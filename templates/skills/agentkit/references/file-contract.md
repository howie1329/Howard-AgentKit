# AgentKit File Contract

Read this before creating or editing any AgentKit-managed guidance file.

## Config

Read `agentkit.config.json` from the repository root when present:

| Field | Use |
| --- | --- |
| `installMode` | `"skill"` confirms skill-path project |
| `preset` | Whether to create `STACK.md` and stack-specific rules |
| `templateSet` | `minimal`, `standard`, or `full` — determines file inventory |
| `designSystem` | `linear` or `apple` — variant for `DESIGN-SYSTEM.md` body |
| `aiTools` | Which thin adapter files to create (`codex`, `cursor`, `claude`, `copilot`) |
| `personalization` | Defaults for project name, commands, paths — override with repo facts when available |
| `agentkitVersion` | Package version at skill install — informational |

Configs without `installMode` are treated as template-path installs.

## File inventory by template set

### minimal

- `AGENTS.md`

### standard

- `AGENTS.md`
- `CHANGE-EXPLANATION.md`
- `CODE-QUALITY.md`
- `DESIGN-SYSTEM.md`
- `.github/pull_request_template.md`

### full

All bundled guidance templates, including:

- Everything in `standard`
- `CLAUDE.md`, `.cursor/rules/agentkit.md`, `.github/copilot-instructions.md` (when in `aiTools` or full set)
- `TESTING.md`, `SECURITY-CHECKLIST.md`, `WORKFLOWS.md`
- `PRD-TEMPLATE.md`, `IMPLEMENTATION-BRIEF-TEMPLATE.md`

### AI tool adapters (additive)

| Tool | File |
| --- | --- |
| `codex` | Uses `AGENTS.md` directly |
| `cursor` | `.cursor/rules/agentkit.md` |
| `claude` | `CLAUDE.md` |
| `copilot` | `.github/copilot-instructions.md` |

Adapters are thin: point to `AGENTS.md` as source of truth. Do not duplicate operating rules.

### Preset addition

When `preset` is set (`next`, `sveltekit`, `express`, `convex`, `fullstack`):

- Create `STACK.md` with stack-specific guidance inferred from the repo
- Add a note in `AGENTS.md` telling agents to read `STACK.md` before stack-specific changes

## Managed blocks

AgentKit-owned content must be wrapped in paired markers:

```html
<!-- agentkit:start <id> -->
Generated content
<!-- agentkit:end <id> -->
```

Rules:

- Use stable ids (e.g. `agents`, `stack`, `design-system`)
- One start/end pair per managed section
- User edits **before** or **after** a managed block are preserved — never overwrite them
- Malformed markers block CLI `agentkit update` on template-path repos — keep pairs valid

For new files, wrap the full AgentKit-generated body in a managed block.

## Repository inspection (required before writing)

Inspect before filling guidance:

1. `package.json` — name, description, scripts (test, lint, build, dev)
2. Framework signals — `next.config.*`, `svelte.config.*`, `convex/`, etc.
3. Existing docs paths — `docs/`, design system files
4. Test runner — vitest, jest, playwright config files
5. Package manager — lockfile (`pnpm-lock.yaml`, `package-lock.json`, `bun.lockb`)

Prefer repo facts over config personalization when they conflict. Use config as fallback defaults.

## Placeholder replacement

Replace bracket placeholders with real values from the repo:

| Placeholder | Source |
| --- | --- |
| `[Project Name]` | `package.json` name or directory name |
| `[short project description]` | `package.json` description or README first paragraph |
| `[issue tracker, e.g. Linear or GitHub Issues]` | `personalization.issueTracker` or infer from `.github/` |
| `[design system path, e.g. docs/design-system.md]` | `personalization.designSystemPath` or `DESIGN-SYSTEM.md` |
| `[briefs path, e.g. docs/briefs]` | `personalization.briefsPath` or `docs/briefs` |
| Project Commands table | Real scripts from `package.json` |

Do not leave `[Project Name]`-style placeholders in shipped guidance.

## Edit boundaries

- **Create** missing files from the inventory — skip files that already exist unless user requests refresh
- **Do not** modify application source code, lockfiles, or CI config during init
- **Do not** delete user-written content outside managed blocks
- **Do not** run `git commit`, `git push`, or destructive shell commands

## Compatibility with CLI update

Guidance created by this skill should be compatible with CLI `agentkit update` on template-path repos and future skill update workflows:

- Managed blocks present on AgentKit-owned sections
- File names match bundled template conventions
- `AGENTS.md` remains the router and source of truth
