# Contract: `npm run backup`

## Invocation

```text
npm run backup
```

No arguments, no prompts. Run from the repository root.

## Input

| Name | Required | Source |
|------|----------|--------|
| `BACKUP_EMAIL` | yes | Environment variable, else `tools/backup/.env` |
| `BACKUP_PASSWORD` | yes | Environment variable, else `tools/backup/.env` |
| `FIREBASE_API_KEY` | yes | Environment variable, else `tools/backup/.env` |
| `FIREBASE_DATABASE_URL` | yes | Environment variable, else `tools/backup/.env` |

Environment variables take priority over `tools/backup/.env`.

## Output on success (stdout), exit code 0

```text
Backup created: backup/bckp-20261003-1.json
Account: user@example.com
Expenses: 123
Categories: 8
People: 3
```

Files: one new file `backup/bckp-YYYYMMDD-N.json` containing the document described in [data-model.md](../data-model.md).

## Failures (stderr), exit code 1, no file created or left behind

| Situation | Message (one line, starts with `Error:`) | Network used |
|-----------|------------------------------------------|--------------|
| Missing configuration or credentials | `Error: missing <NAME1>, <NAME2>. Set them as environment variables or in tools/backup/.env.` | No |
| Wrong email/password or unknown user | `Error: authentication failed. Check BACKUP_EMAIL and BACKUP_PASSWORD.` | Yes |
| Expenses, categories and people all empty | `Error: no data to back up for <email>.` | Yes |
| Network or database unreachable, or access denied | `Error: could not read data: <reason>.` | Yes |
| Cannot create folder or write file | `Error: could not write backup: <reason>.` | Yes |

## Guarantees

- Never modifies or deletes database data.
- Never modifies or deletes an existing file in `backup/`.
- A file named `bckp-*.json` always holds a complete backup.
- Passwords and the API key are never printed.
