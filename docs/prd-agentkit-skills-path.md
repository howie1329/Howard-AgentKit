# PRD: AgentKit Skills Path

> **Status:** Approved for implementation — see [agentkit-skills-path-implementation.md](./agentkit-skills-path-implementation.md)  
> **Target release:** v0.9.x  
> **Author:** Howard Thomas + AgentKit planning session

---

## Problem Statement

AgentKit CLI (`thomas-agentkit`) is gaining npm downloads and successfully bootstraps AI-agent-ready repositories via deterministic template installation. That model works well for offline, immediate setup, but it has limits as projects evolve:

- Template installs require upfront answers (preset, template set, personalization) before files exist, even when an agent could infer stack and commands from the repository.
- Users who prefer agent-guided workflows have no first-class path — only the traditional copy-templates flow.
- There is no bundled Agent Skill that teaches agents how to create and maintain AgentKit guidance files or help users understand completed codebase changes using repository context.
- As the community grows, AgentKit needs a second bootstrap path that installs a skill into the project, without breaking existing template behavior.

Users need a clear split between **CLI bootstrap** (one-time: copy templates *or* install skill) and **skill workflows** (ongoing in the agent: `agentkit init`, `agentkit update`, `agentkit doctor`, `agentkit repair`, `agentkit learn`).

## Solution

Introduce two **CLI bootstrap paths** and one **bundled Agent Skill** with internal workflow routes.

### CLI (terminal) — bootstrap only

| Command | Purpose |
| --- | --- |
| `agentkit init` | **Template path only.** Copies bundled templates, personalization, managed blocks, optional config. Behavior unchanged. |
| `agentkit skill install` | **Skill path.** Installs bundled `agentkit` skill into project, writes `agentkit.config.json` with `installMode: "skill"` and `agentkitVersion`. Does **not** create guidance `.md` files. |
| `agentkit update` | **Template-path maintenance only.** Merges upstream bundled content inside managed blocks. Unchanged for template installs. |

First-time setup UX asks users to pick a path (interactive entry point TBD — see Implementation Decisions), then runs the appropriate **CLI** command above.

### Skill (agent session) — ongoing workflows

After `agentkit skill install`, users invoke workflows **through the bundled skill**, not through new CLI subcommands:

| Skill workflow | Purpose |
| --- | --- |
| `agentkit init` | Agent creates guidance `.md` files from repo context (first-time or missing files) |
| `agentkit update` | Agent syncs guidance after code or package changes |
| `agentkit doctor` | Agent audits guidance against best practices |
| `agentkit repair` | Agent repairs guidance structure after explicit request |
| `agentkit learn` | Agent teaches recent codebase changes and checks user understanding |

These are **routes inside one skill** (`SKILL.md` router → `references/init.md`, `references/update.md`, `references/doctor.md`, `references/repair.md`, `references/learn.md`), not separate skills and not CLI commands on the skill path.

### v0.9.x scope

- CLI: `agentkit skill install` + interactive bootstrap choice
- Skill: routed workflows for `init`, `update`, `doctor`, `repair`, and `learn`
- Codex only (`.agents/skills/agentkit/`)
- CLI `agentkit doctor` not in scope

### Naming contract (critical)

| Name | Where it runs | What it does |
| --- | --- | --- |
| `agentkit init` (CLI) | Terminal | Installs **templates** |
| `agentkit skill install` (CLI) | Terminal | Installs **skill** + config |
| `agentkit init` (skill) | Agent | Creates **guidance files** |
| `agentkit update` (CLI) | Terminal | Template-path managed-block merge |
| `agentkit update` (skill) | Agent | Syncs guidance to repo changes |
| `agentkit doctor` (skill) | Agent | Audits guidance quality |
| `agentkit repair` (skill) | Agent | Repairs guidance structure after explicit request |
| `agentkit learn` (skill) | Agent | Teaches recent changes and checks understanding |

**Never use CLI `agentkit init` for skill installation.**

## User Stories

### Bootstrap (CLI)

1. As a new AgentKit user, I want to choose between copying templates or installing the AgentKit skill at setup time, so that I pick the workflow that fits how I work with AI agents.

2. As a developer who wants immediate offline setup, I want `agentkit init` to copy templates exactly as it does today, so that existing docs, scripts, and npm usage do not break.

3. As a developer on the skill path, I want `agentkit skill install` to install the bundled skill into my project, so that I can run agent workflows in a later session.

4. As a developer who prefers non-interactive CI or scripting, I want `agentkit init --yes` to continue meaning template install only, so that automation is unchanged.

5. As a developer on the skill path, I want `agentkit skill install` to write `agentkit.config.json` with preset, template set, AI tool, and design system choices, so that the agent skill has structured defaults.

6. As a developer on the skill path, I want clear CLI output after `agentkit skill install` explaining the next step (invoke `agentkit init` in the agent), so that I understand why no `.md` files appeared yet.

7. As a developer, I want `--dry-run` on `agentkit skill install` to preview skill files and config without writing guidance templates, so that I can preview safely.

8. As a developer re-running `agentkit skill install`, I want skip-by-default behavior unless `--force`, so that local skill customizations are not overwritten accidentally.

9. As a package consumer, I want the skill bundled inside the published npm package, so that `npx thomas-agentkit skill install` works without extra downloads.

10. As a README reader, I want documentation that clearly separates CLI bootstrap from skill workflows, so that I do not confuse terminal commands with agent invocations.

### Skill workflows (agent)

11. As a Codex user who ran `agentkit skill install`, I want to invoke `agentkit init` in my agent (e.g. `/agentkit init` or natural language), so that the agent creates `AGENTS.md` and companion files from my repository.

12. As a developer on the skill path, I want the agent to inspect my repository (`package.json`, scripts, framework files) when running the **skill** `agentkit init` workflow, so that stack summaries and commands reflect reality.

13. As a developer on the skill path, I want the agent to wrap generated content in AgentKit managed block markers during **skill** `agentkit init`, so that template-path `agentkit update` or future skill update can merge safely.

14. As a developer on the skill path, I want the agent to preserve user edits outside managed blocks, so that I do not lose custom documentation.

15. As a developer who selected a preset at skill install, I want **skill** `agentkit init` to create `STACK.md`, so that stack rules match my project type.

16. As a developer whose **skill** `agentkit init` partially completed, I want to re-invoke the skill workflow to finish missing files, so that init can span multiple agent sessions.

17. As an agent using the AgentKit skill, I want a router in `SKILL.md` that directs me to the correct reference (`init`, `update`, `doctor`, `repair`, or `learn`) based on what the user asked, so that I follow one consistent skill.

18. As an agent using the AgentKit skill, I want explicit non-negotiables (preserve user edits, no destructive commands, AGENTS.md as source of truth), so that workflows do not damage the repository.

19. As a developer on the skill path, I want to invoke **skill** `agentkit update` after meaningful code changes, so that guidance stays aligned with the repo without me editing `.md` files manually.

20. As a developer on the skill path, I want to invoke **skill** `agentkit doctor` to audit guidance quality, so that I catch stale placeholders, wrong commands, or missing companion files.

21. As a developer on the skill path, I want to invoke **skill** `agentkit repair` after explicit structural repair requests, so that malformed managed blocks, thick adapters, or unmanaged guidance can be made safe for updates.

22. As a developer after an agent session, I want to invoke **skill** `agentkit learn`, so that I can understand what changed, why it changed, how the code works, what edge cases matter, and what impact the work has.

### Config, compatibility, and maintenance

23. As a developer, I want `installMode` recorded in config (`template` | `skill`), so that tooling knows how the repo was bootstrapped.

24. As a developer, I want `agentkitVersion` recorded at skill install time, so that future workflows can detect version drift.

25. As a template-path user upgrading `thomas-agentkit`, I want CLI `agentkit update` to keep merging managed blocks the same way, so that package upgrades stay predictable.

26. As a skill-path user, I want **skill** `agentkit update` — not CLI `agentkit update` — to be the primary maintenance path, so that guidance sync uses repo context.

27. As an existing template-path user, I want zero changes to `agentkit init` and `agentkit update` CLI behavior, so that npm downloads and current workflows remain valid.

28. As a maintainer, I want the bundled skill validated against the Agent Skills specification, so that discovery and frontmatter remain compatible.

29. As a maintainer, I want Vitest coverage for `agentkit skill install`, so that regressions in skill copying and config writing are caught before publish.

30. As a maintainer, I want the skill description optimized for agent discovery (triggers and symptoms, not workflow summary), so that agents load the full skill body.

31. As a future Cursor or Claude Code user, I want the skill install architecture to support additional tool paths later, so that v1 Codex-only scope does not block expansion.

32. As a project owner, I want project-local skill installation, so that AgentKit setup is versioned with the repository.

## Implementation Decisions

### Scope for v0.9.x

**In scope:**

- New CLI command: `agentkit skill install`
- Interactive bootstrap choice: templates (`agentkit init`) vs skill (`agentkit skill install`)
- Bundled `agentkit` Agent Skill with router + `references/init.md`, `references/update.md`, `references/doctor.md`, `references/repair.md`, `references/learn.md`, and `references/file-contract.md`
- Skill install to Codex: `.agents/skills/agentkit/`
- Extended `agentkit.config.json`: `installMode`, `agentkitVersion`
- README clarifying CLI vs skill naming
- Vitest coverage for `agentkit skill install`

**Out of scope (deferred):**

- CLI `agentkit doctor`
- Template-to-skill upgrade for existing repos
- Cursor, Claude Code, Copilot skill install paths
- Remote skill registries

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FIRST-TIME SETUP (CLI)                   │
├────────────────────────────┬────────────────────────────────┤
│  agentkit init             │  agentkit skill install         │
│  (template path)           │  (skill path)                   │
│  → copies .md templates    │  → copies skill to              │
│  → installMode: template   │    .agents/skills/agentkit/     │
│                            │  → installMode: skill           │
│                            │  → NO .md guidance files yet    │
└────────────────────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ONGOING WORK (AGENT + SKILL)                │
├─────────────────────────────────────────────────────────────┤
│  agentkit init   → references/init.md    → create .md files │
│  agentkit update → references/update.md  → sync guidance    │
│  agentkit doctor → references/doctor.md  → audit guidance   │
│  agentkit repair → references/repair.md  → repair structure │
│  agentkit learn  → references/learn.md   → teach changes    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              TEMPLATE-PATH MAINTENANCE (CLI only)            │
│  agentkit update → managed-block merge (unchanged)          │
└─────────────────────────────────────────────────────────────┘
```

### Interactive bootstrap entry point

**Recommended for v1:** Add prompts to **both** entry commands when run interactively in a TTY:

- `agentkit init` — if user has not chosen yet, ask: "Copy templates (this command) or install skill instead? (`agentkit skill install`)"
- `agentkit skill install` — collect preset, template set, design system, personalization defaults for config (same questions as template init, but no file copy)

**Alternative (follow-up):** `agentkit setup` as unified interactive dispatcher. Deferred to avoid adding a third top-level command in v1 unless UX testing shows dual-entry is confusing.

`--yes` on `agentkit init` continues to mean template install with defaults — no skill prompt.

### Install mode contract

- `installMode: "template"` — set by CLI `agentkit init`
- `installMode: "skill"` — set by CLI `agentkit skill install`
- `agentkitVersion` — package version at install time

Existing configs without `installMode` → treat as `"template"`.

### Bundled skill structure

```
templates/skills/agentkit/
├── SKILL.md                      # router to init | update | doctor | repair | learn
├── agents/
│   └── openai.yaml
├── references/
│   ├── init.md
│   ├── file-contract.md
│   ├── update.md
│   ├── doctor.md
│   ├── repair.md
│   └── learn.md
```

**SKILL.md router** (conceptual):

```
User asks for agentkit init     → references/init.md
User asks for agentkit update   → references/update.md
User asks for agentkit doctor   → references/doctor.md
User asks for agentkit repair   → references/repair.md
User asks for agentkit learn    → references/learn.md
Guidance files missing/stale    → references/init.md or update.md based on install state
Before any file edit            → references/file-contract.md
```

### Deep modules (testable interfaces)

#### 1. Skill installer (CLI)

**Responsibility:** Copy bundled skill to project-local path.

**Inputs:** Target dir, `force`, `dryRun`, init options for config (preset, templateSet, etc.).

**Outputs:** Created/skipped skill files, written config.

**Destination (v1):** `.agents/skills/agentkit/`

#### 2. Config schema extension

**Responsibility:** Validate and write `installMode`, `agentkitVersion`.

**Inputs:** Skill install options, package version.

**Outputs:** `agentkit.config.json`.

#### 3. Template installer (CLI) — unchanged

**Responsibility:** Existing `agentkit init` behavior.

**Change:** Sets `installMode: "template"` when `--write-config` or when config is written. No skill logic.

#### 4. Bundled AgentKit skill

**Responsibility:** Agent-side workflows for init / update / doctor / repair / learn.

**v1:** Ship routed workflows for guidance creation, sync, audit, repair, and learning.

**Validation:** `skills-ref validate` in CI; subagent pressure tests for shipped workflows.

#### 5. Bootstrap UX (CLI prompts)

**Responsibility:** Help users pick the right CLI command without conflating skill workflows.

**v1:** Documentation-first; light cross-prompts in interactive `init` and `skill install`.

### CLI UX copy

**After `agentkit skill install`:**

```
Installed AgentKit skill in .agents/skills/agentkit/
Wrote agentkit.config.json (installMode: skill)

Next step: In your agent, run agentkit init.
The skill will create AGENTS.md and companion files from your repository.
```

**If user runs CLI `agentkit update` on a skill-path repo (v1):**

```
This project uses installMode: skill.
Run agentkit update in your agent to sync guidance files.
(CLI agentkit update applies to template-path installs.)
```

Optional v1 behavior: exit 0 with message, or exit 1 — **recommend exit 0 with clear message** to avoid breaking scripts.

### Upgrade path (deferred)

Existing template installs cannot convert to skill mode in v1. Follow-up issue after v1 ships.

### Publishing

Skill under `templates/skills/` inside existing `files` whitelist. No new dependencies.

## Testing Decisions

### What makes a good test

- Test observable CLI behavior: files created/skipped, stdout, exit codes, config content
- Do not test private implementation details unless exported (existing pattern)
- Integration tests via `spawnSync` on `dist/cli.js` (prior art in `agentkit.test.ts`)
- Skill bundle: required files exist; `skills-ref validate` passes

### Modules to test

| Module | Test type |
| --- | --- |
| Skill installer | Integration: `agentkit skill install` copies to `.agents/skills/agentkit/` |
| Config schema | Integration: `installMode: skill`, invalid values rejected |
| Template init unchanged | Integration: `agentkit init` still creates `AGENTS.md`; no skill files |
| CLI update on skill repo | Integration: informative message, no unintended file writes |
| Bundled skill | CI: `skills-ref validate`; reference files present |

### Pressure tests (pre-release, subagent)

- **Skill** `agentkit init` on repo with `package.json` — no unrelated overwrites
- **Skill** `agentkit init` — managed blocks present
- **Skill** `agentkit init` — commands match `package.json` scripts, not invented
- **Skill** `agentkit update` — updates only managed guidance and creates configured missing files
- **Skill** `agentkit doctor` — reports findings without editing by default
- **Skill** `agentkit repair` — repairs only clear structural issues after explicit request
- **Skill** `agentkit learn` — teaches recent changes without writing files by default

## Out of Scope

- CLI `agentkit doctor`
- Template-to-skill upgrade
- Cursor / Claude / Copilot skill install paths
- Changing CLI `agentkit init` or `agentkit update` semantics for template path
- `--mode skill` flag on `agentkit init` (explicitly rejected — skill install is its own command)
- Remote skill registry

## Further Notes

### Why one skill, not three

`init`, `update`, `doctor`, `repair`, and `learn` share one product surface. One `agentkit` skill with a router and `references/` avoids duplicated contracts and multiple installs.

### Why CLI `agentkit init` stays template-only

Under Option A, `agentkit init` means two different things in two contexts:

- **CLI:** template bootstrap (historical, documented, scripted)
- **Skill:** guidance file creation (agent-driven)

Keeping CLI `agentkit init` template-only prevents overloading one command and matches how users think about agent workflows (`/agentkit init` in the agent, not in the terminal).

### Backward compatibility

- `agentkit init` — unchanged
- `agentkit update` — unchanged for template-path repos
- No `installMode` in config → `template`
- Package name `thomas-agentkit`; binary `agentkit`

### Follow-up issues after v1

1. Trigger evals for init, update, doctor, repair, learn, and near-miss prompts
2. Optional validation scripts for managed blocks, placeholders, and adapter shape
3. Template-to-skill upgrade
4. Multi-tool skill install paths
5. Optional unified `agentkit setup` interactive dispatcher

### Open question

Should `agentkit skill install` run the same interactive prompts as `agentkit init` (preset, template set, design system, personalization) and store answers in config for the agent? **Recommended yes.**

### Skill authoring reference

Implementation of the bundled skill (router design, progressive disclosure, descriptions, evals, gotchas) is documented in [agentkit-skill-authoring.md](./agentkit-skill-authoring.md), based on [agentskills.io best practices](https://agentskills.io/skill-creation/best-practices).
