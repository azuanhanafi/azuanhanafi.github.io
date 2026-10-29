# azuanhanafi.my

Personal portfolio for **Azuan Hanafi — Configuration & Data Management Specialist**.
Plain HTML/CSS/JS, no build step. Deployed via GitHub Pages to [azuanhanafi.my](https://azuanhanafi.my).

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | All page content: hero, about, experience, capabilities, projects, how I work, skills, education, contact. |
| `styles.css` | Styling and design tokens (light theme, green accent, deep teal bands). |
| `script.js` | Email links, KUL clock, nav pill and mobile menu, experience tabs, capabilities accordion, project dialogs, scroll-lit statement, custom cursor, back-to-top, reveals, scroll-spy, and the footer "Pause animations" button. |
| `dots.js` | Hero dot animation: industry icons drawn in dots that react to the cursor, tilt in 3D and morph on click. Shapes are defined in the `SHAPES` list. |
| `vendor/` | Self-hosted anime.js and fonts (Outfit, Figtree, JetBrains Mono) with their licenses. |
| `assets/Azuan-Hanafi-Resume.pdf` | Downloadable resume. Replace this file to update it. |
| `CNAME` | Binds the site to `azuanhanafi.my`. Do not delete. |
| `.nojekyll` | Disables Jekyll processing. |

## Editing content

Open `index.html`:

- **Contact** — replace the LinkedIn URL with your real profile.
- **Projects** — add an `<article class="proj">` to the `.work` grid, plus a matching `<dialog class="modal">` for its details.
- **Experience / Skills** — update text directly; keep the existing markup pattern.

Animations run for every visitor regardless of the operating system's reduce-motion setting; visitors can stop them with the "Pause animations" button in the footer (remembered per browser).

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
