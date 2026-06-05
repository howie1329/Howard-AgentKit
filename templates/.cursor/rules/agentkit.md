# Cursor AgentKit Rules

Use this rule as a repository guidance router for Cursor agents and composer workflows.

## Primary Guidance

- Follow `AGENTS.md` first.
- Treat `AGENTS.md` as the source of truth for repository-wide agent behavior.
- Do not load companion files for routine coding unless a trigger in `AGENTS.md` applies or the user asks.

## When Relevant

- **File edits (final message):** change-explanation format in `AGENTS.md` and `CHANGE-EXPLANATION.md`.
- **UI / styling / layout:** `DESIGN.md` or the project design path from `AGENTS.md`.
- **Review / refactor / dependencies:** `CODE-QUALITY.md`.
- **Tests / QA strategy:** `TESTING.md` if present.
- **Auth / secrets / PII:** `SECURITY-CHECKLIST.md` if present.
- **Stack-specific code:** `STACK.md` if present.
- **Planning docs requested:** create from `PRD-TEMPLATE.md` or `IMPLEMENTATION-BRIEF-TEMPLATE.md` under the project's briefs path.
- **Process map (optional):** `WORKFLOWS.md` if present.

## Cursor Behavior

- Prefer existing repository patterns over generic generated patterns.
- Keep changes scoped and reviewable.
- Do not change foundational architecture, schema, dependencies, or theme primitives without explicit approval.
- After modifying files, end every task with a change explanation per `AGENTS.md` (summary, what changed, verification, risks, review focus). Scale depth to the change; do not skip for small fixes.
