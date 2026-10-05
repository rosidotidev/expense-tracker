# Implementation Plan: Firebase Data Backup

**Branch**: `001-firebase-data-backup` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-firebase-data-backup/spec.md`

## Summary

A standalone TypeScript command (`npm run backup`) that logs in to Firebase as the app user, reads the
`users/{uid}` node with a single `get()`, and saves it as `backup/bckp-YYYYMMDD-N.json` with the full
root path (`{"users": {"<uid>": {...}}}`). It is run with `tsx` from `tools/backup/`, uses the Firebase
client SDK already in the project, and writes with `node:fs` using a temp-file-then-exclusive-copy
strategy so an existing backup is never overwritten and no partial file is ever left behind. Pure logic
(file naming/versioning, counting, config validation) is isolated in small modules covered by Vitest.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Node.js 24 (needs >= 20.12 for `process.loadEnvFile`)

**Primary Dependencies**: `firebase` ^12 (already present: `firebase/app`, `firebase/auth`, `firebase/database`); dev: `tsx`, `vitest`, `@types/node`

**Storage**: Local files: `backup/bckp-YYYYMMDD-N.json` (JSON, 2-space indent)

**Testing**: Vitest (run with its own scope, `npm run test:backup`), `*.test.ts` files under `tools/backup/`

**Target Platform**: Developer machine (Windows/macOS/Linux) with Node.js and network access

**Project Type**: Standalone CLI utility inside the existing Angular repository

**Performance Goals**: Complete in under 1 minute for up to 10,000 expenses (SC-001); one network read

**Constraints**: No imports from Angular or `src/`; no credentials in repository; never overwrite a backup; no partial files on failure; read-only against the database

**Scale/Scope**: One user, a personal data set; single output file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How the plan complies |
|-----------|--------|-----------------------|
| I. TypeScript Strict Mode | PASS | `tools/backup/tsconfig.json` sets `"strict": true` and is type-checked in the test script |
| II. Simplicity (YAGNI) | PASS | Four small modules, no framework, no `dotenv` (uses built-in `process.loadEnvFile`), one `get()` |
| III. Standalone Utilities | PASS, with one deviation from the input | Lives in `tools/backup/`, imports nothing from `src/` or Angular. The input asked for "the same configuration as `src/environments/environment.ts`; importing that file would break this principle (and the file is git-ignored), so the same values are supplied through the environment instead (see research R2) |
| IV. No Credentials in Repository | PASS | Email/password and Firebase config come from environment variables or a git-ignored `tools/backup/.env`; `.env` and `/backup/` are added to `.gitignore`; only a value-free `.env.example` is committed |
| V. Automated Tests for Pure Logic | PASS | Naming/versioning, counting and config validation are pure functions with Vitest tests, written before the code that uses them |

Post-design re-check (after Phase 1): PASS, no violations; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-firebase-data-backup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli.md           # Phase 1 output: command-line contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
tools/
└── backup/
    ├── backup.ts          # Entry point: orchestrates config -> login -> read -> check -> write -> print
    ├── config.ts          # Pure: validates env values, returns config or the list of missing names
    ├── naming.ts          # Pure: builds bckp-YYYYMMDD-N.json, next version from existing names
    ├── summary.ts         # Pure: counts expenses/categories/people, detects "no data", builds root-path document
    ├── firebase.ts        # I/O: sign in, read users/{uid}, sign out, map errors to messages
    ├── storage.ts         # I/O: create folder, list names, temp write + exclusive copy, cleanup
    ├── tsconfig.json      # strict, module nodenext, types: node
    ├── .env.example       # Variable names only, no values; copy to .env in this same folder
    └── tests/
        ├── config.test.ts
        ├── naming.test.ts
        └── summary.test.ts

backup/                    # Output folder, git-ignored, created at run time
```

**Structure Decision**: One folder `tools/backup/` separate from `src/`. Pure logic (`config`, `naming`,
`summary`) is split from I/O (`firebase`, `storage`) so the pure parts are testable without network or
file system, as Principle V requires. `package.json` gains scripts `"backup": "tsx tools/backup/backup.ts"`
and `"test:backup": "vitest run --dir tools/backup"`, plus devDependencies `tsx`, `vitest`, `@types/node`.

## Complexity Tracking

No constitution violations to justify.
