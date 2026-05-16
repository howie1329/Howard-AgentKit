# Template Guidance Overhaul Plan

## Goal

Modernize AgentKit's installed guidance templates around a concise `AGENTS.md` router, task-specific companion guides, and thin tool-specific adapters.

## Confirmed Decisions

- `AGENTS.md` is the canonical repository guidance router and source of truth.
- `standard` is the default template set for interactive installs and `--yes` installs.
- AI tool adapters remain opt-in through AI tool selection, except `full` installs all bundled templates.
- `full` means every bundled template.
- Add `CHANGE-EXPLANATION.md`, `TESTING.md`, and `SECURITY-CHECKLIST.md`.
- `CHANGE-EXPLANATION.md` is a reusable guide for final handoff, not a per-change artifact template.
- `TESTING.md` and `SECURITY-CHECKLIST.md` are included only in `full`.
- `DESIGN-SYSTEM.md` remains in `standard` for now.
- Keep Cursor adapter path as `.cursor/rules/agentkit.md`.
- `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/agentkit.md` are thin adapters.
- `AGENTS.md` includes a short nested/local guidance rule.
- Keep `IMPLEMENTATION-BRIEF-TEMPLATE.md` and `PRD-TEMPLATE.md` names unchanged.

## Template Set Mapping

### Minimal

- `AGENTS.md`

### Standard

- `AGENTS.md`
- `CODE-QUALITY.md`
- `WORKFLOWS.md`
- `CHANGE-EXPLANATION.md`
- `DESIGN-SYSTEM.md`
- `.github/pull_request_template.md`

### Full

All bundled templates, including AI adapters, planning templates, testing, security, and PR template.

## Files To Add

- `templates/CHANGE-EXPLANATION.md`
- `templates/TESTING.md`
- `templates/SECURITY-CHECKLIST.md`

## Files To Change

- `templates/AGENTS.md`
- `templates/CODE-QUALITY.md`
- `templates/WORKFLOWS.md`
- `templates/CLAUDE.md`
- `templates/.github/copilot-instructions.md`
- `templates/.cursor/rules/agentkit.md`
- `templates/IMPLEMENTATION-BRIEF-TEMPLATE.md`
- `templates/PRD-TEMPLATE.md`
- `templates/.github/pull_request_template.md`
- `src/cli.ts`
- `test/agentkit.test.ts`
- `README.md`

## CLI Behavior Changes

- Default resolved template set changes from `full` to `standard`.
- Interactive prompt still defaults to `standard`.
- `full` continues to install every bundled template.
- AI tool mappings remain:
  - `codex` -> `AGENTS.md`
  - `cursor` -> `.cursor/rules/agentkit.md`
  - `claude` -> `CLAUDE.md`
  - `copilot` -> `.github/copilot-instructions.md`

## Validation Plan

Run:

```bash
npm run build
npm test
```

Also inspect dry-run output for default and full installs when possible.
