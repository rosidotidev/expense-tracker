---

description: "Task list for Firebase Data Backup"
---

# Tasks: Firebase Data Backup

**Input**: Design documents from `/specs/001-firebase-data-backup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: Included. The constitution (Principle V) and the plan require automated tests for the pure logic, so test tasks come first and MUST fail before the code they cover is written.

**Organization**: Tasks are grouped by user story. Paths are relative to the repository root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tool folder, scripts, dependencies, and git-ignore rules

- [X] T001 Add devDependencies `tsx`, `vitest` and `@types/node` (run `npm install -D tsx vitest @types/node`) and add scripts `"backup": "tsx tools/backup/backup.ts"` and `"test:backup": "vitest run --dir tools/backup"` to package.json
- [X] T002 [P] Create tools/backup/tsconfig.json with `"strict": true`, `"module": "nodenext"`, `"moduleResolution": "nodenext"`, `"target": "ES2022"`, `"noEmit": true`, `"types": ["node"]`, including only `./**/*.ts`, and with no reference to `src/` or Angular
- [X] T003 [P] Add the lines `/backup/` and `.env` (under the "Firebase / secrets" section) to .gitignore
- [X] T004 [P] Create tools/backup/.env.example listing `BACKUP_EMAIL=`, `BACKUP_PASSWORD=`, `FIREBASE_API_KEY=`, `FIREBASE_DATABASE_URL=` with no values

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure logic every story needs: configuration validation and backup file naming

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Write failing tests in tools/backup/tests/config.test.ts for `readConfig(env)`: returns `{ email, password, apiKey, databaseUrl }` when all four of `BACKUP_EMAIL`, `BACKUP_PASSWORD`, `FIREBASE_API_KEY`, `FIREBASE_DATABASE_URL` are set; "A value is missing if it is unset or empty after trimming"; returns the list of ALL missing names (not just the first); never includes values in the missing list
- [X] T006 [P] Write failing tests in tools/backup/tests/naming.test.ts for `nextBackupFileName(date, existingNames)`: no existing files gives `bckp-YYYYMMDD-1.json`; with `-1` gives `-2`; with `-1` and `-3` gives `-4` (highest plus one); files of other dates and names not matching `^bckp-YYYYMMDD-(\d+)\.json$` (e.g. temp files, `notes.txt`) are ignored; month and day are zero-padded (e.g. `20260305`); the date used is the local date of the `date` argument
- [X] T007 [P] Implement `readConfig` and the `Config` type in tools/backup/config.ts (pure, no I/O) so T005 passes; also export a `formatMissingMessage(names)` returning `Error: missing <NAME1>, <NAME2>. Set them as environment variables or in tools/backup/.env.`
- [X] T008 [P] Implement `nextBackupFileName` in tools/backup/naming.ts (pure, no I/O) so T006 passes

**Checkpoint**: `npm run test:backup` passes for config and naming; foundation ready

---

## Phase 3: User Story 1 - Create a local backup of my data (Priority: P1) MVP

**Goal**: One command logs in, reads the user's data, and writes `backup/bckp-YYYYMMDD-N.json` with the root-path structure, printing path, account email and counts.

**Independent Test**: With valid credentials and an account with data, `npm run backup` creates the file, prints path, email and the three counts, and the file top level is `users` -> `<uid>` -> `expenses`/`categories`/`people` (quickstart scenarios 1 and 4).

### Tests for User Story 1

> Write these tests FIRST and confirm they FAIL before implementation

- [X] T009 [P] [US1] Write failing tests in tools/backup/tests/summary.test.ts for `countGroups(userData)` ("Number of keys under `expenses`/`categories`/`people`, 0 if absent") and `buildBackupDocument(uid, userData)` returning exactly `{ users: { [uid]: userData } }` with no extra metadata fields and an absent group staying absent (not replaced by `{}`); `formatSummary(path, email, counts)` producing the five lines `Backup created: <path>`, `Account: <email>`, `Expenses: <n>`, `Categories: <n>`, `People: <n>`

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement `countGroups`, `buildBackupDocument` and `formatSummary` in tools/backup/summary.ts (pure) so T009 passes
- [X] T011 [P] [US1] Implement `fetchUserData(config)` in tools/backup/firebase.ts using `firebase/app`, `firebase/auth` and `firebase/database`: `initializeApp({ apiKey, databaseURL })`, `signInWithEmailAndPassword`, one `get(ref(db, "users/" + uid))` with the uid from the signed-in user, returning `{ uid, email, data }`; always call `deleteApp` in a `finally` so the process exits promptly; read-only, no `set`/`update`/`remove` calls
- [X] T012 [P] [US1] Implement `writeBackup(dir, content)` in tools/backup/storage.ts: create `backup/` if missing (`mkdir` recursive), list existing names, pick the name with `nextBackupFileName`, write the JSON string with `node:fs` using flag `wx`, return the final relative path
- [X] T013 [US1] Implement the entry point tools/backup/backup.ts (depends on T007, T008, T010, T011, T012): try `process.loadEnvFile(join(__dirname, '.env'))` so the file tools/backup/.env is found from any working directory (ignore a missing `.env`), call `readConfig(process.env)`, `fetchUserData`, `buildBackupDocument`, serialize with `JSON.stringify(doc, null, 2)`, `writeBackup`, then print `formatSummary(...)` to stdout; any thrown error prints one `Error: ...` line to stderr and sets exit code 1 (full error messages are finished in US3)
- [ ] T014 [US1] Run `npm run test:backup` and `npx tsc --noEmit -p tools/backup`, then run quickstart scenarios 1 and 4 against the real account; fix any failure — automated part done (tests, tsc, missing-credentials run); real-account run pending (needs your credentials)

**Checkpoint**: User Story 1 works on its own and is the MVP

---

## Phase 4: User Story 2 - Never overwrite an existing backup (Priority: P1)

**Goal**: Repeated or concurrent runs on the same day always create a new numbered file; an existing backup is never replaced, and the final name only ever holds complete content.

**Independent Test**: Run the command twice on the same day: `-1` and `-2` exist and `-1` is unchanged; delete `-1` and run again: the new file is `-3` (quickstart scenarios 2 and 3).

### Tests for User Story 2

> Write these tests FIRST and confirm they FAIL before implementation

- [X] T015 [US2] Write failing tests in tools/backup/tests/storage.test.ts using a temporary directory from `node:os` `mkdtemp` (removed after each test): two consecutive `writeBackup` calls on the same date create `-1` then `-2` and the first file content is unchanged; a pre-existing `-1` and `-3` leads to `-4`; if the chosen final name appears between the listing and the copy (simulate by pre-creating it through an injectable hook or a second call), the write retries with the next version and the existing file is untouched; after a successful write no temp file remains in the directory

### Implementation for User Story 2

- [X] T016 [US2] Rework `writeBackup` in tools/backup/storage.ts so T015 passes: write the content to a temp file in `backup/` whose name does not match `^bckp-YYYYMMDD-(\d+)\.json$`, then `copyFile` it to the final name with `fs.constants.COPYFILE_EXCL`, then delete the temp file; if the copy fails with `EEXIST`, recompute the version and retry (at most 5 attempts, then fail with a clear error); never use plain overwrite or `rename` onto the final name
- [ ] T017 [US2] Run `npm run test:backup` and quickstart scenarios 2 and 3; fix any failure — pending: needs the real account

**Checkpoint**: User Stories 1 and 2 both work

---

## Phase 5: User Story 3 - Clear failures without side effects (Priority: P2)

**Goal**: Missing credentials, failed authentication, no data, unreachable database and write failures each end with a distinct one-line message, exit code 1, and no new or partial file in `backup/`.

**Independent Test**: Quickstart scenarios 5, 6 and 7: each failure shows its message from contracts/cli.md, exits with code 1, and leaves no new file.

### Tests for User Story 3

> Write these tests FIRST and confirm they FAIL before implementation

- [X] T018 [P] [US3] Add failing tests to tools/backup/tests/summary.test.ts for `hasData(userData)`: false for `null`, `{}`, and for all three groups absent or empty; true if at least one of expenses, categories or people has data (e.g. only people), per "no data" meaning all three empty
- [X] T019 [P] [US3] Add failing tests to tools/backup/tests/storage.test.ts: when writing fails (e.g. the destination path is a file, or the copy throws a non-`EEXIST` error) no temp file and no `bckp-*.json` file is left behind
- [X] T020 [P] [US3] Write failing tests in tools/backup/tests/errors.test.ts for `describeError(error)`: Firebase auth codes `auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-email` map to `Error: authentication failed. Check BACKUP_EMAIL and BACKUP_PASSWORD.`; other errors map to `Error: could not read data: <reason>.`; write errors map to `Error: could not write backup: <reason>.`; the password and API key never appear in any message

### Implementation for User Story 3

- [X] T021 [P] [US3] Implement `hasData` in tools/backup/summary.ts so T018 passes
- [X] T022 [P] [US3] Implement `describeError` and the small error classes it needs (auth failure, read failure, write failure) in tools/backup/errors.ts so T020 passes
- [X] T023 [US3] Update tools/backup/storage.ts so T019 passes: delete the temp file in a `finally`/error path and never leave a partial file, wrapping failures as write errors
- [X] T024 [US3] Update tools/backup/firebase.ts to throw the auth and read error types from tools/backup/errors.ts (sign-in errors as auth failure, `get()` errors as read failure) — done in backup.ts instead: errors are classified by stage there, so firebase.ts needed no change
- [X] T025 [US3] Update tools/backup/backup.ts: if `readConfig` reports missing names print `formatMissingMessage` and exit 1 BEFORE any network access; after the read, if `hasData` is false print `Error: no data to back up for <email>.` and exit 1 without writing; route every other failure through `describeError`; always exit with code 1 on failure and 0 on success
- [ ] T026 [US3] Run `npm run test:backup` and quickstart scenarios 5, 6, 7 and 8; confirm exit codes with `$LASTEXITCODE` and that `backup/` has no new file after each failure; fix any failure — scenario 5 verified; 6, 7 and 8 pending: need the real account

**Checkpoint**: All three user stories work

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final checks that span all stories

- [X] T027 Run `npx tsc --noEmit -p tools/backup` and confirm strict-mode type checking passes with no `any`, `@ts-ignore` or `@ts-nocheck`
- [X] T028 [P] Confirm tools/backup contains no import from `src/` or `@angular/*` (search the folder) and that `git status` shows neither `.env` nor `backup/` as untracked or modified
- [X] T029 [P] Add a short "Backup" section to README.md describing `npm run backup`, the four `.env` variables, and `npm run test:backup`, linking to specs/001-firebase-data-backup/quickstart.md
- [ ] T030 Run the full quickstart.md validation (all 8 scenarios) and `npm run test:backup` one last time, and confirm `npm run build` still succeeds — build and unit tests pass; quickstart scenarios 1-4, 6-8 pending: need the real account

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T002, T003, T004 can run alongside T001 (T001 changes package.json only).
- **Foundational (Phase 2)**: Depends on Setup (needs Vitest and tsconfig). Blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational.
- **User Story 2 (Phase 4)**: Depends on User Story 1, because it reworks `writeBackup` in tools/backup/storage.ts.
- **User Story 3 (Phase 5)**: Depends on User Stories 1 and 2, because it edits storage.ts, firebase.ts and backup.ts.
- **Polish (Phase 6)**: Depends on all stories.

### Within Each User Story

- Tests MUST be written and FAIL before the implementation they cover
- Pure logic before I/O, I/O before the entry point
- Tasks touching the same file (storage.ts, backup.ts, firebase.ts, summary.ts, storage.test.ts) are not marked [P] against each other

### Parallel Opportunities

- Setup: T002, T003, T004
- Foundational: T005, T006, T007, T008 (T007 after T005, T008 after T006, but the two pairs are independent)
- US1: T010, T011, T012 (after T009 for T010)
- US3: T018, T019, T020, then T021, T022

## Parallel Example: Foundational

```text
Task: "Write failing tests in tools/backup/tests/config.test.ts"
Task: "Write failing tests in tools/backup/tests/naming.test.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. Complete Phase 3 (User Story 1)
3. STOP and VALIDATE with quickstart scenarios 1 and 4

Note: after the MVP the tool already protects data, but may overwrite only in the narrow race where two runs choose the same name; User Story 2 closes that gap, and User Story 3 gives clear errors.

### Incremental Delivery

1. Setup + Foundational, then User Story 1 (MVP)
2. Add User Story 2 (safe repeated and concurrent runs)
3. Add User Story 3 (clear failures, no partial files)
4. Polish

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- Commit after each task or logical group
- Never put credentials or real data into tests, fixtures or docs (constitution Principle IV)
- Network and real-account checks are done through the quickstart scenarios, not in automated tests
