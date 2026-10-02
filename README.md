# Wenyu Huang — Physics & Computation

A bilingual personal homepage for Wenyu Huang (黄文瑀), a UC San Diego physics undergraduate, expected graduation 2029. Swiss typography, an interactive gravity experiment, research projects, and a real-data cell mechanics explorer. Plain HTML, CSS, and JavaScript; no installation or build step.

## Local preview

```bash
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Use HTTP rather than opening the HTML file directly, because the cell explorer loads a local JSON data file.

## Features

- English by default; Chinese switch with translated content, controls, metadata, and image descriptions.
- Light and dark themes. Initial theme follows the system; explicit language/theme choices are remembered locally.
- Interactive gravity experiment with draggable particle launches, adjustable gravity, keyboard controls, reset, and pause.
- Scroll reveals, reading progress, active navigation, native project disclosures, and image enlargement.
- Cell mechanics explorer: select cell area or myosin, scrub saved simulation time, play/pause, reset, and inspect local approximate values. This renders real saved data; it does not solve a new model in the browser.
- Five projects: Cell stress, EnergyBench, Elastocapillarity, Research Atlas, and Wenhao’s Arcade.
- Responsive layout, keyboard focus, native image dialog, reduced-motion support, and offscreen animation suspension.

## Editing

| File | Purpose |
| --- | --- |
| `index.html` | English content, project links, and semantic structure. |
| `script.js` | Chinese translations, language/theme preferences, navigation, and image viewer. |
| `styles.css` | Design tokens, responsive layout, typography, motion, and themes. |
| `gravity.js` | Softened inverse-square gravity experiment. |
| `cell-study.js` | Browser rendering and controls for real saved simulation fields. |
| `assets/cell-fields.json` | Compact original simulation data; see `docs/cell-data.md`. |
| `docs/design.md` | Design direction and intentional adaptations. |
| `docs/content-sources.md` | Source notes for project descriptions and media. |

To add or change text, update its English value in `index.html` and the matching key in the `chinese` dictionary in `script.js`. English defaults are read from the HTML. Replace project images under `assets/`; preserve meaningful image descriptions. Add publications only when actual citation details and links are supplied.

The site loads no third-party fonts, runtime libraries, analytics, or tracking scripts. Simulation data loads when its explorer approaches the viewport. External links load only when selected. The hero is an illustrative gravity experiment, not research output. Project images come from the corresponding projects; the arcade image is its original cover artwork.

## GitHub Pages

Publish the `main` branch at the repository root through **Settings → Pages → Deploy from a branch**. `.nojekyll` enables direct static serving. All local asset URLs are relative and work under the `/homepage/` project path.

Site URL: [wenhaoquestion.github.io/homepage/](https://wenhaoquestion.github.io/homepage/).

No backend, secret key, or custom server is required. Changes pushed to `main` are rebuilt by GitHub Pages.
