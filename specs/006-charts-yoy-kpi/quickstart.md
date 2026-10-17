# Quickstart: Validating the Year-over-Year Chart and Summary Cards

Details of the functions and UI are in [contracts/ui-and-service.md](./contracts/ui-and-service.md) and [data-model.md](./data-model.md).

## Prerequisites

- Node and the project dependencies installed (`npm install`); no new package is needed.
- To see the feature, a signed-in app with expenses in at least two different years (including the current one), more than one person and category, and a few recurring or on-debit expenses.

## 1. Automated checks

```powershell
npx vitest run --dir src
ng build
```

Expected: all specs green, including the new cases in `src/app/services/chart-data.spec.ts` (single year, several years, a year with missing months, the current year stopping at the current month, person and category filters on the yearly series with dates ignored, monthly average for one month and for a partial month, a range crossing a year boundary, `previousPeriod` for 1 day, 30 days and a full year, `percentChange` with previous 0 / positive / negative, legacy expenses without `recurrent` or `debit`, empty input); existing specs unchanged and green; `ng build` ends without errors.

## 2. Manual scenarios (`ng serve`, tab "Grafici")

| # | Steps | Expected |
|---|---|---|
| 1 | Open the tab with default filters | Three cards under the filter bar (desktop: one row); "Anno su anno" chart below the two rings |
| 2 | Look at the yearly chart | One line per year with expenses, January to December, legend of the years ascending, each year its own color |
| 3 | Check the current year line | It stops at the current month; no zero drop after it |
| 4 | Hover (desktop) or tap (phone) a point | Tooltip with year and exact amount |
| 5 | Change "Da" and "A" | Cards and other charts change; the yearly chart does not |
| 6 | Pick a person, a category, then each checkbox | The yearly chart and the cards both recompute |
| 7 | Compare the first card with the monthly chart | Card total equals the sum of the monthly bars |
| 8 | Range of one full month, then a range of 15 Jan - 3 Mar | Average = total; average = total / 3 |
| 9 | Range with no earlier expenses | Third card shows "n/a", no arrow |
| 10 | Range with earlier expenses lower / higher | `▲ n%` / `▼ n%` |
| 11 | Filters matching nothing | Cards: €0.00, €0.00, "n/a"; yearly chart shows "Nessun dato per i filtri selezionati" |
| 12 | Date range with no expenses, but other years have data | Cards show zeros; the yearly chart is still drawn |
| 13 | Narrow the window to 500px or less | Cards compact in one row of three, chart fits the width, no horizontal scroll |
| 14 | Press Reimposta | Filters back to default; everything recomputes |
| 15 | Inspect Firebase traffic or data | No writes, no extra listeners |

## 3. Regression check

- Monthly chart (all three modes), the two rings, filter bar and other tabs: same look and behavior as before.
- `git diff --stat` shows no change in `firebase-rules.json`, `tools/backup` or `src/app/models/expense.model.ts`.
