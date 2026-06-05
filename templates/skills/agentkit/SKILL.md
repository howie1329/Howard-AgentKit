---
name: agentkit
description: Use when bootstrapping, updating, or auditing AgentKit-managed repository guidance (AGENTS.md, STACK.md, companion guides) in a skill-path project — including after agentkit skill install, when guidance files are missing, placeholders remain, project commands are stale, or the user asks to run agentkit init, agentkit update, or agentkit doctor in the agent.
compatibility: Requires agentkit CLI and agentkit.config.json with installMode skill, or existing AgentKit-managed files with block markers.
metadata:
  author: thomas-agentkit
  version: "1.0"
---

# AgentKit Skill

Maintain AgentKit-managed repository guidance files using project context.

## When to use

- User ran `agentkit skill install` and needs guidance files created
- `AGENTS.md` or companion guides are missing
- Placeholders like `[Project Name]` remain in guidance files
- User asks to run `agentkit init`, `agentkit update`, or `agentkit doctor` **in the agent**
- Project commands in guidance do not match `package.json`

## When not to use

- User wants CLI template install in the terminal → direct them to `agentkit init` (CLI)
- Generic documentation requests unrelated to AgentKit guidance contract
- Code review or feature implementation without guidance file changes

## Route

Read `references/file-contract.md` before editing any AgentKit-managed file.

1. User asks to **initialize** AgentKit guidance, or `AGENTS.md` is missing
   → `references/init.md`

2. User asks to **update** or **sync** guidance after code/stack changes
   → `references/update.md`

3. User asks to **doctor**, **audit**, or **review** guidance quality
   → `references/doctor.md`

4. Unsure which workflow applies
   → If no guidance files exist: `references/init.md`
   → If files exist but stale/wrong commands: `references/update.md`
   → If user wants a quality pass only: `references/doctor.md`

## Non-negotiables

- `AGENTS.md` is the source of truth; AI tool adapters stay thin pointers
- Preserve user content **outside** AgentKit managed blocks
- Do not run destructive git commands or overwrite unrelated files
- Commands in guidance must come from `package.json` scripts or `agentkit.config.json` personalization — never invent scripts
- Wrap AgentKit-owned sections in managed block markers (see `references/file-contract.md`)
- CLI `agentkit init` installs **templates**; this skill's `agentkit init` **creates guidance files** — never confuse them

## Gotchas

| Gotcha | Reality |
| --- | --- |
| `installMode: skill` but no `.md` files yet | Expected after `agentkit skill install` — run this skill's init workflow |
| `templateSet: minimal` | Create `AGENTS.md` only — do not add optional companions |
| `templateSet: standard` | Core companions only — not `TESTING.md`, `WORKFLOWS.md`, etc. |
| `templateSet: full` | All bundled guidance files plus selected AI tool adapters |
| AI tool adapters | Thin pointers to `AGENTS.md` — do not duplicate operating rules |
| `STACK.md` | Create only when `preset` is set in `agentkit.config.json` |
| `DESIGN-SYSTEM.md` | Follow `designSystem` from config — do not invent styling systems |
| Partial init | Safe to re-run init to finish missing files; skip existing files unless user asks to refresh |

## Quick reference

| User says | Load |
| --- | --- |
| "run agentkit init" / "set up AGENTS.md" | `references/init.md` |
| "sync guidance" / "update AGENTS.md after stack change" | `references/update.md` |
| "audit guidance" / "agentkit doctor" | `references/doctor.md` |
| Before any file edit | `references/file-contract.md` |
