# Data Model: Firebase Data Backup

The authoritative description of the database is [`docs/datamodel-firebase.md`](../../docs/datamodel-firebase.md). This file covers only what the utility handles.

## Backup document (the JSON file content)

Root-path form, no extra metadata fields (spec Clarifications, FR-007):

```json
{
  "users": {
    "<uid>": {
      "expenses":   { "<pushId>": { "who": "...", "amount": 0, "date": "YYYY-MM-DD", "where": "...", "category": "...", "notes": "...", "uid": "<uid>", "createdAt": 0 } },
      "categories": { "<pushId>": "..." },
      "people":     { "<pushId>": "..." }
    }
  }
}
```

- Keys and values are copied exactly as read; the utility does not transform, validate or reorder them.
- A group with no data is simply absent (not an empty object invented by the utility).
- Serialized with 2-space indentation.

## Backup file name

| Part | Rule |
|------|------|
| Pattern | `bckp-YYYYMMDD-N.json` |
| `YYYYMMDD` | Local date at the moment the file name is chosen, zero-padded |
| `N` | Integer >= 1; highest existing `N` for the same date plus one, or 1 if none |
| Location | `backup/` at the repository root (current working directory of `npm run backup`) |

Names in `backup/` that do not match the pattern are ignored when computing `N`.

## Run configuration (read-only input)

| Name | Required | Meaning |
|------|----------|---------|
| `BACKUP_EMAIL` | yes | Login email of the app user |
| `BACKUP_PASSWORD` | yes | Login password of the app user |
| `FIREBASE_API_KEY` | yes | Same value as `firebase.apiKey` in the app environment |
| `FIREBASE_DATABASE_URL` | yes | Same value as `firebase.databaseURL` in the app environment |

Source order: real environment variables first, then the `.env` file in the utility's folder (`tools/backup/.env`). A value is "missing" if it is unset or empty after trimming.

## Backup summary (printed result)

| Field | Source |
|-------|--------|
| File path | Final path of the created file |
| Account email | The signed-in account email |
| Expenses count | Number of keys under `expenses` (0 if absent) |
| Categories count | Number of keys under `categories` (0 if absent) |
| People count | Number of keys under `people` (0 if absent) |

## Rules and state

- "No data": expenses, categories and people are all empty or absent; the run fails and writes nothing.
- A run has no persistent state; its only effect is one new complete file, or none.
