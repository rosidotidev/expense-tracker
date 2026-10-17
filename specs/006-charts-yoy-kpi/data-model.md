# Data Model: Year-over-Year Chart and Summary Cards

No stored data is added or changed. Everything below is derived in memory from the existing `Expense` records (read through `ExpenseService.expenses$`).

## Inputs (existing)

- **Expense**: `date` (`YYYY-MM-DD`), `amount`, `who`, `category`, optional `recurrent` and `debit`. Legacy expenses without the two flags are valid (`undefined` is treated as not recurrent / not on debit).
- **ChartFilters**: `from`, `to`, `person`, `category`, `onlyRecurrent`, `onlyDebit`.

## Derived types (in `chart-data.ts`)

### YearSeries

| Field | Type | Rule |
|---|---|---|
| `year` | `number` | A year with at least one expense in the input |
| `months` | `(number \| null)[]` (length 12) | Total of the month, rounded to cents; `0` for a month without expenses; `null` only for the months after the current month of the current year |

The list of series is sorted by `year`, ascending.

### DateRange

`{ from: string; to: string }`, both `YYYY-MM-DD`, inclusive.

### RangeSummary

| Field | Type | Rule |
|---|---|---|
| `total` | `number` | Sum of the amounts, rounded to cents |
| `monthlyAverage` | `number` | `total / months`, rounded to cents; `months` = calendar months touched by the range, at least 1 |

For an invalid range both values are `0`.

### Change

`number | null`: percent change `(current - previous) / previous * 100`, `null` when `previous === 0`. Shown rounded to a whole number; `null` shows "n/a".

## Relationships and flow

```text
expenses ──filterExpenses(all filters, appliedRange)────► filtered ─► rangeSummary ─► total, average
         ──filterExpenses(same, previousPeriod(range))──► previous ─► rangeSummary ─► previous total
                                                   percentChange(total, previous total) ─► change
         ──filterExpenses(person, category, flags,
                          ALL_TIME_FROM..ALL_TIME_TO)───► yearlyFiltered ─► yearlyMonthlySeries(…, today) ─► lines
```

## State transitions

None. All values are `computed` signals that recompute when the expenses or the shared filters change. Nothing is stored.
