# Implementation Plan: Recurring Expenses

**Branch**: `002-recurring-expenses` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-recurring-expenses/spec.md`

## Summary

Add an optional `recurrent` flag to expenses, a checkbox in the form and a compact indicator/toggle in the list, and a once-per-session
check after login that copies the previous month's recurrent expenses into the current month when the
current month has none. The rule lives in a pure function (`planRecurringCopies`) with Vitest tests.
The check reads only the previous + current month through the existing indexed `date` range query,
and writes copies with deterministic ids via `set`, so concurrent runs cannot duplicate. No new
dependencies, no new database node, no index, no backend, no data migration.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Angular 21 (standalone, zoneless)

**Primary Dependencies**: existing only (Angular, RxJS 7.8, firebase 12). None added.

**Storage**: Firebase Realtime Database, existing node `users/{uid}/expenses/{id}`; new optional child `recurrent: true`. `firebase-rules.json` unchanged (the existing `date` index is reused).

**Testing**: Vitest 5 (already a devDependency), run with `npx vitest run --dir src`. The Angular `ng test` target is not configured.

**Target Platform**: Browser SPA

**Project Type**: Web application (frontend only)

**Performance Goals**: Login check reads at most two calendar months of data, independent of history size (SC-004).

**Constraints**: Local date parts only (no `toISOString`); no full-history listener for the check; no extra derived fields; backward compatible; `tools/backup` untouched.

**Scale/Scope**: One user's expenses; tens to hundreds of expenses per month.

## Constitution Check

*GATE: passes before Phase 0 and re-checked after Phase 1 design.*

| Principle | Status | Note |
|-----------|--------|------|
| I. TypeScript Strict | Pass | New code is strict, no `any`. (Existing `toExpenseList(snapshot: any)` is reused, not extended.) |
| II. Simplicity / YAGNI | Pass | One pure function, two service methods, small UI additions. No new dependency, index, or linking field. |
| III. Standalone Utilities | N/A | Not a utility; change is confined to `src/app`. `tools/backup` not touched. |
| IV. No Credentials | Pass | No config or secrets touched. |
| V. Tests for Pure Logic | Pass | `planRecurringCopies` is I/O-free and fully unit tested. |

No violations; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-recurring-expenses/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── recurring-contract.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/app/
├── models/
│   └── expense.model.ts            # + recurrent?: boolean
├── services/
│   ├── recurring.ts                # NEW: pure planRecurringCopies (+ date helpers)
│   ├── recurring.spec.ts           # NEW: Vitest tests
│   ├── expense.service.ts          # + addExpense(recurrent), setRecurrent, ensureRecurringForCurrentMonth
│   └── mock-firebase.service.ts    # verified (set/remove/listenRange sufficient); no change expected
└── components/
    ├── dashboard/dashboard.ts      # call the once-per-session check after listeners start
    ├── expense-form/               # "Recurrent" checkbox
    └── expense-list/               # narrow column with one icon that shows and toggles the flag (no badge, nothing in Category/Actions); signals so the zoneless UI updates
```

**Structure Decision**: Single Angular app; pure logic split out in `services/recurring.ts` so it is testable without Angular or Firebase.

## Design Decisions

1. **Pure rule** — `planRecurringCopies(expenses: Expense[], today: Date): Expense[]` receives only the previous + current month expenses (the caller guarantees the range). It computes current/previous `YYYY-MM` from `today`'s local `getFullYear()/getMonth()`, returns `[]` if any current-month expense has `recurrent === true` or the previous month has none, otherwise returns the copies. January wraps to December of the previous year. Last day of month via `new Date(y, m + 1, 0).getDate()`; copy day = `min(originalDay, lastDay)`.
2. **Deterministic ids** — sources sorted by `date`, then `createdAt`, then `id`; copy `i` gets id `rec-YYYYMM-<i>` (YYYYMM of the current month). The function skips any id already present in the input (so an edited or unflagged copy is never overwritten by a re-run). Copies carry `who, amount, where, category, notes, uid, recurrent: true`, and `createdAt = today.getTime()`.
3. **Write path** — `FirebaseService.set('users/{uid}/expenses/{id}', copy)` per copy (never `push`); two devices racing write identical content to identical keys.
4. **Read path** — `ensureRecurringForCurrentMonth()` in `ExpenseService`: guarded by a per-uid "already ran" marker (set before the read so it runs once per session even on failure/retry-free), `listenRange(path, 'date', firstDayPrev, lastDayCurrent).pipe(take(1))`, converts the snapshot to expenses, calls the pure function (which looks at `recurrent` in memory), writes copies. Errors are caught and logged/toasted; never block the UI. The full `listenExpenses()` listener is not used for the check. The existing history/overview listeners then show copies automatically.
5. **Flag editing** — `addExpense` accepts optional `recurrent` and stores the field only when true (absent otherwise). `setRecurrent(id, value)`: `set(.../recurrent, true)` when on, `remove(.../recurrent)` when off, so unflagged expenses are stored exactly like legacy ones.
6. **Zoneless UI** — the list's `allExpenses`/`loading` become signals (templates/getters read them), so subscription callbacks and flag toggles re-render. The form uses a reactive-form control for the checkbox, reset to `false` on reset.
7. **Rules/indexes** — no change to `firebase-rules.json`; `recurrent` is never queried server-side.

## Complexity Tracking

No constitution violations to justify.
