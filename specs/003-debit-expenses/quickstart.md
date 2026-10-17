# Quickstart: Validating Debit Expenses

## Prerequisites

- `npm install` done; no new dependencies.
- App run in the usual way (`npm start`); the dev mock backend is enough.

## 1. Automated checks

```bash
npx vitest run --dir src          # new debit tests + existing recurring tests
npx vitest run --dir tools/backup # backup tool unchanged and green
npx ng build                      # strict build passes
```

Expected: all pass. `recurring.spec.ts` unchanged and green; the new specs cover `matchesDebitFilter` (default returns all; legacy never "debit"; `true` matches "debit" only), `addExpense` (no `debit` key for false/undefined, `debit: true` when true) and `setDebit` (true sets, false removes the path).

## 2. Manual scenarios

1. **Create on debit**: add an expense with Debit ticked; its euro control is switched on in Storico (table and card), and no "Debit" badge appears next to the category. Add one without; the euro control is off.
2. **Default view unchanged**: with the filter on "Tutti", the list and totals match what was shown before the feature.
3. **Filter**: choose "A debito" then "Non a debito"; list narrows within the selected period and combines with person and category. From page 2, changing the filter returns to page 1.
4. **Settle / re-open**: untick on a debit expense (table and, with the window under 600px, card); the euro control switches off, amount and totals unchanged, toast shown. Tick again; it switches back on.
5. **Legacy data**: a pre-existing expense (no `debit`) appears under "Non a debito", never "A debito"; nothing is written on load.
6. **Data check**: after settling, the expense node has no `debit` key (never `false`).
7. **Recurring**: a copy generated from a debit expense has no `debit` flag.
8. **Backup/rules**: `firebase-rules.json` and `tools/backup` show no diff.
