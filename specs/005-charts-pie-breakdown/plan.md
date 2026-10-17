# Implementation Plan: Charts Tab - Spending Breakdown by Category and Person

**Branch**: `005-charts-pie-breakdown` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-charts-pie-breakdown/spec.md`

## Summary

Add two doughnut charts (spending by category, spending by person) below the monthly trend chart of the "Grafici" tab. They are derived with `computed` signals from the filtered expenses the tab already produces (`ChartsComponent.filtered`), so they follow the shared filter bar with no new data source. The aggregation (`totalsBy`), the "Other" merge (`groupSmallSlices`) and the deterministic colors (`colorFor`, `sliceColors`) are added to the pure file `src/app/services/chart-data.ts` and unit-tested with Vitest. Clicking a slice or a legend entry calls the existing `setCategory` / `setPerson` of the shared filter, ignoring "Other". Read-only, no new dependency.

**Deviations from the request, to confirm**:

1. **ng2-charts is not installed.** The request says "Chart.js and ng2-charts are already installed by the previous part"; they are not. Part 1 (spec 004, research decision 1) deliberately used **Chart.js directly** because the compatible ng2-charts needs `@angular/cdk` and the latest needs Angular 22. This plan keeps that choice: no new dependency, the two new Chart.js controllers (`DoughnutController`, `ArcElement`) are registered by the new component.
2. **One new child component, `breakdown-chart`, inside `components/charts/`.** The request says to extend `charts.ts/html/css`. The ring + center total + legend + empty state is identical for both charts; a small child component used twice avoids duplicating that markup and canvas lifecycle. `charts.ts/html/css` still own the data (computed signals), the click handling and the grid placement.
3. **Cross-chart color match is dropped (spec FR-011 narrowed).** The existing monthly stacked chart colors a name by its *position* in the overall order, so the same name can have a different color there than in a ring. Matching them would require changing the existing monthly chart, which the request forbids. The spec (FR-011, US4 scenario 2, SC-005) is amended: colors are stable across filter changes *within the rings*; unifying them with the stacked monthly chart is left as a possible follow-up (one-line change: use `colorFor` there).

## Technical Context

**Language/Version**: TypeScript (strict), Angular 21.2 (zoneless, signals) in `src/app`

**Primary Dependencies**: none new. Existing: `chart.js ^4.5.1` (direct use), Angular, RxJS `toSignal`

**Storage**: none. Reads the expenses already held by `ExpenseService.expenses$`; no writes, no new listener, query or index

**Testing**: Vitest, `npx vitest run --dir src` (no Angular `ng test` target); build check with `ng build`

**Target Platform**: Web, desktop and handheld; the tab's breakpoint is 500px (same as part 1)

**Project Type**: single Angular web app

**Performance Goals**: one O(n) pass per ring over the already filtered expenses; update in well under 1 second for several thousand expenses (SC-003)

**Constraints**: read-only; `Expense` model, `firebase-rules.json`, `tools/backup`, other tabs, and the monthly trend chart's behavior untouched; palette taken from the app CSS variables; no `any`

**Scale/Scope**: 1 existing service file extended, 1 existing spec file extended, 1 existing component (3 files) extended, 1 new child component (3 small files)

## Constitution Check

*Version 1.0.0. Re-checked after Phase 1 design: all pass.*

| Principle | Status | Note |
|---|---|---|
| I. TypeScript Strict | Pass | Typed entries and keys; Chart.js types for configs; no `any` |
| II. Simplicity (YAGNI) | Pass, justified | No new dependency. The only added structure is one child component, justified by removing duplication across two identical charts. HTML legend instead of the Chart.js legend because it must show percentages and be clickable/tappable |
| III. Standalone Utilities | Pass | Not applicable; `tools/backup` not touched |
| IV. No Credentials | Pass | Nothing sensitive added |
| V. Tests for Pure Logic | Pass | All new logic is pure in `chart-data.ts`, covered in `chart-data.spec.ts` |
| Workflow: keep suite and build passing | Gate | Existing specs stay green; `ng build` verified in the quickstart |

## Project Structure

### Documentation (this feature)

```text
specs/005-charts-pie-breakdown/
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
├── services/
│   ├── chart-data.ts                 # + totalsBy, groupSmallSlices, colorFor, sliceColors, formatEuro
│   └── chart-data.spec.ts            # + tests for the new functions
└── components/charts/
    ├── charts.ts                     # + computed category/person entries, click handlers, palette split
    ├── charts.html                   # + grid with two <app-breakdown-chart> below the monthly chart
    ├── charts.css                    # + .breakdown-grid (2 columns, 1 column <= 500px)
    ├── chart-canvas.ts               # NOT touched (monthly bar wrapper)
    └── breakdown-chart/              # NEW
        ├── breakdown-chart.ts        # doughnut canvas (Chart.js), center total, click -> output
        ├── breakdown-chart.html      # card, ring, center total, clickable legend, empty message
        └── breakdown-chart.css       # ring box, legend, responsive

firebase-rules.json, tools/backup, src/app/models/expense.model.ts   # NOT touched
```

**Structure Decision**: keep the part 1 layout. Pure logic in `services/chart-data.ts`; presentation in the `charts` component folder; the child component is purely presentational (inputs and one output, no services).

## Complexity Tracking

No constitution violations to justify.
