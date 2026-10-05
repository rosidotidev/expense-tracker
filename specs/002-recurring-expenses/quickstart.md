# Quickstart: Validating Recurring Expenses

## Prerequisites

- `npm install` done; `src/environments/environment.ts` present (copy from `environment.example.ts`).
- For a no-Firebase run, set `useMock: true` in the environment (in-memory data, auto-login).

## 1. Unit tests (pure rule)

```bash
npx vitest run --dir src
```

Expected: all `recurring.spec.ts` cases pass — current month already recurrent, previous month without recurrent, correct copy, day 31 in a shorter month, January → previous-year December, non-recurrent ignored, flag removed in current month, deterministic ids.

## 2. Build

```bash
npm run build
```

Expected: no TypeScript errors (strict mode).

## 3. Manual scenarios (`npm start`)

1. **Flag at creation** — add an expense ticking "Recurrent"; open Storico: the row's indicator is filled. Add one without ticking: outline indicator. (US1)
2. **Toggle** — in Storico, click the row's indicator to switch the flag on/off; it fills/empties and persists after reload. (US2)
3. **Copy on login** — with a recurrent expense dated in the previous month (and none recurrent in the current month), log out and in: the current month shows the copy with same person, amount, place, category, notes, flag; same day of month. (US3)
4. **No duplicates** — reload / log in again in the same month: no new copies. (US3)
5. **Short month** — previous-month recurrent expense on the 31st with a 30-day current month: the copy is on the 30th. (US3)
6. **Unflag a copy** — turn the flag off on the copy; it is no longer a candidate for the following month. (US4)
7. **Legacy data** — existing expenses show unchanged with the indicator off; database nodes for them are not modified. (US5)
8. **Reads stay bounded** — in the browser network/WebSocket inspector, login issues a ranged `date` query for two months for this check, not a full-expenses read from the check itself.

See [contracts/recurring-contract.md](contracts/recurring-contract.md) and [data-model.md](data-model.md) for details.
