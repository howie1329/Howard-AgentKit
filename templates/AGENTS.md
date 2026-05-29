# [Project Name] Agent Guide

## Purpose

This is the primary instruction file for AI coding agents working in this repository.

[Project Name] is [short project description]. Agents should optimize for safe, focused, production-ready changes that follow local patterns.

## Source Of Truth

Follow this file first. It defines the repository-wide operating rules for agents.

Use companion guides only when relevant to the task. Do not load or restate every guide by default.

## Reference Map

Read these files when the task calls for them:

| Task type | Read first |
| --- | --- |
| Any implementation | `AGENTS.md` |
| Code quality, refactors, review, dependencies | `CODE-QUALITY.md` |
| Planning, branching, implementation, review, release | `WORKFLOWS.md` |
| After any task that edits repository files | `CHANGE-EXPLANATION.md` (use its format in your final message) |
| UI, styling, layout, navigation, components | `[design system path, e.g. docs/design-system.md]` |
| Tests, fixtures, mocks, QA strategy | `TESTING.md` |
| Auth, permissions, secrets, PII, data handling | `SECURITY-CHECKLIST.md` |
| Complex engineering execution | `IMPLEMENTATION-BRIEF-TEMPLATE.md` |
| Product or user-facing feature definition | `PRD-TEMPLATE.md` |
| Stack-specific work | `STACK.md` when present |

## Local Guidance

This root `AGENTS.md` applies to the whole repository.

If a subdirectory contains its own `AGENTS.md` or equivalent local guidance, follow the most specific local guidance for files in that subtree. When instructions conflict, prefer the more specific local guidance unless it violates repository-wide safety, security, or quality rules.

## Operating Rules

- Inspect existing code and patterns before changing files.
- Prefer the smallest complete solution that satisfies the task.
- Keep diffs focused and reviewable.
- Preserve user changes. Do not overwrite or revert work you did not make.
- Avoid speculative abstractions, broad rewrites, and dependency bloat.
- Validate external input at system boundaries.
- Keep public APIs and persisted data shapes stable unless the task requires a change.
- Ask before destructive commands, broad refactors, schema changes, dependency additions, or security-sensitive changes.
- Run the narrowest useful checks before finishing.
- After any coding work that changes files, end with a change explanation that follows `CHANGE-EXPLANATION.md`. Do not skip this for small fixes.

## Before Coding

Before making meaningful code changes:

1. Confirm the task, scope, and acceptance criteria.
2. Check whether the task is linked to an issue in [issue tracker, e.g. Linear or GitHub Issues].
3. For non-trivial work without an issue, ask whether one should be created before implementation.
4. Create or switch to an appropriate branch when the workflow expects branches.
5. Inspect nearby code, tests, and existing patterns.
6. Read relevant companion guidance from the Reference Map.
7. Identify the smallest complete approach.
8. Ask for clarification if requirements, risk, or approval boundaries are unclear.

Tiny fixes can skip branch-and-brief ceremony when the change is obvious and low risk.

## During Coding

While implementing:

- Modify existing patterns before creating new ones.
- Keep behavior explicit and easy to test.
- Avoid unrelated formatting churn.
- Prefer existing utilities, components, and conventions.
- Add or update tests when behavior changes.
- For UI work, follow `[design system path, e.g. docs/design-system.md]` and preserve existing interaction patterns.
- For stack-specific work, read `STACK.md` when present.
- Document meaningful decisions in the change explanation, implementation brief, or PR when they matter.

## Approval Boundaries

Ask before:

- Adding a new runtime dependency.
- Changing schemas, migrations, permissions, auth, billing, or data retention behavior.
- Running destructive commands or deleting files.
- Changing global design tokens, theme primitives, or foundational layout rules.
- Performing broad refactors or large formatting-only rewrites.
- Editing generated, vendored, or external-source files unless the task explicitly requires it.

## After Coding (Required)

If you modified any files in the repository, your **final message** must include a change explanation that follows `CHANGE-EXPLANATION.md`.

This is how developers catch up on agent work. It is required for bugfixes, refactors, and small edits—not only large features or PRs. Scale section depth to the change; do not omit the explanation because the diff is small.

Do not write a separate change-explanation file unless the project asks for one. Use the format in your reply.

## Before Finishing

Before marking work complete:

1. Re-read the original request and acceptance criteria.
2. Confirm the implementation satisfies the requested scope.
3. Run the narrowest relevant checks:
   - `[test command, e.g. npm test]`
   - `[lint command, e.g. npm run lint]`
   - `[build/check command, e.g. npm run build]` for larger changes
4. Review the diff for unrelated changes.
5. Confirm no unnecessary dependencies, schema changes, theme changes, or broad refactors were introduced.
6. Include the change explanation from **After Coding (Required)** in your final message.

## Project Commands

Replace these examples with the project's real commands:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run tests |
| `npm run lint` | Run lint checks |
| `npm run build` | Build the project |

Remove commands that do not apply.

## Environment

Document required environment variables here:

- `[ENV_VAR_NAME]`: [description]

Never commit API keys, tokens, private keys, or local `.env` values. Keep secrets in environment variables or the project-approved secret store.

## Stack

Document the real stack for this project:

- [Primary framework]
- [Language/runtime]
- [Backend/data layer]
- [Styling system]
- [Test tools]
- [Lint/format tools]
