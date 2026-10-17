# Research: Year-over-Year Chart and Summary Cards

No `NEEDS CLARIFICATION` remained in the Technical Context; the decisions below fix the open design points.

## 1. Charting library

- **Decision**: use `chart.js` directly, a new `LineController`-based wrapper component.
- **Rationale**: it is the only chart library installed (`ng2-charts` is not; part 1 research already rejected it because of its `@angular/cdk` / Angular version requirements). No new dependency (constitution II).
- **Alternatives**: add `ng2-charts` (new dependency, version conflicts); hand-drawn SVG (more code, no tooltips).

## 2. Line chart wrapper

- **Decision**: new `yoy-chart` component, typed `Chart<'line'>`, same create-then-update pattern as `chart-canvas.ts`.
- **Rationale**: `ChartCanvasComponent` is bar-typed; widening it would modify the monthly chart's wrapper, which must stay unchanged.
- **Alternatives**: generalize `chart-canvas` to any chart type (touches existing component and its typing).

## 3. Ignoring the dates in the yearly list

- **Decision**: call `filterExpenses` with `from = '0000-01-01'`, `to = '9999-12-31'` (constants `ALL_TIME_FROM`, `ALL_TIME_TO`), keeping person, category and flags.
- **Rationale**: `filterExpenses` returns `[]` for an empty or invalid range, so "unset" dates would give no data. The constants keep the function untouched and still compare `YYYY-MM-DD` strings.
- **Alternatives**: make dates optional in `filterExpenses` (changes behavior shared with the other charts); a second filter function (duplicates the person/category/flag logic).

## 4. Yearly series and the current month

- **Decision**: `yearlyMonthlySeries(expenses, today)` groups by `date.slice(0, 4)` and `slice(5, 7)`. Years are ascending. For the current year, months after the current month are `null`; every other year (including past years with gaps) has `0` for empty months. Expenses dated after the current month of the current year are not drawn.
- **Rationale**: `null` makes Chart.js stop the line (no `spanGaps`), while `0` is real zero spending. The current year/month come from the local date parts of `today`.
- **Alternatives**: cut the labels at the current month (the axis would no longer be January to December for every line).
- **Edge**: a year after the current year (expenses entered in advance) is treated as a past year, with all twelve months shown. It is rare and drawing it is simpler than hiding it.

## 5. Month count and previous period

- **Decision**:
  - `rangeSummary`: months = calendar months touched by the range (`(yearTo - yearFrom) * 12 + monthTo - monthFrom + 1`), at least 1; average = total / months, rounded to 2 decimals.
  - `previousPeriod(from, to)`: length in days `n` (both ends included); `to' = from - 1 day`, `from' = to' - (n - 1) days`. Day arithmetic uses `Date.UTC` on the date parts and `getUTC*` to format, so there is no DST or timezone shift.
  - `percentChange(current, previous)`: `null` when `previous === 0`, otherwise `(current - previous) / previous * 100`.
- **Rationale**: matches spec FR-010, FR-011, FR-012/013 and the request; amounts are positive, so a previous total of 0 means no expenses.
- **Alternatives**: previous period by calendar months (changes the "same length" meaning); `Date` with `setDate` in local time (works, but UTC arithmetic is simpler to reason about).

## 6. Invalid ranges

- **Decision**: the cards use `appliedRange()` (last valid range) like the other charts; the yearly chart does not depend on dates. `rangeSummary` and `previousPeriod` still behave on invalid input (`rangeSummary` returns zeros for an invalid range).
- **Rationale**: consistent with the existing "keep last valid range" rule of the tab and with the spec edge case.

## 7. Colors of the years

- **Decision**: `yearColor(year, palette) = palette[year % palette.length]`, palette = the accent colors without the neutral last tone (5 colors).
- **Rationale**: stable per year and different for years closer than 5 apart; the name hash of `colorFor` would collide for nearby years.
- **Alternatives**: position in the sorted list (changes when a year disappears under a filter); `colorFor(String(year))` (hash collisions).

## 8. Amount display and cards

- **Decision**: `formatEuro` for amounts, `Math.round` for the percentage, text `n/a` for `null`; arrow `▲` (increase) / `▼` (decrease) from the mockup; no arrow when the rounded value is 0. The increase uses the coral accent; the decrease uses the teal one.
- **Rationale**: follows mockup 03 (coral for an increase) and the app CSS variables.
