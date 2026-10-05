# Data Model: Recurring Expenses

## Expense (`users/{uid}/expenses/{id}`) — existing node, one new optional field

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `who` | string | yes | unchanged |
| `amount` | number | yes | unchanged |
| `date` | string `YYYY-MM-DD` | yes | indexed (existing); used for the two-month range read |
| `where` | string | yes | unchanged |
| `category` | string | yes | unchanged |
| `notes` | string | yes | unchanged |
| `uid` | string | yes | unchanged |
| `createdAt` | number (ms) | yes | unchanged; for copies, the time the copy is created |
| `recurrent` | boolean | **no** | **new**. Stored only as `true`. Absent means not recurrent. |

TypeScript: `recurrent?: boolean` on `Expense` in `src/app/models/expense.model.ts`.

### Rules

- Absent, `false` and `undefined` are all "not recurrent". The app never writes `false`; turning the flag off removes the child.
- No existing record is rewritten. Records gain `recurrent` only through an explicit user action or as newly created copies.
- No new node, no index, no derived field.

## Generated copy

A copy is a normal expense with:

- id: `rec-YYYYMM-<index>` (YYYYMM = current month, index = position of the source in the sorted list of the previous month's recurrent expenses, sorted by `date`, `createdAt`, `id`);
- `who, amount, where, category, notes, uid` copied from the source; `recurrent: true`;
- `date`: current `YYYY-MM-` + `min(source day, last day of current month)`;
- `createdAt`: creation time.

## Month window for the check

- start = first day of the previous month; end = last day of the current month, both `YYYY-MM-DD` built from local date parts.
- January: previous month is December of the previous year.

## State transitions

- not recurrent ⇄ recurrent: `setRecurrent(id, true)` sets the child; `setRecurrent(id, false)` removes it.
- Session: the check runs at most once per user per session (in-memory marker).
