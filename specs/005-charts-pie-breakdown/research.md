# Research: Charts Tab - Spending Breakdown

No `NEEDS CLARIFICATION` remained in the Technical Context. The decisions below close the open design points.

## 1. Charting library: Chart.js directly, not ng2-charts

- **Decision**: reuse Chart.js (already in `package.json`) directly; register `DoughnutController` and `ArcElement` (plus `Tooltip`) in the new child component.
- **Rationale**: ng2-charts is not installed. Part 1 research found ng2-charts 11 needs Angular 22 and 10 pulls `@angular/cdk`. Adding either for two canvases would break "no new dependencies".
- **Alternatives**: install `ng2-charts@10` (new deps, rejected); hand-drawn SVG rings (re-implements tooltip and hit-testing, rejected).

## 2. Where the ring is drawn and where the rest lives

- **Decision**: canvas draws only the ring and its tooltip. The **center total** is an HTML element centered over the canvas, and the **legend** is an HTML list of buttons.
- **Rationale**: the legend must show name + percentage and be clickable/tappable with comfortable targets and wrap on narrow screens; the Chart.js legend does not render percentages natively and is awkward to style. An HTML center total needs no drawing plugin and follows app fonts and CSS variables.
- **Alternatives**: Chart.js legend with `generateLabels` and a custom center-text plugin (more code, harder to test and style).

## 3. Click handling

- **Decision**: ring clicks use Chart.js `onClick` with `getElementsAtEventForMode(event, 'nearest', { intersect: true }, true)`; the slice index maps to the entry; the child emits `sliceClick(name)` and ignores entries flagged `isOther`. Legend buttons emit the same output. The parent calls `setCategory` or `setPerson`.
- **Rationale**: one output keeps both interactions identical (FR-008) and the "Other" guard in one place (FR-009). On touch, the same `onClick` fires on tap, and Chart.js shows the tooltip on tap.

## 4. Identifying the "Other" slice

- **Decision**: entries carry `isOther: boolean`; the merged entry is named `Altro` (UI language) but is recognized by the flag, never by its name.
- **Rationale**: a real category can be called "Altro" (the mockup itself has one). Name-based detection would make that real category non-clickable and give it the neutral color.

## 5. Threshold rule

- **Decision**: percentage = `amount / total * 100`, not rounded in the data. An entry is "small" when `percentage < threshold - 1e-9` (strictly below, so exactly 3% stays). Merge only if at least one entry is small **and** at least one entry is kept (otherwise the result would be a single "Other" slice, so the list is returned unchanged). A single small entry among larger ones is still folded into "Altro" (follows spec US3 scenario 6).
- **Rationale**: matches spec FR-007; the epsilon avoids a float error turning exactly 3% into 2.9999999.

## 6. Deterministic colors

- **Decision**: `colorFor(name, palette)` hashes the name (FNV-1a, 32-bit, on the exact stored name) modulo `palette.length`. The palette passed to it is the app's five accent variables (`--coral --teal --violet --amber --pink`); the sixth existing entry `--ink-dim` is the neutral color reserved for "Other" and is never produced by `colorFor`. `sliceColors(entries, palette, neutral)` returns one color per entry (`neutral` for `isOther`).
- **Rationale**: depends only on the name, so it is independent of order and filters (FR-011). Five colors means collisions are expected with many entries; slices get a thin surface-colored border so neighbors with the same color stay distinguishable, and the legend plus tooltip carry the name. Collisions are allowed by the spec's edge cases.
- **Alternatives**: first-come assignment (depends on order, rejected); larger generated palette (leaves the app's look, rejected).

## 7. Missing or empty names

- **Decision**: `totalsBy` groups by the stored string. An empty `category` or `who` is grouped under the labels `Senza categoria` / `Senza persona`. Names absent from the people/category lists are not looked up at all, so they are counted naturally (FR-013).
- **Rationale**: the ring total always equals the sum of the filtered expenses (FR-014).

## 8. Feeding the rings and the empty/invalid states

- **Decision**: use the existing private `filtered` computed (which already applies `appliedRange`, i.e. keeps the last valid range while dates are inverted). Add `categoryEntries` and `personEntries` computed signals. Each ring shows the empty message when its list is empty; the message text is passed in so it matches the monthly chart's ("Nessun dato per i filtri selezionati").
- **Rationale**: guarantees the ring totals equal the monthly chart for the same filters (SC-002), with no new subscription.

## 9. Amount formatting

- **Decision**: move the `euro()` formatting helper into `chart-data.ts` as `formatEuro` (same output, `€` + two decimals) so the child component can use it; `charts.ts` imports it instead of its local copy.
- **Rationale**: one formatting rule across the tab; the monthly chart output is unchanged.

## 10. Narrowed color consistency with the monthly stacked chart

- **Decision**: see plan deviation 3. The monthly chart stays untouched; the spec is amended accordingly.
