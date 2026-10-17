# Data Model: Charts Tab - Foundation, Filters and Monthly Trend

**No change to stored data.** The feature is read-only: no new Firebase node, no new field, no write, no migration. `firebase-rules.json`, `tools/backup` and `docs/datamodel-firebase.md` are untouched.

## Existing entity read by the feature

`Expense` (`src/app/models/expense.model.ts`, unchanged). Fields used: `date` (`YYYY-MM-DD`), `amount`, `who`, `category`, `recurrent?` (true only), `debit?` (true only). A missing `recurrent` or `debit` means false.

## Transient types (in memory only, in `src/app/services/chart-data.ts`)

### ChartFilters

| Field | Type | Default | Meaning |
|---|---|---|---|
| `from` | `string` (`YYYY-MM-DD`) | 1 January of the current year | first day, inclusive |
| `to` | `string` (`YYYY-MM-DD`) | today (local) | last day, inclusive |
| `person` | `string` | `''` (all) | exact match on `who` when not empty |
| `category` | `string` | `''` (all) | exact match on `category` when not empty |
| `onlyRecurrent` | `boolean` | `false` | when true, keep only `recurrent === true` |
| `onlyDebit` | `boolean` | `false` | when true, keep only `debit === true` |

Defaults come from `defaultFilters(today)`; Reset assigns that value to the filter signal.

### MonthBucket

| Field | Type | Meaning |
|---|---|---|
| `key` | `string` (`YYYY-MM`) | the calendar month |
| `label` | `string` | Italian short name, with the year when the range spans more than one year |
| `total` | `number` | sum of matching amounts, rounded to 2 decimals (0 for an empty month) |

### StackedChart

| Field | Type | Meaning |
|---|---|---|
| `months` | `MonthBucket[]` | the same buckets as the plain chart (`total` is the plain total) |
| `series` | `{ name: string; values: number[] }[]` | one per distinct category (or person); `values[i]` belongs to `months[i]` |

## Invariants (all covered by tests)

- The range is inclusive on both ends; an inverted range (`from > to`) yields no expenses and no buckets.
- Every matching expense is counted exactly once, in the bucket of its `YYYY-MM`.
- For each month, the sum of the series values equals `months[i].total`.
- Expenses without `recurrent` or `debit` count as not recurring and not on debit: kept when the checkboxes are off, excluded when they are on.
- Inputs are never mutated.
