<!--
Sync Impact Report
- Version change: (unversioned template) → 1.0.0
- Modified principles: none renamed (all placeholders replaced with initial principles)
- Added sections: Core Principles I–V, Technical Constraints, Development Workflow, Governance
- Removed sections: none
- Follow-up TODOs: none
-->
# Expense Tracker Constitution

## Core Principles

### I. TypeScript Strict Mode

All TypeScript code, including standalone utilities, MUST compile with `"strict": true`.
The use of `any`, `@ts-ignore` and `@ts-nocheck` MUST be avoided; where unavoidable it MUST be
justified in a comment. Rationale: strict typing catches defects at compile time.

### II. Simplicity and Readability (YAGNI)

Code MUST be simple and readable. Features, abstractions, options and dependencies MUST NOT be
added for hypothetical future needs. Any added complexity MUST be justified in the plan or in the
code review. Rationale: small, clear code is cheaper to maintain and review.

### III. Standalone Utilities

Utilities (e.g. the Firebase backup tool) MUST live in their own folder (such as `tools/`),
separate from `src/`. They MUST NOT import Angular, nor any code from `src/`, and MUST be runnable
with a single command without starting the Angular app. Rationale: utilities must stay usable and
testable independently from the application.

### IV. No Credentials in Code or Repository

Credentials, passwords, tokens and service accounts MUST NOT appear in source code, tests, docs or
any file tracked by git. They MUST be provided only through environment variables or files ignored
by git (e.g. `.env`), and such files MUST be listed in `.gitignore`. Generated output containing
personal data (e.g. `backup/`) MUST also be git-ignored. Rationale: prevents secret and personal
data leaks.

### V. Automated Tests for Pure Logic

Every utility MUST have automated tests covering its pure logic (e.g. file naming and daily
versioning). Pure logic MUST be isolated from I/O so it can be tested without network or file
system access. Tests MUST pass before a feature is considered complete.
Rationale: pure logic is cheap to test and the most common source of silent regressions.

## Technical Constraints

- Language: TypeScript (strict). The Angular app and standalone utilities share the same
  repository but not the same code.
- Utilities MAY use the Firebase client SDK already present in the project but MUST read their
  configuration and credentials as stated in Principle IV.
- New dependencies MUST be justified under Principle II.

## Development Workflow

- Features follow the Spec Kit flow: specify → plan → tasks → implement.
- Specifications and plans MUST be checked against this constitution before implementation.
- Changes MUST keep the existing test suite and the app build passing.

## Governance

This constitution supersedes other practices in this repository. Amendments MUST be made by editing
this file, stating the reason, and updating the version below. Versioning follows semantic
versioning: MAJOR for removed or redefined principles, MINOR for new principles or materially
expanded guidance, PATCH for clarifications. Compliance MUST be verified in every plan and code
review; violations MUST be fixed or explicitly justified.

**Version**: 1.0.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-03
