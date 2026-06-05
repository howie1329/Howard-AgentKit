# AgentKit Skill Authoring Guide

Internal reference for building the bundled `agentkit` Agent Skill and future workflow routes (`init`, `update`, `doctor`).

**Related docs:**

- [PRD: AgentKit Skills Path](./prd-agentkit-skills-path.md) — product scope and CLI vs skill split
- [Agent Skills specification](https://agentskills.io/specification)
- [Best practices for skill creators](https://agentskills.io/skill-creation/best-practices)
- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)
- [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)

---

## 1. What a skill is (and is not)

Per the [Agent Skills spec](https://agentskills.io/specification), a skill is a directory with at minimum `SKILL.md` (YAML frontmatter + markdown instructions). Optional folders:

| Folder | Purpose |
| --- | --- |
| `references/` | On-demand docs (workflows, contracts, API detail) |
| `scripts/` | Tested executables the agent runs repeatedly |
| `assets/` | Templates, schemas, static resources |
| `evals/` | Test cases for systematic iteration (recommended) |

**Skills are:** reusable procedures, project-specific conventions, reference guides agents would get wrong without help.

**Skills are not:** one-off narratives, generic advice the model already knows, or mechanical checks better done by CLI/scripts alone.

For AgentKit, the skill teaches agents how to **create and maintain repository guidance files** (`AGENTS.md`, companions, adapters, `STACK.md`) using repo context — work the CLI cannot fully judge.

---

## 2. Progressive disclosure (load order)

Agents load skills in three layers. Design around this:

```
Layer 1 — Metadata (~100 tokens, always visible)
  name + description in frontmatter
       ↓ agent decides skill may apply
Layer 2 — SKILL.md body (<500 lines, <5000 tokens recommended)
  router, non-negotiables, gotchas, when to load references
       ↓ agent picks workflow
Layer 3 — references/, scripts/, assets/ (on demand)
  init.md, update.md, doctor.md, file-contract.md, template mirrors
```

**Implications for AgentKit:**

- Keep `SKILL.md` as the **router + shared contract**, not the full init procedure.
- Put step-by-step workflows in `references/init.md` (and later `update.md`, `doctor.md`).
- Put file inventory, managed-block rules, and edit boundaries in `references/file-contract.md`.
- Mirror bundled CLI templates under `assets/templates/` so agents read canonical content without duplicating prose in the skill.

**File reference rule:** link one level deep from `SKILL.md` (e.g. `references/init.md`). Avoid chains like `SKILL.md → a.md → b.md`.

---

## 3. One skill with a router (not three skills)

AgentKit uses **one** `agentkit` skill with internal workflow routes.

| Approach | Verdict |
| --- | --- |
| One `agentkit` skill + `references/init|update|doctor.md` | **Recommended** — shared file contract, one install, one description to tune |
| Separate `agentkit-init`, `agentkit-update`, `agentkit-doctor` skills | Avoid — duplicated contract, version drift, triple install UX |
| Workflow summary in YAML `description` | Avoid — agents shortcut the body and skip the router |

`init`, `update`, and `doctor` share:

- The same managed-block format
- The same file inventory rules
- The same `AGENTS.md`-first source-of-truth model
- The same `agentkit.config.json` semantics

They differ only in **procedure** — perfect fit for `references/` routes, not separate skills.

### Router design pattern

`SKILL.md` should contain an explicit **Route** section. Order matters: check explicit user intent first, then symptoms.

```markdown
## Route

Read `references/file-contract.md` before editing any AgentKit-managed file.

1. User asks to **initialize** AgentKit guidance, or `AGENTS.md` is missing
   → `references/init.md`

2. User asks to **update** or **sync** guidance after code/stack changes
   → `references/update.md`

3. User asks to **doctor**, **audit**, or **review** guidance quality
   → `references/doctor.md`

4. Unsure which workflow applies
   → If no guidance files exist: `init.md`
   → If files exist but stale/wrong commands: `update.md`
   → If user wants a quality pass only: `doctor.md`
```

**Router rules:**

- **Defaults, not menus** — pick the most likely route when ambiguous; mention escape hatches briefly ([best practices](https://agentskills.io/skill-creation/best-practices#provide-defaults-not-menus)).
- **Procedures over declarations** — teach *how* to inspect the repo and decide what to write, not a single fixed file list for every project ([best practices](https://agentskills.io/skill-creation/best-practices#favor-procedures-over-declarations)).
- **Do not embed full workflows in the router** — the router only decides *which reference to load*.

### v1 stubs for deferred workflows

Ship `references/update.md` and `references/doctor.md` as short stubs in v1 so the router stays stable:

```markdown
# agentkit update (not yet available in this package version)

This workflow is not shipped in v0.9.x. Tell the user:
- Template-path repos: run CLI `agentkit update`
- Skill-path repos: this workflow is coming soon; manually edit or re-run init for missing files
```

Stubs prevent the agent from improvising update/doctor behavior without guidance.

---

## 4. Writing the `description` field (discovery)

The `description` is the **only** signal at Layer 1. If it fails, the skill never loads.

Official guidance ([optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)):

- Use **imperative** phrasing: "Use when…" / "Use this skill when…"
- Focus on **user intent**, not internal mechanics
- Include **keywords** agents would match (file names, symptoms, commands)
- Be **concise** (hard limit 1024 characters)
- List contexts explicitly, including when the user does not say "AgentKit"

### AgentKit description (draft)

```yaml
---
name: agentkit
description: Use when bootstrapping, updating, or auditing AgentKit-managed repository guidance (AGENTS.md, STACK.md, companion guides) in a skill-path project — including after agentkit skill install, when guidance files are missing, placeholders remain, project commands are stale, or the user asks to run agentkit init, agentkit update, or agentkit doctor in the agent.
compatibility: Requires agentkit CLI and agentkit.config.json with installMode skill, or existing AgentKit-managed files with block markers.
metadata:
  author: thomas-agentkit
  version: "1.0"
---
```

### Description anti-patterns

| Bad | Why |
| --- | --- |
| "Creates AGENTS.md, then updates stack, then runs checklist" | Agent follows description instead of reading router ([CSO trap](https://agentskills.io/skill-creation/best-practices)) |
| "Helps with documentation" | Too vague to trigger |
| "Use for init" only | Misses update/doctor/stale-guidance triggers |

### Trigger eval queries (recommended)

Maintain `evals/trigger-queries.json` (~20 queries: 10 should-trigger, 10 should-not-trigger). Examples:

**Should trigger:**

- "I ran agentkit skill install — set up my AGENTS.md from this Next.js repo"
- "my AGENTS.md still has [Project Name] placeholders"
- "run agentkit doctor on our guidance files"
- "we switched from npm to pnpm, update the command table in AGENTS.md"

**Should not trigger (near-misses):**

- "write a README for this project" (generic docs, not AgentKit contract)
- "run agentkit init" in terminal context (CLI template install — skill may still help if user clarifies agent session, but test precision)
- "review my PR code changes" (code review, not guidance audit)

Run trigger evals across description iterations ([optimization loop](https://agentskills.io/skill-creation/optimizing-descriptions#the-optimization-loop)).

---

## 5. Context budget — what to include

From [best practices — spending context wisely](https://agentskills.io/skill-creation/best-practices#spending-context-wisely):

> Ask each piece: "Would the agent get this wrong without this instruction?" If no, cut it.

**Include in AgentKit skill:**

- Managed block marker format (`<!-- agentkit:start id -->` … `<!-- agentkit:end id -->`)
- `AGENTS.md` is source of truth; adapters stay thin
- Preserve user content **outside** managed blocks
- Read `package.json` scripts before writing command tables
- Read `agentkit.config.json` for preset, templateSet, aiTools, personalization defaults
- AgentKit-specific gotchas (below)

**Omit:**

- What `AGENTS.md` is in general
- How markdown works
- Generic "follow best practices" advice
- Full template text (point to `assets/templates/` instead)

### Coherent unit test

The `agentkit` skill should cover **one coherent unit**: maintaining AgentKit guidance files in a repository. It should not also cover general code review, feature implementation, or CLI packaging — those are separate skills or the main agent job.

---

## 6. Calibrating control per workflow

Match prescriptiveness to fragility ([best practices — calibrating control](https://agentskills.io/skill-creation/best-practices#calibrating-control)).

| Workflow | Fragility | Control level |
| --- | --- | --- |
| **init** | High — wrong files, no managed blocks, overwritten user edits | Prescriptive: checklist, plan-validate-execute, mandatory `file-contract.md` |
| **update** | High — must not touch user sections; must sync real repo state | Prescriptive: diff plan before write, validate against `file-contract.md` |
| **doctor** | Lower — audit can use judgment | Flexible: severity rubric (Blocker / Concern / Suggestion), report template |

### init — prescriptive patterns

Use all of these in `references/init.md`:

1. **Checklist** — multi-step with dependencies
2. **Plan-validate-execute** — list files to create from config + contract, validate plan, then write
3. **Validation loop** — after writes, re-read files and confirm markers/placeholders
4. **Output template** — doctor-style report optional; init ends with file list + unresolved placeholders

Example checklist skeleton:

```markdown
## init checklist

- [ ] Read `agentkit.config.json` (or note absent and infer minimal set)
- [ ] Read `references/file-contract.md` — determine expected files
- [ ] Inspect repo: package.json, framework signals, existing docs
- [ ] Draft file plan (paths only) — do not write yet
- [ ] Validate plan against file-contract
- [ ] Write files with managed blocks from `assets/templates/` base content
- [ ] Personalize placeholders from repo evidence
- [ ] Re-read outputs — confirm markers, no invented commands
```

### doctor — flexible patterns

Provide a **report template** ([templates for output format](https://agentskills.io/skill-creation/best-practices#templates-for-output-format)):

```markdown
## AgentKit doctor report

### Blockers
- ...

### Concerns
- ...

### Suggestions
- ...

### Verified OK
- ...
```

---

## 7. Gotchas (highest-value content)

Keep project-specific gotchas in `SKILL.md` or early in `references/file-contract.md` so agents read them **before** hitting the situation ([gotchas sections](https://agentskills.io/skill-creation/best-practices#gotchas-sections)).

**AgentKit gotchas (seed list — extend from real corrections):**

| Gotcha | Reality |
| --- | --- |
| CLI `agentkit init` vs skill `agentkit init` | CLI installs **templates**; skill workflow **creates guidance files**. Never confuse them. |
| `installMode: skill` but no `.md` files yet | Expected after `agentkit skill install` — run skill init, not CLI init. |
| Personalization only at CLI on template path | Skill path: agent fills placeholders from repo during skill init. |
| Managed blocks required for CLI `update` | Skill init must wrap AgentKit-owned sections in markers. |
| User edits outside blocks | CLI `update` preserves them; skill workflows must too. |
| `templateSet: minimal` | Do not install `TESTING.md`, `WORKFLOWS.md`, etc. |
| AI tool adapters | Thin pointers to `AGENTS.md` — do not duplicate operating rules. |
| Invented npm scripts | Commands must come from `package.json` scripts or user-provided config. |
| `DESIGN-SYSTEM.md` | Comes from bundled design-system variant in config, not invented styling rules. |
| `STACK.md` | Only when preset is set in config; use bundled stack guidance patterns. |

When an agent makes a mistake in testing, add the correction here — this is the fastest improvement loop.

---

## 8. Scripts — when to bundle

From [bundling reusable scripts](https://agentskills.io/skill-creation/best-practices#bundling-reusable-scripts): if traces show the agent reinventing the same logic every run, extract a script.

**Good AgentKit script candidates:**

| Script | Purpose |
| --- | --- |
| `scripts/validate-markers.sh` | Check managed block pairs, malformed markers |
| `scripts/list-expected-files.js` | Given config JSON, print file inventory from contract |
| `scripts/check-placeholders.sh` | Fail if `[Project Name]`-style placeholders remain |

**Keep in CLI, not skill:** template byte copying, npm package version reads, skill directory install — deterministic and already tested in Vitest.

**Skill scripts** supplement agent judgment; they do not replace the CLI.

---

## 9. Evaluation strategy

Follow [evaluating skills](https://agentskills.io/skill-creation/evaluating-skills):

### Two eval types

| Type | File | Tests |
| --- | --- | --- |
| **Trigger evals** | `evals/trigger-queries.json` | Does the skill activate on the right user messages? |
| **Output evals** | `evals/evals.json` | Does the skill produce correct files and behavior? |

### Output eval cases (start with 2–3, expand)

```json
{
  "skill_name": "agentkit",
  "evals": [
    {
      "id": 1,
      "prompt": "I ran agentkit skill install on this Next.js repo. Initialize AgentKit guidance.",
      "expected_output": "AGENTS.md and standard-set companions created with managed blocks; commands from package.json; STACK.md present; placeholders filled from repo.",
      "files": ["evals/fixtures/next-minimal/"]
    },
    {
      "id": 2,
      "prompt": "agentkit init — add missing CODE-QUALITY.md only, don't touch my custom section before the marker",
      "expected_output": "Only missing file created; existing user content outside markers preserved.",
      "files": ["evals/fixtures/partial-install/"]
    }
  ]
}
```

### Assertions (add after first run)

- `AGENTS.md` exists and contains `<!-- agentkit:start agents -->`
- No `[Project Name]` left when repo has `package.json` name
- Command table matches actual scripts
- Files match `templateSet` in config

### Iteration loop

1. Run evals without skill changes (baseline)
2. Read traces — vague steps, wrong tool use, skipped contract
3. Patch skill (gotchas, checklist, router)
4. Re-run evals
5. Repeat until pass rate acceptable

Also run `skills-ref validate ./templates/skills/agentkit` in CI ([spec validation](https://agentskills.io/specification#validation)).

---

## 10. Recommended bundled skill layout

```
templates/skills/agentkit/
├── SKILL.md
├── references/
│   ├── init.md
│   ├── update.md          # stub in v0.9.x
│   ├── doctor.md          # stub in v0.9.x
│   └── file-contract.md
├── assets/
│   └── templates/         # mirror of templates/ at package build or copy time
├── scripts/
│   ├── validate-markers.sh
│   └── check-placeholders.sh
└── evals/
    ├── evals.json
    ├── trigger-queries.json
    └── fixtures/
```

### SKILL.md recommended sections

1. **Overview** — one sentence
2. **When to use / When not to use**
3. **Route** — workflow router table
4. **Non-negotiables** — preserve user edits, no destructive ops, AGENTS-first
5. **Gotchas** — AgentKit-specific table
6. **Quick reference** — which reference file for which user phrase

Keep under 500 lines. Heavy content lives in `references/`.

---

## 11. CLI ↔ skill contract

The skill and CLI must agree on mechanics ([PRD](./prd-agentkit-skills-path.md)):

| Concern | Owner |
| --- | --- |
| `agentkit skill install` | CLI |
| `agentkit init` (terminal) | CLI — templates only |
| `agentkit init` (agent) | Skill — creates guidance files |
| `agentkit update` (terminal) | CLI — template-path managed-block merge |
| `agentkit update` (agent) | Skill — deferred |
| `agentkit doctor` (agent) | Skill — deferred |
| Managed block format | Shared contract in `file-contract.md` |
| `agentkit.config.json` schema | CLI writes; skill reads |

---

## 12. Authoring checklist (pre-ship)

**Specification**

- [ ] `name` matches directory (`agentkit`)
- [ ] `description` ≤ 1024 chars, imperative, trigger-rich, no workflow summary
- [ ] `SKILL.md` < 500 lines
- [ ] `skills-ref validate` passes

**Router**

- [ ] Explicit Route section with ordered conditions
- [ ] `file-contract.md` loaded before any edits
- [ ] Stubs for unreleased workflows (update, doctor)

**Content quality**

- [ ] Every section passes "would the agent get this wrong without it?"
- [ ] Gotchas table populated from real test corrections
- [ ] Defaults chosen (not equal-weight menus)
- [ ] init workflow uses checklist + plan-validate-execute

**Testing**

- [ ] ≥2 output evals with fixtures
- [ ] ≥20 trigger queries with near-miss negatives
- [ ] Subagent pressure test: skill init on sample repo
- [ ] Output files pass `validate-markers` script

**AgentKit alignment**

- [ ] Produced files compatible with CLI `agentkit update --dry-run`
- [ ] Skill does not duplicate CLI install behavior
- [ ] Docs distinguish CLI vs agent `agentkit init`

---

## 13. Sources

Content synthesized from:

- [Agent Skills — Best practices](https://agentskills.io/skill-creation/best-practices) (March 2026 scrape)
- [Agent Skills — Specification](https://agentskills.io/specification)
- [Agent Skills — Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)
- [Agent Skills — Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills)
- AgentKit PRD and prior planning sessions (Option A: CLI bootstrap vs skill workflows)

When official guidance and AgentKit PRD conflict, **PRD wins for product behavior**; **agentskills.io wins for skill format**.
