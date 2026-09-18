# Personal homepage

A responsive personal homepage built with plain HTML, CSS, and JavaScript. No package installation or build step is required.

## Preview locally

From the repository directory, run:

```bash
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Stop the server with `Ctrl+C`.

## Files and editing

| File | Purpose |
| --- | --- |
| `index.html` | Page content, navigation, and project links. Edit personal text and project URLs here. |
| `styles.css` | Colors, typography, layout, and responsive styles. |
| `script.js` | Navigation menu enhancement. |
| `assets/wave-study.webp` | Locally stored hero artwork. |
| `.nojekyll` | Tells GitHub Pages to serve the static files without Jekyll processing. |

The AI-generated hero image is an artistic illustration, not experimental data or a scientific result. The site uses no third-party runtime, remotely loaded assets or fonts, or analytics. Project links lead to external websites only when selected.

## Publish with GitHub Pages

After the files are on the repository's `main` branch:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** and **/(root)**, then save.
4. Wait for GitHub's deployment to finish; the Pages settings will show the published address.

The expected project-site address is [wenhaoquestion.github.io/homepage/](https://wenhaoquestion.github.io/homepage/). This is the expected URL, not confirmation that the site has been deployed. Keep asset and internal-page paths relative so they work under `/homepage/` as well as in local previews.
