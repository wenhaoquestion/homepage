# Verification receipt

## Visual reference and intentional changes

Three coordinated Image Gen section concepts defined the Swiss typography, 12-column alignment, paper/ink/vermilion palette, thin rules, open rails, inverse research band and red footer. The owner subsequently requested Chinese/English, dark mode, two lab affiliations, five source-grounded projects, interactive cell fields instead of video, and a gravity experiment instead of the original wave art. These updates are intentional extensions of that visual specification.

Concept files were inspected through `view_image`:

- Hero: `exec-c34cb13c-b949-48b6-abfa-d2db3e38daa1.png`
- About/research: `exec-c4627f0f-9c63-4608-8c7f-2973ed9c2e9a.png`
- Projects/contact: `exec-40a8424d-233f-4c11-87e3-fb343e064243.png`

They remain in the chat's generated-image artifacts; they are not shipped as interface images. The current browser screenshot was saved and inspected through `view_image` in the same visual QA pass. Codex in-app browser was used; no Playwright Chromium fallback. Desktop checked at the concept's native 1505×1045 viewport and mobile at390×844. The browser's scrollbar reduces rendered content width by15px.

## Fidelity ledger

| Point | Evidence and result |
| --- | --- |
| Typography | Two-line large grotesk hero, tightly tracked section headings and strong project names match the reference hierarchy. Chinese has a separate type scale. No clipped heading in mobile check. |
| Grid and whitespace | Header, hero, fact strip, 22% section rail, split about paragraphs and ruled project list use the same alignment system. Hero vertical padding adjusted to retain the facts at the first viewport edge. |
| Palette | Exact paper `#f5f5f2`, ink `#171715`, accent `#ed3d23`; dark theme introduced at owner request. No extra hero tint, gradient background, shadows or rounded cards. |
| Legibility | Measured contrast: body16.43:1, light red links5.28:1, dark red links6.80:1, footer4.52:1, muted text5.45:1. Real scientific figures retain their colors and can be enlarged. |
| Containers and icons | Open sections, fine rules, inverse research band, thin arrows, square controls, plus/minus disclosures and solid red footer maintained. |
| Above-fold copy | Hero heading and brand retained. Owner-authorized changes are 2029 undergraduate identity, language/theme controls, gravity caption and working interaction controls. No invented credentials or metrics. |
| Media | Original project figures and app screenshot load locally. Arcade artwork is labeled as cover art. Cell explorer renders saved numerical data with a matching legend and a clear saved-state explanation. |
| Responsive behavior |390px mobile checks show no horizontal overflow, stacked content and native menu. English/Chinese and light/dark were exercised. |

No unresolved material mismatch remains against the reference system as updated by the owner's requests. The core visual system and the revised implementation were directly compared, including the final browser render.

## Interaction checks

- Real mouse drag launched a gravity probe. Gravity1.60× output, paused state, keyboard launch and reset messages verified in browser.
- Gravity numerical smoke checks: eight seeded particles remain stable over60 simulated seconds; maximum relative energy drift over100 seconds≈0.00354%; particle cap32, touch cancellation, reduced-motion initial pause and explicit playback verified.
- Cell data loads only near its viewport. Slider20% gives3.00h; myosin field changes legend and pixels; playback advances saved frames; reset restores area at0h. Chinese field/time labels and mobile controls verified.
- Cell smoke checks use the real JSON: decoding, `/homepage/assets/cell-fields.json` path, hidden-page pause, reset and failed-fetch fallback verified.
- Project image opens in native dialog, Escape closes it and focus returns to the originating image link.
- Mobile menu closes on internal selection and focuses the destination. Language/theme choices survive reload.
- Source checks: JavaScript syntax, unique element IDs, all local references, complete translations and `git diff --check` pass.

## Scientific boundary

The hero is a softened central-force demonstration in normalized units. The cell explorer displays101 actual stored simulation states from an exploratory model, with80×80 sampling and quantization documented in `cell-data.md`; controls do not re-solve the model. Publications await actual citation details from the owner.
