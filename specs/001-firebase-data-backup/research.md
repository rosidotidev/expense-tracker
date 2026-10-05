# Research: Firebase Data Backup

All items from the Technical Context are resolved; none remain as NEEDS CLARIFICATION.

## R1. Runner for the TypeScript script: `tsx` vs `ts-node`

- **Decision**: `tsx`, invoked by the npm script `backup`.
- **Rationale**: Runs TypeScript with no configuration and no separate compile step; works with ESM and `node:` imports. It does no type checking, so type safety is enforced separately with `tsc --noEmit -p tools/backup` (Principle I).
- **Alternatives considered**: `ts-node` (needs more ESM configuration, slower); Node's built-in type stripping (works on Node 24 but ties the project to a recent Node and has stricter syntax limits); compiling with `tsc` first (extra build step, violates YAGNI).

## R2. Firebase configuration without importing `src/environments/environment.ts`

- **Decision**: Read `FIREBASE_API_KEY` and `FIREBASE_DATABASE_URL` from environment variables or `tools/backup/.env`; these hold the same values as `firebase.apiKey` and `firebase.databaseURL` in `environment.ts`.
- **Rationale**: Constitution Principle III forbids importing from `src/`. `environment.ts` is also listed in `.gitignore`, so it may be absent on a fresh clone. Email/password sign-in and a database read need only the API key and database URL, so the other fields (`authDomain`, `projectId`, `appId`, ...) are not required (YAGNI).
- **Alternatives considered**: Importing `environment.ts` (breaks Principle III and fails when the file is missing); parsing `environment.ts` as text (fragile coupling to the Angular file); hard-coding values (Principle IV).
- **Impact**: The user copies two values once into `tools/backup/.env`. This is a deliberate deviation from the plan input and is noted in the Constitution Check.

## R3. Reading the data

- **Decision**: After sign-in, a single `get(ref(db, "users/" + uid))`, with `uid` taken from the authenticated user.
- **Rationale**: Rules allow reading `users/$uid` only when `auth.uid === $uid` (`firebase-rules.json`), so the user's own node is the only readable unit; one request keeps it simple and atomic.
- **Notes**: `snapshot.val()` returns `null` for a missing node. Push IDs are not integer-like, so Firebase does not convert the groups into arrays.
- **Alternatives considered**: Three separate reads (more requests, no benefit); Admin SDK with a service account (reads all users, but a stored service-account secret raises the risk; out of scope per the spec).

## R4. Loading `.env`

- **Decision**: Use Node's built-in `process.loadEnvFile(path)` inside a try/catch, with the path built from the script's own folder (`__dirname` + `.env`), then read `process.env`. The `.env` therefore lives in `tools/backup/` and is found whatever the current working directory is.
- **Rationale**: Built in since Node 20.12 and does not override variables that are already set, which gives the required priority to real environment variables (spec FR-002). No extra dependency (YAGNI).
- **Alternatives considered**: `dotenv` package (extra dependency for the same result).

## R5. Never overwrite, and no partial file

- **Decision**: Create `backup/` if missing, list existing file names, compute the next version with the pure function, write the JSON to a temp file in `backup/` (name not matching `bckp-*.json`), then copy it to the final name with `COPYFILE_EXCL` and delete the temp file. If the copy fails because the name already exists (a concurrent run), recompute the version and retry (bounded to a few attempts). On any other error, delete the temp file.
- **Rationale**: The exclusive copy cannot replace an existing file, so overwriting is impossible even with two simultaneous runs; the final name only ever appears with complete content (spec FR-006, FR-012, edge cases).
- **Alternatives considered**: Plain `writeFile` with flag `wx` directly on the final name (a crash mid-write leaves a truncated file with a valid name); `rename` (overwrites silently on some platforms).

## R6. Choosing the next version

- **Decision**: Match existing names with `^bckp-YYYYMMDD-(\d+)\.json$` for today's date; next version = highest number + 1, or 1 if none.
- **Rationale**: Handles gaps (`-1`, `-3` gives `-4`) as in spec User Story 2.
- **Alternatives considered**: Counting matching files (reuses a number after a gap, can collide).

## R7. Testing

- **Decision**: Vitest, run separately with `vitest run --dir tools/backup`, files named `*.test.ts`.
- **Rationale**: The project's `ng test` is scoped to `src/**/*.spec.ts` through `tsconfig.spec.json`, so tool tests need their own invocation. Vitest is also what `tsconfig.spec.json` already references (`vitest/globals`) and has native TypeScript support, so no extra transform setup is needed.
- **Alternatives considered**: `node:test` with `tsx` (no new test dependency, but a different style from the Angular tests); extending the Angular test target (would couple the tool to Angular, against Principle III).

## R8. Error handling and exit codes

- **Decision**: Exit code 0 on success and 1 on any failure; each failure prints one `Error: ...` line to stderr. Authentication failures are detected from the Firebase error code (credential/user errors) and shown as "authentication failed"; other errors (network, permission denied) show their own message. The Firebase app is deleted at the end so the process exits promptly.
- **Rationale**: Matches spec FR-008 to FR-012 with the least machinery.
- **Alternatives considered**: One exit code per error kind (not required by the spec; can be added later).
