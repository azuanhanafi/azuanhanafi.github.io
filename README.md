# azuanhanafi.my

Personal portfolio for **Azuan Hanafi — Configuration & Data Management Specialist**.
Plain HTML/CSS/JS, no build step. Deployed via GitHub Pages to [azuanhanafi.my](https://azuanhanafi.my).

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | All page content: hero, experience, projects, skills, contact. Spots to change are marked `<!-- EDIT -->`. |
| `styles.css` | Styling + light/dark theme tokens. |
| `script.js` | Footer year + theme toggle (remembers choice). |
| `assets/Azuan-Hanafi-Resume.pdf` | Downloadable resume. Replace this file to update it. |
| `CNAME` | Binds the site to `azuanhanafi.my`. Do not delete. |
| `.nojekyll` | Disables Jekyll processing. |

## Editing content

Open `index.html`, search for `EDIT`:

- **Contact** — replace the LinkedIn URL with your real profile.
- **Projects** — add more `<article class="feature">` (full-width) or `<article class="card">` blocks as you build things.
- **Experience / Skills** — update text directly; keep the existing markup pattern.

To update the resume: drop a new PDF in at `assets/Azuan-Hanafi-Resume.pdf` (same name), commit, push.

## Local preview

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deploy / update

```bash
git add -A
git commit -m "Update content"
git push
```

GitHub Pages (Settings → Pages → Source: `main` / root) rebuilds automatically in ~1 minute.
