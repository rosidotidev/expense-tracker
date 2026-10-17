# Feature Specification: Charts Tab - Spending Breakdown by Category and Person

**Feature Branch**: `005-charts-pie-breakdown`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Pie charts for the \"Grafici\" tab of the expense-tracker app, part 2 of 3, building on the tab, the shared filter bar and the monthly trend chart that already exist. Two doughnut charts below the monthly trend chart (spending by category and spending by person), side by side on desktop and stacked on handheld devices, computed on the expenses matching the shared filter bar, with legend and percentages, total in the center, exact amount on hover or tap, small slices merged into \"Other\", click on a slice or legend entry to set the shared category/person filter, stable colors, empty-state message, read-only and fully backward compatible. Visual reference: docs/mockup (06-torte, 01-layout-completo, 07-mobile) and docs/mockup/report-mockup.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how my spending splits by category and by person (Priority: P1)

Below the monthly trend chart of the **Grafici** tab, the user sees two doughnut charts: **spending by category** and **spending by person**. They are side by side on desktop. Each has one slice per category (or per person), a legend listing every entry with its percentage of the total, the total amount written in the center of the ring, and the exact amount of a slice visible on hover (desktop) or tap (handheld). Both charts are computed on the expenses that match the shared filter bar (date range, person, category, only recurring, only on debit), so they always agree with the monthly trend chart.

**Why this priority**: This is the core of the feature. With only these two charts the user already answers "where does my money go and who spends it".

**Independent Test**: With expenses across several categories and people, open the tab and confirm both rings appear below the monthly chart, slices and legend percentages match the data, the center shows the same total as the sum of the monthly chart for the same filters, and the exact amount of a slice shows on hover or tap.

**Acceptance Scenarios**:

1. **Given** the "Grafici" tab is open with default filters, **When** the page is shown, **Then** two doughnut charts, "by category" and "by person", appear below the monthly trend chart, side by side on a desktop-sized screen.
2. **Given** expenses in several categories, **When** the category chart is shown, **Then** it has one slice per category, each legend entry shows the category name and its percentage of the total, and the center shows the total amount of the matching expenses.
3. **Given** expenses of several people, **When** the person chart is shown, **Then** it has one slice per person with the same elements (name, percentage, total in the center).
4. **Given** a chart, **When** the user hovers (or taps) a slice, **Then** the exact amount of that slice and what it belongs to are shown.
5. **Given** any combination of filters in the shared bar, **When** it changes, **Then** both charts update to count only the matching expenses, and their center totals equal the sum of the monthly trend chart for the same filters.
6. **Given** the percentages shown in a legend, **When** they are added up, **Then** they total 100% (rounding differences of at most 1 point are tolerated).

---

### User Story 2 - Click a slice to filter the whole tab (Priority: P1)

Clicking (or tapping) a slice, or its legend entry, of the category chart sets the shared **category** filter to that category; doing the same on the person chart sets the shared **person** filter. Every chart of the tab (monthly trend and both rings) updates immediately, and the filter bar shows the new value, which the user can change or clear as usual with the existing controls.

**Why this priority**: It turns the charts from a static picture into a way to explore the data, and it is the main interaction the mockup calls out ("click a slice = set the filter").

**Independent Test**: Click a category slice and verify that the category filter shows that category, the monthly chart counts only it, the person ring is recomputed on it and the category ring shows a single slice at 100%. Repeat with a legend entry and with the person ring.

**Acceptance Scenarios**:

1. **Given** the category chart, **When** the user clicks a slice, **Then** the shared category filter is set to that category and all charts of the tab update.
2. **Given** the category chart, **When** the user clicks a legend entry, **Then** the effect is the same as clicking its slice.
3. **Given** the person chart, **When** the user clicks a slice or a legend entry, **Then** the shared person filter is set to that person and all charts of the tab update.
4. **Given** a slice has been clicked, **When** the filter bar is looked at, **Then** the corresponding dropdown shows the selected value, and the Reset button restores it to "All" as before.
5. **Given** a person filter and a category filter set by clicks on both rings, **When** the charts update, **Then** only expenses matching both are counted.
6. **Given** a handheld-sized screen, **When** the user taps a slice, **Then** the filter is set (and the exact amount is shown) as on desktop.

---

### User Story 3 - Keep the small entries readable with "Other" (Priority: P2)

Entries that represent less than 3% of the total are merged into a single slice labelled "Other", always drawn and listed last, in a neutral color. If merging would leave only one slice in the chart, nothing is merged and every entry keeps its own slice. The "Other" slice shows its percentage and exact amount like any other slice, but clicking it (or its legend entry) does nothing, since it stands for several categories or people.

**Why this priority**: Without it a long tail of tiny categories makes the ring and legend unreadable; the feature still works without it, hence P2.

**Independent Test**: Use data where two or more categories are below 3% and confirm they appear as one "Other" slice, last, in a neutral color, whose amount is the sum of the merged ones; click it and confirm nothing changes. Use data where merging would leave a single slice and confirm all entries stay separate.

**Acceptance Scenarios**:

1. **Given** at least one entry below 3% of the total and at least two slices left after merging, **When** the chart is shown, **Then** all entries below 3% are replaced by one "Other" slice whose amount is their sum.
2. **Given** an "Other" slice, **When** the chart is shown, **Then** it is the last slice and the last legend entry, in a neutral color that is not used by any category or person.
3. **Given** an "Other" slice, **When** the user clicks it or its legend entry, **Then** no filter changes and no chart updates.
4. **Given** a chart where merging the entries below 3% would leave only one slice, **When** the chart is shown, **Then** nothing is merged and each entry keeps its own slice.
5. **Given** an entry exactly at 3%, **When** the chart is shown, **Then** it is not merged (only entries strictly below 3% are).
6. **Given** a single entry below 3% and other larger entries, **When** the chart is shown, **Then** it is shown as "Other" containing only that entry, following the same rule.

---

### User Story 4 - Stable colors and sensible behavior when a filter is already set (Priority: P2)

Every category and every person keeps the same color while the user changes filters, so "Alimentari" is always the same color in its ring and legend. When the person filter is already set, the person chart stays visible with a single slice at 100% (and likewise for the category chart when the category filter is set), instead of disappearing.

**Why this priority**: Consistency lets the user follow an item across charts and filter changes; it is polish on top of the core value.

**Independent Test**: Note the color of a category, change filters and confirm it never changes. Set a person filter and confirm the person ring remains with one 100% slice in that person's color.

**Acceptance Scenarios**:

1. **Given** a category or person shown in a ring, **When** any filter changes and that entry is still present, **Then** it keeps exactly the same color.
2. **Given** the same category or person in the legend and in its ring, **When** the user looks at both, **Then** they use the same color.
3. **Given** a person filter is set, **When** the person chart is shown, **Then** it is still visible with a single slice at 100% labelled with that person and the total in the center.
4. **Given** a category filter is set, **When** the category chart is shown, **Then** it is still visible with a single slice at 100%.
5. **Given** a person filter is set, **When** the category chart is shown, **Then** it shows the split by category of that person's expenses only.
6. **Given** a slice at 100%, **When** the user clicks it, **Then** the filter is set to the value it already has, so nothing visibly changes.

---

### User Story 5 - Use the charts comfortably on a handheld device (Priority: P2)

On a narrow screen the two doughnut charts are stacked one under the other in the single-column layout of the tab, each with its legend still readable and the total still visible in the center, without any horizontal page scrolling.

**Why this priority**: The app already offers a dedicated handheld layout, so the new charts must not be desktop-only.

**Independent Test**: Open the tab on a phone-sized screen with several categories and people; confirm the rings are stacked, legends are readable, slices and legend entries can be tapped, and the page does not scroll horizontally.

**Acceptance Scenarios**:

1. **Given** a handheld-sized screen, **When** the tab is shown, **Then** the category chart is above the person chart, both full width, below the monthly trend chart.
2. **Given** a handheld-sized screen, **When** a legend has many entries, **Then** all entries are readable and tappable without overlapping the ring.
3. **Given** a handheld-sized screen, **When** the user taps a slice, **Then** its exact amount is shown.

---

### Edge Cases

- No expense matches the active filters: each chart shows the same short "no data for the selected filters" message already used by the monthly trend chart, with no ring, legend or center total.
- The "from" date is after the "to" date: the rings follow the same rule as the monthly trend chart (no chart drawn for the inverted range, same explanatory message shown by the tab).
- An expense whose category or person no longer exists in the app lists: it is still counted, under its stored name, with its own slice and a stable color.
- Pre-existing expenses with an empty category or person: they are counted under a clear fallback label instead of being dropped, so the total of the ring always equals the sum of the matching expenses.
- A single category or person in the data: the chart shows one slice at 100% and nothing is merged.
- Many small entries all below 3%: they all merge into "Other"; if that would leave only "Other", nothing is merged and every entry keeps its own slice.
- Entries whose amounts are zero: they do not produce a slice; if the total is zero the empty-state message is shown.
- Percentages that do not add to exactly 100 after rounding: the legend shows rounded values; the underlying slice sizes are exact.
- Very long category or person names: legend entries remain readable (text may be shortened) without breaking the layout.
- More categories or people than colors in the palette: colors may repeat only after the palette is exhausted, and an entry still keeps its own color across filter changes.
- Amounts with cents: slice amounts and the center total are summed correctly and formatted like amounts elsewhere in the app.
- The user clicks several slices in quick succession: the last click wins and the charts end up consistent with the filter bar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Grafici" tab MUST show, below the existing monthly trend chart, two doughnut charts: spending by category and spending by person.
- **FR-002**: On desktop-sized screens the two charts MUST be side by side; on handheld-sized screens they MUST be stacked in a single column with no horizontal page scrolling.
- **FR-003**: Both charts MUST be computed on exactly the expenses matching the shared filter bar (date range, person, category, only recurring, only on debit), so their totals are consistent with the monthly trend chart.
- **FR-004**: Each chart MUST have one slice per category (or per person) with spending in the filtered data, sized by the sum of the matching expenses.
- **FR-005**: Each chart MUST show a legend listing every entry with its percentage of the total, and the total amount of the matching expenses in the center of the ring.
- **FR-006**: The exact amount of a slice MUST be visible on hover on desktop and on tap on handheld devices.
- **FR-007**: Entries strictly below 3% of the chart total MUST be merged into a single slice labelled "Other", shown last in the ring and in the legend, in a neutral color distinct from every category and person color. If merging would leave only one slice, nothing MUST be merged.
- **FR-008**: Clicking or tapping a slice, or its legend entry, of the category chart MUST set the shared category filter to that category; the same on the person chart MUST set the shared person filter. All charts of the tab MUST update, and the filter bar MUST reflect the new value.
- **FR-009**: Clicking or tapping the "Other" slice or its legend entry MUST do nothing.
- **FR-010**: When the person filter is set, the person chart MUST stay visible with a single slice at 100%; when the category filter is set, the category chart MUST stay visible with a single slice at 100%.
- **FR-011**: Every category and every person MUST keep the same color across filter changes, in the ring and in its legend. Matching the colors of the stacked monthly trend chart is not required, because that chart must not change.
- **FR-012**: When no expense matches the active filters, each chart MUST show the same "no data for the selected filters" message used by the monthly trend chart instead of an empty ring.
- **FR-013**: Expenses whose category or person is no longer present in the app lists MUST still be counted, under the stored name.
- **FR-014**: The center total of each chart MUST equal the sum of the amounts of the matching expenses, and the sum of its slice amounts, including "Other", MUST equal that total.
- **FR-015**: The charts MUST follow the existing look of the app and the layout of the reference mockups (06-torte, 01-layout-completo, 07-mobile), which are illustrative and not pixel-perfect.
- **FR-016**: The feature MUST be read-only: it MUST NOT write, modify, migrate or delete any data. The only state it changes is the transient shared filter selection of the tab, which is not stored.
- **FR-017**: The feature MUST NOT change the expense data model, the database security rules, the backup tool, the other tabs, or the existing monthly trend chart and its behavior.
- **FR-018**: The feature MUST NOT trigger additional reads of the database beyond what the app already performs.

### Key Entities

- **Expense** (existing): a record of money spent, with person, amount, date, place, category, notes and the optional recurring and debit flags. Only read; not changed.
- **Chart filters** (existing, transient): the shared selection of date range, person, category and the two flag checkboxes. A click on a slice is another way to set the person or category value; nothing is stored.
- **Breakdown entry**: for one category or person, its name, the sum of its matching expenses, its percentage of the total, and its stable color.
- **"Other" entry**: the synthetic entry that groups all entries below 3% of the total; it has the sum of the merged amounts, a neutral color, and is not clickable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opening the tab sees both breakdown charts for the current year to date, below the monthly chart, without touching any control.
- **SC-002**: For any combination of filters, the center total of each chart equals the sum of the matching expenses and the monthly trend total for the same filters, in 100% of cases.
- **SC-003**: Selecting a slice or legend entry updates the filter and all charts in under 1 second for a history of several thousand expenses, and the user needs a single click or tap to narrow the tab to a category or person.
- **SC-004**: Entries below 3% are always merged into one last "Other" slice unless that would leave a single slice, and clicking "Other" never changes any filter, in 100% of cases.
- **SC-005**: An item keeps the same color in 100% of cases while the user changes filters, in its ring and legend.
- **SC-006**: 100% of pre-existing expenses remain unchanged after using the charts, and no data is written by any action on them.
- **SC-007**: On a handheld-sized screen, both charts, their legends and the slice interactions can be used without horizontal page scrolling.
- **SC-008**: The monthly trend chart, the other tabs and the filter bar behave exactly as before this feature, apart from the filters now also being settable by clicking a slice.

## Assumptions

- The tab, the shared filter bar and the monthly trend chart from part 1 (spec 004) already exist and are reused unchanged; this feature only adds the two charts below the monthly chart.
- The app already loads all expenses at startup; the new charts work on that data with no new loading step.
- The "Other" label is shown in the app's interface language (Italian: "Altro"), like the rest of the tab, while this spec calls it "Other".
- The 3% threshold applies to each chart's own total, evaluated separately for the category chart and the person chart.
- An expense with an empty category or person is grouped under a generic fallback label so totals stay exact.
- Colors are assigned so that an entry keeps its color independently of the active filters; the exact palette follows the existing look of the app, and the neutral color of "Other" is grey.
- Percentages are shown rounded to whole numbers; amounts are shown in euros with the same formatting used elsewhere in the app.
- Clicking a slice only sets the filter; clearing it is done with the existing filter bar controls or the Reset button.
- Out of scope: drill-down screens, sub-categories, comparison between periods, budgets, export, year-over-year comparison and summary indicators (the last two belong to part 3 of the charts work).
