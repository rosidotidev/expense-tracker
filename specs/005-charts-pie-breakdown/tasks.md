---

description: "Task list for the spending breakdown doughnut charts"
---

# Tasks: Charts Tab - Spending Breakdown by Category and Person

**Input**: Design documents from `/specs/005-charts-pie-breakdown/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-and-service.md, quickstart.md

**Tests**: Requested in the plan input: Vitest cases for the pure functions in `src/app/services/chart-data.spec.ts`, run with `npx vitest run --dir src`. UI is verified by the manual scenarios in quickstart.md and by `ng build`.

**Organization**: Tasks are grouped by user story. All paths are relative to the repository root. Strict TypeScript, no `any`, no new dependency; never touch `firebase-rules.json`, `tools/backup`, `src/app/models/expense.model.ts`, `src/app/components/charts/chart-canvas.ts` or the monthly chart behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: User story the task belongs to (US1 to US5)

---

## Phase 1: Setup

**Purpose**: Confirm the baseline before changing anything.

- [X] T001 Run `npx vitest run --dir src` and `ng build` from the repository root and confirm both pass before any change (baseline); note the existing test count.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure building blocks every story needs, in `src/app/services/chart-data.ts` (pure, I/O-free, never mutating inputs). Contract: `contracts/ui-and-service.md`.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 In `src/app/services/chart-data.ts` add `export interface BreakdownEntry { name: string; amount: number; percentage: number; isOther: boolean }` plus `export const OTHER_NAME = 'Altro'` and `export const SMALL_SLICE_THRESHOLD = 3` (percent). `amount` is rounded to 2 decimals; `percentage` is `amount / total * 100`, not rounded.
- [X] T003 In `src/app/services/chart-data.ts` implement `export function totalsBy(expenses: Expense[], key: 'category' | 'who'): BreakdownEntry[]`: group by the stored string (an empty value becomes `Senza categoria` for `category` and `Senza persona` for `who`); round each sum to 2 decimals; drop groups whose sum is zero or less; return `[]` for empty input or a zero total; sort by `amount` descending, ties by `name` ascending; every entry has `isOther: false`. Do not look names up in the people/category lists.
- [X] T004 In `src/app/services/chart-data.ts` implement `export function colorFor(name: string, palette: string[]): string`: 32-bit FNV-1a hash of the exact name, modulo `palette.length`; depends only on `name` and `palette` (never on order or other entries). Caller guarantees a non-empty palette.
- [X] T005 In `src/app/services/chart-data.ts` implement `export function sliceColors(entries: BreakdownEntry[], palette: string[], neutral: string): string[]`: one color per entry, `neutral` when `isOther`, otherwise `colorFor(entry.name, palette)`.
- [X] T006 In `src/app/services/chart-data.ts` add `export function formatEuro(value: number): string` returning `` `€${value.toFixed(2)}` `` (same text as the existing `euro` helper in `src/app/components/charts/charts.ts`), then replace that local `euro` function in `charts.ts` with an import of `formatEuro` (identical output; no other change to the monthly chart code).

**Checkpoint**: pure functions exist and compile (`ng build` still passes).

---

## Phase 3: User Story 1 - See how my spending splits by category and by person (Priority: P1) 🎯 MVP

**Goal**: Two doughnut charts below the monthly chart, with legend + percentages, total in the center, exact amount on hover/tap, driven by the shared filters, with the empty-state message.

**Independent Test**: With expenses in several categories and people, open "Grafici": both rings appear below the monthly chart with matching legends, center totals equal the sum of the monthly bars, tooltip shows the exact amount, and filters that match nothing show "Nessun dato per i filtri selezionati" in each ring (quickstart scenarios 1, 2, 3, 9).

### Tests for User Story 1

> Write these first, confirm they fail, then rely on T003.

- [X] T007 [US1] In `src/app/services/chart-data.spec.ts` add a `describe('totalsBy')` block: (a) percentages sum to about 100 (`toBeCloseTo(100, 6)`) and amounts sum to the input total; (b) entries sorted by amount descending, ties by name; (c) a single entry is kept at 100%; (d) an expense whose category or person is not in any list is still counted under its stored name; (e) empty input returns `[]`; (f) an empty `category`/`who` is counted under `Senza categoria` / `Senza persona`; (g) the input array is not mutated; (h) works for both `'category'` and `'who'` keys.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `src/app/components/charts/breakdown-chart/breakdown-chart.ts`: standalone, `OnPush` component `app-breakdown-chart` with inputs `title: string`, `entries: BreakdownEntry[]`, `colors: string[]`, `emptyMessage: string`. It registers `DoughnutController`, `ArcElement`, `Tooltip` with Chart.js and owns one doughnut instance on a `<canvas>` (same lifecycle pattern as `chart-canvas.ts`: create in `ngAfterViewInit`, update data/options in an `effect`, destroy via `DestroyRef`; `responsive: true`, `maintainAspectRatio: false`, `cutout` about `'62%'`, white (`--surface`) slice borders, legend disabled). Tooltip label: `` `${name}: ${formatEuro(amount)}` ``. Expose a computed `total` (sum of entry amounts, rounded to 2 decimals).
- [X] T009 [P] [US1] Create `src/app/components/charts/breakdown-chart/breakdown-chart.html` and `breakdown-chart.css`: a card-style block with `<h3 class="section-title">{{ title() }}</h3>`; when `entries().length > 0` show the ring box (relative, fixed height, e.g. 240px, 200px at max-width 500px) with the canvas and an absolutely centered element showing `formatEuro(total())` (pointer-events none); below/next to it a legend list, one row per entry in ring order: color dot (`colors()[i]`), name, `Math.round(percentage)` followed by `%`. Otherwise show `<p class="empty-state">{{ emptyMessage() }}</p>`. Use only the app CSS variables (`--ink`, `--ink-dim`, `--line`, `--surface`); legend names must wrap/ellipsize without breaking the layout.
- [X] T010 [US1] In `src/app/components/charts/charts.ts` add `readonly categoryEntries = computed(() => totalsBy(this.filtered(), 'category'))` and `readonly personEntries = computed(() => totalsBy(this.filtered(), 'who'))` (reuse the existing private `filtered` computed, which already applies `appliedRange`; no new subscription or listener), plus computed `categoryColors` / `personColors` using `sliceColors` with the palette split: the first five entries of `PALETTE` (`--coral --teal --violet --amber --pink`) as hashing palette and the last (`--ink-dim`) as neutral, read through the existing `paletteColors()`, and a readonly `emptyMessage = 'Nessun dato per i filtri selezionati'`. Import `BreakdownChartComponent` in the component `imports`.
- [X] T011 [US1] In `src/app/components/charts/charts.html`, after the monthly chart block (`hasData` / empty state, unchanged), add `<div class="breakdown-grid">` containing two `<app-breakdown-chart>`: category first (`title="Per categoria"`), person second (`title="Per persona"`), bound to the computed signals from T010.
- [X] T012 [US1] In `src/app/components/charts/charts.css` add `.breakdown-grid` (`display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.25rem; min-width: 0`) and, inside the existing `@media (max-width: 500px)` block, `grid-template-columns: 1fr` so the rings stack with the category above the person; ensure no horizontal page scroll.

**Checkpoint**: US1 works on its own: rings, legends, center totals, tooltips, empty state, responsive grid. Run `npx vitest run --dir src` and `ng build`.

---

## Phase 4: User Story 2 - Click a slice to filter the whole tab (Priority: P1)

**Goal**: Clicking or tapping a slice or legend entry sets the shared category (or person) filter; every chart updates.

**Independent Test**: Click a category slice: the category dropdown shows it, the monthly chart counts only it, the category ring shows one slice at 100%; repeat with a legend entry and with the person ring (quickstart scenarios 6, 7, 12).

### Implementation for User Story 2

- [X] T013 [US2] In `src/app/components/charts/breakdown-chart/breakdown-chart.ts` add `sliceClick = output<string>()`. Chart.js `onClick`: `chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true)`; if an element is found, take `entries()[element.index]` and emit its `name` only when `!isOther`. Set `onHover` to switch the canvas cursor to `pointer` only over a non-"Other" slice. Add a `legendClick(entry)` method with the same guard.
- [X] T014 [US2] In `src/app/components/charts/breakdown-chart/breakdown-chart.html` make each legend row a `<button type="button">` calling `legendClick(entry)`; in `breakdown-chart.css` give it a comfortable tap target, reset button styling and a visible focus state.
- [X] T015 [US2] In `src/app/components/charts/charts.ts` add `onCategorySlice(name: string)` calling the existing `setCategory(name)` and `onPersonSlice(name: string)` calling the existing `setPerson(name)`; in `charts.html` bind `(sliceClick)` on the category and person charts to them. Do not add any other write path.

**Checkpoint**: US1 + US2 work; clicking narrows every chart; Reimposta restores "Tutte".

---

## Phase 5: User Story 3 - Keep the small entries readable with "Other" (Priority: P2)

**Goal**: Entries strictly below 3% merge into one grey "Altro" slice, last, not clickable; nothing merged if that would leave a single slice.

**Independent Test**: Dataset with two or more entries under 3%: one grey "Altro" slice and legend row last with the summed amount; clicking it changes nothing; a dataset where merging would leave one slice stays unmerged (quickstart scenarios 4, 5).

### Tests for User Story 3

- [X] T016 [US3] In `src/app/services/chart-data.spec.ts` add a `describe('groupSmallSlices')` block with a small helper that builds entries from amounts via `totalsBy`: (a) entries below 3% are merged into one `Altro` entry (`isOther: true`) placed last whose amount and percentage are the sum of the merged ones; (b) nothing is merged when no entry is below the threshold (same list returned); (c) nothing is merged when every entry is below the threshold, i.e. only "Altro" would remain (list returned unchanged); (d) an entry exactly at 3% is not merged (use amounts such as 3 of 100); (e) a single small entry among larger ones becomes `Altro` containing only that entry; (f) kept entries keep their order, the input is not mutated, and a real category named "Altro" is not treated as the merged one (`isOther` false).

### Implementation for User Story 3

- [X] T017 [US3] In `src/app/services/chart-data.ts` implement `export function groupSmallSlices(entries: BreakdownEntry[], threshold: number): BreakdownEntry[]`: small means `percentage < threshold - 1e-9`; kept = the others in order; if there are no small entries or no kept entries return `entries` unchanged; otherwise return `[...kept, { name: OTHER_NAME, amount: round2(sum of small amounts), percentage: sum of small percentages, isOther: true }]`. Never mutate the input.
- [X] T018 [US3] In `src/app/components/charts/charts.ts` change `categoryEntries` and `personEntries` to `groupSmallSlices(totalsBy(this.filtered(), key), SMALL_SLICE_THRESHOLD)`.
- [X] T019 [US3] In `breakdown-chart.html` / `breakdown-chart.css` render the legend row of an `isOther` entry as non-interactive (`disabled`, default cursor, no hover effect) and confirm the ring never emits for it (guard from T013); the neutral color comes from `sliceColors` (T005, wired in T010).

**Checkpoint**: US1 to US3 work together; "Altro" is last, grey and inert.

---

## Phase 6: User Story 4 - Stable colors and a filtered ring stays visible (Priority: P2)

**Goal**: A name always has the same color in its ring and legend across filter changes; with a person or category filter set, the matching ring stays visible with one slice at 100%.

**Independent Test**: Note a category color, change filters, it never changes; set a person filter and the person ring shows one 100% slice in that person's color; the category ring shows only that person's categories (quickstart scenario 8, 6, 7).

### Tests for User Story 4

- [X] T020 [US4] In `src/app/services/chart-data.spec.ts` add `describe('colorFor')` and `describe('sliceColors')`: (a) the same name and palette always give the same color, also when called in different orders and after calling it for other names; (b) the result is always an element of the palette; (c) `sliceColors` gives the neutral color to the `isOther` entry and never gives the neutral color to a normal entry when the neutral is not in the palette; (d) a real category named "Altro" (`isOther: false`) gets a palette color, not the neutral one; (e) the colors of an entry do not depend on the other entries in the list.

### Implementation for User Story 4

- [X] T021 [US4] Verify in `src/app/components/charts/charts.ts` that the palette split done in T010 never feeds the neutral color (`--ink-dim`) into `colorFor`, and that the monthly chart still uses the palette exactly as before (no edit to its code).
- [ ] T022 [US4] Verify (by test and by manual run) that with `filters().person` or `filters().category` set the filtered list produces exactly one entry at 100%, `groupSmallSlices` leaves it unchanged, and the ring is rendered with a single slice and a 100% legend row; if anything hides it, fix it in `breakdown-chart.html` or `charts.html` (the ring must never be hidden in that case). Add a case to `describe('totalsBy')` in `src/app/services/chart-data.spec.ts` for a single-name input giving one entry at 100%.

**Checkpoint**: colors stable and single-slice case verified.

---

## Phase 7: User Story 5 - Use the charts comfortably on a handheld device (Priority: P2)

**Goal**: Stacked, readable rings on narrow screens with tappable legends and no horizontal scroll.

**Independent Test**: At 500px width or less, the category ring is above the person ring, legends are readable and tappable, tapping a slice shows the amount and sets the filter, and the page does not scroll horizontally (quickstart scenario 11).

### Implementation for User Story 5

- [ ] T023 [US5] In `src/app/components/charts/breakdown-chart/breakdown-chart.css` add the `@media (max-width: 500px)` rules: ring box height about 200px, legend in a single column below the ring with a minimum tap-target height of 40px, long names ellipsized, `min-width: 0` on the grid children to prevent overflow; confirm the grid collapse from T012 and check there is no horizontal scroll at 360px width.
- [ ] T024 [US5] Check the mockup `docs/mockup/06-torte.svg`, `01-layout-completo.svg` and `07-mobile.svg` against the result (ring with legend and percentages, total in the center, order category then person, single column on mobile) and adjust spacing only; do not add the year-over-year chart or summary cards (part 3).

**Checkpoint**: all five stories work on desktop and handheld.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T025 Run `npx vitest run --dir src` and confirm all suites pass: the new cases plus the existing ones (recurring, debit-filter, expense service, chart-data from part 1).
- [X] T026 Run `ng build` and confirm it finishes without errors or strict-typing warnings (no `any`, no `@ts-ignore`).
- [X] T027 Run `git diff --stat` and confirm no change to `firebase-rules.json`, `tools/backup`, `src/app/models/expense.model.ts`, `src/app/components/charts/chart-canvas.ts`, `package.json` or `package-lock.json` caused by this feature.
- [ ] T028 Walk through the manual scenarios 1 to 13 in `specs/005-charts-pie-breakdown/quickstart.md` with `ng serve` (desktop and a 500px-wide window), including that the monthly chart, filter bar and other tabs behave as before and that no data is written.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup; blocks all stories. T002 → T003, T004 (T004 and T005 are independent of T003 but share the file, so run in order T002 to T006).
- **US1 (Phase 3)**: after Foundational. T007 (tests) before relying on T003; T008 and T009 can run in parallel (different files); T010 needs T003 to T005 and the component from T008; T011 needs T008 to T010; T012 any time after T011.
- **US2 (Phase 4)**: after US1 (extends the same component and bindings). T013 → T014 → T015.
- **US3 (Phase 5)**: after US1; independent of US2 (touches `groupSmallSlices`, the computed signals and the legend). T016 before T017; T018 after T017; T019 after T013 if US2 is done (the guard) otherwise just the legend styling.
- **US4 (Phase 6)**: after US1 (colors already exist from Foundational); T021 is a verification of T010; T020 and T022 touch `chart-data.spec.ts`, so run them after T016.
- **US5 (Phase 7)**: after US1; T023 and T024 can run in parallel with US2 to US4 once the component files exist.
- **Polish (Phase 8)**: after all desired stories.

### User Story Dependencies

- **US1 (P1)**: needs Foundational only: this is the MVP.
- **US2 (P1)**: needs US1's component and bindings.
- **US3 (P2)**: needs US1; independent of US2.
- **US4 (P2)**: needs Foundational colors and US1.
- **US5 (P2)**: needs US1's CSS.

### Parallel Opportunities

- T008 and T009 (component class vs template/CSS) after Foundational.
- T023 and T024 (CSS tuning and mockup check) while US2 to US4 are in progress.
- Tests in `chart-data.spec.ts` (T007, T016, T020, T022) edit the same file, so they are not marked [P].

## Parallel Example: User Story 1

```text
# After Phase 2 is done, in parallel (different files):
Task: "Create breakdown-chart.ts (doughnut, center total, inputs) in src/app/components/charts/breakdown-chart/"
Task: "Create breakdown-chart.html and breakdown-chart.css in src/app/components/charts/breakdown-chart/"
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 baseline, Phase 2 pure functions.
2. Phase 3 (US1): rings with legend, center total, tooltip, empty state.
3. Stop and validate with quickstart scenarios 1, 2, 3, 9, then `npx vitest run --dir src` and `ng build`.

### Incremental Delivery

1. Add US2 (click to filter), validate scenarios 6, 7, 12.
2. Add US3 ("Altro" merge), validate scenarios 4, 5.
3. Add US4 (color stability, single 100% slice), validate scenario 8.
4. Add US5 (handheld polish), validate scenario 11.
5. Polish: full test run, build, diff check, full manual pass.

## Notes

- The Angular app is zoneless: derive everything with `computed` signals; no `subscribe`, no new Firebase listener, query or index.
- Colors: only the app CSS variables; the neutral `--ink-dim` is reserved for "Altro".
- "Altro" is recognized by `isOther`, never by name.
- Commit after each task or logical group, only when asked.
