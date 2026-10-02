# Cell-field explorer data

`assets/cell-fields.json` is a compact representation of real saved numerical fields from the exploratory **A00_baseline_n50** two-dimensional cell-stress study. It backs an interactive canvas viewer; it does not run a solver or generate new model predictions.

## Provenance

- Scientific source: `output/cell_stress_study/runs/A00_baseline_n50/main_v2_cell_stress_state.npz` in the source simulation project.
- Archive SHA-256: `feaa86a696fb4e6f37696afc0b3a685f193147603c2741dec3feab5a9a602131`.
- Original arrays: `a` and `m`, float32, shape **1001 × 100 × 100**, with axes `(time, x, y)`. Time and coordinates come from `time_hours`, `xg`, and `yg` (float64).
- This is the exact archive consumed by `output/presentation/scripts/figures_video.py` to render `baseline_eulerian_dynamics.mp4`. That video selected every second stored state; this website selects every tenth.
- The source simulation spans **0–15 hours** and uses reference radius **R = 4 mm**. The saved time interval is **0.015 h**.
- This source is the older two-dimensional active-nematic/cell-stress baseline, not the subsequent standalone one-dimensional solver. Its parameters are exploratory and not biologically calibrated.

## Sampling and encoding

The web asset contains **101 actual saved states** at 0.15-hour intervals, including 0, 7.5 and 15 h. Source state indices are `0, 10, …, 1000`; no temporal interpolation or rerun is performed.

Spatial selection uses `round(linspace(0, 99, 80))` independently in each source coordinate. This selects actual nearest source nodes, with no averaging or synthetic values. The exact selected coordinates and source indices are included in the JSON. Because nearest-node selection does not retain perfectly uniform spacings, coordinate-aware probes should use `xCoordinates` and `yCoordinates`.

Each selected field is transposed from `(x, y)` to `(y, x)` and flipped vertically. The flattened byte order is **frame, screen row, column**. A canvas therefore displays x increasing left to right, and y decreasing top to bottom, without further transpose or vertical flip.

The native finite-node mask is constant across every source frame and both fields. It is preserved through sampling. A base64-encoded uint8 mask marks **4992 valid nodes out of 6400**: 1 means finite field data; 0 means transparent. Values stored at masked nodes are filler bytes and must never be interpreted as field measurements. Do not replace the source mask with a newly calculated circular mask.

Both channels are quantized to uint8 on the same fixed ranges as the original presentation. These ranges contain every finite value in the entire source archive, so no source sample is clipped.

| Field | Meaning | Encoding/display range | Maximum measured encoding error |
|---|---|---|---|
| `area` | Mean cell area a/a₀, a₀ = 1; dimensionless | 0.4–1.0 | 0.001176470 |
| `myosin` | Dimensionless model myosin m; not a calibrated concentration | 0–0.55 | 0.001078430 |

Decode a finite field value as `field.min + byte / 255 * (field.max - field.min)`. Probe readouts should show approximate values. Quantization half-step upper bounds are 0.001176471 for area and 0.001078432 for myosin. This representation is intended for exploration and visualization, not quantitative reanalysis.

## Browser contract

- `width`, `height`: 80 and 80.
- `frameCount`: 101.
- `times`: real simulation times in hours, one per frame.
- `mask`: base64 uint8, length `width * height`.
- `fields.area.data` and `fields.myosin.data`: base64 uint8, each length `frameCount * width * height`.
- `fields.*.min` / `max`: fixed decode and display scales; `observedMin` / `observedMax` describe selected samples; `sourceObservedMin` / `sourceObservedMax` describe all original source samples.
- `xCoordinates`: normalized x coordinate of each column, increasing.
- `yCoordinates`: normalized y coordinate of each screen row, decreasing.
- `provenance`: run identifier, archive checksum, sampling indices and scientific limitations. No machine-specific path is embedded in the public JSON.

A frame offset is `frameIndex * width * height`; a pixel index within that frame is `row * width + column`. Honor the shared mask before drawing or probing. If visual interpolation is introduced later, label it as interpolation between saved states rather than a new simulation.

## Geometry qualification

The original source uses coordinate spacing **2/99**, while the solver stencil records **dxy = 0.02**. The archived finite-node mask has 7804 valid nodes; 136 lie slightly outside radius 1 in the saved coordinate system (maximum radius ≈ 1.008585). The presentation preserves this documented discrepancy, and this export does too. The domain is a **fixed Eulerian grid**, not an expanding material boundary.

## Validation receipt

The exporter verified stable finite-node masks across every original frame; both channels inside the declared scales; the decoded mask length and exact roundtrip; field lengths and layout; source-to-browser point correspondence at 0, 7.5 and 15 h; quantization errors; and a final JSON size below 2 MB. The output is 1,737,960 bytes. No simulation source or scientific result was modified.
