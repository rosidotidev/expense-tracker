# Implementation Plan: Charts Tab - Year-over-Year Comparison and Summary Cards

**Branch**: `006-charts-yoy-kpi` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-charts-yoy-kpi/spec.md`

## Summary

Extend the "Grafici" tab with three summary cards (total, monthly average, change vs previous period) above the charts and a year-over-year line chart below the pie charts. Everything is derived with `computed` signals in `ChartsComponent`. The cards use the already filtered expenses (`filtered`, all filters, dates included); the previous period is a second `filterExpenses` call with the same filters and the previous range. The year-over-year chart uses a second list built with `filterExpenses` over the whole time span, so only person, category and the two flags apply. The new logic (`yearlyMonthlySeries`, `rangeSummary`, `previousPeriod`, `percentChange`, `yearColor`) is pure and I/O-free in `src/app/services/chart-data.ts`, tested with Vitest. No new dependency, listener, query or index; the full history is already in `ExpenseService.expenses$`.

**Deviations from the request, to confirm**:

1. **ng2-charts is not installed** (same as in part 2). Only `chart.js` is. This plan keeps using Chart.js directly, as parts 1 and 2 do; no dependency is added.
2. **"Date range removed (from and to unset)" does not work with `filterExpenses` as it is.** The function returns `[]` when the range is invalid, and an empty `from`/`to` counts as invalid (`isValidRange`). Changing it would alter the behavior the other charts rely on. Instead the yearly list passes the constants `ALL_TIME_FROM = '0000-01-01'` and `ALL_TIME_TO = '9999-12-31'`, which keeps `filterExpenses` untouched and still uses the same function and string comparison.
3. **One new small component, `yoy-chart`, in `components/charts/yoy-chart/`.** The existing `ChartCanvasComponent` is typed for bar charts only (`Chart<'bar'>`). Widening it would touch the monthly chart's wrapper, which must not change, so a separate line-chart wrapper (about 40 lines, same pattern) is added. The cards are plain markup in `charts.html`; no component is needed.
4. **Year colors use `yearColor(year, palette)` = `palette[year % palette.length]`, not `colorFor`.** `colorFor` hashes the name, and with 5 colors two nearby years would often collide and the legend would be ambiguous. Using the year number guarantees different colors for years less than 5 apart and keeps a year's color stable across filters. The neutral palette tone is not used.
5. **Change card at 0%**: it is decided on the rounded value. A change that rounds to 0% shows "0%" with no arrow (spec FR-012); the request says "arrow up or down otherwise".
6. **Spec FR-014 vs FR-015**: when the date range has no matches but the year-over-year list does, FR-015 (the more specific) wins: the chart is drawn and the cards show zero, zero and "n/a". The chart shows the "no data" message only when its own list is empty. FR-014 will read consistently with this when the spec is next touched.

## Technical Context

**Language/Version**: TypeScript (strict), Angular 21.2 (zoneless, signals) in `src/app`

**Primary Dependencies**: none new. Existing: `chart.js ^4.5.1` (direct use; registers `LineController`, `LineElement`, `PointElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend` in the new component), Angular, RxJS `toSignal`

**Storage**: none. Reads `ExpenseService.expenses$` through the existing `expenses` signal; no writes, no new listener, query or index

**Testing**: Vitest, `npx vitest run --dir src` (no Angular `ng test` target); build check with `ng build`

**Target Platform**: Web, desktop and handheld; the tab's breakpoint is 500px (as in parts 1 and 2)

**Project Type**: single Angular web app

**Performance Goals**: a few O(n) passes (cards current, cards previous, yearly list, yearly series) over the in-memory expenses; update well under 1 second for several thousand expenses (SC-007)

**Constraints**: read-only; `Expense` model, `firebase-rules.json`, `tools/backup`, other tabs, the filter bar, the monthly chart and the pies untouched; colors from the app CSS variables; no `any`; dates handled as `YYYY-MM-DD` strings with local or pure-calendar arithmetic, never `toISOString`

**Scale/Scope**: 1 service file extended, 1 spec file extended, 1 component (3 files) extended, 1 new child component (1 file)

## Constitution Check

*Version 1.0.0. Re-checked after Phase 1 design: all pass.*

| Principle | Status | Note |
|---|---|---|
| I. TypeScript Strict | Pass | Typed series (`(number \| null)[]`), typed ranges; Chart.js types for config; no `any` |
| II. Simplicity (YAGNI) | Pass, justified | No new dependency. One small child component, justified because widening the bar-only canvas wrapper would change the existing monthly chart. Cards are markup only. Chart.js legend is used for the years (no custom legend) |
| III. Standalone Utilities | Pass | Not applicable; `tools/backup` not touched |
| IV. No Credentials | Pass | Nothing sensitive added |
| V. Tests for Pure Logic | Pass | All new logic is pure in `chart-data.ts`, covered in `chart-data.spec.ts` |
| Workflow: keep suite and build passing | Gate | Existing specs stay green; `ng build` run at the end (quickstart) |

## Project Structure

### Documentation (this feature)

```text
specs/006-charts-yoy-kpi/
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
│   ├── chart-data.ts                 # + ALL_TIME_FROM/TO, yearlyMonthlySeries, rangeSummary,
│   │                                 #   previousPeriod, percentChange, yearColor
│   └── chart-data.spec.ts            # + tests for the new functions
└── components/charts/
    ├── charts.ts                     # + computed summary, previousSummary, change, yearlyFiltered,
    │                                 #   yearlySeries, yoyConfig
    ├── charts.html                   # + cards row after the filter bar; yearly section after the pies
    ├── charts.css                    # + .kpi-grid (3 columns, compact <= 500px), .yoy-area, .yoy-note
    ├── chart-canvas.ts               # NOT touched
    ├── breakdown-chart/              # NOT touched
    └── yoy-chart/
        └── yoy-chart.ts              # NEW: line chart wrapper (inline template)

firebase-rules.json, tools/backup, src/app/models/expense.model.ts   # NOT touched
```

**Structure Decision**: keep the part 1 and 2 layout. Pure logic in `services/chart-data.ts`; presentation in the `charts` component folder; the new child is purely presentational (one input, no services).

## Complexity Tracking

No constitution violations to justify.
