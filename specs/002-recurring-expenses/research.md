# Research: Recurring Expenses

No `NEEDS CLARIFICATION` items remained; the decisions below record the choices and the facts verified in the code.

## R1 — Preventing duplicates across devices and repeated runs

- **Decision**: Deterministic ids `rec-YYYYMM-<index>` written with `FirebaseService.set`; the pure function also skips ids already present in the input.
- **Rationale**: Two devices running at once write the same content to the same keys (idempotent). `push` would generate different keys and duplicate. Skipping ids already present protects a copy the user edited or unflagged from being overwritten by a later re-run.
- **Alternatives**: `push` + a "generated" marker node (new node, violates spec); transactions (heavier than needed); a derived "copiedFrom" field (extra stored data, rejected).
- **Known residual**: Source order must be stable for ids to stay stable. Sorting by `date`, `createdAt`, `id` makes it deterministic for an unchanged previous month.

## R2 — Reading only two months

- **Decision**: Reuse `FirebaseService.listenRange(path, 'date', start, end)` (already used by `queryExpenses`), take the first emission, and filter `recurrent` in memory.
- **Rationale**: `date` is the indexed field and is `YYYY-MM-DD`, so lexicographic range works; data read is constant over the years. `take(1)` unsubscribes, leaving no live listener, and the first emission of a Realtime Database `onValue` query is the complete result of that query.
- **Alternatives**: Full `listen` (grows with history); index on `recurrent` (needs rules change and still loses the "current month" scoping); `get()` (not exposed by `FirebaseService`; adding it widens the change).
- **Verified**: `mock-firebase.service.ts` `listenRange` emits synchronously from a `BehaviorSubject`, so `take(1)` works in mock mode.

## R3 — Date handling

- **Decision**: Use `getFullYear()/getMonth()/getDate()` of local `Date`s and zero-padded string building; last day of month through `new Date(y, m + 1, 0).getDate()`.
- **Rationale**: `toISOString()` converts to UTC and can shift the day/month near midnight in non-UTC timezones.
- **Note**: The existing `todayString()` in `expense-form.ts` uses `toISOString`; it is out of scope for this feature and left unchanged.

## R4 — When to run the check

- **Decision**: Call `ensureRecurringForCurrentMonth()` from `DashboardComponent.ngOnInit` (the route entered after login), guarded by an in-memory "ran for this uid" marker in `ExpenseService`.
- **Rationale**: The dashboard is the post-login entry point; the service is a root singleton, so the marker lives for the whole session and a different user logging in later still runs the check.
- **Alternative**: Hook on `user$` in the service constructor (implicit, runs before guards/UI are ready); rejected for being less explicit.

## R5 — Mock service support

- **Decision**: No change to `mock-firebase.service.ts`.
- **Verified**: `set(path, data)` writes the nested value and emits the parent and the path; `remove` emits the parent; `listenRange` filters by the order field. That covers copy writes, `recurrent` set, and `recurrent` removal.

## R6 — Zoneless change detection

- **Decision**: Convert `allExpenses` and `loading` in `ExpenseListComponent` to signals; the form keeps reactive forms.
- **Rationale**: The app is zoneless, so plain-field updates inside async subscriptions do not reliably re-render. Signals read in the template/getters schedule change detection.

## R7 — Writing the flag

- **Decision**: `true` is stored; `false` removes the child.
- **Rationale**: Legacy and unflagged expenses stay byte-identical in shape; "absent = not recurrent" has one representation.
