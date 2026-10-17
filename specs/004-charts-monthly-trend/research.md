# Research: Charts Tab - Foundation, Filters and Monthly Trend

## 1. Charting library and Angular wrapper

**Decision**: add only `chart.js` (`^4.5.1`) and use it directly through a small standalone wrapper component. Do not add `ng2-charts`.

**Findings** (checked on the npm registry on 2026-10-17):

| Package | Version | Angular peer | Other peers |
|---|---|---|---|
| `ng2-charts` | 11.0.0 (latest) | `>=22.0.0` | `@angular/cdk >=22.0.0` |
| `ng2-charts` | 10.0.0 | `>=21.0.0` | `@angular/cdk >=21.0.0` |
| `chart.js` | 4.5.1 (latest 4.x) | none | none |

The project uses Angular `^21.2.0`, so `ng2-charts@11` cannot be installed cleanly. `ng2-charts@10.0.0` is compatible but declares `@angular/cdk` as a peer, which npm would install: that is **three** new packages instead of one, and `@angular/cdk` is not otherwise used by the app.

**Rationale**: Chart.js exposes a simple imperative API (`new Chart(canvas, config)`, `chart.update()`, `chart.destroy()`). A wrapper component of about 40 lines with one `effect` is enough, works the same with or without zone.js, and keeps the "one new dependency" constraint. Constitution principle II (simplicity) favours the smaller footprint.

**Alternatives considered**:
- `ng2-charts@10.0.0`: compatible, but adds the wrapper library plus `@angular/cdk`; rejected for the footprint. It remains the fallback if the team prefers the declarative directive: only `chart-canvas.ts` would change.
- ECharts / ApexCharts: heavier for four simple charts; rejected.
- Hand-drawn SVG: no new dependency, but axes, stacking, tooltips and tap handling would have to be written and maintained; rejected.

## 2. Registering only what is used

**Decision**: import and register only `Chart`, `BarController`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip` and `Legend` from `chart.js`, once, in `chart-canvas.ts`. Parts 005 and 006 will add the arc and line pieces they need.

**Rationale**: keeps the bundle small (tree-shaking) compared with `Chart.register(...registerables)`.

## 3. Where the data comes from

**Decision**: use `ExpenseService.expenses$` (a `BehaviorSubject` already fed by `listenExpenses()` in `DashboardComponent.ngOnInit`) converted with `toSignal(..., { initialValue: [] })`. People and categories come from `PeopleService.people$` and `CategoryService.categories$`, also through `toSignal`.

**Rationale**: no new Firebase listener, query or index (FR-019). The overview tab uses `queryExpenses` with a range because it has month/year pickers; this tab needs arbitrary ranges and, in part 3, the whole history, which `expenses$` already holds. Filtering in memory follows the pattern already used for person and category in `overview.ts` and `expense-list.ts`.

**Alternatives considered**: `queryExpenses(year, month)`: cannot express a free from/to range and would add a second subscription; rejected.

## 4. Zoneless state management

**Decision**: `signal<ChartFilters>` for the filters, `signal<'total' | 'category' | 'who'>` for the toggle, and `computed` for the filtered list, the validity of the range and the chart data. The wrapper reads its input signal inside an `effect` to create or update the chart.

**Rationale**: the app is zoneless (no `zone.js`, `provideBrowserGlobalErrorListeners` only). Signals notify Angular's scheduler, so the template updates without relying on zone-triggered change detection. Older components use plain fields and subscriptions; this component does not copy that pattern.

## 5. Date handling

**Decision**: expense dates stay `YYYY-MM-DD` strings. The range comparison is a plain string comparison (`from <= date && date <= to`), which is correct for zero-padded ISO dates and inclusive on both ends. "Today" and the default start (`YYYY-01-01`) are built from local date parts (`getFullYear`, `getMonth`, `getDate`), never `toISOString`.

**Rationale**: `toISOString` converts to UTC and can shift the day around midnight in non-UTC timezones; `recurring.ts` already follows the same rule. The range of months is built from the `YYYY-MM` prefix of `from` and `to`.

## 6. Month buckets and labels

**Decision**: one bucket per calendar month from the month of `from` to the month of `to`, including empty months. Labels are the Italian short names (`Gen Feb Mar Apr Mag Giu Lug Ago Set Ott Nov Dic`, as in the mockup); when the range spans more than one calendar year the label becomes `Gen 2025`. Totals are rounded to 2 decimals after summing (`Math.round(x * 100) / 100`) to avoid floating-point drift such as `0.1 + 0.2`.

**Rationale**: matches FR-008, FR-014 and the edge cases in the spec; rounding makes "stacked total equals plain total" testable with exact equality.

## 7. Stacked modes

**Decision**: `monthlyTotalsBy(expenses, from, to, key)` returns the month labels and one series per distinct `category` (or `who`) value found in the filtered expenses, with one value per month. Series are ordered by their overall total, descending. Colors come from the app's CSS variables (`--coral`, `--teal`, `--violet`, `--amber`, `--pink`, then a neutral tone), read once with `getComputedStyle` and cycled by series order.

**Rationale**: only values that occur are shown, so a stored name that is no longer in the people/category lists is still counted (spec edge case). Reading the CSS variables keeps the chart on the app's palette (FR-016) without duplicating hex codes.

## 8. Tooltip and legend

**Decision**: use Chart.js' built-in tooltip (hover on desktop, tap on handheld) with an amount formatted as the rest of the app does (`€` followed by two decimals); the built-in legend is shown only in the stacked modes and hidden in "Total".

**Rationale**: satisfies FR-010 and FR-011 with no custom code.

## 9. Invalid range and empty data

**Decision**: the range is valid only when both dates are non-empty and `from <= to`. While it is not valid, the component keeps drawing the **last valid** range and shows a short message for the inverted case. `filterExpenses` itself returns an empty list for an inverted range (it must not depend on the UI). "No data" is shown when the filtered list is empty and the range is valid.

**Rationale**: FR-012 and FR-013 plus the "cleared date picker" edge case.

## 10. Layout and responsive behaviour

**Decision**: follow the overview: `.card` / `.card-title` from `styles.css`, `.filters` flex row with `.form-group` fields, and the same 500px breakpoint where the filters become a two-column grid. The two checkboxes and the Reset button sit on their own row below the selects. The chart container has a fixed relative height and `maintainAspectRatio: false`, so it fills the card width on any screen. Date fields use native `<input type="date">`, as the expense form does.

**Rationale**: FR-015 and FR-016; reuses existing global classes instead of new styles.

## 11. Tests

**Decision**: Vitest, `chart-data.spec.ts` next to the pure file, in the style of `debit-filter.spec.ts`: plain objects as expenses, no Angular `TestBed`, no DOM. The Chart.js wrapper and the template are verified manually in the quickstart and by `ng build`.

**Rationale**: constitution principle V covers pure logic; the project has no component-test setup and `ng test` is not configured.

## 12. Data model, rules, backup

**Decision**: no change to `Expense`, `firebase-rules.json`, `tools/backup` or `docs/datamodel-firebase.md`.

**Rationale**: the feature is read-only (FR-017, FR-018).
