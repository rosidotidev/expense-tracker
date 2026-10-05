---

description: "Task list for Recurring Expenses"
---

# Tasks: Recurring Expenses

**Input**: Design documents from `/specs/002-recurring-expenses/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/recurring-contract.md, quickstart.md

**Tests**: Requested in the plan: Vitest unit tests for the pure function `planRecurringCopies`, run with `npx vitest run --dir src`. Written before the function (TDD).

**Organization**: Tasks are grouped by user story. All paths are relative to the repository root. Do not modify `firebase-rules.json` or `tools/backup`; add no dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story the task belongs to (US1–US5)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project can run the new tests and build.

- [X] T001 Verify the baseline: run `npx vitest run --dir src` (a "no test files" result is acceptable) and `npm run build` from the repository root; note any pre-existing failures so they are not attributed to this feature.
- [X] T002 [P] Verify `src/app/services/mock-firebase.service.ts` supports what the feature needs (`set` on a child path emitting the parent, `remove`, `listenRange` emitting synchronously). No code change expected; if a gap is found, fix it there and note it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model change used by every story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Add the optional field `recurrent?: boolean` to the `Expense` interface in `src/app/models/expense.model.ts`, with a comment: stored only as `true`; absent means not recurrent.

**Checkpoint**: Model ready; existing code still compiles (`npm run build`).

---

## Phase 3: User Story 1 - Mark an expense as recurrent (Priority: P1) 🎯 MVP

**Goal**: A user can tick "Recurrent" when adding an expense, and recurrent expenses show a "Recurrent" badge in the history list.

**Independent Test**: Add one expense with the checkbox ticked and one without; in Storico only the first shows the badge.

### Implementation for User Story 1

- [X] T004 [US1] In `src/app/services/expense.service.ts`, make `addExpense` accept optional `recurrent` (the existing `Omit<Expense, 'id' | 'uid' | 'createdAt'>` parameter already allows it) and store the field only when it is `true`; when false/undefined the stored object must not contain `recurrent` (never write `false`).
- [X] T005 [P] [US1] In `src/app/components/expense-form/expense-form.ts` add a `recurrent: [false]` control to the form group, pass `recurrent: value.recurrent === true` from `submit()` to `addExpense`, and reset it to `false` in `reset()`.
- [X] T006 [P] [US1] In `src/app/components/expense-form/expense-form.html` add a "Recurrent" checkbox bound to `formControlName="recurrent"` (label "Recurrent", unticked by default) inside `.form-grid`, and style it in `src/app/components/expense-form/expense-form.css` consistently with the existing form fields.
- [X] T007 [US1] In `src/app/components/expense-list/expense-list.html` show a "Recurrent" badge (reuse the existing `badge` class) next to the category/notes cell for rows where `expense.recurrent === true`; add any needed style in `src/app/components/expense-list/expense-list.css`.

**Checkpoint**: US1 works on its own: flag at creation and badge in the list.

---

## Phase 4: User Story 2 - Toggle the flag on an existing expense (Priority: P1)

**Goal**: From the history list the user can turn the flag on or off for any existing expense, and the UI updates in the zoneless app.

**Independent Test**: In Storico toggle a row on then off; the badge appears/disappears immediately and persists after reload.

### Implementation for User Story 2

- [X] T008 [US2] In `src/app/services/expense.service.ts` add `async setRecurrent(id: string, value: boolean): Promise<void>`: throw `'Non autenticato'` if no uid; `value === true` → `this.fb.set(\`users/${uid}/expenses/${id}/recurrent\`, true)`; otherwise `this.fb.remove(\`users/${uid}/expenses/${id}/recurrent\`)`.
- [X] T009 [US2] In `src/app/components/expense-list/expense-list.ts` convert `allExpenses` and `loading` to Angular signals (`signal<Expense[]>([])`, `signal(false)`), update `loadData()` to `.set(...)`, and update the getters (`filteredExpenses`) and the template (`loading`) to read them, so list updates re-render in the zoneless app.
- [X] T010 [US2] In `src/app/components/expense-list/expense-list.ts` add `toggleRecurrent(expense: Expense)` calling `expenseService.setRecurrent(expense.id!, !expense.recurrent)` with a success/error toast through the existing `ToastService`.
- [X] T011 [US2] In `src/app/components/expense-list/expense-list.html` add a per-row on/off toggle (e.g. a small button/switch labelled "Recurrent" with on/off state) in the Azioni cell calling `toggleRecurrent(expense)`; style it in `src/app/components/expense-list/expense-list.css`.

**Checkpoint**: US1 + US2 work: flag can be set at creation and changed afterwards, UI refreshes.

---

## Phase 5: User Story 3 - Automatic monthly copy on login (Priority: P1)

**Goal**: After login, if the current month has no recurrent expense, the previous month's recurrent expenses are copied once per session, without duplicates, reading only two months.

**Independent Test**: With recurrent expenses in the previous month and none in the current one, log in: copies appear with the expected fields and dates; logging in again creates nothing new.

### Tests for User Story 3 (write FIRST, ensure they FAIL)

- [X] T012 [US3] Create `src/app/services/recurring.spec.ts` (Vitest, `import { describe, it, expect } from 'vitest'`) with a small `makeExpense()` helper and these cases for `planRecurringCopies(expenses, today)` (input contains only the two months): (1) current month already has a recurrent expense → `[]`; (2) previous month has no recurrent expenses → `[]`; (3) correct copy: `who, amount, where, category, notes, uid` kept, `recurrent: true`, same day of month, month = current; (4) day 31 original with a 30-day current month, and 29/30/31 with February (use a leap year and a non-leap year) → last day of month; (5) January `today` looks at December of the previous year and copies into January; (6) non-recurrent previous-month expenses ignored while recurrent ones are copied; (7) flag removed in the current month (current copy without `recurrent`) while previous has recurrent → still planned only when the current month has no recurrent (and a copy whose id already exists in the input is not returned again); (8) deterministic ids `rec-YYYYMM-<index>` with sources ordered by `date`, `createdAt`, `id` regardless of input order, same output on repeated calls; (9) legacy expenses without the `recurrent` field are treated as non-recurrent (US5); (10) the input array and objects are not mutated. Run `npx vitest run --dir src` and confirm they fail because `recurring.ts` does not exist yet.

### Implementation for User Story 3

- [X] T013 [US3] Create `src/app/services/recurring.ts` exporting pure `planRecurringCopies(expenses: Expense[], today: Date): Expense[]` per `contracts/recurring-contract.md`: local `getFullYear()/getMonth()/getDate()` only (no `toISOString`); `YYYY-MM` of current and previous month (January → December of year − 1); return `[]` if any current-month expense has `recurrent === true` or the previous month has none; sort previous-month recurrent sources by `date`, `createdAt`, `id`; build copies with id `rec-YYYYMM-<index>`, day `min(sourceDay, new Date(y, m + 1, 0).getDate())`, `createdAt: today.getTime()`, `recurrent: true`; skip ids already present in the input; strict TypeScript, no `any`. Make T012 pass.
- [X] T014 [US3] In `src/app/services/expense.service.ts` add `ensureRecurringForCurrentMonth(): Promise<void>`: return immediately if no uid or if this uid already ran in the session (in-memory `Set<string>`, marked before reading); compute `start` = first day of previous month and `end` = last day of current month as local `YYYY-MM-DD` strings (reuse helpers exported from `recurring.ts` if useful); read with `this.fb.listenRange(\`users/${uid}/expenses\`, 'date', start, end).pipe(take(1))` (import `take`/`firstValueFrom` from rxjs) so no listener stays open; convert with `toExpenseList`; call `planRecurringCopies(expenses, new Date())`; write each copy with `this.fb.set(\`users/${uid}/expenses/${copy.id}\`, <copy without id>)` (never `push`); wrap in try/catch so failures never break the UI. Do not use `listenExpenses()` or add any index.
- [X] T015 [US3] In `src/app/components/dashboard/dashboard.ts` call `this.expenseService.ensureRecurringForCurrentMonth()` in `ngOnInit()` after the existing listeners are started (fire and forget; errors already handled inside the service).

**Checkpoint**: US3 works: tests pass; manual scenarios 3–5 of `quickstart.md` pass.

---

## Phase 6: User Story 4 - Copies are normal expenses (Priority: P2)

**Goal**: Copies can be edited, unflagged or deleted like any expense; an unflagged copy is not copied the following month.

**Independent Test**: Unflag a copy, then run the plan for the next month: it is not copied.

### Implementation for User Story 4

- [X] T016 [US4] Add a test in `src/app/services/recurring.spec.ts` simulating the next month: previous-month input contains a copy unflagged (no `recurrent`) and another still flagged → only the flagged one is copied; and a test that deleting/unflagging nothing else changes the other copies' ids' relative order rules (ids depend only on the sorted recurrent sources). Run `npx vitest run --dir src`.
- [X] T017 [US4] Manually verify in the app (mock mode is fine) that a copied expense can be deleted with the existing "Elimina" action and unflagged with the toggle from T011, and that unflagging does not touch any other expense; fix any issue found in `src/app/components/expense-list/`.

**Checkpoint**: US4 verified.

---

## Phase 7: User Story 5 - Existing data keeps working (Priority: P1)

**Goal**: Legacy expenses (no `recurrent` field) behave as non-recurrent and are never modified.

**Independent Test**: With legacy data only, login creates nothing and no record changes.

### Implementation for User Story 5

- [X] T018 [US5] Review the diff (`git diff`) to confirm: no migration/write of existing expenses anywhere (the only writes are the explicit `set`/`remove` of `recurrent`, new `rec-…` copies, and `addExpense`); `firebase-rules.json` and `tools/backup` are untouched; `package.json` has no new dependency; no derived field was added.
- [X] T019 [US5] Manually verify with legacy-only data (mock mode with expenses added before ticking anything): the list shows no badges, the login check creates no copies, and re-login creates no duplicates.

**Checkpoint**: Backward compatibility confirmed.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T020 Run `npx vitest run --dir src` and `npm run build`; both must pass (no strict-mode errors).
- [X] T021 Run the manual scenarios in `specs/002-recurring-expenses/quickstart.md`, including scenario 8 (only a two-month ranged read from the check).
- [X] T022 [P] Update `README.md` with a short "Recurring expenses" section: the flag, the monthly copy rule, and the two accepted limits (app not opened for a whole month; all recurrent expenses removed → copied again at next login of the same month).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: after Setup; blocks all stories.
- **US1, US2, US3, US5, US4**: all need Phase 2. US2 builds on the list changes of US1 (T007 and T011 edit the same template) so run US1 → US2. US3 is independent of US1/US2 except `expense.service.ts` edits (T004, T008, T014 are sequential in the same file). US4 needs US2 (toggle) and US3 (copies). US5 is verification after the code stories.
- **Polish**: after all stories.

### Within Each Story

- T012 (tests) before T013; T013 before T014; T014 before T015.
- T008 before T010/T011; T009 before T010.

### Parallel Opportunities

- T002 with T001.
- T005 and T006 (form ts vs html/css) after T004.
- T012 and T013's dependency-free preparation can overlap with US1/US2 UI work only if different files are touched by different people; `expense.service.ts` tasks (T004, T008, T014) must be sequential.
- T022 with T020/T021.

## Parallel Example: User Story 1

```bash
Task: "T005 expense-form.ts: recurrent control, submit and reset"
Task: "T006 expense-form.html/css: Recurrent checkbox"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 → Phase 2 → Phase 3 (US1); validate the flag and badge.
2. Note that the feature's core value (automatic copy) is US3; ship US1 + US2 + US3 together for usefulness.

### Incremental Delivery

1. Setup + Foundational.
2. US1 → US2 (flag management).
3. US3 (tests first, then pure function, service, dashboard trigger).
4. US4 and US5 verification, then Polish.

## Notes

- [P] tasks touch different files with no dependencies.
- Commit after each task or logical group; keep the existing build and tests passing.
- Constitution: strict TypeScript, no `any`, no new dependencies, pure logic tested.

## Phase 9: Convergence

- [X] T023 Remove the "Recurrent" text badge from the Category cell in `src/app/components/expense-list/expense-list.html` (lines ~74-76) and delete the now-unused `.badge-recurrent` rule in `src/app/components/expense-list/expense-list.css`, so the Category column shows only the category per FR-016 (contradicts)
- [X] T024 Remove the "Recurrent: on/off" button from the Actions cell in `src/app/components/expense-list/expense-list.html` (lines ~87-95) so Actions keeps only the "Elimina" action and its confirmation, per FR-016 (contradicts)
- [X] T025 Add a narrow column to the history table in `src/app/components/expense-list/expense-list.html` (a header cell with a recurring-arrows icon/short label and a per-row cell) containing a single icon button that calls `toggleRecurrent(expense)`: filled icon when `expense.recurrent` is true, outline icon otherwise, `title="Recurrent"` tooltip, `[attr.aria-pressed]="!!expense.recurrent"` and an `aria-label`; style it compactly in `src/app/components/expense-list/expense-list.css` per FR-004, FR-003 (missing)
- [X] T026 Check the row height and the Category/Actions column widths against the layout before this feature (rows not taller, Category and Actions not wider; only one narrow added column), including on phone width, and adjust `src/app/components/expense-list/expense-list.css` if needed per SC-007 (partial)
- [X] T027 Run `npx vitest run --dir src` and `npm run build`, then re-check quickstart scenarios 1, 2 and 7 in `specs/002-recurring-expenses/quickstart.md` against the new indicator per US1/US2/US5 (partial)
