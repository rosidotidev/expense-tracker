# Data Model: Debit Expenses

## Expense (`users/{uid}/expenses/{pushId}`)

One optional field is added; nothing else changes.

| Field | Type | Rule |
|---|---|---|
| `debit` | `true` (optional) | Present only when the expense is on debit. Never stored as `false`. Absent = not on debit. |

All other fields (`who`, `amount`, `date`, `where`, `category`, `notes`, `uid`, `createdAt`, `recurrent?`) are unchanged.

## State transitions

| From | Action | To | Database operation |
|---|---|---|---|
| no `debit` | tick at creation | `debit: true` | included in the `push` payload |
| no `debit` | untick at creation | no `debit` | field omitted from the payload |
| no `debit` (incl. legacy) | tick in history | `debit: true` | `set .../{id}/debit = true` |
| `debit: true` | untick in history | no `debit` | `remove .../{id}/debit` |

No other write ever touches an existing expense. Reading legacy data never writes.

## Derived (client only, never stored)

`DebitFilter` = `'' | 'debit' | 'settled'`

| Filter | Matches |
|---|---|
| `''` (default) | every expense |
| `'debit'` | `expense.debit === true` |
| `'settled'` | `expense.debit !== true` (legacy and cleared expenses) |

## Invariants

- Legacy expenses (no `debit` key) match `''` and `'settled'`, never `'debit'`.
- Ticking/unticking never changes `amount`, so no total changes.
- A cleared expense equals an expense that never had the field.
- Recurring copies carry no `debit` key.
- No index, rule or new node is added.
