# Contract: Breakdown Charts UI and Pure Functions

## Pure functions (`src/app/services/chart-data.ts`, added)

All synchronous, I/O-free, never mutating their inputs.

```ts
export interface BreakdownEntry {
  name: string;
  amount: number;       // rounded to 2 decimals
  percentage: number;   // 0-100, not rounded
  isOther: boolean;
}

export const OTHER_NAME = 'Altro';
export const SMALL_SLICE_THRESHOLD = 3; // percent

export function totalsBy(expenses: Expense[], key: 'category' | 'who'): BreakdownEntry[];
export function groupSmallSlices(entries: BreakdownEntry[], threshold: number): BreakdownEntry[];
export function colorFor(name: string, palette: string[]): string;
export function sliceColors(entries: BreakdownEntry[], palette: string[], neutral: string): string[];
export function formatEuro(value: number): string; // '€' + 2 decimals, as the monthly chart
```

| Function | Behaviour |
|---|---|
| `totalsBy` | groups by the stored `category` / `who` (empty becomes `Senza categoria` / `Senza persona`); amount-descending, ties by name; zero-or-less groups dropped; `[]` for no data; every entry `isOther: false` |
| `groupSmallSlices` | strictly-below-threshold entries merged into one `Altro` entry (`isOther: true`) placed last; unchanged list when nothing is small or when no entry would remain besides `Altro`; entries exactly at the threshold are kept |
| `colorFor` | deterministic hash of the name into `palette`; same name and palette always give the same color, independent of order or other entries; `''` palette is not supported (caller passes at least one color) |
| `sliceColors` | one color per entry, `neutral` for `isOther`, `colorFor` otherwise |
| `formatEuro` | same text as the existing monthly chart helper |

## Component contract

### `ChartsComponent` (extended)

| Item | Behaviour |
|---|---|
| New state | `categoryEntries`, `personEntries` (`computed` from `filtered`), palette split into five accents and one neutral |
| New handlers | `onCategorySlice(name)` calls `setCategory(name)`; `onPersonSlice(name)` calls `setPerson(name)`; "Other" never reaches them (filtered by the child) |
| Layout | below the monthly chart: `<div class="breakdown-grid">` with category ring first, person ring second; 2 columns, 1 column at max-width 500px |
| Unchanged | monthly chart, filter bar, toggle, `chart-canvas.ts` |

### `BreakdownChartComponent` (`app-breakdown-chart`, new, standalone, OnPush)

| Input / output | Type | Behaviour |
|---|---|---|
| `title` | string | e.g. "Per categoria", "Per persona" |
| `entries` | `BreakdownEntry[]` | already merged by `groupSmallSlices` |
| `colors` | string[] | one per entry (`sliceColors`) |
| `emptyMessage` | string | shown instead of the ring when `entries` is empty |
| `sliceClick` | output `string` | emitted with the entry name on a ring click or legend click; never for `isOther` |

| UI element | Behaviour |
|---|---|
| Ring | doughnut, white slice borders, tooltip `name: €amount` on hover (desktop) or tap (handheld); cursor pointer on clickable slices only |
| Center | total of all entries via `formatEuro` |
| Legend | one button per entry in the ring's order: color dot, name, whole-number percentage; "Altro" last and disabled (no click effect, no pointer cursor); wraps and stays readable on narrow screens |
| Empty | the `emptyMessage` in the existing `empty-state` style; no ring, legend or center |
| Single entry | one slice, legend shows 100% |
