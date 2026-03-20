# FreeFlow Reader

FreeFlow Reader is a static, frontend-only text-to-speech website designed to be hosted for free on GitHub Pages.

## Features

- Paste text directly into the app
- Upload `.txt`, `.md`, `.html`, `.htm`, and Word `.docx` files
- Import article text from a website URL
- Change voice, speed, and pitch
- Pause, resume, and stop playback
- Keep the core experience in the browser with no backend

## Important limitations

- Voice quality depends on the voices available in the user's browser and operating system.
- Word `.doc` files are not reliably supported in browser-only apps. Use `.docx`.
- Website imports are best-effort only because some sites block scraping or return messy text.
- This is not a full Speechify clone because Speechify uses premium server-side voice technology. This app gives you the best free browser-based version of the idea.

## Run locally

Because this is a static site, you can open `index.html` directly, but using a tiny local server is better for testing:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. From this folder, connect your local repo to GitHub:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git add .
git commit -m "Initial FreeFlow Reader site"
git push -u origin main
```

3. In GitHub, open `Settings` -> `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select the `main` branch and `/ (root)` folder.
6. Save, then wait for GitHub Pages to publish the site.
7. Your site URL will usually be:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

If you publish from a user site repository named `YOUR-USERNAME.github.io`, the URL becomes:

```text
https://YOUR-USERNAME.github.io/
```

## Future upgrade ideas

- Add PDF text extraction with a browser PDF parser
- Save user settings to local storage
- Add word highlighting while reading
- Add drag and drop uploads
