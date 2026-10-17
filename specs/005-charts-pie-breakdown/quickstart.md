# Quickstart: Validating the Breakdown Charts

Details of the functions and component are in [contracts/ui-and-service.md](./contracts/ui-and-service.md) and [data-model.md](./data-model.md).

## Prerequisites

- Node and the project dependencies installed (`npm install`); no new package is needed.
- To see the charts, a signed-in app with expenses in several categories and people, including at least two categories or people below 3% of the period total and a few expenses with a deleted category or person.

## 1. Automated checks

```powershell
npx vitest run --dir src
ng build
```

Expected: all specs green, including the new cases in `src/app/services/chart-data.spec.ts` (percentages sum to about 100, sort order, merge below 3%, nothing merged when a single slice would remain, a single entry at 100%, exactly 3% not merged, same color regardless of order, "Other" always neutral, names missing from the lists still counted, empty input gives `[]`); existing specs (recurring, debit, expense service, chart data from part 1) unchanged and green; `ng build` finishes without errors.

## 2. Manual scenarios (`ng serve`, tab "Grafici")

| # | Steps | Expected |
|---|---|---|
| 1 | Open the tab with default filters | Two rings below the monthly chart, side by side on desktop; center totals equal the sum of the monthly bars |
| 2 | Hover a slice (desktop) or tap it (phone) | Tooltip with the name and exact amount |
| 3 | Check a legend | Name and whole-number percentage per entry; percentages add to about 100 |
| 4 | Dataset with entries under 3% | One grey "Altro" slice and legend entry, last; its amount is the sum of the merged ones |
| 5 | Click "Altro" (slice and legend) | Nothing changes |
| 6 | Click a category slice | Category filter shows it; all charts update; the category ring shows one slice at 100% |
| 7 | Click a person legend entry | Person filter set; all charts update; the person ring shows one slice at 100% |
| 8 | Change filters and compare colors | A name keeps its color in the rings across every filter change |
| 9 | Filters matching no expense | Each ring shows "Nessun dato per i filtri selezionati" |
| 10 | Expense with a category or person removed from the lists | Still counted under its stored name |
| 11 | Narrow the window to 500px or less (or use a phone) | Rings stacked, category above person, legends readable, no horizontal scroll |
| 12 | Press Reimposta | Filters back to default; rings recompute |
| 13 | Inspect Firebase traffic or data | No writes, no extra listeners |

## 3. Regression check

- Monthly chart (all three modes), filter bar, other tabs: same look and behavior as before.
- `git diff --stat` shows no change in `firebase-rules.json`, `tools/backup` or `src/app/models/expense.model.ts`.
