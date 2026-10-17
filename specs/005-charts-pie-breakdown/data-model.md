# Data Model: Charts Tab - Spending Breakdown

No persisted data is added or changed. Everything below is derived in memory from the already filtered expenses.

## Existing (read only)

- **Expense** (`src/app/models/expense.model.ts`): uses `who`, `category`, `amount`, `date`, optional `recurrent`, `debit`. Not changed.
- **ChartFilters** (`chart-data.ts`): shared transient filter state. The only write this feature performs is through its existing setters (`setPerson`, `setCategory`), triggered by a slice click.

## New derived types (`src/app/services/chart-data.ts`)

### BreakdownEntry

| Field | Type | Rule |
|---|---|---|
| `name` | string | stored `category` or `who`; empty values become `Senza categoria` / `Senza persona`; `Altro` for the merged entry |
| `amount` | number | sum of the group, rounded to 2 decimals |
| `percentage` | number | `amount / total * 100`, not rounded (the legend rounds to whole numbers) |
| `isOther` | boolean | `true` only for the merged entry; `false` otherwise |

### Collections and invariants

- `totalsBy(expenses, key)` returns `BreakdownEntry[]` sorted by `amount` descending (ties by name, ascending, for a stable order); groups with an amount of zero or less are dropped; `[]` for empty input or a zero total.
- Sum of `percentage` is 100 (within floating-point error); sum of `amount` equals the sum of the input expenses (within cent rounding).
- `groupSmallSlices(entries, threshold)`:
  - small = `percentage < threshold` (strict); entries at exactly the threshold are kept;
  - small entries are replaced by one entry `{ name: 'Altro', amount: sum, percentage: sum, isOther: true }` appended last;
  - if there are no small entries, or no entry would remain besides "Other", the input list is returned unchanged;
  - kept entries keep their order; the input array is never mutated.
- Color: `colorFor(name, palette)` is a pure function of the name and the palette; `sliceColors` gives `neutral` to `isOther` entries and `colorFor` to the rest.

## Transient UI state

| State | Where | Notes |
|---|---|---|
| `categoryEntries`, `personEntries` | `computed` in `ChartsComponent` | `groupSmallSlices(totalsBy(filtered(), key), 3)` |
| `palette`, `neutral` | read from the CSS variables once per computation | accents `--coral --teal --violet --amber --pink`, neutral `--ink-dim` |

## State transitions

- Slice or legend click (not "Other") on the category ring: `filters.category = name` → every computed signal recomputes → monthly chart and both rings update.
- Same for the person ring and `filters.person`.
- Reset (existing button) clears both back to "Tutte".
