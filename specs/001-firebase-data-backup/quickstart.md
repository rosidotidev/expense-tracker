# Quickstart: Firebase Data Backup

Validation guide for the finished feature. Contract: [contracts/cli.md](./contracts/cli.md). Data: [data-model.md](./data-model.md).

## Prerequisites

- Node.js 20.12 or newer (the project uses Node 24) and `npm install` already run.
- An existing app account (email and password) with a Realtime Database that allows it to read `users/<its uid>`.
- The Firebase `apiKey` and `databaseURL` values from `src/environments/environment.ts`.

## Setup

1. Create `tools/backup/.env` (it is git-ignored) by copying `tools/backup/.env.example` in the same folder:

   ```text
   BACKUP_EMAIL=<your app login email>
   BACKUP_PASSWORD=<your app login password>
   FIREBASE_API_KEY=<firebase.apiKey>
   FIREBASE_DATABASE_URL=<firebase.databaseURL>
   ```

2. Confirm `git status` does not list `.env` or `backup/`.

## Scenarios

| # | Run | Expected |
|---|-----|----------|
| 1 | `npm run backup` | Prints path, account email and counts; `backup/bckp-<today>-1.json` exists; `backup/` was created if missing |
| 2 | `npm run backup` again | A second file `-2` is created; the `-1` file is unchanged (compare timestamp or hash) |
| 3 | Delete `-1`, run again | New file is `-3` (highest existing plus one) |
| 4 | Open the file | Top level is `users` -> `<uid>` -> `expenses`/`categories`/`people`; counts match the printed ones |
| 5 | Remove `BACKUP_PASSWORD` from `tools/backup/.env` and run | `Error: missing BACKUP_PASSWORD ...`, exit code 1, no new file |
| 6 | Set a wrong password and run | `Error: authentication failed ...`, exit code 1, no new file |
| 7 | Use an account with no expenses, categories or people | `Error: no data to back up ...`, exit code 1, no new file |
| 8 | Set a variable in the shell that differs from `tools/backup/.env` and run | The shell value is used |

Check the exit code with `echo $?` (bash) or `$LASTEXITCODE` (PowerShell).

## Automated tests

```text
npm run test:backup
npx tsc --noEmit -p tools/backup
```

Both must pass: tests cover file naming/versioning, counting and config validation; the type check enforces strict mode.
