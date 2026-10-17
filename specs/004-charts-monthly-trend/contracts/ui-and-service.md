# Contract: Charts Tab UI and Pure Functions

## Pure functions (`src/app/services/chart-data.ts`)

All functions are synchronous, I/O-free and never mutate their inputs.

```ts
export interface ChartFilters {
  from: string; to: string;            // YYYY-MM-DD, inclusive
  person: string; category: string;    // '' = all
  onlyRecurrent: boolean; onlyDebit: boolean;
}

export interface MonthBucket { key: string; label: string; total: number }
export interface StackedChart {
  months: MonthBucket[];
  series: { name: string; values: number[] }[];
}

export function defaultFilters(today?: Date): ChartFilters;
export function isValidRange(from: string, to: string): boolean;
export function filterExpenses(expenses: Expense[], filters: ChartFilters): Expense[];
export function monthlyTotals(expenses: Expense[], from: string, to: string): MonthBucket[];
export function monthlyTotalsBy(
  expenses: Expense[], from: string, to: string, key: 'category' | 'who'
): StackedChart;
```

| Function | Behaviour |
|---|---|
| `defaultFilters(today)` | `from` = `YYYY-01-01` and `to` = today, built from local date parts; other fields at their defaults |
| `isValidRange` | true only when both are non-empty and `from <= to` |
| `filterExpenses` | keeps expenses with `from <= date <= to` (string compare) matching person, category and the two flags; returns `[]` when the range is inverted; missing flags count as false |
| `monthlyTotals` | one bucket per calendar month from `from` to `to`, empty months included; expects the list already passed through `filterExpenses`; totals rounded to 2 decimals; `[]` for an inverted range |
| `monthlyTotalsBy` | same buckets plus one series per distinct `category` (or `who`), ordered by overall total descending; per month the series values sum to the bucket total |

## Component contract (`src/app/components/charts`)

| Item | Behaviour |
|---|---|
| Selector | `app-charts`, standalone; rendered by the dashboard in the `'grafici'` case |
| Tab | label "Grafici", key `'grafici'`, between `'riepilogo'` and `'persone'` |
| Inputs / outputs | none |
| Data sources | `ExpenseService.expenses$`, `PeopleService.people$`, `CategoryService.categories$`, each via `toSignal` |
| State | signals: filters, display mode (`'total' | 'category' | 'who'`); `computed`: filtered expenses, range validity, chart data |
| Filter bar | Da, A (date inputs), Persona, Categoria (selects with "Tutte"), "Solo ricorrenti", "Solo addebito" (checkboxes), "Reimposta" button |
| Toggle | Totale (default) / Per categoria / Per persona |
| Chart | bars per month; tooltip on hover/tap with `€` and two decimals; legend only in stacked modes |
| Inverted range | message "La data iniziale non può essere dopo quella finale"; chart keeps the last valid range |
| No data | message "Nessun dato per i filtri selezionati" in place of the chart |
| Reset | sets the filters signal to `defaultFilters()`; the toggle returns to "Totale" |
| Handheld (max 500px) | single column; filters in a two-column grid; flags and Reset on their own row; no horizontal page scroll |

## Chart wrapper (`chart-canvas.ts`)

Standalone component with one input, the Chart.js configuration (signal-readable). It creates the chart after the view is ready, updates it when the input changes, and destroys it on teardown. It registers only `BarController`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip` and `Legend`.

## What does not change

`Expense` model, `ExpenseService`, `firebase-rules.json`, `tools/backup`, the other tabs and the recurring-expenses logic.
