# Implementation Plan: Charts Tab - Foundation, Filters and Monthly Trend

**Branch**: `004-charts-monthly-trend` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-charts-monthly-trend/spec.md`

## Summary

Add a "Grafici" tab between "Riepilogo" and "Persone" with a shared filter bar (free date range, person, category, only recurring, only on debit, reset) and a monthly trend bar chart that can be stacked by category or by person. The tab is read-only: it reads the expenses already loaded by the dashboard (`ExpenseService.expenses$`), filters and aggregates them in memory, and draws them with **Chart.js**. All logic lives in one pure file, `src/app/services/chart-data.ts`, unit-tested with Vitest. State is held in signals (the app is zoneless).

**Deviation from the request, to confirm**: the request names Chart.js "through ng2-charts". Research found that the latest ng2-charts (11.0.0) needs Angular 22 while this project is on Angular 21.2, and that the compatible 10.0.0 also pulls in `@angular/cdk` as a peer. The plan therefore uses **Chart.js directly** with a small wrapper component (about 40 lines), which keeps the single new dependency the request asked for. See [research.md](./research.md), decision 1. Switching to `ng2-charts@10.0.0` later only touches the wrapper.

## Technical Context

**Language/Version**: TypeScript (strict), Angular 21.2 (zoneless, signals) in `src/app`

**Primary Dependencies**: one new: `chart.js` `^4.5.1`. Existing: Angular, RxJS (`toSignal` from `@angular/core/rxjs-interop`), `FirebaseService` (not touched)

**Storage**: none new. Reads the existing `users/{uid}/expenses` data already held in `ExpenseService.expenses$`; no writes

**Testing**: Vitest, run with `npx vitest run --dir src` (no Angular `ng test` target)

**Target Platform**: Web, desktop and handheld (the app's breakpoints are 500px for the overview and 600px for the expense list; this tab follows the overview, 500px)

**Project Type**: single Angular web app

**Performance Goals**: filter and aggregation are O(n) in memory over the loaded expenses; the chart updates in well under 1 second for several thousand expenses (SC-002)

**Constraints**: read-only; no new Firebase listener, query or index; `Expense` model, `firebase-rules.json`, `tools/backup` and other tabs untouched; dates handled as local `YYYY-MM-DD` strings, never `toISOString`; month labels in Italian

**Scale/Scope**: personal expense data; 1 new service file, 1 spec file, 1 new component folder (3 component files plus a chart wrapper), 2 small edits in `dashboard`

## Constitution Check

*Version 1.0.0. Re-checked after Phase 1 design: all pass.*

| Principle | Status | Note |
|---|---|---|
| I. TypeScript Strict | Pass | No `any`; filters, buckets and series are typed; Chart.js types used for the config |
| II. Simplicity (YAGNI) | Pass, justified | One dependency is added on purpose: every chart of the tab (this feature and the next two) needs a charting engine, and hand-drawn SVG or canvas would mean maintaining axes, stacking, tooltips and hover/tap handling ourselves. Chart.js is used directly, without the Angular wrapper library, to avoid a second dependency and an `@angular/cdk` peer. Only the controllers and elements actually used are registered (tree-shaking) |
| III. Standalone Utilities | Pass | Not applicable; `tools/backup` not touched |
| IV. No Credentials | Pass | Nothing sensitive added |
| V. Tests for Pure Logic | Pass | `chart-data.ts` is pure and I/O-free; `chart-data.spec.ts` covers it |
| Workflow: keep suite and build passing | Gate | Existing specs (`recurring`, `debit-filter`, `expense.service`) and the backup tests must stay green; `ng build` verified in the quickstart |

## Project Structure

### Documentation (this feature)

```text
specs/004-charts-monthly-trend/
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
package.json                                  # + chart.js ^4.5.1
src/app/
├── services/
│   ├── chart-data.ts                         # NEW: pure filter + monthly aggregation
│   ├── chart-data.spec.ts                    # NEW: Vitest tests
│   └── expense.service.ts                    # NOT touched
└── components/
    ├── dashboard/
    │   ├── dashboard.ts                      # Tab type + tabs array + import ChartsComponent
    │   └── dashboard.html                    # @case ('grafici') { <app-charts /> }
    └── charts/                               # NEW
        ├── charts.ts                         # filter signals, derived chart data
        ├── charts.html                       # filter bar, toggle, chart, empty/invalid states
        ├── charts.css                        # card look, responsive (500px)
        └── chart-canvas.ts                   # NEW: tiny wrapper that owns the Chart.js instance

docs/datamodel-firebase.md                    # NOT changed (no data model change)
```

**Structure Decision**: single existing Angular project. New code is one pure helper file, one new component folder and two small edits in `dashboard`, as requested. The wrapper `chart-canvas.ts` is the only extra file beyond the request: it isolates the one piece of imperative Chart.js code so the parts 005 and 006 can reuse it.

## Complexity Tracking

No constitution violations. The one new dependency is justified in the Constitution Check above (principle II).
