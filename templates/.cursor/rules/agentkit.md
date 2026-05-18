# Cursor AgentKit Rules

Use this rule as a repository guidance router for Cursor agents and composer workflows.

## Primary Guidance

- Follow `AGENTS.md` first.
- Treat `AGENTS.md` as the source of truth for repository-wide agent behavior.
- Keep context focused. Read companion files only when relevant to the task.

## Read When Relevant

- `CODE-QUALITY.md`: code quality, review, refactors, dependencies.
- `WORKFLOWS.md`: planning, implementation, review, release.
- `CHANGE-EXPLANATION.md`: final handoff and developer-facing explanation.
- `DESIGN-SYSTEM.md`: UI, styling, layout, navigation, components.
- `TESTING.md`: tests, fixtures, mocks, QA strategy.
- `SECURITY-CHECKLIST.md`: auth, permissions, secrets, PII, data handling.
- `STACK.md`: stack-specific rules when present.

## Cursor Behavior

- Prefer existing repository patterns over generic generated patterns.
- Keep changes scoped and reviewable.
- Do not change foundational architecture, schema, dependencies, or theme primitives without explicit approval.
- Summarize changed files, checks run, risks, and review focus before handoff.
