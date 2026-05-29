# Project Workflows

## Purpose

Optional process reference for repositories that installed the **full** AgentKit template set.

`AGENTS.md` is the canonical source of truth for daily agent work. Use this file only when you need a quick map of which companion guide fits a situation.

## Choose The Right Document

| Situation | Use |
| --- | --- |
| Daily implementation, approval boundaries, change explanations | `AGENTS.md` |
| Tiny obvious fix | Implement directly; no formal planning doc |
| User-facing feature or product uncertainty (planning requested) | Create from `PRD-TEMPLATE.md` under `[briefs path, e.g. docs/briefs]` |
| Multi-file engineering with risk (planning requested) | Create from `IMPLEMENTATION-BRIEF-TEMPLATE.md` under `[briefs path, e.g. docs/briefs]` |
| UI, styling, layout, navigation, components | `DESIGN-SYSTEM.md` or project design-system path |
| Security-sensitive change | `SECURITY-CHECKLIST.md` if present |
| Test strategy or test implementation | `TESTING.md` if present |
| Review, refactor, dependencies | `CODE-QUALITY.md` |
| Any task that edits repository files | Change-explanation format in `AGENTS.md` and `CHANGE-EXPLANATION.md` |

For branching, implementation steps, review expectations, and release checks, follow `AGENTS.md`.
