# Feature Specification: Recurring Expenses

**Feature Branch**: `002-recurring-expenses`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Recurring expenses for the expense-tracker app. An expense can be marked as recurrent through an optional boolean flag \"recurrent\" (a checkbox in the add-expense form, and a way to turn the flag on or off for an existing expense in the history list, shown with a \"Recurrent\" badge). When the user logs in and the data is loaded, the app checks the current month: if it already contains at least one recurrent expense, it does nothing. If it contains none, it looks at the previous month and copies every recurrent expense found there into the current month; if the previous month has no recurrent expenses, nothing is copied. A copy keeps person, amount, place, category, notes and the recurrent flag; its date is the same day of the month as the original, or the last day of the month when the original day does not exist. Copies are normal expenses. If the user removes the flag from a copy in the current month, that expense is no longer copied the following month. The check runs once per session, reads only the data of the previous and of the current month, and running it twice must never create duplicates. Fully backward compatible; no new database node. Known accepted limits documented as assumptions."

## Clarifications

### Session 2026-10-05

- Q: How should the recurrent state be shown and toggled in the history list without taking extra space? → A: A single compact indicator (a recurring-arrows icon, filled when recurrent, outline when not, with a "Recurrent" tooltip) in its own narrow column, which is also the on/off toggle. No text badge, nothing in the Category column, and the Actions column keeps only "Delete".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mark an expense as recurrent (Priority: P1)

A user records an expense that repeats every month (rent, subscription, insurance). When adding it, they tick a "Recurrent" checkbox. In the history list the expense shows a compact recurrent indicator.

**Why this priority**: Without the flag there is nothing to copy; it is the foundation of the feature and is useful on its own as a visual marker.

**Independent Test**: Add an expense with the checkbox ticked and verify the indicator shows the recurrent state in the history list; add one without ticking and verify it shows the non-recurrent state.

**Acceptance Scenarios**:

1. **Given** the add-expense form, **When** the user ticks "Recurrent" and saves, **Then** the expense is saved as recurrent and shows the recurrent indicator in its on state in the history list.
2. **Given** the add-expense form, **When** the user saves without ticking it, **Then** the expense is not recurrent and the indicator shows the off state.

---

### User Story 2 - Toggle the flag on an existing expense (Priority: P1)

A user realises an already-recorded expense is (or is no longer) recurrent. From the history list they turn the flag on or off for that expense.

**Why this priority**: Needed to flag existing data and to stop a recurring expense from being copied further.

**Independent Test**: Toggle the flag on an existing expense, verify the indicator switches between on and off and persists after reloading the app.

**Acceptance Scenarios**:

1. **Given** a non-recurrent expense in the list, **When** the user turns the flag on, **Then** the indicator shows the on state and the change persists.
2. **Given** a recurrent expense, **When** the user turns the flag off, **Then** the indicator shows the off state and the change persists.

---

### User Story 3 - Automatic monthly copy on login (Priority: P1)

When the user logs in and data is loaded, the app makes sure the current month contains the recurrent expenses of the previous month. If the current month already has at least one recurrent expense, nothing happens. Otherwise every recurrent expense of the previous month is copied into the current month.

**Why this priority**: This is the core value: the user no longer re-enters monthly expenses by hand.

**Independent Test**: With recurrent expenses in the previous month and none in the current one, log in and verify copies appear in the current month with the expected dates and fields.

**Acceptance Scenarios**:

1. **Given** the previous month has recurrent expenses and the current month has none, **When** the user logs in, **Then** each is copied into the current month keeping person, amount, place, category, notes and the recurrent flag.
2. **Given** the current month already has at least one recurrent expense, **When** the user logs in, **Then** nothing is copied.
3. **Given** the previous month has no recurrent expenses, **When** the user logs in, **Then** nothing is copied.
4. **Given** an original dated the 31st and a current month with fewer days, **When** copied, **Then** the copy is dated the last day of the current month.
5. **Given** the check already ran in this session, **When** it is triggered again, **Then** no duplicate expenses are created.

---

### User Story 4 - Copies are normal expenses (Priority: P2)

A user edits, deletes or unflags a copied expense like any other. Unflagging a copy in the current month means it will not be copied the following month.

**Why this priority**: Gives the user control over what recurs; relies on the previous stories.

**Independent Test**: Unflag a copy, then simulate the next month's check and verify it is not copied.

**Acceptance Scenarios**:

1. **Given** a copied expense, **When** the user edits its amount, **Then** only that copy changes and the original is untouched.
2. **Given** a copy whose flag is removed, **When** the next month's check runs, **Then** that expense is not copied.
3. **Given** a copied expense, **When** the user deletes it, **Then** it is removed like any other expense.

---

### User Story 5 - Existing data keeps working (Priority: P1)

Users with years of existing expenses see no change: expenses without the flag are simply not recurrent, and no existing record is modified, migrated or lost.

**Why this priority**: Data safety is a hard constraint.

**Independent Test**: Load a dataset created before this feature; verify all expenses display as before, with the indicator off, and none is altered.

**Acceptance Scenarios**:

1. **Given** expenses created before this feature, **When** the app loads, **Then** they appear unchanged and non-recurrent.
2. **Given** such data, **When** the monthly check runs, **Then** no existing expense is modified or deleted.

---

### Edge Cases

- Original day does not exist in the current month (29th–31st): the copy uses the last day of the month.
- Current month already contains a recurrent expense (e.g. added manually): no copy occurs, even if the previous month had more.
- Previous month has no recurrent expenses: nothing is copied.
- Check triggered more than once in the same session, or after a reload within the same month: no duplicates (the current month then already contains recurrent expenses).
- Year boundary: in January the previous month is December of the prior year.
- Copy interrupted partway (e.g. connection lost): the list stays usable, and a later check retries without duplicating copies already created.
- Copies carry the recurrent flag, so they recur again the next month unless unflagged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Expenses MUST support an optional "recurrent" flag; expenses without it are treated as not recurrent.
- **FR-002**: The add-expense form MUST offer a "Recurrent" checkbox, unticked by default.
- **FR-003**: Users MUST be able to turn the flag on or off for an existing expense from the history list.
- **FR-004**: The history list MUST show each expense's recurrent state through a single compact indicator (icon, filled when recurrent, outline when not, with a "Recurrent" tooltip) in its own narrow column; the indicator is also the on/off toggle (FR-003).
- **FR-016**: The history list MUST NOT show recurrent text badges or extra recurrent controls in the Category or Actions columns; the Category column shows the category only and the Actions column keeps only the delete action.
- **FR-005**: After login and data load, the system MUST check the current month and do nothing if it contains at least one recurrent expense.
- **FR-006**: If the current month has no recurrent expenses, the system MUST copy every recurrent expense of the previous month into the current month; if there are none, it MUST copy nothing.
- **FR-007**: A copy MUST keep person, amount, place, category, notes and the recurrent flag.
- **FR-008**: A copy's date MUST be the same day of the month as the original, or the last day of the current month if that day does not exist.
- **FR-009**: Copies MUST be normal expenses that can be edited, unflagged or deleted independently of the original.
- **FR-010**: An expense unflagged in the current month MUST NOT be copied the following month.
- **FR-011**: The check MUST run at most once per session.
- **FR-012**: The check MUST read only the previous and current month's data, never the whole history.
- **FR-013**: Running the check more than once MUST NOT create duplicate expenses.
- **FR-014**: Existing expenses MUST NOT be modified, migrated or lost by this feature, and no new storage area is introduced.
- **FR-015**: Copied expenses MUST appear in the current month's list without any manual action.

### Key Entities

- **Expense**: A recorded spending item with person, amount, date, place, category, notes and an optional recurrent flag (absent means not recurrent).
- **Month**: The set of expenses whose date falls within one calendar month; the unit read by the monthly check.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can mark an expense as recurrent while adding it with no extra steps beyond ticking one checkbox.
- **SC-002**: 100% of recurrent expenses from the previous month appear in the current month after login when the current month had none, with all copied fields and correct dates.
- **SC-003**: Zero duplicate expenses are created across repeated logins or repeated checks within a month.
- **SC-004**: Time from login to a ready list does not noticeably increase and does not grow with the amount of historical data (same with 1 month or 10 years of data).
- **SC-005**: 100% of pre-existing expenses are unchanged and displayed as non-recurrent after the feature is released.
- **SC-006**: A user can turn the flag on or off on an existing expense in a single action from the history list.
- **SC-007**: Compared with the history list before this feature, rows are not taller and the Category and Actions columns are not wider; the recurrent state adds only one narrow column.

## Assumptions

- The user is authenticated and the app's expense data is loaded before the check runs.
- "Current month" and "previous month" are calendar months based on the user's local date.
- Known accepted limit: if the app is not opened for a whole month, nothing is copied the next month (only the immediately previous month is examined).
- Known accepted limit: if all recurrent expenses are removed from the current month, they are copied again at the next login of the same month.
- Backfilling older months, reminders, and editing a series of expenses at once are out of scope.
- Copies are not linked to their originals; later changes to an original do not propagate.
