# Implementation Plan: Debit Expenses

**Branch**: `003-debit-expenses` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-debit-expenses/spec.md`

## Summary

Add an optional `debit?: boolean` flag to the expense, following exactly the convention of the existing `recurrent` flag: stored only as `true`, removed when cleared, absent means not on debit. The add-expense form gets a "Debit" checkbox; the history list gets a "Debito" filter (applied in memory, no new query) and an on/off euro control in both the table row and the handheld card (no separate badge: the euro control is the only debit indicator). The filter predicate lives in a small pure function so it can be unit-tested. No backend, dependency, rules or backup-tool change, and no write to existing data.

## Technical Context

**Language/Version**: TypeScript (strict), Angular (zoneless, signals) in `src/app`

**Primary Dependencies**: none added (existing Angular, RxJS, Firebase client via `FirebaseService`)

**Storage**: Firebase Realtime Database, existing node `users/{uid}/expenses/{id}`; one optional child `debit` (`true` only)

**Testing**: Vitest, run with `npx vitest run --dir src` (no Angular `ng test` target)

**Target Platform**: Web, desktop table layout and handheld card layout (breakpoint 600px)

**Project Type**: single Angular web app

**Performance Goals**: no extra reads; filter is an O(n) in-memory pass over the already loaded period

**Constraints**: backward compatible; no migration, backfill or write on existing data; `debit` never stored as `false`; `recurring.ts` untouched; `firebase-rules.json` and `tools/backup` untouched; no index on `debit`

**Scale/Scope**: personal expense data, one field, ~7 files touched plus 2 new files and tests

## Constitution Check

*Version 1.0.0. Re-checked after Phase 1 design: all pass.*

| Principle | Status | Note |
|---|---|---|
| I. TypeScript Strict | Pass | No `any`; new function typed with `Expense` and a union filter type |
| II. Simplicity (YAGNI) | Pass | Mirrors `recurrent`; one pure function, no new abstractions or deps |
| III. Standalone Utilities | Pass | `tools/backup` not touched |
| IV. No Credentials | Pass | Nothing sensitive added |
| V. Tests for Pure Logic | Pass | `matchesDebitFilter` tested; service write behaviour tested with a fake `FirebaseService` |
| Workflow: keep suite and build passing | Gate | `recurring.spec.ts` and backup tests must stay green; verified in quickstart |

## Project Structure

### Documentation (this feature)

```text
specs/003-debit-expenses/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-and-service.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/app/
├── models/
│   └── expense.model.ts                 # + debit?: boolean
├── services/
│   ├── expense.service.ts               # addExpense accepts debit; + setDebit(id, value)
│   ├── debit-filter.ts                  # NEW: DebitFilter type + matchesDebitFilter()
│   ├── debit-filter.spec.ts             # NEW: predicate tests
│   ├── expense.service.spec.ts          # NEW: addExpense / setDebit write tests
│   ├── mock-firebase.service.ts         # dev mock: refresh ancestor listeners on set/remove
│   └── recurring.ts                     # NOT touched
└── components/
    ├── expense-form/                    # Debit checkbox next to Recurrent (.ts/.html/.css)
    └── expense-list/                    # selectedDebit, toggleDebit, select, euro toggles (.ts/.html/.css)

docs/datamodel-firebase.md               # document optional debit field
```

**Structure Decision**: single existing Angular project; new code is one pure helper file under `src/app/services` plus edits to existing files, as requested.

## Complexity Tracking

No constitution violations; nothing to justify.
