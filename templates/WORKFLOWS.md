# Project Workflows

## Purpose

This document defines lightweight workflows for research, planning, implementation, review, and release.

Keep this file practical. Delete sections that do not apply to the project.

## Choose The Right Document

| Situation | Use |
| --- | --- |
| Tiny obvious fix | No formal planning doc required |
| User-facing feature or product uncertainty | `PRD-TEMPLATE.md` |
| Known engineering work with multiple files or risks | `IMPLEMENTATION-BRIEF-TEMPLATE.md` |
| UI, styling, layout, navigation, components | `DESIGN-SYSTEM.md` |
| Security-sensitive change | `SECURITY-CHECKLIST.md` |
| Test strategy or test implementation | `TESTING.md` |
| Any task that edits repository files | `CHANGE-EXPLANATION.md` (format for the agent's final message) |

## Research-Only Workflow

Use this when the task asks for investigation, options, or recommendations without coding.

1. Confirm the research question and scope.
2. Inspect relevant code, docs, tests, and history.
3. Use external sources only when current ecosystem knowledge is needed.
4. Separate facts from recommendations.
5. Summarize trade-offs, risks, and a recommended path.
6. Do not edit files unless the task changes from research to implementation.

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

## Implementation Workflow

1. Read the issue, PRD, or implementation brief.
2. Inspect existing patterns and nearby tests.
3. Read relevant companion guidance from `AGENTS.md`.
4. Make the smallest complete change.
5. Add or update tests where behavior changes.
6. Run relevant checks.
7. Review the diff before finishing.
8. End with a change explanation that follows `CHANGE-EXPLANATION.md` whenever files were modified.

## Pause And Ask Triggers

Pause and ask before:

- expanding scope beyond the request
- adding dependencies
- changing schemas or migrations
- changing auth, permissions, privacy, billing, or data retention behavior
- running destructive commands
- changing design tokens, themes, or foundational layout rules
- performing broad refactors or formatting-only rewrites
- removing tests or weakening validation

## Review Workflow

Review for correctness first, then maintainability, tests, UX, security, and style.

Call out:

- bugs or regressions
- missing validation or error handling
- missing authorization checks
- overly broad abstractions
- missing tests for changed behavior
- UI states that are missing or inaccessible
- unclear handoff, risks, or rollout notes

## Release Workflow

Before release:

- Confirm tests and build pass.
- Confirm docs match behavior.
- Confirm environment variables and migrations are documented.
- Confirm no secrets or local-only files are included.
- Confirm changelog or release notes are updated when the project expects them.
- Confirm rollback or mitigation steps for risky changes.
