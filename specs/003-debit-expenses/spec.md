# Feature Specification: Debit Expenses

**Feature Branch**: `003-debit-expenses`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Debit expenses for the expense-tracker app. An expense can be marked as on debit (still owed) through an optional boolean flag, set from a Debit checkbox in the add-expense form, filterable in the history tab, and untickable/tickable on every expense in the history (table and handheld card layouts). Fully backward compatible: existing data is never modified, migrated or lost."

## Clarifications

### Session 2026-10-17

- Q: In the history list, should a debit expense also show a "Debit" badge in the category column? → A: No. In the table layout the on/off euro symbol is the only indicator; in the card layout (handheld) the euro widget/button is the only indicator. No badge next to the category in either layout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mark an expense as on debit when logging it (Priority: P1)

When adding an expense, the user can tick a "Debit" checkbox to record that the amount is still owed. If left unticked, the expense is saved exactly as today.

**Why this priority**: Without a way to create debit expenses, nothing else in the feature has value.

**Independent Test**: Add one expense with "Debit" ticked and one without; the first is stored as on debit, the second is stored exactly as before.

**Acceptance Scenarios**:

1. **Given** the add-expense form, **When** the user ticks "Debit" and saves, **Then** the expense is saved as on debit and appears in the history marked as on debit through the euro control (switched on).
2. **Given** the add-expense form, **When** the user saves without ticking "Debit", **Then** the expense is saved with no debit information at all, identical to an expense created before this feature.
3. **Given** the "Debit" checkbox, **When** the form is opened or reset, **Then** the checkbox is unticked by default.

---

### User Story 2 - Settle or re-open a debit from the history (Priority: P1)

In the history tab (Storico), on every expense, the user can untick the debit flag when the debt has been settled and tick it again if needed. The control is available both in the table layout and in the card layout used on handheld devices. An expense on debit is clearly recognizable through the euro control itself, shown switched on: the on/off euro symbol in the table layout, the euro widget in the card layout. No separate badge is shown next to the category.

**Why this priority**: Settling the debt is the core purpose of tracking it.

**Independent Test**: Open the history, untick the flag on a debit expense in both layouts, then tick it again; the euro control state and the stored state follow each change.

**Acceptance Scenarios**:

1. **Given** an expense on debit in the history, **When** the user unticks the flag, **Then** the euro control switches off, the expense stays in the history with the same amount, and all totals are unchanged.
2. **Given** an expense not on debit (including any pre-existing expense), **When** the user ticks the flag, **Then** it becomes on debit and the euro control shows switched on.
3. **Given** a handheld device, **When** the user views the history as cards, **Then** the euro widget is available on every card and shows whether the expense is on debit.
4. **Given** a debit expense that was settled, **When** its stored data is inspected, **Then** it is indistinguishable from an expense that never had the debit field.

---

### User Story 3 - Filter the history by debit status (Priority: P2)

In the history tab a new "Debit" filter sits next to the month, year, person and category filters with three values: All (default), On debit, Not on debit. It combines with the other filters, narrows the expenses already shown for the selected period, and returns the list to the first page when changed.

**Why this priority**: Makes it easy to see what is still owed, but depends on stories 1 and 2.

**Independent Test**: With a mix of debit and non-debit expenses, switch the filter through its three values and confirm the list changes accordingly, alone and combined with other filters.

**Acceptance Scenarios**:

1. **Given** the filter on All, **When** the history is shown, **Then** it is identical to the history before this feature.
2. **Given** a selected period, **When** the user selects "On debit", **Then** only expenses of that period with the flag are shown.
3. **Given** a selected period, **When** the user selects "Not on debit", **Then** only expenses of that period without the flag are shown, including all pre-existing expenses.
4. **Given** the user is on a later page of the list, **When** the debit filter is changed, **Then** the list returns to the first page.
5. **Given** person and category filters are set, **When** the debit filter is changed, **Then** all filters apply together.
6. **Given** the filter is "On debit", **When** the user unticks an expense's flag, **Then** that expense leaves the filtered list.

---

### Edge Cases

- A user with only pre-existing data opens the app: nothing is written or changed; every expense counts as not on debit and the default history looks the same as before.
- Ticking and then unticking the flag on a pre-existing expense leaves it identical to the original.
- The debit filter combined with other filters yields no results: the usual empty-list state is shown.
- A recurring-expense copy generated from a debit expense is not on debit.
- Totals and summaries never change when the flag is ticked or unticked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The add-expense form MUST offer a "Debit" checkbox, unticked by default.
- **FR-002**: An expense MUST be recorded as on debit only when the checkbox is ticked; otherwise no debit information is stored.
- **FR-003**: The history MUST provide a "Debit" filter beside month, year, person and category, with values All (default), On debit and Not on debit.
- **FR-004**: The debit filter MUST combine with the existing filters, narrow the expenses of the selected period, and reset the list to the first page when changed.
- **FR-005**: With the filter on All, the history MUST be identical to the current behaviour.
- **FR-006**: Every expense in the history MUST offer a control to untick or tick the debit flag, in both the table layout and the handheld card layout.
- **FR-007**: An expense on debit MUST be clearly recognizable in the history in both layouts through the euro control (on/off symbol in the table, euro widget in the cards); the category column and the category label of the card MUST NOT show any additional debit badge.
- **FR-008**: Unticking the flag MUST only clear the flag; the expense stays with the same amount and counts in all totals exactly as before. Ticking MUST likewise not affect totals.
- **FR-009**: The flag MUST be stored only when true and removed when cleared, so a settled expense is indistinguishable from one that never had it.
- **FR-010**: Expenses without the debit information MUST be treated as not on debit.
- **FR-011**: Existing data MUST NOT be modified, migrated, backfilled or lost, and no write MUST be made to an existing expense unless the user explicitly ticks or unticks its flag.
- **FR-012**: The optional debit flag MUST be the only addition to the data model; no new storage area is introduced.
- **FR-013**: The debit flag MUST be independent of the recurrent flag; a copy generated by the recurring-expenses rule MUST NOT inherit the debit flag.

### Key Entities

- **Expense**: An existing record of money spent. Gains one optional attribute, "debit" (true = still owed). Absence means not on debit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log an expense on debit with a single extra click on the add form.
- **SC-002**: A user can settle (or re-open) a debit in one click from the history, on both desktop and handheld layouts.
- **SC-003**: 100% of expenses that existed before the feature remain unchanged after using it, and appear as not on debit.
- **SC-004**: With the filter on All, the history shows exactly the same expenses and totals as before the feature, in 100% of cases.
- **SC-005**: Ticking or unticking the flag changes no total or amount in any view.
- **SC-006**: Switching the debit filter updates the list immediately and always returns to the first page.

## Assumptions

- Debit and the existing "recurrent" flag are independent; a copy generated by the recurring-expenses rule does not inherit the debit flag.
- Any user who can see an expense in the history can tick or untick its flag.
- The debit filter value is not remembered between sessions; it starts on All.
- The exact look of the on/off euro control is a design choice, provided the on and off states are clearly distinguishable.
- Out of scope: debtor or creditor names, partial payments, settlement dates, debt totals or reports, notifications.
