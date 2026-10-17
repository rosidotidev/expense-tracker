# Feature Specification: Charts Tab - Foundation, Filters and Monthly Trend

**Feature Branch**: `004-charts-monthly-trend`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Charts tab for the expense-tracker app, part 1 of 3 (foundation, filters and monthly trend). A new tab \"Grafici\" between \"Riepilogo\" and \"Persone\", with a filter bar shared by all its charts (free date range, person, category, only recurring, only on debit, reset) and a monthly trend chart (total per month, switchable to a stack by category or by person). Read-only and fully backward compatible. Visual reference: the mockups in docs/mockup (01-layout-completo, 02-filtri, 04-andamento-mensile, 07-mobile) and docs/mockup/report-mockup.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how much I spend each month over a period (Priority: P1)

The user opens a new tab, **Grafici**, placed between *Riepilogo* and *Persone*. Right away it shows a bar chart with the total spent in each month, for the period from 1 January of the current year up to today. The user can change the period with free "from" and "to" date pickers. Months without expenses still appear, as empty bars, so the time axis is continuous. The exact amount of a month is visible on hover (desktop) or tap (handheld).

**Why this priority**: This is the core of the feature: without the tab and the monthly trend there is nothing to filter or stack. It alone is a usable MVP.

**Independent Test**: Open the tab with some expenses spread over several months; confirm one bar per month of the default period, empty months shown as empty bars, and the exact total of a month visible on hover or tap. Change "from" and "to" and confirm the bars follow.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the tab bar, **Then** a "Grafici" tab appears between "Riepilogo" and "Persone".
2. **Given** the user opens "Grafici" for the first time in a session, **When** the tab is shown, **Then** the period is 1 January of the current year to today and the chart shows one bar per month of that period.
3. **Given** a month inside the period with no expenses, **When** the chart is shown, **Then** that month appears with an empty bar and its month label.
4. **Given** the chart, **When** the user hovers (or taps) a month, **Then** the exact total of that month is shown.
5. **Given** the user changes the "from" or "to" date, **When** the new range is valid, **Then** the chart updates to show exactly the months of the new range.
6. **Given** no expense falls in the selected period, **When** the chart area is shown, **Then** it displays a short "no data for the selected filters" message instead of an empty chart.

---

### User Story 2 - Narrow the chart to a person or a category, and reset (Priority: P1)

A filter bar at the top of the tab lets the user restrict the data to one person and/or one category. Both default to "All". A **Reset** button restores every filter (dates, person, category and the two checkboxes of story 3) to its default. The filter bar is shared: every chart of the tab, now and in later parts, uses it.

**Why this priority**: Without person and category filters the chart cannot answer "how much does this person spend" or "how much do we spend on this category", which is the main reason for the tab.

**Independent Test**: Select one person, then one category, then both; confirm the bars only count matching expenses each time. Press Reset and confirm everything returns to the defaults.

**Acceptance Scenarios**:

1. **Given** the filter bar, **When** the tab is opened, **Then** "Person" and "Category" both show "All" and the chart counts every expense of the period.
2. **Given** a person is selected, **When** the chart updates, **Then** only that person's expenses are counted.
3. **Given** a category is selected, **When** the chart updates, **Then** only that category's expenses are counted.
4. **Given** both a person and a category are selected, **When** the chart updates, **Then** only expenses matching both are counted.
5. **Given** any filter has been changed, **When** the user presses Reset, **Then** the dates return to 1 January of the current year - today, person and category return to "All", and both checkboxes are unticked.
6. **Given** the filter bar, **When** the person and category lists are opened, **Then** they offer the people and categories the user already has in the app.

---

### User Story 3 - Look only at recurring or on-debit expenses (Priority: P2)

Two checkboxes in the filter bar, "Only recurring" and "Only on debit", both unticked by default, restrict the chart to expenses carrying the existing recurrent flag and/or the existing debit flag. When both are ticked, only expenses with both flags are counted.

**Why this priority**: Useful to isolate fixed costs or what is still owed, but the tab is already valuable without it.

**Independent Test**: With a mix of flagged and unflagged expenses, tick each checkbox alone and then both; confirm the bars change accordingly and that expenses without the flags never count when a checkbox is ticked.

**Acceptance Scenarios**:

1. **Given** both checkboxes unticked, **When** the chart is shown, **Then** flagged and unflagged expenses are all counted.
2. **Given** "Only recurring" is ticked, **When** the chart updates, **Then** only recurring expenses are counted.
3. **Given** "Only on debit" is ticked, **When** the chart updates, **Then** only expenses on debit are counted.
4. **Given** both are ticked, **When** the chart updates, **Then** only expenses that are both recurring and on debit are counted.
5. **Given** a pre-existing expense without the optional flags, **When** a checkbox is ticked, **Then** that expense is not counted, and when both are unticked it is counted as usual.

---

### User Story 4 - See what each month is made of (Priority: P2)

Above the monthly chart a toggle lets the user choose how the bars are drawn: **Total** (default, one block per month), **By category** or **By person**. In the last two modes each bar is stacked into coloured parts, one per category or per person, with a legend that explains the colours. The exact amount of a part is visible on hover or tap.

**Why this priority**: Adds the "why" behind a month's total and mirrors the mockup, but the plain total already answers the basic question.

**Independent Test**: Switch the toggle through its three values with a dataset of several categories and people; confirm that each stacked bar adds up to the same total shown in "Total" mode, and that the legend matches the colours.

**Acceptance Scenarios**:

1. **Given** the tab is opened, **When** the chart is shown, **Then** the toggle is on "Total".
2. **Given** the toggle is on "By category", **When** the chart is shown, **Then** each bar is stacked by category and a legend lists the categories with their colours.
3. **Given** the toggle is on "By person", **When** the chart is shown, **Then** each bar is stacked by person and a legend lists the people with their colours.
4. **Given** any stacked mode, **When** the user hovers or taps a part of a bar, **Then** its exact amount (and what it belongs to) is shown.
5. **Given** any filter changes, **When** the toggle stays on a stacked mode, **Then** the chart updates and the stacked total of each month equals its "Total" value.
6. **Given** a category (or person) filter is set and the toggle is on that same dimension, **When** the chart is shown, **Then** it shows a single part per bar.

---

### User Story 5 - Use the tab comfortably on a handheld device (Priority: P2)

On a narrow screen the tab becomes a single column: the filter bar is compact (dates on one row, person and category on the next, checkboxes and Reset below) and the chart takes the full width, with the toggle and legend still usable.

**Why this priority**: The app already offers a dedicated handheld layout for its lists, so the new tab must not be a desktop-only exception.

**Independent Test**: Open the tab on a phone-sized screen; confirm there is no horizontal page scroll, every filter is reachable and the chart and its legend are readable.

**Acceptance Scenarios**:

1. **Given** a handheld-sized screen, **When** the tab is shown, **Then** the content is a single column with no horizontal page scrolling.
2. **Given** a handheld-sized screen, **When** the user uses the filters, **Then** all of them (dates, person, category, both checkboxes, Reset) can be reached and changed without overlap.
3. **Given** a handheld-sized screen, **When** the user taps a bar, **Then** the exact amount is shown.

---

### Edge Cases

- The "from" date is later than the "to" date: the chart does not update with an inverted range and a short message explains that the start must not be after the end.
- A date picker is cleared or incomplete: the chart keeps showing the last valid range until both dates are valid again.
- The range lies inside a single month: the chart shows a single bar for that month.
- The range crosses a year boundary: months of different years are told apart (the month label includes the year when the range spans more than one calendar year).
- A very long range (many years): the chart still shows one bar per month and remains readable (labels may be thinned out).
- An expense whose person or category no longer exists in the app's lists: it is still counted, under its stored name, in totals and stacked modes.
- Pre-existing expenses without the optional recurring and debit flags: treated as not recurring and not on debit.
- An expense dated on the first or last day of the range: it is included (the range is inclusive on both ends).
- The user switches to another tab and comes back: the tab keeps working; filters are not required to be remembered across sessions.
- Amounts with cents: monthly totals add them up correctly and are shown consistently with how amounts are shown elsewhere in the app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST show a new tab labelled "Grafici" positioned between "Riepilogo" and "Persone".
- **FR-002**: The tab MUST contain, at the top, a single filter bar shared by every chart of the tab, with: a "from" date, a "to" date, a person filter, a category filter, an "Only recurring" checkbox, an "Only on debit" checkbox and a Reset button.
- **FR-003**: On opening, the date range MUST default to 1 January of the current year through today; person and category MUST default to "All"; both checkboxes MUST be unticked.
- **FR-004**: The date range MUST be freely selectable by the user and MUST be inclusive on both ends.
- **FR-005**: The person and category filters MUST offer "All" plus the people and categories already present in the app; selecting a value MUST restrict the data to expenses of that person or category, and the two MUST combine.
- **FR-006**: "Only recurring" MUST restrict the data to expenses carrying the recurring flag, and "Only on debit" MUST restrict it to expenses carrying the debit flag; when both are ticked, both conditions MUST hold. Expenses without these optional flags MUST be treated as not recurring and not on debit.
- **FR-007**: The Reset button MUST restore every filter of the bar to its default value in one action.
- **FR-008**: Below the filter bar, a monthly trend chart MUST show the total amount spent in each calendar month of the selected range, as bars, including months with no expenses (shown empty).
- **FR-009**: The monthly trend chart MUST count only the expenses that match all active filters.
- **FR-010**: A toggle MUST let the user choose between "Total" (default), "By category" and "By person"; in the last two modes each bar MUST be stacked by category or by person, with a legend, and the stacked parts of a month MUST sum to the same value as its "Total".
- **FR-011**: The exact amount of a month (and, in stacked modes, of each part) MUST be visible on hover on desktop and on tap on handheld devices.
- **FR-012**: When no expense matches the active filters, the chart area MUST show a short "no data for the selected filters" message instead of an empty chart.
- **FR-013**: When the "from" date is after the "to" date, the system MUST NOT draw a chart for the inverted range and MUST show a short explanatory message.
- **FR-014**: Month labels MUST be in Italian, and MUST include the year whenever the selected range spans more than one calendar year.
- **FR-015**: The layout MUST work on desktop and on handheld devices: on narrow screens it MUST become a single column with a compact filter bar and no horizontal page scrolling.
- **FR-016**: The tab MUST follow the existing look of the app (colours, cards, typography) and the layout shown in the reference mockups, which are illustrative and not pixel-perfect.
- **FR-017**: The feature MUST be read-only: it MUST NOT write, modify, migrate or delete any data.
- **FR-018**: The feature MUST NOT change the expense data model, the database security rules, the backup tool, or the behaviour of the existing tabs.
- **FR-019**: The feature MUST NOT trigger additional reads of the database beyond what the app already performs.

### Key Entities

- **Expense** (existing): a record of money spent, with person, amount, date, place, category, notes and the optional recurring and debit flags. Not changed by this feature; only read.
- **Chart filters** (transient): the current choice of date range, person, category and the two flag checkboxes. Shared by every chart of the tab, held only while the app is open, not stored.
- **Monthly total**: for each calendar month of the range, the sum of the matching expenses, optionally split by category or by person.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opening the tab sees the monthly totals for the current year to date without touching any control.
- **SC-002**: A user can change the period, person or category and see the chart update in under 1 second for a history of several thousand expenses.
- **SC-003**: For any combination of filters, the total shown for a month matches the sum of the amounts of the matching expenses of that month, in 100% of cases, in all three display modes.
- **SC-004**: With the default filters, every expense of the default period is counted exactly once, and no expense outside the range is counted.
- **SC-005**: 100% of pre-existing expenses, including those without the optional flags, remain unchanged after using the tab, and no data is written by any action on it.
- **SC-006**: Opening and using the tab does not change how the other tabs look or behave.
- **SC-007**: On a handheld-sized screen, every control of the tab can be used and the chart read without horizontal page scrolling.

## Assumptions

- The app already loads all of the user's expenses when it starts; the tab works on that data and does not need any new loading step.
- The chart filters are not remembered between sessions (out of scope); the tab starts from the defaults each time the app is opened.
- Amounts are shown in euros with the same formatting used elsewhere in the app.
- The person and category lists are the ones already maintained in the existing "Persone" and "Categorie" tabs.
- A range of any length is allowed; there is no upper limit on the number of months shown.
- Colours of the stacked parts are consistent between the chart and its legend; the exact palette is a design choice following the existing look of the app.
- The reference mockups use invented data and are illustrative only. The pie charts, the year-over-year chart and the summary cards that appear in them belong to the next parts (005 and 006) and are not part of this feature.
- Out of scope for this part: pie charts, year-over-year comparison, summary indicators (totals, averages, change vs previous period), chart export or printing, moving averages, forecasts, and remembering the filters between sessions.
