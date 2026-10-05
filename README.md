# 💰 Shared Expense Tracker

A web application for managing expenses shared between several people. Each user can record expenses, organise them by person and category, browse and filter the full history, and view monthly summaries with totals and averages.

Built with **Angular 21** (standalone components, zoneless) and **Firebase** (Authentication + Realtime Database).

> The user interface is in Italian (tab names such as *Registra spesa*, *Storico*, *Riepilogo*); this README uses English names with the Italian label in parentheses where useful.

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [Firebase setup](#firebase-setup)
- [Data model](#data-model)
- [Data backup](#data-backup) (restore coming soon)
- [Production build and deployment](#production-build-and-deployment)
- [Project structure](#project-structure)
- [How this project was built with Spec Kit](#how-this-project-was-built-with-spec-kit)

---

## Features

- **Login** — Email/password authentication through Firebase Auth. There is no public sign-up: users are created in the Firebase console.
- **Add expense** (*Registra spesa*) — Form with person, amount, date, place, category and notes.
- **History** (*Storico*) — Table of all expenses with filters, column sorting, pagination (10 rows per page) and deletion.
- **Summary** (*Riepilogo*) — Statistics filterable by month, year, person and category: total, number of expenses, average, total per person.
- **People** (*Persone*) — Add and remove the people who share the expenses.
- **Categories** (*Categorie*) — Manage categories (6 defaults: Food, Transport, Entertainment, Housing, Shopping, Other).
- **Recurring expenses** — Mark an expense as *Recurrent* when adding it, or toggle the flag from *Storico* (shown with a "Recurrent" badge). At login, if the current month has no recurrent expense, the recurrent expenses of the previous month are copied into it (same day of the month, or the last day when it does not exist). The check runs once per session and reads only the previous and current month. Known limits: if the app is not opened for a whole month nothing is copied the next month; if all recurrent expenses are removed from the current month, they are copied again at the next login of the same month.
- **Real time** — Data is updated live on every open device.
- **Multi-user** — Each user only sees their own data (isolation by Firebase UID, enforced by the database rules).
- **Responsive** — Works on desktop, tablet and phone.
- **Data backup** — A standalone command-line tool exports all your data to a local JSON file (see [Data backup](#data-backup)).

---

## Getting started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later

### Install

```bash
cd expense-tracker
npm install
```

### Run locally in mock mode (no Firebase)

The app ships with a mock mode that simulates Firebase in memory. No configuration is needed apart from the environment file (see below):

```bash
npx ng serve --open
```

The app opens at `http://localhost:4200/` and logs you in automatically as `demo@example.com`. This is handy for trying out the interface.

### Run locally against a real Firebase project

Follow [Firebase setup](#firebase-setup), then:

```bash
npx ng serve --open
```

### Environment file

`src/environments/environment.ts` holds your Firebase configuration and is **excluded from git** (it is listed in `.gitignore`). A template is provided:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

(on Windows: `copy src\environments\environment.example.ts src\environments\environment.ts`), then fill in your values.

The `useMock` flag switches between the two modes:

| Value | Effect |
|-------|--------|
| `useMock: true` | In-memory data, automatic login, no Firebase needed |
| `useMock: false` | Uses the real Firebase project configured in the file |

---

## Firebase setup

### 1. Create the project

1. Go to **https://console.firebase.google.com/**
2. Click **Add project**
3. Choose a name (e.g. `expense-tracker-rs`)
4. Disable Google Analytics → **Create project**

### 2. Enable authentication

1. Left menu → expand **Build** → **Authentication**
2. Click **Get started**
3. Select **Email/Password** in the provider list
4. Enable the first toggle → **Save**

### 3. Create the Realtime Database

1. Left menu → **Realtime Database** → **Create database**
2. Pick the **europe-west1** region
3. Choose **Start in locked mode** → **Enable**
4. Open the **Rules** tab and replace the content with the following (the same rules are in `firebase-rules.json`):

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "expenses": {
          ".indexOn": ["date", "createdAt"]
        }
      }
    }
  }
}
```

5. Click **Publish**

### 4. Register the web app

1. Go to **Project Overview** (house icon, top left)
2. Click the **Web** icon (`</>`) to add an app
3. Choose a nickname → **Register app**
4. Copy the configuration shown

Alternatively: **⚙️ Project settings** → scroll to **Your apps** → **SDK setup and configuration**.

### 5. Fill in environment.ts

Create `src/environments/environment.ts` (see [Environment file](#environment-file)) with the values you copied:

```typescript
export const environment = {
  production: false,
  useMock: false,
  firebase: {
    apiKey: 'AIzaSy...',
    authDomain: 'your-project.firebaseapp.com',
    databaseURL: 'https://your-project-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'your-project',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123'
  }
};
```

### 6. Create the users

The app has no public sign-up. To add users:

1. Firebase Console → **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password

### 7. (Optional) Block self-registration

To prevent anyone from signing up by calling the Firebase APIs directly:

1. **Authentication** → **Settings** → **User actions**
2. Disable **Allow users to sign up**

---

## Data model

Nothing needs to be created by hand. The Realtime Database is schema-less: the structure is created on the first insert.

```
users/
  {uid}/
    expenses/
      {expenseId}/
        who: string
        amount: number
        date: string (YYYY-MM-DD)
        where: string
        category: string
        notes: string
        uid: string
        createdAt: number
        recurrent?: true   (optional; absent = not recurrent)
    people/
      {key}: string
    categories/
      {key}: string
```

---

## Data backup

A standalone command-line utility in `tools/backup/` (independent of Angular and of the `src/` code) saves all of a user's data from Firebase into a single local JSON file.

- Output: `backup/bckp-YYYYMMDD-N.json`, where `N` starts at 1 and increases if you run several backups on the same day. **An existing backup is never overwritten.**
- The `backup/` folder is created if missing and is git-ignored (it contains personal data).
- The JSON reproduces the Firebase tree from the database root (`users` → `{uid}` → `expenses`, `categories`, `people`), so it can be re-imported as is.
- Writes are atomic: only a complete file gets its final name, and nothing partial is left behind on failure.
- On success it prints the file path, the account email and the number of expenses, categories and people saved. It exits with a clear error if credentials are missing, authentication fails, or there is no data.

### Usage

1. Create `tools/backup/.env` (git-ignored) by copying `tools/backup/.env.example`:

   ```text
   BACKUP_EMAIL=<the email you log in to the app with>
   BACKUP_PASSWORD=<the password you log in to the app with>
   FIREBASE_API_KEY=<firebase.apiKey from environment.ts>
   FIREBASE_DATABASE_URL=<firebase.databaseURL from environment.ts>
   ```

   The same four values can also be provided as environment variables, which take priority over the `.env` file.

2. Run:

   ```bash
   npm run backup
   ```

   The tool's unit tests run with `npm run test:backup`.

Details, contract and verification scenarios: [`specs/001-firebase-data-backup/`](specs/001-firebase-data-backup/) (in particular `quickstart.md` and `contracts/cli.md`).

### Restore — coming soon

A **restore** feature is planned: it will re-import a `bckp-*.json` file into Firebase. The backup format was designed for this from the start, since the file mirrors the database tree exactly. Restore is not implemented yet.

---

## Production build and deployment

### Build

```bash
npx ng build --configuration production
```

Output goes to `dist/expense-tracker/browser/`.

### Deploy to GitHub Pages

The app is a static site, so it can be served from any GitHub Pages folder. Set `--base-href` to the path where it will be served, for example:

```bash
npx ng build --configuration production --base-href /expense-tracker-md/ --output-path dist/expense-tracker-md
```

Then copy the content of `dist/expense-tracker-md/browser/` into the matching folder of your GitHub Pages repository (e.g. `<username>.github.io/expense-tracker-md/`), commit and push.

Remember to add `<username>.github.io` to **Authentication** → **Settings** → **Authorized domains** in the Firebase console, otherwise login will fail on the deployed site.

---

## Project structure

```
src/app/
├── components/
│   ├── categories/        # Category management
│   ├── dashboard/         # Main layout with 5 tabs
│   ├── expense-form/      # Add-expense form
│   ├── expense-list/      # History table (filters, sorting, pagination)
│   ├── login/             # Login page
│   ├── overview/          # Summary with filters and statistics
│   ├── people/            # People management
│   └── toast/             # Toast notifications
├── guards/
│   └── auth.guard.ts      # Route protection (authenticated users only)
├── models/
│   └── expense.model.ts   # TypeScript interface
├── services/
│   ├── firebase.service.ts       # Firebase SDK wrapper
│   ├── mock-firebase.service.ts  # In-memory mock (development)
│   ├── expense.service.ts        # Expense CRUD
│   ├── people.service.ts         # People CRUD
│   ├── category.service.ts       # Category CRUD
│   └── toast.service.ts          # Notifications
├── app.config.ts          # Providers configuration
├── app.routes.ts          # Routing
└── app.ts                 # Root component

src/environments/
├── environment.example.ts # Template (committed)
└── environment.ts         # Your Firebase config (git-ignored)

tools/backup/              # Standalone Firebase backup utility (+ tests)

.specify/                  # Spec Kit: constitution, templates, scripts
.claude/skills/            # Spec Kit slash commands for Claude Code
specs/                     # Feature specifications (one folder per feature)
```

---

## How this project was built with Spec Kit

The main app was written iteratively, but the **backup feature** was built following the [GitHub Spec Kit](https://github.com/github/spec-kit) workflow (spec-driven development) together with [Claude Code](https://claude.com/claude-code). Instead of jumping straight into code, each feature goes through written, reviewable artifacts first.

### What Spec Kit adds to the repository

- **`.specify/`** — The Spec Kit setup: document templates, helper PowerShell scripts, and the **project constitution** (`.specify/memory/constitution.md`).
- **`.claude/skills/speckit-*`** — The Spec Kit commands exposed to Claude Code as slash commands.
- **`specs/<NNN>-<feature-name>/`** — One folder per feature holding all of its artifacts.

### The constitution

The constitution lists the rules every feature must respect. For this project they are:

1. TypeScript strict mode everywhere.
2. Simplicity and readability (YAGNI).
3. Utilities are standalone: they live in `tools/`, and never import Angular or code from `src/`.
4. No credentials in code or in the repository (secrets only in git-ignored `.env` files or environment variables; generated output such as `backup/` is git-ignored too).
5. Automated tests for pure logic.

### The workflow, step by step

| Step | Command | Result |
|------|---------|--------|
| 1. Constitution | `/speckit-constitution` | `.specify/memory/constitution.md` |
| 2. Specify | `/speckit-specify` | `spec.md` — what the feature does and why, user stories, acceptance scenarios |
| 3. Clarify | `/speckit-clarify` | Targeted questions whose answers are written back into the spec (e.g. the exact JSON shape of the backup, when a backup counts as "no data") |
| 4. Plan | `/speckit-plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/cli.md`, `quickstart.md` — checked against the constitution |
| 5. Checklist (optional) | `/speckit-checklist` | `checklists/requirements.md` — quality check of the requirements |
| 6. Tasks | `/speckit-tasks` | `tasks.md` — a dependency-ordered task list |
| 7. Analyze (optional) | `/speckit-analyze` | Consistency check across spec, plan and tasks |
| 8. Implement | `/speckit-implement` | The code and tests, executed task by task |

Other available commands: `/speckit-converge` (append any unbuilt work to the tasks) and `/speckit-taskstoissues` (turn tasks into GitHub issues).

### Example: the backup feature

The first feature, `001-firebase-data-backup`, started from a one-paragraph description ("a standalone command-line utility that exports the user's data to a dated, never-overwritten JSON file"). After the specify and clarify steps produced the spec in [`specs/001-firebase-data-backup/spec.md`](specs/001-firebase-data-backup/spec.md), the plan, tasks and implementation followed, resulting in the code under `tools/backup/` and its tests. Every file in that folder can be read to understand why the tool behaves as it does.

The next feature (restore) will follow the same flow and get its own `specs/002-…` folder.
