---

description: "Task list for Debit Expenses"
---

# Tasks: Debit Expenses

**Input**: Design documents from `/specs/003-debit-expenses/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-and-service.md, quickstart.md

**Tests**: Requested in the plan (Vitest, `npx vitest run --dir src`). Test tasks are included.

**Organization**: Grouped by user story. All paths are relative to the repository root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = log on debit, US2 = settle/re-open in history, US3 = filter

## Rules that apply to every task

- `debit` is stored only as `true`; it is NEVER stored as `false`. Absent = not on debit.
- No migration, backfill or write on existing data. Do NOT edit `src/app/services/recurring.ts`, `firebase-rules.json` or anything under `tools/backup`.
- No `any`, `@ts-ignore` or `@ts-nocheck` (strict TypeScript).

---

## Phase 1: Setup

- [X] T001 Run `npx vitest run --dir src` and `npx vitest run --dir tools/backup` to record the green baseline before any change

---

## Phase 2: Foundational (blocks all stories)

- [X] T002 Add `debit?: boolean; // stored only as true; absent means not on debit` after `recurrent` in `src/app/models/expense.model.ts`
- [X] T003 [P] In `src/app/services/mock-firebase.service.ts`, make `set()` and `remove()` call `emitPath` for every ancestor path of the written path (not only the direct parent and the path itself), so a write to `users/{uid}/expenses/{id}/debit` refreshes listeners on `users/{uid}/expenses` (dev mock only; `set` and `remove` already exist)

**Checkpoint**: model field exists, mock refreshes list listeners.

---

## Phase 3: User Story 1 - Mark an expense as on debit when logging it (Priority: P1) 🎯 MVP

**Goal**: A "Debit" checkbox in the add-expense form; saved only when ticked.

**Independent Test**: Add one expense with Debit ticked and one without; only the first has a `debit: true` key in the database.

### Tests for User Story 1

- [X] T004 [P] [US1] Create `src/app/services/expense.service.spec.ts` (Vitest) building `ExpenseService` with a hand-written fake `FirebaseService` (`uid`, and `push`/`set`/`remove` recording calls). Test that `addExpense` with `debit: true` pushes a payload containing `debit: true`, and with `debit: false` or `debit` omitted pushes a payload with NO `debit` key (`'debit' in payload` is false)

### Implementation for User Story 1

- [X] T005 [US1] In `src/app/services/expense.service.ts` extend `addExpense` to destructure `debit` next to `recurrent` and spread `...(debit === true ? { debit: true } : {})` into the pushed payload (same pattern as `recurrent`)
- [X] T006 [P] [US1] In `src/app/components/expense-form/expense-form.ts` add control `debit: [false]` to the form group, pass `debit: value.debit === true` in `addExpense(...)` in `submit()`, and add `debit: false` to the `form.reset({...})` in `reset()`
- [X] T007 [US1] In `src/app/components/expense-form/expense-form.html` add a "Debit" checkbox (`id="debit"`, `formControlName="debit"`, label text `Debit`) in a `form-group debit-field` block right after the Recurrent block; in `src/app/components/expense-form/expense-form.css` give `.debit-field` the same rules as `.recurrent-field` (extend the existing selectors, do not duplicate styles)

**Checkpoint**: US1 works alone; T004 passes.

---

## Phase 4: User Story 2 - Settle or re-open a debit from the history (Priority: P1)

**Goal**: Badge and on/off toggle on every expense, in table and handheld card layouts.

**Independent Test**: Untick then tick the flag on an expense in both layouts; badge, toast and stored state follow; amount and totals never change.

### Tests for User Story 2

- [X] T008 [P] [US2] In `src/app/services/expense.service.spec.ts` add tests: `setDebit(id, true)` calls `set` on `users/{uid}/expenses/{id}/debit` with `true`; `setDebit(id, false)` calls `remove` on that same path and never calls `set` with `false`; with no `uid` it rejects with `Non autenticato`

### Implementation for User Story 2

- [X] T009 [US2] In `src/app/services/expense.service.ts` add `async setDebit(id: string, value: boolean): Promise<void>` modeled exactly on `setRecurrent`, using path `users/${uid}/expenses/${id}/debit`
- [X] T010 [US2] In `src/app/components/expense-list/expense-list.ts` add `async toggleDebit(expense: Expense)` modeled on `toggleRecurrent`: `setDebit(expense.id!, !expense.debit)`, success toast `'Debito saldato'` when it was on debit else `'Spesa segnata a debito'`, failure toast `'Errore nel salvataggio'` with `'error'`
- [X] T011 [US2] In `src/app/components/expense-list/expense-list.html` table: add a header cell `<th class="debit-cell" title="Debit">€</th>` after the recurrent header, and in each row a `<td class="debit-cell">` with a `<button type="button" class="debit-btn" [class.on]="expense.debit" title="Debit" aria-label="Debit" [attr.aria-pressed]="!!expense.debit" (click)="toggleDebit(expense)">€</button>`; also show `@if (expense.debit) { <span class="badge badge-debit">Debit</span> }` next to the category badge
- [X] T012 [US2] In `src/app/components/expense-list/expense-list.html` cards (`.expense-card`): show the same `Debit` badge in the category `card-row`, and in `.card-actions` add, next to the Ricorrente button, a `btn btn-xs` button labelled `€ Debito` with `[class.btn-primary]="expense.debit"`, `[class.btn-outline]="!expense.debit"`, `[attr.aria-pressed]="!!expense.debit"`, `(click)="toggleDebit(expense)"`
- [X] T013 [US2] In `src/app/components/expense-list/expense-list.css` add `.debit-cell`, `.debit-btn`, `.debit-btn:hover`, `.debit-btn.on` (copy the `.recur-cell`/`.recur-btn` rules, using an existing theme colour variable other than `--violet`, e.g. `--coral`) and `.badge-debit` (existing `.badge` look, same colour); keep the existing 600px breakpoint behaviour unchanged (table hidden, cards shown)

**Checkpoint**: US1 + US2 work; T008 passes; toggling refreshes the list without reload.

---

## Phase 5: User Story 3 - Filter the history by debit status (Priority: P2)

**Goal**: "Debito" select with Tutti / A debito / Non a debito, in memory, combined with other filters, resets to page 1.

**Independent Test**: With mixed data, switch the three values alone and with person/category; default view is identical to before.

### Tests for User Story 3

- [X] T014 [P] [US3] Create `src/app/services/debit-filter.spec.ts` (Vitest) testing `matchesDebitFilter`: filter `''` returns true for legacy (no `debit` key), `debit: true`, and every expense (default returns all); `'debit'` is true only for `debit: true` and false for a legacy expense with no `debit` key at all; `'settled'` is true for legacy expenses and false for `debit: true`

### Implementation for User Story 3

- [X] T015 [US3] Create `src/app/services/debit-filter.ts` exporting `type DebitFilter = '' | 'debit' | 'settled'` and `function matchesDebitFilter(expense: Pick<Expense, 'debit'>, filter: DebitFilter): boolean` (`''` → true; `'debit'` → `expense.debit === true`; `'settled'` → `expense.debit !== true`)
- [X] T016 [US3] In `src/app/components/expense-list/expense-list.ts` add `selectedDebit: DebitFilter = '';` next to `selectedCategory`, and in the `filteredExpenses` getter AND `matchesDebitFilter(e, this.selectedDebit)` to the existing person/category conditions (no new query, no change to `loadData`)
- [X] T017 [US3] In `src/app/components/expense-list/expense-list.html` filters block add, after the Categoria group, `<div class="form-group"><label for="debit-filter">Debito</label><select id="debit-filter" [(ngModel)]="selectedDebit" (ngModelChange)="onLocalFilterChange()" name="debit"><option value="">Tutti</option><option value="debit">A debito</option><option value="settled">Non a debito</option></select></div>`

**Checkpoint**: all stories work; T014 passes.

---

## Phase 6: Polish & Cross-Cutting

- [X] T018 [P] Update `docs/datamodel-firebase.md`: add `debit` (`true`, optional, only present when on debit, never `false`) to the `expenses` field table and tree, and note that ticking/unticking writes or removes only `.../{id}/debit`
- [X] T019 [P] In `src/app/services/recurring.spec.ts` DO NOT edit existing tests; if no test already covers it, add one asserting a copy planned from an expense with `debit: true` has no `debit` key (no change to `src/app/services/recurring.ts`)
- [X] T020 Run `npx vitest run --dir src`, `npx vitest run --dir tools/backup` and `npx ng build`; all must pass (the existing recurring tests unchanged)
- [X] T021 Run `git diff --stat` and confirm no changes to `firebase-rules.json`, `tools/backup`, or `src/app/services/recurring.ts`
- [ ] T022 Walk through the manual scenarios in `specs/003-debit-expenses/quickstart.md` (create, default view, filter + page reset, settle/re-open in table and under 600px, legacy data, no `false` stored)

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories → Phase 6.
- US1, US2 and US3 depend only on Phase 2 and are otherwise independent. US2 and US3 both edit `expense-list.*`, so do them sequentially (US2 then US3) to avoid conflicts; US1 can run in parallel with either.
- Within a story: tests first (should fail), then implementation. T005 and T009 both edit `expense.service.ts`: do them in order.

### Parallel opportunities

- T003 with T002.
- T004 with T006 (different files); T008 with T014 and T018/T019.
- US1 (form files) in parallel with US2/US3 (list files).

## Implementation Strategy

- **MVP**: Phases 1–3 (US1): debit can be recorded.
- **Increment 2**: US2 makes it usable (settling), **Increment 3**: US3 adds the filter.
- Stop after each checkpoint and run `npx vitest run --dir src`.

---

## Phase 7: Change - remove the Debit badge (US2, clarification 2026-10-17)

**Goal**: The euro control is the only debit indicator: no "Debit" badge next to the category in the table row or in the card (spec FR-007). Template and CSS only: no change to data, services, filter, or tests.

**Independent Test**: In Storico, an expense on debit shows the category badge alone; the `€` button (table) and the `€ Debito` button (cards) still toggle and show on/off.

- [X] T023 [US2] In `src/app/components/expense-list/expense-list.html`, table row: replace the category `<td>` (which now wraps the category badge plus the `@if (expense.debit) { <span class="badge badge-debit">Debit</span> }` block) with the original single-badge cell `<td><span class="badge" [ngClass]="categoryBadgeClass(expense.category)">{{ expense.category }}</span></td>`; keep the `debit-cell` column and its `€` button untouched
- [X] T024 [US2] In `src/app/components/expense-list/expense-list.html`, card: remove the `@if (expense.debit) { <span class="badge badge-debit">Debit</span> }` block from the category `card-row`, leaving only the category badge; keep the `€ Debito` button in `.card-actions` untouched
- [X] T025 [P] [US2] In `src/app/components/expense-list/expense-list.css`, delete the `.badge-debit` rule; keep `.debit-cell`, `.debit-btn`, `.debit-btn:hover`, `.debit-btn.on` and the 600px breakpoint rules unchanged
- [X] T026 [P] [US2] In `docs/prj-debit-feature.md`, replace the badge wording: line about Settling ("clearly marked with a **Debit** badge or highlighted state" -> "clearly marked by the euro on/off control, with no separate badge"), the legacy-expense table row ("no badge" -> "euro control off"), and the final check ("shows a **Debit** badge when flagged" -> "shows the euro control switched on when flagged"); do not edit the copied `/speckit-specify` and `/speckit-plan` command texts
- [X] T027 Verify: `grep -rn "badge-debit" src` returns nothing; run `npx vitest run --dir src` and `npx ng build` (both pass, no test changes); `git diff --stat` shows only `expense-list.html`, `expense-list.css`, `docs/prj-debit-feature.md` and `specs/` for this phase
- [ ] T028 Manual check at http://localhost:4200 (table and under 600px): a debit expense shows no "Debit" badge next to the category, the euro control is on; untick/tick still works with toast

**Dependencies**: T023 and T024 edit the same file (do in order); T025 and T026 are parallel with them. T027 and T028 come last. Phase 7 depends only on the completed Phase 4 (US2).
