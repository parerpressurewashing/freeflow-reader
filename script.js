const textInput = document.getElementById("text-input");
const previewText = document.getElementById("preview-text");
const characterCount = document.getElementById("character-count");
const readingTime = document.getElementById("reading-time");
const voiceSelect = document.getElementById("voice-select");
const rateRange = document.getElementById("rate-range");
const pitchRange = document.getElementById("pitch-range");
const rateValue = document.getElementById("rate-value");
const pitchValue = document.getElementById("pitch-value");
const speechStatus = document.getElementById("speech-status");
const fileInput = document.getElementById("file-input");
const fileStatus = document.getElementById("file-status");
const websiteUrl = document.getElementById("website-url");
const urlStatus = document.getElementById("url-status");

const MAX_CHUNK_LENGTH = 220;
const FALLBACK_SAMPLE = `Welcome to FreeFlow Reader.

This app is designed to feel like a free, browser-based alternative for listening to long-form text. Paste writing, upload a document, or try importing an article from the web. Then pick a voice, change the speed, and listen hands-free.

Because everything runs in the browser, the voice quality depends on the voices already available on your device.`;

let availableVoices = [];
let queuedChunks = [];
let currentChunkIndex = 0;
let speaking = false;
const PREFERRED_VOICE_NAMES = ["Zoe", "Samantha", "Karen", "Daniel"];

function setStatus(message) {
  speechStatus.textContent = message;
}

function setHelperMessage(element, message, type = "") {
  element.textContent = message;
  element.classList.remove("is-error", "is-success");
  if (type) {
    element.classList.add(type);
  }
}

function updateTextMetrics() {
  const text = textInput.value.trim();
  const characterLength = text.length;
  const estimatedWords = text ? text.split(/\s+/).length : 0;
  const minutes = estimatedWords ? Math.max(1, Math.round(estimatedWords / 180)) : 0;

  characterCount.textContent = characterLength.toLocaleString();
  readingTime.textContent = `${minutes} min`;
  previewText.textContent = text || "Your imported or pasted text will appear here.";
}

function populateVoices() {
  availableVoices = window.speechSynthesis.getVoices().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const previousValue = voiceSelect.value;
  voiceSelect.innerHTML = "";

  if (!availableVoices.length) {
    const option = document.createElement("option");
    option.textContent = "No browser voices available";
    option.value = "";
    voiceSelect.appendChild(option);
    return;
  }

  availableVoices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} (${voice.lang})${
      voice.default ? " • default" : ""
    }`;
    voiceSelect.appendChild(option);
  });

  const preferredVoiceIndex = availableVoices.findIndex((voice) =>
    PREFERRED_VOICE_NAMES.some((preferredName) =>
      voice.name.toLowerCase().includes(preferredName.toLowerCase())
    )
  );
  const englishVoiceIndex = availableVoices.findIndex((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );

  if (previousValue && availableVoices[Number(previousValue)]) {
    voiceSelect.value = previousValue;
  } else if (preferredVoiceIndex >= 0) {
    voiceSelect.value = String(preferredVoiceIndex);
  } else if (englishVoiceIndex >= 0) {
    voiceSelect.value = String(englishVoiceIndex);
  } else {
    voiceSelect.value = "0";
  }
}

function getSelectedVoice() {
  const voiceIndex = Number(voiceSelect.value);
  return availableVoices[voiceIndex] || null;
}

function splitTextIntoChunks(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return [];
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]*/g) || [cleaned];
  const chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    const nextChunk = `${currentChunk} ${sentence}`.trim();
    if (nextChunk.length <= MAX_CHUNK_LENGTH) {
      currentChunk = nextChunk;
      return;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    if (sentence.length <= MAX_CHUNK_LENGTH) {
      currentChunk = sentence.trim();
      return;
    }

    const phraseParts = sentence.match(/[^,;:]+[,;:]*/g) || [sentence];
    let phraseChunk = "";

    phraseParts.forEach((part) => {
      const nextPhraseChunk = `${phraseChunk} ${part}`.trim();
      if (nextPhraseChunk.length <= MAX_CHUNK_LENGTH) {
        phraseChunk = nextPhraseChunk;
      } else {
        if (phraseChunk) {
          chunks.push(phraseChunk);
        }
        phraseChunk = part.trim();
      }
    });

    currentChunk = phraseChunk;
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function stopSpeech() {
  window.speechSynthesis.cancel();
  queuedChunks = [];
  currentChunkIndex = 0;
  speaking = false;
  setStatus("Stopped.");
}

function speakNextChunk() {
  if (!speaking || currentChunkIndex >= queuedChunks.length) {
    speaking = false;
    setStatus("Finished reading.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(queuedChunks[currentChunkIndex]);
  const voice = getSelectedVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  utterance.rate = Number(rateRange.value);
  utterance.pitch = Number(pitchRange.value);

  utterance.onend = () => {
    currentChunkIndex += 1;
    speakNextChunk();
  };

  utterance.onerror = (event) => {
    speaking = false;
    setStatus(`Speech error: ${event.error || "unknown issue"}.`);
  };

  setStatus(
    `Reading chunk ${currentChunkIndex + 1} of ${queuedChunks.length}${
      voice ? ` with ${voice.name}` : ""
    }.`
  );

  window.speechSynthesis.speak(utterance);
}

function startSpeech() {
  const text = textInput.value.trim();
  if (!text) {
    setStatus("Add some text first.");
    return;
  }

  const voice = getSelectedVoice();
  if (!voice && availableVoices.length) {
    setStatus("Choose a voice first.");
    return;
  }

  window.speechSynthesis.cancel();
  queuedChunks = splitTextIntoChunks(text);
  currentChunkIndex = 0;

  if (!queuedChunks.length) {
    setStatus("There was not enough readable text to speak.");
    return;
  }

  speaking = true;
  speakNextChunk();
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

async function readUploadedFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".docx")) {
    if (!window.mammoth) {
      throw new Error("The Word document parser did not load.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  const content = await file.text();

  if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
    return stripHtml(content);
  }

  return content.trim();
}

async function importWebsiteText(url) {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) {
    throw new Error("Enter a website URL first.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error("Enter a valid full URL, including https://");
  }

  const mirrorUrl = `https://r.jina.ai/http://${parsedUrl.href.replace(/^https?:\/\//, "")}`;
  const response = await fetch(mirrorUrl);

  if (!response.ok) {
    throw new Error(`Import failed with status ${response.status}.`);
  }

  const rawText = await response.text();
  return rawText
    .replace(/^Title:.*$/m, "")
    .replace(/^URL Source:.*$/m, "")
    .replace(/^Markdown Content:.*$/m, "")
    .trim();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const { tab } = button.dataset;

    document.querySelectorAll(".tab-button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === tab);
    });
  });
});

textInput.addEventListener("input", updateTextMetrics);

rateRange.addEventListener("input", () => {
  rateValue.textContent = `${Number(rateRange.value).toFixed(1)}x`;
});

pitchRange.addEventListener("input", () => {
  pitchValue.textContent = Number(pitchRange.value).toFixed(1);
});

document.getElementById("load-sample").addEventListener("click", () => {
  textInput.value = FALLBACK_SAMPLE;
  updateTextMetrics();
  setStatus("Sample text loaded.");
});

document.getElementById("clear-text").addEventListener("click", () => {
  textInput.value = "";
  updateTextMetrics();
  stopSpeech();
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  setHelperMessage(fileStatus, `Importing ${file.name}...`);

  try {
    const extractedText = await readUploadedFile(file);
    textInput.value = extractedText;
    updateTextMetrics();
    setHelperMessage(
      fileStatus,
      `${file.name} imported successfully.`,
      "is-success"
    );
    setStatus(`Loaded ${file.name}.`);
  } catch (error) {
    setHelperMessage(
      fileStatus,
      error.message || "That file could not be read.",
      "is-error"
    );
    setStatus("File import failed.");
  }
});

document.getElementById("import-url").addEventListener("click", async () => {
  setHelperMessage(urlStatus, "Importing website text...");

  try {
    const extractedText = await importWebsiteText(websiteUrl.value);
    textInput.value = extractedText;
    updateTextMetrics();
    setHelperMessage(
      urlStatus,
      "Website text imported. Review the preview before pressing play.",
      "is-success"
    );
    setStatus("Website text imported.");
  } catch (error) {
    setHelperMessage(
      urlStatus,
      error.message || "Website import failed.",
      "is-error"
    );
    setStatus("Website import failed.");
  }
});

document.getElementById("speak-button").addEventListener("click", startSpeech);

document.getElementById("pause-button").addEventListener("click", () => {
  if (!window.speechSynthesis.speaking) {
    setStatus("Nothing is currently speaking.");
    return;
  }

  window.speechSynthesis.pause();
  setStatus("Paused.");
});

document.getElementById("resume-button").addEventListener("click", () => {
  if (!window.speechSynthesis.paused) {
    setStatus("Speech is not paused.");
    return;
  }

  window.speechSynthesis.resume();
  setStatus("Resumed.");
});

document.getElementById("stop-button").addEventListener("click", stopSpeech);

window.addEventListener("beforeunload", () => {
  window.speechSynthesis.cancel();
});

window.speechSynthesis.onvoiceschanged = populateVoices;
populateVoices();
updateTextMetrics();
rateValue.textContent = `${Number(rateRange.value).toFixed(1)}x`;
pitchValue.textContent = Number(pitchRange.value).toFixed(1);
