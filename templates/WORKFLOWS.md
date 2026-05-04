# Project Workflows

## Purpose

This document defines lightweight workflows for planning, implementation, review, and release.

Keep this file practical. Delete sections that do not apply to the project.

## Planning Workflow

Use a PRD for product or user-facing work that needs intent, requirements, and acceptance criteria.

Use an implementation brief for engineering work that is already understood but needs a clear execution plan.

Tiny fixes can skip formal planning when the change is obvious and low risk.

## Branch Workflow

- Prefer an issue-linked branch when available.
- Use short, descriptive branch names:
  - `feature/[short-name]`
  - `fix/[short-name]`
  - `chore/[short-name]`
- Keep each branch focused on one coherent change.

## Coding Workflow

1. Read the issue, PRD, or implementation brief.
2. Inspect existing patterns.
3. Make the smallest complete change.
4. Add or update tests where behavior changes.
5. Run relevant checks.
6. Review the diff before handoff.

## Review Workflow

Review for correctness first, then maintainability, tests, UX, and style.

Call out:

- Bugs or regressions.
- Missing validation or error handling.
- Overly broad abstractions.
- Missing tests for changed behavior.
- UI states that are missing or inaccessible.

## Release Workflow

Before release:

- Confirm tests and build pass.
- Confirm docs match behavior.
- Confirm environment variables and migrations are documented.
- Confirm no secrets or local-only files are included.
