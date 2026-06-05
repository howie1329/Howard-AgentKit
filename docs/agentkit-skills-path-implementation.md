# AgentKit Skills Path — Implementation Brief

> **Target release:** v0.9.x  
> **Product spec:** [prd-agentkit-skills-path.md](./prd-agentkit-skills-path.md)  
> **Skill authoring:** [agentkit-skill-authoring.md](./agentkit-skill-authoring.md)

## Goal

Ship two CLI bootstrap paths without breaking existing template behavior:

1. **Template path** — `agentkit init` copies bundled guidance templates (unchanged).
2. **Skill path** — `agentkit skill install` copies the bundled `agentkit` Agent Skill and writes config; guidance `.md` files are created later via the skill workflow in an agent session.

One bundled skill (`templates/skills/agentkit/`) with internal routes for `init`, `update`, and `doctor`. v0.9.x ships the **init** workflow only; update/doctor are router stubs.

## Out of scope for v0.9.x

- Skill workflows: `agentkit update`, `agentkit doctor` (real procedures — stubs only)
- CLI `agentkit doctor`
- Template-to-skill upgrade for existing repos
- Cursor, Claude Code, Copilot skill install paths (Codex only: `.agents/skills/agentkit/`)
- Remote skill registries
- `--mode skill` on `agentkit init` (rejected — skill install is its own command)

## File map

### New — bundled skill (published via npm)

```
templates/skills/agentkit/
├── SKILL.md
├── references/
│   ├── init.md
│   ├── file-contract.md
│   ├── update.md          # stub in v0.9.x
│   └── doctor.md          # stub in v0.9.x
```

`assets/templates/` mirror of CLI templates is **deferred** — agents read canonical patterns from `references/file-contract.md` and inspect the repo; add mirror only if init evals show agents need byte-level templates.

### Modified — CLI and tests

| Path | Change |
| --- | --- |
| `src/cli.ts` | Add `skill install` subcommand; extend config schema; bootstrap cross-prompts |
| `test/agentkit.test.ts` | Integration tests for skill install, config, update-on-skill-repo message |
| `README.md` | Bootstrap paths, naming contract (docs phase may land before code) |

## CLI work items

### 1. `agentkit skill install [target]`

- Copy `templates/skills/agentkit/` → `.agents/skills/agentkit/` in target project
- Skip existing skill files by default; `--force` overwrites
- `--dry-run` prints planned skill files and config without writing
- Reuse interactive prompts from `agentkit init` for preset, template set, design system, AI tools, personalization — store answers in config, **do not** copy guidance `.md` templates
- Write `agentkit.config.json` with `installMode: "skill"` and `agentkitVersion` (package version at install time)
- Support `--write-config`, `--yes`, `--preset`, `--design-system` parity where applicable

### 2. Config schema extension

Add to `AgentKitConfig`:

```json
{
  "installMode": "skill",
  "agentkitVersion": "0.9.0"
}
```

- Valid `installMode`: `"template"` | `"skill"`
- Existing configs without `installMode` → treat as `"template"`
- Reject unknown `installMode` values at load time

### 3. `agentkit init` — minimal change

- Set `installMode: "template"` when config is written (`--write-config` or interactive write)
- Interactive TTY: light cross-prompt — "Copy templates (this command) or install skill instead? (`agentkit skill install`)"
- `--yes` continues to mean template install with defaults — **no** skill prompt

### 4. `agentkit update` — skill-path guard

When `installMode: "skill"` in target config:

- Print informative message (exit 0)
- Do not write guidance files

```
This project uses installMode: skill.
Run agentkit update in your agent to sync guidance files.
(CLI agentkit update applies to template-path installs.)
```

Skill `agentkit update` workflow is deferred — message may note "coming soon".

## Naming contract

| Name | Where | What |
| --- | --- | --- |
| `agentkit init` | Terminal | Install **templates** |
| `agentkit skill install` | Terminal | Install **skill** + config |
| `agentkit init` | Agent | Create **guidance files** |
| `agentkit update` | Terminal | Template-path managed-block merge |
| `agentkit update` | Agent | Sync guidance (deferred) |
| `agentkit doctor` | Agent | Audit guidance (deferred) |

**Never use CLI `agentkit init` for skill installation.**

## CLI UX copy

**After `agentkit skill install`:**

```
Installed AgentKit skill in .agents/skills/agentkit/
Wrote agentkit.config.json (installMode: skill)

Next step: In your agent, run agentkit init.
The skill will create AGENTS.md and companion files from your repository.
```

## Bundled skill v1 scope

- **Ship:** `SKILL.md` router, `references/init.md`, `references/file-contract.md`
- **Stub:** `references/update.md`, `references/doctor.md`
- **Validate:** `skills-ref validate ./templates/skills/agentkit` in CI
- Authoring detail: [agentkit-skill-authoring.md](./agentkit-skill-authoring.md)

## Test plan

| Module | Test type |
| --- | --- |
| Skill installer | Integration: `agentkit skill install` copies to `.agents/skills/agentkit/` |
| Config schema | Integration: `installMode: skill`, invalid values rejected |
| Template init unchanged | Integration: `agentkit init` still creates `AGENTS.md`; no skill files |
| CLI update on skill repo | Integration: informative message, no unintended file writes |
| Bundled skill | CI: `skills-ref validate`; reference files present |

Pressure tests (pre-release, subagent):

- Skill `agentkit init` on repo with `package.json` — no unrelated overwrites
- Skill `agentkit init` — managed blocks present
- Skill `agentkit init` — commands match `package.json` scripts, not invented

## Definition of done (v0.9.x)

- [ ] `agentkit skill install` works with `--dry-run`, `--force`, skip-by-default
- [ ] Skill installed to `.agents/skills/agentkit/`
- [ ] `agentkit.config.json` written with `installMode: skill`, `agentkitVersion`, and install choices
- [ ] `agentkit init` behavior unchanged for template path; sets `installMode: template` when config written
- [ ] CLI `agentkit update` on skill-path repo prints message, exits 0, no file writes
- [ ] Bundled skill passes `skills-ref validate`
- [ ] Vitest integration tests cover skill install and config
- [ ] README documents bootstrap paths and naming contract
- [ ] npm publish includes `templates/skills/` via existing `files` whitelist

## Follow-up after v0.9.x

1. Skill `agentkit update` workflow (`references/update.md`)
2. Skill `agentkit doctor` workflow (`references/doctor.md`)
3. Template-to-skill upgrade
4. Multi-tool skill install paths (Cursor, Claude Code)
5. Optional unified `agentkit setup` interactive dispatcher
