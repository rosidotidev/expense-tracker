# Contracts: Recurring Expenses

Internal contracts of the Angular app (no external API).

## `planRecurringCopies` (`src/app/services/recurring.ts`)

```ts
planRecurringCopies(expenses: Expense[], today: Date): Expense[]
```

- **Input**: only the expenses of the previous and current month (the caller guarantees the range); `today` supplies the current local month and the copies' `createdAt`.
- **Output**: expenses to create, in id order; `[]` when the current month has a recurrent expense or the previous month has none.
- **Guarantees**: pure (no I/O, no mutation of input); local date parts only; deterministic ids `rec-YYYYMM-<index>`; ids already present in the input are not returned.

## `ExpenseService` additions

| Method | Behavior |
|--------|----------|
| `addExpense(expense)` | `expense` may include `recurrent?: boolean`; the field is stored only when `true`. |
| `setRecurrent(id, value)` | `true` → `set(users/{uid}/expenses/{id}/recurrent, true)`; `false` → `remove(...)`. Rejects when not authenticated. |
| `ensureRecurringForCurrentMonth()` | Once per uid per session: `listenRange(users/{uid}/expenses, 'date', prevMonthStart, currentMonthEnd)` with `take(1)`, then `planRecurringCopies`, then `set` per copy. Failures are caught; never throws into the UI. |

## UI contracts

- **Expense form**: a "Recurrent" checkbox, unchecked by default, reset on "Pulisci" and after a successful save.
- **Expense list**: a narrow column with a single icon button per row (filled when `recurrent === true`, outline otherwise, tooltip "Recurrent", `aria-pressed`) that calls `setRecurrent`. No text badge; the Category column shows only the category; the Actions column keeps only "Elimina". Success/failure feedback through the existing toast.

## Database contract

- Path written: `users/{uid}/expenses/{id}` (copies, via `set`) and `users/{uid}/expenses/{id}/recurrent`.
- `firebase-rules.json`: unchanged. No new `.indexOn`.
