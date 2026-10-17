---

description: "Task list for Charts Tab - Foundation, Filters and Monthly Trend"
---

# Tasks: Charts Tab - Foundation, Filters and Monthly Trend

**Input**: Design documents from `/specs/004-charts-monthly-trend/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-and-service.md, quickstart.md

**Tests**: Requested in the plan (Vitest, `npx vitest run --dir src`). Test tasks are included for the pure logic in `chart-data.ts`; the component and the Chart.js wrapper are verified by `ng build` and the quickstart.

**Organization**: Grouped by user story. All paths are relative to the repository root. The stories build on the same component and the same pure file, so they are implemented in priority order (US1 first); only the tasks marked [P] touch different files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = monthly totals over a period, US2 = person/category filters and reset, US3 = recurring/debit checkboxes, US4 = stacked by category/person, US5 = handheld layout

## Rules that apply to every task

- The feature is READ-ONLY: no write to Firebase, no migration. Do NOT edit `src/app/models/expense.model.ts`, `src/app/services/expense.service.ts`, `src/app/services/recurring.ts`, `firebase-rules.json`, `docs/datamodel-firebase.md` or anything under `tools/backup`.
- No new Firebase listener, query or index: read expenses only from `ExpenseService.expenses$`, people from `PeopleService.people$`, categories from `CategoryService.categories$`, each through `toSignal` from `@angular/core/rxjs-interop`.
- The only new dependency is `chart.js` `^4.5.1`. Do NOT install `ng2-charts` or `@angular/cdk`.
- Dates are `YYYY-MM-DD` strings compared as strings; build "today" and the default start from local date parts (`getFullYear`, `getMonth`, `getDate`), NEVER `toISOString`.
- No `any`, `@ts-ignore` or `@ts-nocheck` (strict TypeScript). State uses signals (`signal`, `computed`); the app is zoneless.
- UI text in Italian, amounts shown as `€` followed by two decimals (as in the overview tab).

---

## Phase 1: Setup

- [X] T001 Run `npx vitest run --dir src` and `npx vitest run --dir tools/backup` to record the green baseline before any change
- [X] T002 Install the only new dependency with `npm install chart.js@^4.5.1` (updates `package.json` and `package-lock.json`); confirm `ng2-charts` and `@angular/cdk` were not added

---

## Phase 2: Foundational (blocks all stories)

- [X] T003 [P] Create `src/app/services/chart-data.ts` with the shared types and small helpers, nothing else yet: `ChartFilters` (`from`, `to`: `YYYY-MM-DD` inclusive; `person`, `category`: `''` = all; `onlyRecurrent`, `onlyDebit`: boolean), `MonthBucket` (`key` `YYYY-MM`, `label`, `total`), `StackedChart` (`months: MonthBucket[]`, `series: { name: string; values: number[] }[]`); `defaultFilters(today = new Date())` returning `from` = `YYYY-01-01` of the current year and `to` = today (local date parts), `person` and `category` `''`, both flags `false`; `isValidRange(from, to)` true only when both are non-empty and `from <= to`; the Italian short month labels `Gen Feb Mar Apr Mag Giu Lug Ago Set Ott Nov Dic`
- [X] T004 [P] Create `src/app/components/charts/chart-canvas.ts`: standalone component `app-chart-canvas` with one input (the Chart.js `ChartConfiguration`, as a signal input) rendering a `<canvas>` inside a relatively positioned container; create the chart after the view is ready, update it (`chart.data`/`chart.options` then `chart.update()`) when the input changes, `destroy()` it on teardown; register ONLY `Chart`, `BarController`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend` from `chart.js`; set `responsive: true` and `maintainAspectRatio: false` by default

**Checkpoint**: types/defaults exist; wrapper compiles.

---

## Phase 3: User Story 1 - See how much I spend each month over a period (Priority: P1) 🎯 MVP

**Goal**: A "Grafici" tab between "Riepilogo" and "Persone" showing one bar per month for a free from/to range (default: 1 January of the current year to today), with empty months, exact amount on hover/tap, a "no data" message and a message for an inverted range.

**Independent Test**: Open the tab with expenses over several months: one bar per month, empty months as empty bars, exact total on hover/tap; change "Da"/"A" and the bars follow; an empty range shows the no-data message; "Da" after "A" shows the explanatory message and keeps the last valid chart.

### Tests for User Story 1

- [X] T005 [US1] Create `src/app/services/chart-data.spec.ts` (Vitest, plain objects as expenses, no TestBed). Cover: `defaultFilters(new Date(2026, 9, 17))` gives `from` `2026-01-01` and `to` `2026-10-17`; `isValidRange` (equal dates true, inverted false, empty string false); `filterExpenses` range inclusive on both ends (an expense on `from` and one on `to` are kept, the days just outside are dropped) and returns `[]` for an inverted range; `monthlyTotals` returns one bucket per calendar month including empty months (total `0`), a range inside a single month returns one bucket, a range crossing a year boundary (e.g. `2025-11-15` to `2026-02-10`) returns four buckets with labels carrying the year (`Nov 2025`, `Dic 2025`, `Gen 2026`, `Feb 2026`) while a single-year range has plain labels (`Gen`), decimals are summed exactly (`0.1 + 0.2` gives `0.3`), inverted range returns `[]`, and inputs are not mutated

### Implementation for User Story 1

- [X] T006 [US1] In `src/app/services/chart-data.ts` add `filterExpenses(expenses, filters)` (for now only the date range: keep expenses with `filters.from <= date <= filters.to` by string comparison; return `[]` when the range is not valid; never mutate the input) and `monthlyTotals(expenses, from, to)`: one `MonthBucket` per calendar month from the month of `from` to the month of `to` including empty months, `key` = `YYYY-MM`, `label` = Italian short name, with the year appended (`Gen 2025`) when the range spans more than one calendar year, `total` = sum of the amounts of the expenses whose `date` starts with that `YYYY-MM`, rounded to 2 decimals (`Math.round(x * 100) / 100`); `[]` for an inverted range. Makes T005 pass
- [X] T007 [P] [US1] In `src/app/components/dashboard/dashboard.ts` add `'grafici'` to the `Tab` union, add `{ key: 'grafici', label: 'Grafici' }` to the `tabs` array between `riepilogo` and `persone`, and import `ChartsComponent` in `imports`; in `src/app/components/dashboard/dashboard.html` add `@case ('grafici') { <app-charts /> }` between the `riepilogo` and `persone` cases. (The import only compiles once T008 exists; do T008 first or in the same commit)
- [X] T008 [US1] Create `src/app/components/charts/charts.ts`: standalone component `app-charts` (selector `app-charts`, `templateUrl`/`styleUrl` to `charts.html`/`charts.css`, imports `FormsModule` and `ChartCanvasComponent`). Signals: `filters = signal(defaultFilters())`; `expenses = toSignal(this.expenseService.expenses$, { initialValue: [] })`. Computed: `rangeValid` via `isValidRange`; `appliedRange` = the last valid `{from, to}` (keep the previous value while the range is not valid, e.g. kept in a plain field updated when valid); `filtered` = `filterExpenses(expenses(), { ...filters(), ...appliedRange })`; `buckets` = `monthlyTotals(filtered(), from, to)`; `hasData` = some bucket total > 0 or filtered length > 0; `chartConfig` = Chart.js bar config with labels from the buckets, one dataset of the totals in `--coral` (read once with `getComputedStyle(document.documentElement)`), tooltip label formatted as `€` plus two decimals, y axis starting at 0, no legend. Methods to set `from` and `to` on the signal from the date inputs
- [X] T009 [US1] Create `src/app/components/charts/charts.html`: `.card` with `.card-title` "Grafici"; a `.filters` block with two `.form-group` date inputs "Da" (`id="from"`) and "A" (`id="to"`, `type="date"`) bound to the filters signal; when `!rangeValid()` show the message "La data iniziale non può essere dopo quella finale" (class `field-error`) only for the inverted case; below it a section "Andamento mensile" (class `section-title`) with `<app-chart-canvas [config]="chartConfig()" />` when `hasData()`, otherwise `<p class="empty-state">Nessun dato per i filtri selezionati</p>`
- [X] T010 [P] [US1] Create `src/app/components/charts/charts.css`: reuse the overview styling (`.filters` flex wrap with `gap: 1rem` and `.form-group { flex: 1; min-width: 140px; margin-bottom: 0 }`, `.section-title` as in `src/app/components/overview/overview.css`); a `.chart-box` with `position: relative; height: 320px` for the canvas container; use only the existing CSS variables (`--coral`, `--ink`, `--line`, `--radius-md`)

**Checkpoint**: US1 works alone; T005 passes; the tab appears in the right position.

---

## Phase 4: User Story 2 - Narrow the chart to a person or a category, and reset (Priority: P1)

**Goal**: Shared filter bar gains Persona and Categoria selects (default "Tutte") and a "Reimposta" button restoring every filter to its default.

**Independent Test**: Select a person, a category, both: bars count only matching expenses. Press "Reimposta": dates, person, category (and checkboxes/toggle once they exist) return to defaults.

### Tests for User Story 2

- [X] T011 [US2] In `src/app/services/chart-data.spec.ts` add tests for `filterExpenses`: person filter keeps only `who` equal to the value; category filter keeps only matching `category`; both combine; empty strings keep everything; an expense whose person or category is not in any list is still kept when no such filter is set

### Implementation for User Story 2

- [X] T012 [US2] In `src/app/services/chart-data.ts` extend `filterExpenses` so that, when `filters.person` is not empty, only expenses with `who === filters.person` are kept, and when `filters.category` is not empty, only expenses with `category === filters.category` are kept. Makes T011 pass
- [X] T013 [US2] In `src/app/components/charts/charts.ts` add `people = toSignal(this.peopleService.people$, { initialValue: [] })` and `categories = toSignal(this.categoryService.categories$, { initialValue: [] })` (inject `PeopleService` and `CategoryService`), setters for `person` and `category` on the filters signal, and `reset()` that assigns `defaultFilters()` to the filters signal
- [X] T014 [US2] In `src/app/components/charts/charts.html` add to the `.filters` block two `.form-group` selects "Persona" (`id="person"`) and "Categoria" (`id="category"`), each with a first option "Tutte" (value `''`) followed by the people/categories lists (same markup pattern as `src/app/components/overview/overview.html`), and a "Reimposta" button (`class="btn btn-outline btn-sm"`) calling `reset()`

**Checkpoint**: US1 and US2 work; T011 passes.

---

## Phase 5: User Story 3 - Look only at recurring or on-debit expenses (Priority: P2)

**Goal**: "Solo ricorrenti" and "Solo addebito" checkboxes (off by default) restrict the data to expenses with the existing flags; when both are on, both must hold.

**Independent Test**: With flagged, unflagged and old (no flag) expenses, tick each checkbox alone and both: only matching expenses count; old expenses vanish when a checkbox is on and return when off.

### Tests for User Story 3

- [X] T015 [US3] In `src/app/services/chart-data.spec.ts` add tests for `filterExpenses`: both flags off keeps flagged and unflagged expenses; `onlyRecurrent` keeps only `recurrent === true`; `onlyDebit` keeps only `debit === true`; both on keeps only expenses with both; a legacy expense with NO `recurrent` and NO `debit` key is kept with the checkboxes off and excluded with either one on

### Implementation for User Story 3

- [X] T016 [US3] In `src/app/services/chart-data.ts` extend `filterExpenses` so that `onlyRecurrent` keeps only `recurrent === true` and `onlyDebit` keeps only `debit === true` (a missing flag counts as false and as not on debit). Makes T015 pass
- [X] T017 [US3] In `src/app/components/charts/charts.ts` add setters for `onlyRecurrent` and `onlyDebit` on the filters signal; in `src/app/components/charts/charts.html` add two checkboxes with labels "Solo ricorrenti" (`id="onlyRecurrent"`) and "Solo addebito" (`id="onlyDebit"`), unticked by default, in a `.flags` row inside the filter bar next to the "Reimposta" button; in `src/app/components/charts/charts.css` style `.flags` (flex, wrap, `gap: 1rem`, aligned center)

**Checkpoint**: US1-US3 work; T015 passes; "Reimposta" also unticks both boxes (it assigns `defaultFilters()`).

---

## Phase 6: User Story 4 - See what each month is made of (Priority: P2)

**Goal**: A toggle "Totale" (default) / "Per categoria" / "Per persona" stacks each bar by category or person, with a legend and exact amount of each part on hover/tap.

**Independent Test**: Switch the toggle through its three values: stacked parts of each month add up to the "Totale" bar; legend matches the colors; with a person selected and "Per persona", every bar has a single part.

### Tests for User Story 4

- [X] T018 [US4] In `src/app/services/chart-data.spec.ts` add tests for `monthlyTotalsBy`: with key `'category'` and key `'who'`, for every month the sum of the series values equals `months[i].total` (compare with exact equality after the 2-decimal rounding); one series per distinct value found; series ordered by overall total descending; a category or person name that is not in any list is still counted; empty months give `0` in every series; `months` equals `monthlyTotals(...)` of the same input; inverted range gives empty `months` and `series`

### Implementation for User Story 4

- [X] T019 [US4] In `src/app/services/chart-data.ts` add `monthlyTotalsBy(expenses, from, to, key: 'category' | 'who'): StackedChart`: `months` = `monthlyTotals(expenses, from, to)`, `series` = one `{ name, values }` per distinct `expense[key]` in the input, `values[i]` = sum (rounded to 2 decimals) of that name's amounts in `months[i]`, series ordered by overall total descending; empty `series` for an inverted range. Makes T018 pass
- [X] T020 [US4] In `src/app/components/charts/charts.ts` add `mode = signal<'total' | 'category' | 'who'>('total')`; make `chartConfig` build, for `'total'`, the single coral dataset with no legend, and for `'category'`/`'who'` one stacked dataset per series of `monthlyTotalsBy` (`stacked: true` on both axes, legend shown at the bottom, tooltip showing series name and `€` plus two decimals), colors cycled in series order from the app CSS variables `--coral`, `--teal`, `--violet`, `--amber`, `--pink` then the neutral `--ink-dim` (read with `getComputedStyle(document.documentElement)`); make `reset()` also set `mode` back to `'total'`
- [X] T021 [US4] In `src/app/components/charts/charts.html` add, above the chart, a toggle of three buttons "Totale", "Per categoria", "Per persona" (class `.mode-toggle`, the active one with class `active`, `type="button"`) bound to `mode`; in `src/app/components/charts/charts.css` style `.mode-toggle` as a pill group using `--radius-full`, `--line`, `--coral` for the active button, consistent with the `.tab-btn` look in `src/app/components/dashboard/dashboard.css`

**Checkpoint**: US1-US4 work; T018 passes.

---

## Phase 7: User Story 5 - Use the tab comfortably on a handheld device (Priority: P2)

**Goal**: Single column, compact filter bar, no horizontal page scrolling, chart and legend readable on narrow screens.

**Independent Test**: Window below 500px: filters in a two-column grid, flags and "Reimposta" on their own row, chart full width, no horizontal page scroll, tap shows the exact amount.

- [X] T022 [US5] In `src/app/components/charts/charts.css` add `@media (max-width: 500px)`: `.filters` becomes `display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem` with `.filters .form-group { min-width: 0 }` (same approach as `src/app/components/overview/overview.css`); `.flags` and the "Reimposta" button span the full row (`grid-column: 1 / -1`); `.mode-toggle` stretches to full width with equal buttons; `.chart-box` height reduced to about 260px; add `min-width: 0` to the card content so the canvas never forces horizontal scrolling

**Checkpoint**: all five stories work.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T023 Run `npx vitest run --dir src` and confirm all specs pass: the new `chart-data.spec.ts` and the existing ones (`recurring`, `debit-filter`, `expense.service`)
- [X] T024 [P] Run `npx vitest run --dir tools/backup` and confirm the backup tests are still green
- [X] T025 Run `npx ng build` and confirm the strict build passes with no errors
- [X] T026 Run `git diff --stat -- src/app/models src/app/services/expense.service.ts src/app/services/recurring.ts firebase-rules.json tools/backup docs/datamodel-firebase.md` and confirm it is empty (read-only feature: none of these may change); confirm `package.json` adds only `chart.js` and no `ng2-charts` or `@angular/cdk`
- [ ] T027 Walk through the manual scenarios in `specs/004-charts-monthly-trend/quickstart.md` (`npm start`, mock backend) on desktop and below 500px width, and fix any deviation from the spec

---

## Phase 9: Follow-up change - Stacked blocks ordered per bar (US4 refinement)

**Request**: in the stacked modes, the blocks inside each bar MUST be ordered by size **within that bar**: the block with the largest amount in that month is the lowest one, the smallest is at the top. The request names the "Per categoria" view; the same code path serves "Per persona", so both stacked modes get the same rule (one behaviour, no extra branching).

**Scope: presentation only.** Nothing changes in what is counted: `filterExpenses`, `monthlyTotals` and `monthlyTotalsBy` stay exactly as they are, the totals, the filters, the toggle and the "Totale" mode are untouched, and `spec.md`, `data-model.md` and `contracts/` are not edited. Only the order in which the blocks are drawn changes.

**Decision recorded**: ordering is per bar (per month), not one global order. The same name keeps the same color in every bar, so the position of a color can change from one bar to the next. Chart.js stacks datasets in a fixed order, so the stacked chart is fed with "layers" (layer 0 = bottom = the largest block of each month, layer 1 = the second largest, ...) instead of one dataset per name, and the legend is built from the names.

**Independent Test**: with expenses where the biggest category differs between two months, switch to "Per categoria": in each bar the largest block is at the bottom and sizes decrease going up; the legend still lists every name with its color; the bar totals do not change.

### Tests for the follow-up

- [X] T028 [US4] In `src/app/services/chart-data.spec.ts` add a `describe('rankStacked')` block for the new function: for each month the layers are ordered by that month's value, descending, layer 0 first (bottom); two months with a different biggest name produce different names in layer 0; equal values keep the overall order of `StackedChart.series` (stable tie-break); entries with value `0` come after all entries with a value above `0`; for every month the sum of the layer values equals `months[i].total` (compare after the same 2-decimal rounding); the number of layers equals the number of series; an empty `series` returns `[]`; the input is not mutated

### Implementation for the follow-up

- [X] T029 [US4] In `src/app/services/chart-data.ts` add and export `rankStacked(stacked: StackedChart): { names: string[]; values: number[] }[]`: returns one layer per series, `layers[k].names[i]` and `layers[k].values[i]` being the name and value of the k-th largest series in `stacked.months[i]` (sorted by value descending, ties keep the order of `stacked.series`, zero values last); `[]` when `stacked.series` is empty. Pure and I/O-free, no `any`. Makes T028 pass
- [X] T030 [US4] In `src/app/components/charts/charts.ts` change the stacked branch of `chartConfig` (modes `'category'` and `'who'`) to use `rankStacked(stacked)`: one dataset per layer (`stack` order bottom to top = layer 0 first), `data` = layer values, `backgroundColor` = an array with, for each month, the color of that block's name; the color of a name is fixed by its index in `stacked.series` (overall total order) cycled through the existing palette, so a name has the same color in every bar. Tooltip label shows `${names[i]}: ` plus `€` and two decimals using the layer's name for the hovered month, and the tooltip hides items whose value is `0` (`filter`). Legend: `generateLabels` returns one entry per name in `stacked.series` with its color, and `onClick` is a no-op so a click cannot hide a layer. The `'total'` branch stays unchanged
- [X] T031 [P] [US4] In `specs/004-charts-monthly-trend/quickstart.md` add one line to manual scenario 7 only: "in each bar the block with the largest amount of that month is the lowest one and sizes decrease going up; with data where the biggest category differs between two months, the order differs between those two bars; the legend still lists every name with its color; bar totals are unchanged"

### Verification for the follow-up

- [X] T032 Run `npx vitest run --dir src` (all specs, including the new `rankStacked` tests), `npx vitest run --dir tools/backup` and `npx ng build`; all must pass. Then repeat manual scenario 7 of `quickstart.md` including the new per-bar ordering check (can be done together with T027)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: after Setup; T003 and T004 are independent files and can run in parallel; T004 needs T002 (`chart.js` installed)
- **User stories (Phases 3-7)**: all need Foundational. They share `chart-data.ts`, `chart-data.spec.ts`, `charts.ts`, `charts.html` and `charts.css`, so implement them in order US1 → US2 → US3 → US4 → US5 (US1 is the MVP; the later ones extend the same files)
- **Polish (Phase 8)**: after all desired stories
- **Follow-up (Phase 9)**: after US4 (T018-T021) because it changes the stacked branch of `chartConfig`; order T028 → T029 → T030; T031 (one quickstart line) can run in parallel with T029/T030; T032 last

### Within each story

- Test task first (it fails), then the `chart-data.ts` change that makes it pass, then component, template and style
- In US1: T005 → T006; T008 before T007 compiles; T009 after T008; T010 independent

### Parallel opportunities

- T003 and T004 (different files)
- In US1: T007 (dashboard files) and T010 (`charts.css`) can run alongside T008/T009 once T003 exists
- T023 and T024 can run together after the code is done

## Parallel Example: Foundational + US1

```text
# Together:
Task: "T003 Create src/app/services/chart-data.ts (types and helpers)"
Task: "T004 Create src/app/components/charts/chart-canvas.ts"

# After T006 and T008 exist:
Task: "T007 Register the Grafici tab in src/app/components/dashboard/dashboard.ts and dashboard.html"
Task: "T010 Create src/app/components/charts/charts.css"
```

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 and Phase 2
2. Phase 3 (US1): tab, date range, monthly bars, empty and invalid states
3. **Stop and validate** with quickstart scenarios 1-4, 8-10; the tab is already useful

### Incremental delivery

1. Foundation + US1 → MVP
2. US2 (person, category, reset) → validate scenarios 5 and 11
3. US3 (flags) → scenario 6
4. US4 (stacking) → scenario 7
5. US5 (handheld) → scenario 12
6. Polish: tests, build, no-diff check, full quickstart

## Notes

- [P] tasks = different files, no dependencies
- Keep `filterExpenses` as ONE function extended in US2 and US3, not three functions
- Commit after each story checkpoint
- Parts 005 and 006 will reuse `chart-data.ts`, the filter bar and `chart-canvas.ts`; do not add pie or line chart code here
