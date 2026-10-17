---

description: "Task list for the year-over-year chart and the summary cards"
---

# Tasks: Charts Tab - Year-over-Year Comparison and Summary Cards

**Input**: Design documents from `/specs/006-charts-yoy-kpi/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-and-service.md, quickstart.md

**Tests**: Requested in the plan input: Vitest cases for the pure functions in `src/app/services/chart-data.spec.ts`, run with `npx vitest run --dir src`. UI is verified by the manual scenarios in quickstart.md and by `ng build` at the end.

**Organization**: Tasks are grouped by user story. All paths are relative to the repository root. Strict TypeScript, no `any`, no new dependency; never touch `firebase-rules.json`, `tools/backup`, `src/app/models/expense.model.ts`, `src/app/components/charts/chart-canvas.ts`, `src/app/components/charts/breakdown-chart/`, `filterExpenses` or the behavior of the monthly chart and the rings. Dates are `YYYY-MM-DD` strings: never `toISOString`, never `new Date('YYYY-MM-DD')`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: User story the task belongs to (US1 to US5)

---

## Phase 1: Setup

**Purpose**: Confirm the baseline before changing anything.

- [X] T001 Run `npx vitest run --dir src` and `ng build` from the repository root and confirm both pass before any change (baseline); note the existing test count.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and constants in `src/app/services/chart-data.ts` (pure, I/O-free). Contract: `contracts/ui-and-service.md`.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 In `src/app/services/chart-data.ts` add `export const ALL_TIME_FROM = '0000-01-01'` and `export const ALL_TIME_TO = '9999-12-31'` (used to ignore the dates through the unchanged `filterExpenses`, because it returns `[]` for an empty range), plus `export interface YearSeries { year: number; months: (number | null)[] }` (months has length 12), `export interface DateRange { from: string; to: string }` and `export interface RangeSummary { total: number; monthlyAverage: number }`.

**Checkpoint**: types and constants compile (`ng build` still passes).

---

## Phase 3: User Story 1 - Compare the same months across years (Priority: P1) 🎯 MVP

**Goal**: A year-over-year line chart below the rings: January to December, one line per year with expenses, legend of the years in ascending order with one color per year, exact amount on hover/tap, the current year stopping at the current month.

**Independent Test**: With expenses in at least two years, open "Grafici": the chart shows one line per year with expenses, a legend with those years, the current year ending at the current month, and the exact amount of a point on hover or tap (quickstart scenarios 1 to 4).

### Tests for User Story 1

> Write these first, confirm they fail, then rely on T004 and T005.

- [X] T003 [US1] In `src/app/services/chart-data.spec.ts` add `describe('yearlyMonthlySeries')` and `describe('yearColor')` blocks, using a fixed `today` such as `new Date(2026, 9, 17)` (October, local date): (a) a single year of data gives one entry with 12 monthly totals; (b) several years give one entry each, sorted ascending by `year`; (c) a past year with missing months has `0` (not `null`) in the empty months; (d) the current year has real values up to October and `null` for November and December, with no `0` after the current month; (e) an expense dated after the current month of the current year is not counted in any month (that month stays `null`); (f) totals are rounded to cents (for example 0.1 + 0.2 gives 0.3); (g) legacy expenses without `recurrent` or `debit` keys are counted normally; (h) empty input returns `[]`; (i) the input array is not mutated; (j) `yearColor(2026, palette)` equals `palette[2026 % palette.length]`, and two years less than `palette.length` apart never share a color.

### Implementation for User Story 1

- [X] T004 [US1] In `src/app/services/chart-data.ts` implement `export function yearlyMonthlySeries(expenses: Expense[], today: Date): YearSeries[]`: group by `Number(e.date.slice(0, 4))` and `Number(e.date.slice(5, 7))`; one entry per year with at least one expense, sorted ascending; 12 monthly totals each rounded with the existing `round2`; empty months are `0`; only for the year equal to `today.getFullYear()` the months after `today.getMonth() + 1` are `null` (expenses in those months are ignored); use the local date parts of `today` and no `toISOString`; years after the current year are treated like past years (all 12 months real); empty input returns `[]`.
- [X] T005 [US1] In `src/app/services/chart-data.ts` implement `export function yearColor(year: number, palette: string[]): string` returning `palette[year % palette.length]` (caller guarantees a non-empty palette). Do not use `colorFor`: its hash would collide for nearby years.
- [X] T006 [P] [US1] Create `src/app/components/charts/yoy-chart/yoy-chart.ts`: standalone `OnPush` component `app-yoy-chart` with inline template `<div class="chart-box"><canvas #canvas></canvas></div>` and style `.chart-box { position: relative; width: 100%; height: 100%; }`; one required input `config` of type `ChartConfiguration<'line'>`; register `LineController`, `LineElement`, `PointElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend` from `chart.js`; create the `Chart<'line'>` in `ngAfterViewInit` and update `data` and `options` in an `effect` when the config changes, merging `{ responsive: true, maintainAspectRatio: false }`; destroy the chart in `DestroyRef.onDestroy`. Same pattern as `src/app/components/charts/chart-canvas.ts`, which is not modified.
- [X] T007 [US1] In `src/app/components/charts/charts.ts` import `ALL_TIME_FROM`, `ALL_TIME_TO`, `MONTH_LABELS`, `yearColor`, `yearlyMonthlySeries` and `YoyChartComponent` (add it to `imports`), and add computed signals: `yearlyFiltered` = `filterExpenses(this.expenses(), { ...this.filters(), from: ALL_TIME_FROM, to: ALL_TIME_TO })`; `yearlySeries` = `yearlyMonthlySeries(this.yearlyFiltered(), new Date())`; `hasYearly` = `yearlySeries().length > 0`; `yoyConfig` = `ChartConfiguration<'line'>` with `labels: MONTH_LABELS`, one dataset per year (`label: String(year)`, `data: months`, `borderColor` and `backgroundColor` from `yearColor(year, accent palette)` where the accent palette is `paletteColors()` without its last (neutral) tone, `borderWidth: 3`, `pointRadius: 3.5`, no `spanGaps` so `null` stops the line), legend at the top right with the years (default Chart.js legend, ascending order as the datasets), tooltip label `` `${ctx.dataset.label}: ${formatEuro(ctx.parsed.y ?? 0)}` `` and a y axis with `beginAtZero: true` and `formatEuro` ticks.
- [X] T008 [US1] In `src/app/components/charts/charts.html`, after the `breakdown-grid` div and still inside the card, add `<h3 class="section-title">Anno su anno</h3>` and `@if (hasYearly()) { <div class="yoy-area"><app-yoy-chart [config]="yoyConfig()" /></div> }`. (The empty branch is added in US4, the note in US2.)
- [X] T009 [P] [US1] In `src/app/components/charts/charts.css` add `.yoy-area { position: relative; height: 320px; min-width: 0; }` (the same height as `.chart-area`) and, in the existing `@media (max-width: 500px)` block, `.yoy-area { height: 260px; }`.

**Checkpoint**: the yearly chart is visible, correct and independently testable.

---

## Phase 4: User Story 2 - The chart ignores dates but follows the other filters (Priority: P1)

**Goal**: The yearly chart does not depend on "from" and "to", follows person, category and the two flags, and a short note under it says it is not affected by the date filter.

**Independent Test**: Change only the dates and verify the yearly chart does not change while the others do; set a person, a category and each checkbox and verify it recomputes; the note is visible (quickstart scenarios 5 and 6).

### Tests for User Story 2

- [X] T010 [US2] In `src/app/services/chart-data.spec.ts` add `describe('yearly series with filters')`, building the list the way the component does (`filterExpenses(expenses, { ...filters, from: ALL_TIME_FROM, to: ALL_TIME_TO })` then `yearlyMonthlySeries`): (a) two different `from`/`to` ranges, even an inverted one or one covering a single day, give an identical series; (b) the `person` filter keeps only that person's expenses in every year; (c) the `category` filter keeps only that category; (d) `onlyRecurrent` and `onlyDebit` each keep only the matching expenses and, together, only those that are both; (e) legacy expenses without `recurrent` or `debit` keys are excluded by the flag filters and included without them; (f) a filter that matches nothing gives `[]`.

### Implementation for User Story 2

- [X] T011 [US2] In `src/app/components/charts/charts.html`, inside the `@if (hasYearly())` block of T008, after the `yoy-area` div add `<p class="yoy-note">Non è influenzato dal filtro date.</p>`.
- [X] T012 [P] [US2] In `src/app/components/charts/charts.css` add `.yoy-note { margin: 0.5rem 0 0; font-size: 0.8rem; color: var(--ink-dim); }`.
- [X] T013 [US2] Verify in `src/app/components/charts/charts.ts` that `yearlyFiltered` reads `this.filters()` and not `appliedRange()` (so inverted or incomplete dates never affect the chart); adjust if not.

**Checkpoint**: US1 and US2 together deliver the complete yearly chart.

---

## Phase 5: User Story 3 - See the key numbers of the period at a glance (Priority: P1)

**Goal**: Three summary cards above the charts: total, monthly average, and change vs the previous period, computed on all filters including the dates.

**Independent Test**: With known expenses and a date range, the total equals the sum of the matching expenses and the monthly chart total, the average equals total divided by the calendar months touched, and the change equals the percentage difference from the immediately preceding range of the same length (quickstart scenarios 7 to 10).

### Tests for User Story 3

> Write these first, confirm they fail, then rely on T015 to T017.

- [X] T014 [US3] In `src/app/services/chart-data.spec.ts` add blocks `describe('rangeSummary')`, `describe('previousPeriod')` and `describe('percentChange')`: (a) `rangeSummary` over a range of exactly one month gives `monthlyAverage === total`; (b) over a partial range of 15 January to 3 March gives `total / 3`; (c) over a range crossing a year boundary (1 December to 31 January) gives `total / 2`; (d) a range inside one month, even a single day, counts as 1 month; (e) totals and averages are rounded to cents; (f) an invalid range (empty or inverted) gives `{ total: 0, monthlyAverage: 0 }`; (g) empty input gives zeros; (h) `previousPeriod('2026-03-15', '2026-03-15')` (1 day) gives `{ from: '2026-03-14', to: '2026-03-14' }`; (i) a 30-day range such as `2026-04-01` to `2026-04-30` gives `2026-03-02` to `2026-03-31`; (j) the full year `2026-01-01` to `2026-12-31` gives `2025-01-01` to `2025-12-31`; (k) a range starting on 1 March after a leap year (`2025-03-01` to `2025-03-31` gives `2025-01-29` to `2025-02-28`) and a range covering 29 February keep the same length in days; (l) `percentChange(100, 0)` is `null` and `percentChange(0, 0)` is `null`; (m) `percentChange(120, 100)` is `20`; (n) `percentChange(80, 100)` is `-20`; (o) `percentChange(0, 100)` is `-100`; (p) `percentChange(100, 100)` is `0`.

### Implementation for User Story 3

- [X] T015 [US3] In `src/app/services/chart-data.ts` implement `export function rangeSummary(expenses: Expense[], from: string, to: string): RangeSummary`: `total` = `round2` of the sum of the amounts; months = `(yearTo - yearFrom) * 12 + monthTo - monthFrom + 1` from `from.slice(0, 4)`/`slice(5, 7)` and the same of `to`, at least 1; `monthlyAverage` = `round2(total / months)`; when `isValidRange(from, to)` is false return `{ total: 0, monthlyAverage: 0 }`. The expenses are assumed to be already filtered; do not filter by date here.
- [X] T016 [US3] In `src/app/services/chart-data.ts` implement `export function previousPeriod(from: string, to: string): DateRange`: convert each date to a day number with `Date.UTC(year, month - 1, day) / 86400000`, `length = toDay - fromDay + 1`, `prevTo = fromDay - 1`, `prevFrom = prevTo - (length - 1)`, and format back with `getUTCFullYear/getUTCMonth/getUTCDate` and the existing `pad2` (calendar arithmetic only: no local time, no `toISOString`, no DST effect).
- [X] T017 [US3] In `src/app/services/chart-data.ts` implement `export function percentChange(current: number, previous: number): number | null`: `null` when `previous === 0`, otherwise `(current - previous) / previous * 100` (not rounded).
- [X] T018 [US3] In `src/app/components/charts/charts.ts` import `percentChange`, `previousPeriod`, `rangeSummary` and add computed signals: `summary` = `rangeSummary(this.filtered(), from, to)` with `{ from, to }` from `appliedRange()`; `previousSummary` = `const prev = previousPeriod(from, to); rangeSummary(filterExpenses(this.expenses(), { ...this.filters(), from: prev.from, to: prev.to }), prev.from, prev.to)` (same person, category and flags, only the dates differ); `change` = `percentChange(this.summary().total, this.previousSummary().total)`; `changeText` = `'n/a'` when `change()` is `null`, otherwise `` `${Math.abs(Math.round(change))}%` `` with a prefix `▲ ` when the rounded value is above 0, `▼ ` when below 0 and nothing when it is 0; `changeDirection` = `'up' | 'down' | 'none'` from the rounded value (`'none'` when `null` or 0).
- [X] T019 [US3] In `src/app/components/charts/charts.html`, after the `rangeInverted()` error message and before the `Andamento mensile` title, add `<div class="kpi-grid">` with three `<div class="kpi-card">` children: "Totale periodo" with `{{ formatEuro(summary().total) }}`; "Media mensile" with `{{ formatEuro(summary().monthlyAverage) }}`; "vs periodo prec." with `{{ changeText() }}` carrying `[class.up]="changeDirection() === 'up'"` and `[class.down]="changeDirection() === 'down'"` and, for an up or down change only, a short caption ("spesa in aumento" / "spesa in calo"). Expose `formatEuro` on the component (`readonly formatEuro = formatEuro;`) for the template.
- [X] T020 [P] [US3] In `src/app/components/charts/charts.css` add `.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; min-width: 0; }`, `.kpi-card` (white background like the other cards, `border: 1px solid var(--line)`, `border-radius`, padding, `min-width: 0`), `.kpi-label` (small, `var(--ink-dim)`), `.kpi-value` (Baloo 2 as in `.section-title`, bold, about 1.5rem, `var(--ink)`), `.kpi-value.up { color: var(--coral); }`, `.kpi-value.down { color: var(--teal); }` and `.kpi-caption` (small, `var(--ink-dim)`), following mockup `docs/mockup/03-kpi.svg` and the existing app CSS variables.

**Checkpoint**: the three cards are correct and independently testable.

---

## Phase 6: User Story 4 - Clear empty state (Priority: P2)

**Goal**: With no matching expense the yearly chart shows the same "no data" message as the other charts and the cards show zero, zero and "n/a"; when only the date range is empty the chart is still drawn.

**Independent Test**: Choose filters that match nothing: message in the yearly area, cards `€0.00`, `€0.00`, `n/a`; choose a date range without expenses while other years have data: zeros in the cards and the chart still drawn (quickstart scenarios 11 and 12).

- [X] T021 [US4] In `src/app/components/charts/charts.html` add the `@else` branch to the `@if (hasYearly())` block: `<p class="empty-state">Nessun dato per i filtri selezionati</p>` (the same text and class used by the monthly chart; the note is not shown in this branch).
- [X] T022 [US4] In `src/app/services/chart-data.spec.ts` add to the `describe('rangeSummary')` and `describe('percentChange')` blocks the empty-state cases not already covered: `rangeSummary([], from, to)` is `{ total: 0, monthlyAverage: 0 }` for a valid range, and the combination `percentChange(0, 0)` is `null` (cards show `€0.00`, `€0.00`, `n/a`).
- [X] T023 [US4] Verify in `src/app/components/charts/charts.ts` that `changeText()` is `'n/a'` and `changeDirection()` is `'none'` when there is no previous expense (including no expense at all), that the caption is not rendered in that case, and that the cards read `summary()` and `previousSummary()` (date based) while the yearly chart reads `yearlySeries()` (date free), so FR-015 holds; adjust if not.

**Checkpoint**: all empty states behave as in the spec.

---

## Phase 7: User Story 5 - Use the new elements comfortably on a handheld device (Priority: P2)

**Goal**: Cards in one compact row of three on narrow screens, the yearly chart and its legend fit the width, no horizontal page scrolling.

**Independent Test**: At 500px or less (or on a phone) the cards are compact and readable, the chart fits the width, tapping a point shows its amount, and the page does not scroll horizontally (quickstart scenario 13).

- [X] T024 [US5] In `src/app/components/charts/charts.css`, inside the existing `@media (max-width: 500px)` block, add compact card styles: `.kpi-grid { gap: 0.5rem; }`, smaller `.kpi-card` padding, `.kpi-label` about 0.7rem, `.kpi-value` about 1.05rem, `.kpi-caption` hidden or very small, and text wrapping allowed so values such as `€12345.67` never overflow the card; keep all cards inside the viewport width.
- [X] T025 [US5] In `src/app/components/charts/charts.ts` in `yoyConfig` set the legend `labels` for narrow screens through the existing responsive Chart.js behavior only (no new resize listeners): `boxWidth` about 12 so that many years wrap onto more lines instead of overflowing, and check that the tooltip also opens on tap (the Chart.js default for `interaction`, `mode: 'nearest'` and `intersect: false` is used so a tap near a point shows its amount).
- [ ] T026 [US5] Open `ng serve`, reduce the window to 500px, and confirm no horizontal page scroll, the cards stay in one row of three and are readable, and the yearly chart, legend and note fit the width; fix the CSS in `src/app/components/charts/charts.css` if not.

**Checkpoint**: all five stories work on desktop and handheld.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of the whole feature.

- [X] T027 Run `npx vitest run --dir src` and confirm all specs pass, including the existing ones (recurring, debit, expense service, chart data from parts 1 and 2) and the new cases.
- [X] T028 Run `ng build` from the repository root and confirm it finishes without errors or new warnings.
- [ ] T029 Run the manual scenarios of `specs/006-charts-yoy-kpi/quickstart.md` (1 to 15) with `ng serve` and fix any difference found.
- [X] T030 Run `git diff --stat` and confirm there is no change in `firebase-rules.json`, `tools/backup`, `src/app/models/expense.model.ts`, `src/app/components/charts/chart-canvas.ts`, `src/app/components/charts/breakdown-chart/` or the dates logic of `filterExpenses`, and that `package.json` has no new dependency.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; blocks all stories.
- **US1 (Phase 3)**: depends on Foundational. **US2 (Phase 4)** extends the US1 section (note and filter tests), so it follows US1.
- **US3 (Phase 5)**: depends only on Foundational; it can be done before or in parallel with US1 and US2, but US1 to US3 all edit `charts.ts`, `charts.html`, `charts.css` and `chart-data.ts`, so in one working tree they are done one after the other.
- **US4 (Phase 6)**: depends on US1 (yearly empty branch) and US3 (cards).
- **US5 (Phase 7)**: depends on US1 and US3 (the elements it makes compact).
- **Polish (Phase 8)**: depends on all stories.

### Within each story

- Tests first (they fail), then pure functions, then component data, then template, then CSS.

### Parallel Opportunities

- T006 (new file `yoy-chart.ts`) can run in parallel with T003 to T005.
- T009, T012 and T020 (CSS) can run in parallel with the `.ts` and `.html` tasks of their own story once the class names are known.
- No two tasks that edit the same file are marked [P].

---

## Parallel Example: User Story 1

```text
# After T002, together:
Task: "T003/T004/T005 in src/app/services/chart-data.ts and chart-data.spec.ts"
Task: "T006 Create src/app/components/charts/yoy-chart/yoy-chart.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 and Phase 2.
2. Phase 3 (US1) and Phase 4 (US2): the complete yearly chart. Validate with quickstart scenarios 1 to 6.
3. Phase 5 (US3): the summary cards. Validate scenarios 7 to 10.
4. Phases 6 and 7 (empty states, handheld), then Phase 8.

### Incremental Delivery

Each phase leaves the app building and the existing tab unchanged apart from the new element it adds, so it can be stopped at any checkpoint.

---

## Notes

- [P] tasks = different files, no dependencies on unfinished tasks.
- [Story] label maps the task to a user story for traceability.
- Commit after each phase.
- If a deviation from `plan.md` becomes necessary, update the plan first.
