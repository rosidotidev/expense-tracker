# Contract: Pure Functions and UI Elements

The app exposes no external API; the contracts are the pure functions of `src/app/services/chart-data.ts` and the UI elements of the "Grafici" tab. Existing exports are unchanged.

## Pure functions (new exports)

```ts
export const ALL_TIME_FROM = '0000-01-01';
export const ALL_TIME_TO = '9999-12-31';

export interface YearSeries { year: number; months: (number | null)[] } // length 12
export interface DateRange { from: string; to: string }
export interface RangeSummary { total: number; monthlyAverage: number }

yearlyMonthlySeries(expenses: Expense[], today: Date): YearSeries[]
rangeSummary(expenses: Expense[], from: string, to: string): RangeSummary
previousPeriod(from: string, to: string): DateRange
percentChange(current: number, previous: number): number | null
yearColor(year: number, palette: string[]): string
```

| Function | Behavior |
|---|---|
| `yearlyMonthlySeries` | One entry per year with expenses, ascending; 12 monthly totals (cents); empty months are `0`; months after the current month of `today`'s year are `null`; empty input gives `[]`. Uses local date parts of `today`, string slicing of `date` |
| `rangeSummary` | `total` of the given expenses (assumed already filtered); `monthlyAverage = total / months`, `months` = calendar months touched by `from..to`, minimum 1; invalid range gives zeros |
| `previousPeriod` | Same length in days (both ends included), ending the day before `from`; pure calendar arithmetic (no timezone shift) |
| `percentChange` | `null` if `previous === 0`; else `(current - previous) / previous * 100` (not rounded) |
| `yearColor` | `palette[year % palette.length]` |

## Component data (`ChartsComponent`, computed signals)

| Name | Source |
|---|---|
| `summary` | `rangeSummary(filtered(), from, to)` of `appliedRange()` |
| `previousSummary` | `rangeSummary(filterExpenses(expenses, {...filters, ...previousPeriod(from, to)}), prev.from, prev.to)` |
| `change` | `percentChange(summary().total, previousSummary().total)` |
| `yearlyFiltered` | `filterExpenses(expenses, {...filters, from: ALL_TIME_FROM, to: ALL_TIME_TO})` |
| `yearlySeries` | `yearlyMonthlySeries(yearlyFiltered(), new Date())` |
| `yoyConfig` | `ChartConfiguration<'line'>` built from `yearlySeries` |

## UI elements

| Element | Behavior |
|---|---|
| Cards row (`.kpi-grid`), below the filter bar and its error message, above "Andamento mensile" | Three cards: "Totale periodo" (euro), "Media mensile" (euro), "vs periodo prec." (`▲ 12%` / `▼ 8%` / `0%` / `n/a`, with a short caption). Three columns on desktop; three compact columns on screens up to 500px |
| Section "Anno su anno", after the two rings | Line chart, January to December labels (`MONTH_LABELS`), one dataset per year, Chart.js legend of the years at the top, tooltip `year: €amount`; `null` points are not drawn and not connected |
| Note under the chart | "Non è influenzato dal filtro date." (short, always visible when the chart is shown) |
| Empty state | `yearlySeries()` empty: the existing message "Nessun dato per i filtri selezionati" instead of the chart; the note is not shown |

## Not changed

Filter bar, `filterExpenses`, `monthlyTotals*`, `rankStacked`, `totalsBy`, `groupSmallSlices`, `colorFor`, `ChartCanvasComponent`, `BreakdownChartComponent`, the `Expense` model, `firebase-rules.json`, `tools/backup`.
