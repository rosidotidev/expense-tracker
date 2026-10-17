# Feature Specification: Charts Tab - Year-over-Year Comparison and Summary Cards

**Feature Branch**: `006-charts-yoy-kpi`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Year-over-year chart and summary indicators for the \"Grafici\" tab of the expense-tracker app, part 3 of 3, building on the tab, the shared filter bar, the monthly trend chart and the pie charts that already exist. Add a year-over-year line chart with the months from January to December on the horizontal axis and one line per year that has expenses, with a legend of the years and the exact amount visible on hover or tap; the current year stops at the current month. This chart does not use the \"from\" and \"to\" dates of the filter bar and always compares the whole years available, but it does follow the person, category, only recurring and only on debit filters, and a short note under the chart says that it is not affected by the date filter. Add three summary cards above the charts, computed on the expenses that match all the filters of the bar including the dates: the total of the period; the monthly average, which is the total divided by the number of months of the selected range, counting a partial month as one month; and the change compared with the previous period of the same length, which is the range immediately before the \"from\" date, shown as a percentage with an up or down arrow, or \"n/a\" when the previous period has no expenses. When no expense matches, the year-over-year chart shows the same \"no data for the selected filters\" message used by the other charts, and the cards show zero and \"n/a\". The cards sit in one row on desktop and stay compact on handheld devices. The feature is read-only and fully backward compatible. Out of scope: forecasts, averages across years, budget or target lines, per-category year-over-year, export, and a choice of chart type. Visual reference: docs/mockup (05-anno-su-anno, 03-kpi, 01-layout-completo, 07-mobile) and docs/mockup/report-mockup.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare the same months across years (Priority: P1)

In the **Grafici** tab the user sees a **year-over-year** line chart. The horizontal axis shows the twelve months from January to December; there is one line for every year that has expenses, each in its own color, with a legend listing the years. The exact amount of a month for a year is shown on hover (desktop) or tap (handheld). The current year's line stops at the current month: later months of the current year are not drawn, so a future month is never shown as zero spending.

**Why this priority**: This is the core of the feature. It answers "am I spending more or less than in previous years at the same time of year".

**Independent Test**: With expenses in at least two different years, open the tab and confirm the chart shows one line per year with expenses, a legend with those years, the current year ending at the current month, and the exact amount of any point on hover or tap.

**Acceptance Scenarios**:

1. **Given** expenses in 2024, 2025 and the current year, **When** the tab is shown, **Then** the chart has three lines, a legend with the three years, and the months January to December on the horizontal axis.
2. **Given** the current month is October, **When** the current year's line is drawn, **Then** it covers January to October and nothing is drawn for November and December.
3. **Given** a past year with expenses, **When** its line is drawn, **Then** it covers January to December, and a month with no expenses in that year has an amount of zero.
4. **Given** a point of a line, **When** the user hovers over it (desktop) or taps it (handheld), **Then** the exact amount and the year and month it belongs to are shown.
5. **Given** a year with no matching expenses at all, **When** the chart is shown, **Then** that year has no line and no legend entry.
6. **Given** each year in the legend, **When** the user looks at the line, **Then** the line and its legend entry use the same color, and a year keeps the same color while the filters change.

---

### User Story 2 - The chart ignores dates but follows the other filters (Priority: P1)

The year-over-year chart does **not** use the "from" and "to" dates of the shared filter bar: it always compares the whole years available. It does follow the **person**, **category**, **only recurring** and **only on debit** filters. A short note under the chart says that it is not affected by the date filter, so the user is not surprised when changing the dates leaves it unchanged.

**Why this priority**: Comparing years only makes sense over full years; the note avoids the impression of a broken filter. Without this rule the chart would contradict its own purpose.

**Independent Test**: Change the "from" and "to" dates and verify the chart does not change while the other charts do; then set a person, a category, and each of the two checkboxes and verify the chart recomputes each time. Confirm the note is visible under the chart.

**Acceptance Scenarios**:

1. **Given** the chart is shown, **When** the user changes only "from", only "to", or both, **Then** the year-over-year chart stays exactly the same.
2. **Given** a person selected in the filter bar, **When** the chart updates, **Then** every line counts only that person's expenses, for the whole years.
3. **Given** a category selected, **When** the chart updates, **Then** every line counts only that category's expenses.
4. **Given** "only recurring" or "only on debit" checked, **When** the chart updates, **Then** only the matching expenses are counted; with both checked, only expenses that are both.
5. **Given** the chart is shown, **When** the user looks under it, **Then** a short note states that the chart is not affected by the date filter.
6. **Given** a selection where "from" and "to" cover only a few days, **When** the chart is shown, **Then** it still compares the whole years.

---

### User Story 3 - See the key numbers of the period at a glance (Priority: P1)

Above the charts, below the filter bar, three summary cards show: the **total** spent in the period, the **monthly average**, and the **change compared with the previous period**. They are computed on the expenses that match **all** the filters of the bar, dates included.

- **Total**: sum of the matching expenses.
- **Monthly average**: the total divided by the number of months of the selected range, counting a partial month as one full month (for example 15 January to 3 March counts as 3 months).
- **Change vs previous period**: the previous period is the range of the same length that ends the day before the "from" date. The card shows the percentage change of the current total compared with the previous total, with an up arrow when spending increased and a down arrow when it decreased. When the previous period has no expenses it shows "n/a".

The previous period is evaluated with the same person, category, only recurring and only on debit filters as the current one; only the dates differ.

**Why this priority**: These numbers give the user the answer to "how much, how much per month, and better or worse than before" without reading any chart; they also depend on the shared dates, unlike the year-over-year chart.

**Independent Test**: Use a known set of expenses, set a date range, and check by hand that the total equals the sum of the matching expenses, the average equals total divided by months counted as described, and the change equals the percentage difference from the immediately preceding range of the same length.

**Acceptance Scenarios**:

1. **Given** default filters, **When** the tab is shown, **Then** three cards appear above the charts: total, monthly average and change vs previous period.
2. **Given** any combination of filters, **When** the filters change, **Then** the total equals the sum of the matching expenses and equals the total of the monthly trend chart for the same filters.
3. **Given** a range of exactly one full month, **When** the average is shown, **Then** it equals the total.
4. **Given** a range that touches three calendar months, even partially, **When** the average is shown, **Then** it equals the total divided by 3.
5. **Given** a previous period with expenses lower than the current ones, **When** the change is shown, **Then** it is a positive percentage with an up arrow; if higher, a negative percentage with a down arrow.
6. **Given** a previous period with no matching expenses, **When** the change is shown, **Then** the card shows "n/a" without an arrow.
7. **Given** a person or category filter, **When** the cards are computed, **Then** the previous period is computed with the same filter, not on all expenses.
8. **Given** the "from" date changes, **When** the cards update, **Then** the previous period is recomputed as the same-length range ending the day before the new "from".

---

### User Story 4 - Clear empty state (Priority: P2)

When no expense matches the filters of the bar, the year-over-year chart shows the same short "no data for the selected filters" message used by the other charts of the tab, with no lines or legend, and the three cards show zero for the total, zero for the average and "n/a" for the change.

**Why this priority**: The tab must never look broken; it is secondary to showing data when there is some.

**Independent Test**: Choose a filter combination with no expenses (for example a category the person never used) and confirm the message and the card values.

**Acceptance Scenarios**:

1. **Given** no expense matches the filters of the bar, **When** the chart area is shown, **Then** the year-over-year chart displays the same "no data" message as the other charts instead of an empty drawing.
2. **Given** no expense matches the filters of the bar, **When** the cards are shown, **Then** the total shows zero, the monthly average shows zero, and the change shows "n/a".
3. **Given** no expense matches the person, category and flag filters in any year, **When** the dates are changed, **Then** the empty state remains.
4. **Given** the date range has no expenses but other years or months do (with the same person, category and flags), **When** the tab is shown, **Then** the year-over-year chart still shows those years' lines, while the cards show zero, zero and "n/a" because they follow the dates.

---

### User Story 5 - Use the new elements comfortably on a handheld device (Priority: P2)

On desktop the three cards sit in a single row above the charts. On a narrow screen they stay compact and readable (side by side or tightly stacked as space allows), and the year-over-year chart takes the full width, with its legend readable and its points tappable, without horizontal page scrolling.

**Why this priority**: The app already has a dedicated handheld layout, so the new elements must not be desktop-only.

**Independent Test**: Open the tab on a phone-sized screen; confirm the cards are compact and fully readable, the chart fits the width, tapping a point shows its amount, and the page does not scroll horizontally.

**Acceptance Scenarios**:

1. **Given** a desktop-sized screen, **When** the tab is shown, **Then** the three cards are in one row above the charts.
2. **Given** a handheld-sized screen, **When** the tab is shown, **Then** the cards remain compact, their labels and values are fully readable, and nothing overflows the screen width.
3. **Given** a handheld-sized screen, **When** the chart is shown, **Then** it fits the width and its legend and note remain readable.
4. **Given** a handheld-sized screen, **When** the user taps a point, **Then** its exact amount is shown.

---

### Edge Cases

- Only one year of data exists: the chart shows a single line with a one-entry legend; the cards work as usual.
- Expenses exist only in the current year: the chart shows one line ending at the current month.
- A past year with gaps: months with no expenses count as zero and the line is drawn through them; the current year's line is never drawn beyond the current month.
- A year's data only in later months (for example expenses from August onward): the earlier months of that year have an amount of zero.
- The "from" date is after the "to" date: the cards and the chart follow the same rule as the other charts of the tab (nothing drawn for the inverted range and the same explanatory message shown by the tab); the year-over-year chart, which ignores dates, is not affected by an inverted range.
- A range inside a single month: the average equals the total (one month).
- A range crossing a year boundary (for example 1 December to 31 January): both calendar months are counted, so the average is the total divided by 2.
- A very long range (several years): the average counts every calendar month touched, and the previous period has the same length in days.
- The previous period starts before the first expense of the app: it is simply empty and the change shows "n/a".
- The previous period has expenses but the current one has none: the change is a decrease of 100% with a down arrow, not "n/a".
- The previous and current totals are equal: the change shows 0% with no up or down arrow.
- A previous total very small compared with the current one: the percentage may be very large; it is shown as a rounded whole percentage, not capped.
- The change percentage is shown rounded to a whole number; the total and average are shown in euros formatted like amounts elsewhere in the app.
- Leap years and months of different length: the previous period is computed on whole days, so its length in days always equals that of the selected range.
- A category or person no longer in the app lists: its expenses are still counted in the chart and in the cards.
- An expense with an empty category or person: it is still counted in the totals of the cards and chart, since totals must not drop expenses.
- Amounts with cents: summed correctly, with no visible rounding errors in the cards and in the point amounts.
- Many years of data: the legend stays readable and every year keeps its own color; colors may repeat only after the palette is exhausted.
- The user changes filters in quick succession: the chart and the cards always end up consistent with the final state of the filter bar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Grafici" tab MUST show a year-over-year line chart with the months January to December on the horizontal axis and one line per year that has matching expenses.
- **FR-002**: The chart MUST show a legend listing the years, each with the same color as its line, and a year MUST keep its color while filters change.
- **FR-003**: The exact amount of a month for a year MUST be visible on hover on desktop and on tap on handheld devices, together with the year and the month.
- **FR-004**: The line of the current year MUST stop at the current month; months after it MUST NOT be drawn. Months of past years with no expenses MUST count as zero.
- **FR-005**: The year-over-year chart MUST NOT use the "from" and "to" dates of the filter bar and MUST always cover all years available in the data.
- **FR-006**: The year-over-year chart MUST follow the person, category, only recurring and only on debit filters of the filter bar.
- **FR-007**: A short note under the chart MUST state that it is not affected by the date filter.
- **FR-008**: The tab MUST show, above the charts and below the filter bar, three summary cards: total of the period, monthly average, and change compared with the previous period.
- **FR-009**: The three cards MUST be computed on exactly the expenses matching all the filters of the bar, dates included, so the total equals the total of the monthly trend chart for the same filters.
- **FR-010**: The monthly average MUST be the total divided by the number of calendar months touched by the selected range, counting a partial month as one month.
- **FR-011**: The previous period MUST be the range of the same length in days that ends the day before the "from" date, evaluated with the same person, category, only recurring and only on debit filters.
- **FR-012**: The change card MUST show the percentage change of the current total over the previous total, rounded to a whole number, with an up arrow for an increase and a down arrow for a decrease, and no arrow when it is 0%.
- **FR-013**: The change card MUST show "n/a" when the previous period has no matching expenses.
- **FR-014**: When no expense matches the filters of the bar, the year-over-year chart MUST show the same "no data for the selected filters" message used by the other charts, and the cards MUST show zero for the total, zero for the average and "n/a" for the change.
- **FR-015**: When the date range has no matching expenses but the person, category and flag filters match expenses in other periods, the year-over-year chart MUST still be drawn while the cards show zero, zero and "n/a".
- **FR-016**: The cards MUST sit in a single row on desktop-sized screens and stay compact and readable on handheld-sized screens, and the chart MUST fit the screen width, with no horizontal page scrolling.
- **FR-017**: Amounts MUST be formatted in euros like elsewhere in the app, with cents summed correctly.
- **FR-018**: The feature MUST follow the existing look of the app and the layout of the reference mockups (05-anno-su-anno, 03-kpi, 01-layout-completo, 07-mobile), which are illustrative and not pixel-perfect.
- **FR-019**: The feature MUST be read-only: it MUST NOT write, modify, migrate or delete any data.
- **FR-020**: The feature MUST NOT change the expense data model, the database security rules, the backup tool, the other tabs, or the existing charts and their behavior.
- **FR-021**: The feature MUST NOT trigger additional reads of the database beyond what the app already performs.

### Key Entities

- **Expense** (existing): a record of money spent, with person, amount, date, place, category, notes and the optional recurring and debit flags. Only read; not changed.
- **Chart filters** (existing, transient): the shared selection of date range, person, category and the two flag checkboxes. The year-over-year chart ignores the dates; the cards use all of them.
- **Yearly series**: for one year, the twelve monthly totals (January to December), stopping at the current month for the current year, and its stable color.
- **Summary indicators**: the total of the period, the monthly average, and the change versus the previous period (a percentage with direction, or "n/a").
- **Previous period**: the range of the same length in days ending the day before the "from" date; it exists only to compute the change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user opening the tab sees the three cards and the year-over-year chart without touching any control.
- **SC-002**: For any combination of filters, the total on the first card equals the sum of the matching expenses and the total of the monthly trend chart for the same filters, in 100% of cases.
- **SC-003**: For a given selection of person, category and flags, changing only the dates never changes the year-over-year chart, in 100% of cases.
- **SC-004**: The monthly average and the change percentage match a manual calculation from the same expenses, in 100% of cases, including partial months, year boundaries and an empty previous period ("n/a").
- **SC-005**: The current year's line never extends beyond the current month and a year without matching expenses never appears, in 100% of cases.
- **SC-006**: Any point of the chart shows its exact amount on hover or tap, and a user can tell which year is which from the legend without guessing.
- **SC-007**: After any filter change, the chart and the cards are updated in under 1 second for a history of several thousand expenses.
- **SC-008**: 100% of pre-existing expenses remain unchanged after using the feature, and no data is written by any action on it.
- **SC-009**: On a handheld-sized screen, the cards, the chart, its legend and its note can be used without horizontal page scrolling.
- **SC-010**: The other tabs, the filter bar and the existing charts behave exactly as before this feature.

## Assumptions

- The tab, the shared filter bar, the monthly trend chart and the pie charts from parts 1 and 2 (specs 004 and 005) already exist and are reused unchanged; this feature only adds the three cards above the charts and the year-over-year chart below the existing ones.
- The app already loads all expenses at startup; the new elements work on that data with no new loading step.
- Labels follow the interface language of the tab (Italian), for example "Totale periodo", "Media mensile", "vs periodo prec." and "n/a"; this spec uses the English names.
- The default date range (1 January of the current year to today) is the one already defined for the tab; it is not changed by this feature.
- The number of months for the average is the number of distinct calendar months touched by the selected range, counting a partial month as one.
- The previous period has the same number of days as the selected range, both ends included, and ends the day before "from".
- The cards rely on the "from" and "to" dates always being set in the filter bar, as defined by the tab; the previous period is undefined, and therefore "n/a", if "from" is missing.
- A decrease is not treated as "good" or "bad" in color terms beyond what the mockup suggests (an increase of spending is highlighted in the warm accent color); the arrow and the sign carry the meaning.
- Percentages are shown rounded to whole numbers.
- The year-over-year line colors follow the existing look of the app; the oldest years use the more muted colors, as in the mockup.
- Out of scope: forecasts, averages across years, budget or target lines, per-category year-over-year, export, and a choice of chart type.
