# Contracts: Debit Expenses

The app has no external API; the contracts are the internal service and UI surfaces.

## ExpenseService

```text
addExpense(expense: Omit<Expense, 'id'|'uid'|'createdAt'>): Promise<void>
  - `debit` accepted in the input.
  - Written to the pushed payload only when `debit === true`; `false`/`undefined` => key absent.

setDebit(id: string, value: boolean): Promise<void>
  - Path: users/{uid}/expenses/{id}/debit
  - value true  => set(path, true)
  - value false => remove(path)
  - Not authenticated => throws Error('Non autenticato') (same as setRecurrent)
```

## Pure helper (`src/app/services/debit-filter.ts`)

```text
type DebitFilter = '' | 'debit' | 'settled'
matchesDebitFilter(expense: Pick<Expense,'debit'>, filter: DebitFilter): boolean
```

## Expense form

- Checkbox "Debit", control `debit`, default `false`, placed next to Recurrent, reset to `false` on reset.
- Submit passes `debit: value.debit === true`.

## Expense list

| Element | Behaviour |
|---|---|
| Filter select `id="debit"` label "Debito" | Options: `''` Tutti, `'debit'` A debito, `'settled'` Non a debito. `(ngModelChange)="onLocalFilterChange()"` |
| `filteredExpenses` | person AND category AND `matchesDebitFilter` |
| Debit indicator | The euro control below, shown switched on when `expense.debit`. No separate badge: the category cell and the card category row show the category badge only |
| Table toggle | Button in its own narrow cell, `aria-pressed`, calls `toggleDebit(expense)` |
| Card toggle | Button "Debito" in `.card-actions`, `btn-primary` when on, `btn-outline` when off |
| `toggleDebit(expense)` | `setDebit(id, !expense.debit)`; toast "Spesa segnata a debito" / "Debito saldato"; on failure toast "Errore nel salvataggio" (error) |
