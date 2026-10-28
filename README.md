# azuanhanafi.my

Personal portfolio for **Azuan Hanafi — Configuration & Data Management Specialist**.
Plain HTML/CSS/JS, no build step. Deployed via GitHub Pages to [azuanhanafi.my](https://azuanhanafi.my).

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | All page content: hero, experience, projects, skills, education, contact. |
| `styles.css` | Styling and design tokens (dark theme, gold accent). |
| `script.js` | Email links, KUL clock, tenure count, mobile menu, scroll-spy, project dialogs, scroll reveals. |
| `hero.js` | Hero headline letter rolls and the change request approval pipeline animation (uses anime.js). |
| `signals.js` | Background signal traces along the grid. |
| `vendor/` | Self-hosted anime.js and fonts (Archivo, JetBrains Mono) with their licenses. |
| `assets/Azuan-Hanafi-Resume.pdf` | Downloadable resume. Replace this file to update it. |
| `CNAME` | Binds the site to `azuanhanafi.my`. Do not delete. |
| `.nojekyll` | Disables Jekyll processing. |

## Editing content

Open `index.html`:

- **Contact** — replace the LinkedIn URL with your real profile.
- **Projects** — add an `<article class="proj">` to the `.bento` grid, plus a matching `<dialog class="modal">` for its details.
- **Experience / Skills** — update text directly; keep the existing markup pattern.

After changing `styles.css` or a script, bump its `?v=` number in `index.html` so browsers fetch the new file.

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
