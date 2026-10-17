# Research: Debit Expenses

No `NEEDS CLARIFICATION` items remained. Decisions below come from reading the existing code.

## 1. Storage convention

- **Decision**: `debit?: boolean`, written only as `true`; clearing removes the path `users/{uid}/expenses/{id}/debit`.
- **Rationale**: identical to `recurrent` (`addExpense` spreads it only when `=== true`; `setRecurrent` does `set(path, true)` or `remove(path)`). A settled expense becomes byte-identical to one that never had the field (FR-009).
- **Alternatives**: storing `false` (rejected: pollutes data, differs from legacy); a separate `debts` node (rejected: out of scope, FR-012).

## 2. Filter location and shape

- **Decision**: in-memory filter inside the existing `filteredExpenses` getter, using a pure `matchesDebitFilter(expense, filter)` in `src/app/services/debit-filter.ts`. `DebitFilter = '' | 'debit' | 'settled'`; `''` returns true for every expense.
- **Rationale**: same pattern as person and category; no new Firebase query, no index (rules untouched). The pure function makes the legacy-data guarantee unit-testable. `expense.debit === true` is the only "on debit" test, so absent/`undefined` is never on debit.
- **Alternatives**: Firebase `orderByChild('debit')` query (rejected: new index, extra reads, absent field handling).

## 3. Page reset

- **Decision**: bind the new select with `(ngModelChange)="onLocalFilterChange()"`, which already sets `currentPage = 1`.
- **Rationale**: no new code path (FR-004).

## 4. Zoneless UI refresh after toggle

- **Decision**: no extra state. `toggleDebit` calls `setDebit`; the existing live listener (`listenRange`/`listen`) re-emits and `allExpenses.set(...)` (a signal) updates the list. Filter select changes are template events, which already schedule change detection.
- **Rationale**: this is how `toggleRecurrent` works today. With the real Firebase SDK the listener on `users/{uid}/expenses` fires on child changes.
- **Finding (mock only)**: `MockFirebaseService.set/remove` emit only the parent and the written path. The list subscribes to `users/{uid}/expenses`, two levels above `.../{id}/debit`, so in mock mode a toggle would not refresh the list (the same latent issue already exists for recurrent). `set` and `remove` do exist and work. **Decision**: make the mock emit every ancestor path of the written path. Dev-only, small, and needed to verify the feature without real Firebase.

## 5. Debit indicator and toggle UI

- **Decision**: no separate badge (spec clarification 2026-10-17, FR-007). Table: new narrow column after the recurrent one, with a round on/off euro button (same pattern as `.recur-btn`, new `.debit-btn` class); this switched-on button is the only indicator. Cards: a "€ Debito" toggle button in `.card-actions` beside "Ricorrente" (same `btn-primary`/`btn-outline` switching), also the only indicator. The category cell and the card category row show the category badge only. The `.badge-debit` style is removed.
- **Rationale**: reuses existing styles and the 600px breakpoint; the on/off state is visible in both layouts (FR-006, FR-007) without duplicating the information next to the category.
- **Alternatives considered**: keeping the badge in addition to the toggle (rejected by the user: redundant).

## 6. Recurring copies

- **Decision**: do not touch `recurring.ts`. Its copy builder already whitelists/produces fields without `debit`; its tests must keep passing.
- **Rationale**: FR-013. Verified in implementation by running the existing recurring tests plus a check that a copy of a debit expense has no `debit` key.

## 7. Testing the service

- **Decision**: `ExpenseService` takes `FirebaseService` through its constructor, so it can be built in Vitest with a small hand-written fake (`uid`, `push`, `set`, `remove` recording calls) without Angular DI.
- **Rationale**: allows testing "no `debit` key when false/undefined" and "`setDebit(false)` removes the path" without the mock Angular service.

## 8. Docs and untouched areas

- `docs/datamodel-firebase.md`: add `debit` (optional, only `true`) and note toggling updates one child path.
- `firebase-rules.json`, `tools/backup`: unchanged (backup saves the whole `expenses` node, so the flag is included automatically).

## 9. Change: remove the Debit badge (2026-10-17)

- **Decision**: in `expense-list.html` remove the `@if (expense.debit) { <span class="badge badge-debit">Debit</span> }` blocks from the table category cell (restoring the single-badge cell) and from the card category row; in `expense-list.css` remove `.badge-debit`. Keep the `.debit-btn` column and the "€ Debito" card button unchanged.
- **Scope**: template and CSS only. No change to data, services, the filter, tests, docs/datamodel or Firebase. Existing unit tests are unaffected (none cover the template).
