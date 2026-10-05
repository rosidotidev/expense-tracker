# Feature Specification: Firebase Data Backup

**Feature Branch**: `001-firebase-data-backup` (no branch created; no git hook registered)

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Standalone command-line utility to back up the data of the expense-tracker app. It reads all the user's data (expenses, categories, people, under users/{uid}) from Firebase Realtime Database and saves it in a single local JSON file in the backup/ folder (to be created if missing). The file name must be bckp-YYYYMMDD-Version.json, where YYYYMMDD is today's date and Version is a progressive number that starts at 1 and increases if a backup already exists on the same day, so that no existing backup is ever overwritten. The JSON must reproduce the original structure of the Firebase tree, so that it can be re-imported. The utility is independent of the Angular app: it is launched with a single command, prints on screen the path of the created file and the number of expenses, categories and people saved, and exits with a clear error if authentication fails, if credentials are missing, or if there is no data."

## Clarifications

### Session 2026-10-03

- Q: What should the top level of the backup JSON look like? → A: Full path from the database root: `{"users": {"<uid>": {"expenses": ..., "categories": ..., "people": ...}}}`
- Q: When does a backup count as "no data" and fail? → A: Only when expenses, categories and people are all empty
- Q: Must a failed write leave no partial file in `backup/`? → A: Yes: only a complete file ever gets its final name, and anything partial is cleaned up on any failure
- Q: Where may the credentials come from? → A: Environment variables, plus a git-ignored `.env` file stored in the utility's own folder (`tools/backup/.env`) as a fallback (environment variables take priority)
- Q: Should the printed summary show which account was backed up? → A: Yes: also print the account's email

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a local backup of my data (Priority: P1)

The app owner runs a single command and gets a complete, dated JSON copy of all their expense-tracker data (expenses, categories, people) saved in the local `backup/` folder, with a summary printed on screen.

**Why this priority**: This is the whole purpose of the feature: protecting the user's data against loss, with no dependency on the app being running.

**Independent Test**: With valid credentials and an account that has data, run the command. A new file appears in `backup/`, and the screen shows its path and the counts of expenses, categories and people, which match the data in the database.

**Acceptance Scenarios**:

1. **Given** valid credentials and an account with expenses, categories and people, **When** the user runs the backup command, **Then** a single JSON file named `bckp-YYYYMMDD-1.json` (today's date) is created in `backup/` and the path, the account email and the counts of expenses, categories and people are printed.
2. **Given** the `backup/` folder does not exist, **When** the user runs the command, **Then** the folder is created and the backup is saved in it.
3. **Given** the backup was created, **When** the file is inspected, **Then** its top level is `users`, then the user's `uid`, then `expenses`, `categories`, `people`, with the same keys and values as the database, so it can be re-imported at the database root as is.

---

### User Story 2 - Never overwrite an existing backup (Priority: P1)

If one or more backups were already made today, a new run creates a new file with the next progressive number instead of replacing anything.

**Why this priority**: Overwriting a backup would defeat its purpose; this guarantee is a core safety property.

**Independent Test**: Run the command twice on the same day. Two files exist (`...-1.json`, `...-2.json`) with the first unchanged.

**Acceptance Scenarios**:

1. **Given** `bckp-20261003-1.json` already exists, **When** the user runs the command on the same day, **Then** `bckp-20261003-2.json` is created and the existing file is untouched.
2. **Given** only backups from previous days exist, **When** the user runs the command, **Then** the new file starts again at `-1` for the current date.
3. **Given** `-1` and `-3` exist for today (gap in numbering), **When** the user runs the command, **Then** the new file uses `-4`, a number greater than the highest existing one.

---

### User Story 3 - Clear failures without side effects (Priority: P2)

When the backup cannot be completed, the user gets an understandable error message and a failure exit status, and no partial or empty backup file is left behind.

**Why this priority**: Users must be able to trust that a file in `backup/` is a valid backup, and quickly understand how to fix the problem.

**Independent Test**: Run the command with missing credentials, wrong credentials, and an account with no data; each ends with a distinct clear message, a failure exit status and no new file.

**Acceptance Scenarios**:

1. **Given** the credentials are not provided, **When** the user runs the command, **Then** the message names which credentials are missing and that they can be provided via environment variables or the `.env` file in the utility's folder (`tools/backup/.env`), and the command fails without contacting the database.
2. **Given** the credentials are wrong, **When** the user runs the command, **Then** a message states that authentication failed and the command fails without creating any file.
3. **Given** authentication succeeds but expenses, categories and people are all empty, **When** the user runs the command, **Then** a message states that there is no data to back up, the command fails, and no file is created.

---

### Edge Cases

- Only some of the three data groups exist (e.g. expenses but no people): the backup is still created, the missing group is counted as 0 and is not invented in the file.
- Network unavailable or database unreachable: a clear error is shown and no file is created.
- The destination folder cannot be written to, or writing fails midway (e.g. disk full): a clear error is shown, the command fails and no partial file remains.
- Two runs started at the same moment must not produce the same file name.
- Backup spanning midnight: the date used is the one at the time the file is created.
- Large data sets: the backup remains a single file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The utility MUST be launched with a single command and MUST work without the web app running or being built.
- **FR-002**: The utility MUST authenticate as the app user using credentials supplied from outside the code and the repository: environment variables, or a git-ignored `.env` file stored in the utility's own folder (`tools/backup/.env`, found regardless of the directory the command is launched from) as a fallback. If both provide a value, the environment variable MUST take priority. The utility MUST NOT prompt interactively.
- **FR-003**: The utility MUST read all of the authenticated user's data: expenses, categories and people.
- **FR-004**: The utility MUST save the data in a single JSON file inside the `backup/` folder, creating the folder if it does not exist.
- **FR-005**: The file name MUST be `bckp-YYYYMMDD-Version.json`, where `YYYYMMDD` is the current date and `Version` is an integer starting at 1.
- **FR-006**: `Version` MUST be one greater than the highest existing version for the same date, so an existing backup is never overwritten.
- **FR-007**: The JSON content MUST reproduce the original structure and values of the user's data, with the full path from the database root (`{"users": {"<uid>": {"expenses": ..., "categories": ..., "people": ...}}}`), so that it can be re-imported at the database root without transformation. The file MUST NOT contain any extra metadata fields.
- **FR-008**: On success the utility MUST print the path of the created file, the email of the account that was backed up, and the number of expenses, categories and people saved, and exit with a success status.
- **FR-009**: If credentials are missing, the utility MUST fail with a message naming the missing items, before any network access.
- **FR-010**: If authentication fails, the utility MUST fail with a clear authentication error.
- **FR-011**: If expenses, categories and people are all empty (no data to back up), the utility MUST fail with a clear message. If at least one of the three groups has data, the backup MUST be created.
- **FR-012**: On every failure, including a failure while writing the file (e.g. disk full), the utility MUST exit with a non-zero status and MUST NOT leave a new or partial backup file in `backup/`: only a complete file may ever carry its final `bckp-...` name, and any temporary or partial file MUST be removed.
- **FR-013**: The utility MUST NOT modify or delete any data in the database or any existing backup file.
- **FR-014**: The utility MUST NOT depend on the Angular application code, and its pure logic (file naming/versioning, counting) MUST be covered by automated tests, per the project constitution.

### Key Entities *(include if feature involves data)*

- **Backup file**: A single JSON file for one run, identified by date and version number, containing the user's complete data under its original database path (`users/<uid>/...`).
- **Expense**: A recorded expense of the user (who, amount, date, where, category, notes, owner, creation time), stored with its original key.
- **Category**: A named expense category, stored with its original key.
- **Person**: A named person to whom expenses are attributed, stored with its original key.
- **Backup summary**: The on-screen result: file path, account email, and counts of expenses, categories and people.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can obtain a complete backup with one command, in under 1 minute for a typical personal data set (up to 10,000 expenses).
- **SC-002**: 100% of the expenses, categories and people present at the time of the run are in the backup, and the counts printed match the counts in the file.
- **SC-003**: Across repeated runs in the same day, no existing backup file is ever altered or replaced (0 overwrites).
- **SC-004**: 100% of failure cases (missing credentials, failed authentication, no data) end with a distinct, understandable message and a failure status, and leave no new file in `backup/`.
- **SC-005**: The backup file is structurally identical to the original data tree, so a re-import requires no conversion.

## Assumptions

- The user to back up is the one identified by the supplied credentials; backing up several users at once is out of scope.
- `Version` is a daily progressive counter (not an app or schema version).
- The date in the file name is the local date of the machine running the utility.
- The database allows each user to read only their own data, so only that user's data is backed up.
- Restoring/importing a backup is out of scope; only the backup format must be re-importable.
- Automatic scheduling, rotation or deletion of old backups, compression and encryption are out of scope.
- Backup files contain personal data and are kept out of version control, as required by the project constitution.
- The existing data model documented in `docs/datamodel-firebase.md` is the reference for the structure.
