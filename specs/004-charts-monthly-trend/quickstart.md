# Quickstart: Validating the Charts Tab (part 1)

## Prerequisites

- `npm install` done, then `npm install chart.js@^4.5.1` (the only new dependency; no `ng2-charts`, no `@angular/cdk`).
- App run in the usual way (`npm start`); the dev mock backend is enough. Have expenses spread over several months, with more than one person and category, some recurring and some on debit, plus at least one old expense without those flags.

## 1. Automated checks

```bash
npx vitest run --dir src          # new chart-data tests + existing specs
npx vitest run --dir tools/backup # backup tool unchanged and green
npx ng build                      # strict build passes
```

Expected: all pass. `chart-data.spec.ts` covers: range inclusive on both ends; person and category filters; legacy expenses without `recurrent` or `debit` (kept with the checkboxes off, excluded with them on); empty months included; range crossing a year boundary (labels with the year); range inside a single month; `from` after `to` returning empty; decimal amounts summed exactly; stacked values summing to the plain total; inputs not mutated.

## 2. Manual scenarios

1. **Tab position**: the tab bar shows Registra spesa, Storico, Riepilogo, **Grafici**, Persone, Categorie.
2. **Defaults**: opening "Grafici" shows 1 January of the current year to today, person and category on "Tutte", both checkboxes off, toggle on "Totale", one bar per month so far.
3. **Empty months**: pick a range containing a month with no expenses; it appears as an empty bar with its label.
4. **Tooltip**: hover a bar (desktop) or tap it (handheld); the exact amount appears as `€` plus two decimals.
5. **Person / category**: select a person, then a category, then both; bars count only matching expenses. Compare one month with the total shown in "Riepilogo" for the same filters.
6. **Flags**: tick "Solo ricorrenti", then "Solo addebito", then both; the old expense without flags disappears each time and returns when unticked.
7. **Stacking**: switch to "Per categoria" and "Per persona"; legend appears, each bar's parts add up to the "Totale" bar; with a person selected and "Per persona", each bar has a single part. In each bar the block with the largest amount of that month is the lowest one and sizes decrease going up; with data where the biggest category differs between two months, the order differs between those two bars; the legend still lists every name with its color; bar totals are unchanged.
8. **Inverted range**: set "Da" after "A"; the explanatory message appears and the chart does not change. Clear a date; the last valid range stays.
9. **Year boundary**: choose a range from October of last year to today; month labels include the year.
10. **No data**: choose a range with no expenses; the "no data" message replaces the chart.
11. **Reset**: change everything, press "Reimposta"; all filters and the toggle return to the defaults.
12. **Handheld**: window below 500px; single column, filters in two columns, flags and Reset on their own row, no horizontal page scroll, chart readable.
13. **Read-only / no new reads**: no write happens from this tab; the browser network panel shows no new database listener when opening it.
14. **Other tabs and rules**: Registra spesa, Storico, Riepilogo, Persone and Categorie behave as before; `firebase-rules.json`, `tools/backup` and `src/app/models/expense.model.ts` show no diff.
