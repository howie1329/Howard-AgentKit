# AgentKit CLI

AgentKit bootstraps repositories for AI-assisted development. It installs agent instructions, workflow guides, quality checklists, and tool adapters for Codex, Cursor, GitHub Copilot, Claude Code, and similar coding agents.

AgentKit is **not** an AI agent. It is a small scaffolding CLI that copies bundled templates or installs a bundled Agent Skill into your project.

**Package:** `thomas-agentkit` · **Command:** `agentkit` · **Requires:** Node.js 18+

## Quick start

Install the standard template set into the current directory:

```bash
npx thomas-agentkit init --yes
```

That creates `AGENTS.md` and a few companion files. Existing files are skipped unless you pass `--force`.

Preview without writing files:

```bash
npx thomas-agentkit init --yes --dry-run
```

Install as a dev dependency and use the local binary:

```bash
npm install -D thomas-agentkit
npx agentkit init --yes
```

## Choose a setup path

AgentKit has two first-time setup paths. Pick one — they work differently and are not interchangeable.

| | **Template path** | **Skill path** |
| --- | --- | --- |
| **Run in terminal** | `agentkit init` | `agentkit skill install` |
| **Best for** | Offline setup; you want files immediately | Agent-guided setup tailored to your repo |
| **What you get** | Bundled `.md` templates copied into the project | Bundled skill in `.agents/skills/agentkit/`; no guidance files yet |
| **Ongoing maintenance** | `agentkit update` (managed-block merge) | Agent commands: `/agentkit update`, `/agentkit doctor`, etc. |
| **Recorded in config** | `installMode: "template"` | `installMode: "skill"` |

Interactive `agentkit init` asks which path to take, then runs it in the same session.

### Template path

Copy bundled guidance files into your project.

```bash
npx thomas-agentkit init
npx thomas-agentkit init ./my-project
npx thomas-agentkit init --yes
npx thomas-agentkit init --preset next
npx thomas-agentkit init --force
```

Sync managed sections after upgrading AgentKit:

```bash
npx thomas-agentkit update
npx thomas-agentkit update --dry-run
```

### Skill path

Install the bundled AgentKit skill. This does **not** create `AGENTS.md` or other guidance files.

```bash
npx thomas-agentkit skill install
npx thomas-agentkit skill install --dry-run
npx thomas-agentkit skill install --force
```

Then, in your agent session, run `/agentkit init` to create guidance from your repository context.

| Agent command | What it does |
| --- | --- |
| `/agentkit init` | Create missing guidance files from repo context |
| `/agentkit update` | Sync guidance after code changes |
| `/agentkit doctor` | Audit guidance quality (read-only by default) |
| `/agentkit repair` | Fix malformed managed blocks or thick adapters |
| `/agentkit learn` | Teach recent changes and check understanding |
| `/agentkit design` | Create or refresh `DESIGN.md` from a bundled baseline |

On skill-path repos, CLI `agentkit update` does not modify guidance files. Use `/agentkit update` in your agent instead.

## Important naming distinction

`agentkit init` means different things in the terminal vs in an agent:

| Command | Where | Action |
| --- | --- | --- |
| `agentkit init` | Terminal | Install **templates** |
| `agentkit skill install` | Terminal | Install the **bundled skill** |
| `/agentkit init` | Agent | Create **guidance files** (skill path only) |

Do not use CLI `agentkit init` for skill installation.

## What gets installed

### Template sets

| Set | Files |
| --- | --- |
| `minimal` | `AGENTS.md` |
| `standard` | `AGENTS.md`, `CHANGE-EXPLANATION.md`, `CODE-QUALITY.md`, `DESIGN.md`, `.github/pull_request_template.md` |
| `full` | All bundled templates, including AI tool adapters and planning/testing/security guides |

Default with `--yes` is `standard`. The `full` set also includes:

- `CLAUDE.md`, `WORKFLOWS.md`, `TESTING.md`, `SECURITY-CHECKLIST.md`
- `IMPLEMENTATION-BRIEF-TEMPLATE.md`, `PRD-TEMPLATE.md`
- `.cursor/rules/agentkit.md`, `.github/copilot-instructions.md`

### AI tool adapters

Thin compatibility files that point back to `AGENTS.md` as the source of truth:

| Tool | File |
| --- | --- |
| Codex | `AGENTS.md` |
| Cursor | `.cursor/rules/agentkit.md` |
| Claude | `CLAUDE.md` |
| Copilot | `.github/copilot-instructions.md` |

Select tools during interactive init, or install all adapters with the `full` template set.

### Stack presets

Presets add stack-specific `STACK.md` guidance and a note in `AGENTS.md`. They do not scaffold framework app files.

- `next` — Next.js
- `sveltekit` — SvelteKit
- `express` — Express
- `convex` — Convex
- `fullstack` — Next.js + Convex

```bash
npx thomas-agentkit init --preset next
npx thomas-agentkit --list-presets
```

### Design baselines

Choose a bundled baseline for `DESIGN.md`:

`linear` · `apple` · `cursor` · `framer` · `notion` · `warp`

```bash
npx thomas-agentkit init --design-system linear
npx thomas-agentkit --list-design-systems
```

## How updates work

New installs wrap generated content in managed block markers:

```html
<!-- agentkit:start agents -->
Generated content
<!-- agentkit:end agents -->
```

`agentkit update`:

- Creates missing managed files
- Replaces only content inside matching managed blocks
- Preserves user edits outside those blocks
- Skips legacy files without managed blocks (reports them as unmanaged)
- Skips files with malformed block markers

Personalization from interactive init applies only when files are created or overwritten during `init`. `update` does not reapply personalized values.

## Configuration

`agentkit.config.json` in the target directory stores install defaults. AgentKit reads it from the target first; if the target has no config, it falls back to the current working directory. CLI flags override config values.

```bash
npx thomas-agentkit init --write-config
```

Use `--force` to overwrite an existing config intentionally.

Example:

```json
{
  "installMode": "template",
  "agentkitVersion": "0.9.0",
  "preset": "next",
  "templateSet": "standard",
  "designSystem": "linear",
  "aiTools": ["codex", "cursor", "claude"],
  "personalization": {
    "projectName": "Acme CRM",
    "projectDescription": "a customer operations dashboard",
    "issueTracker": "Linear",
    "designSystemPath": "docs/design-system.md",
    "briefsPath": "docs/briefs",
    "testCommand": "pnpm test",
    "lintCommand": "pnpm lint",
    "buildCommand": "pnpm build",
    "stackSummary": "Next.js, TypeScript, PostgreSQL"
  }
}
```

Configs without `installMode` are treated as template-path installs. Invalid keys or values exit with an error.

## CLI reference

```text
agentkit init [target] [options]
agentkit skill install [target] [options]
agentkit update [target] [options]
agentkit --list
agentkit --list-presets
agentkit --list-design-systems
agentkit --help
agentkit --version
```

| Flag | Description |
| --- | --- |
| `--force` | Overwrite existing files |
| `--dry-run` | Show planned changes without writing |
| `-y, --yes` | Accept defaults (no prompts) |
| `-i, --interactive` | Explicitly run the interactive flow |
| `--write-config` | Write resolved defaults to `agentkit.config.json` |
| `--preset <name>` | Stack preset (`next`, `sveltekit`, `express`, `convex`, `fullstack`) |
| `--design-system <name>` | Design baseline for `DESIGN.md` |
| `--list` | List bundled template files |
| `--list-presets` | List available presets |
| `--list-design-systems` | List design baselines |

For `agentkit update`, `--preset` refreshes preset-specific managed content (including `STACK.md`). `--design-system` refreshes the managed `DESIGN.md` body.

## Philosophy

Installed guidance is **AGENTS-first**: `AGENTS.md` is enough for daily coding. Companion files load on explicit triggers — UI work, review, security, stack changes, planning — not on every task.

AgentKit should stay simple, practical, easy to inspect, safe by default, and useful immediately.

## Local development

```bash
npm install
npm run dev -- init ./tmp-demo --yes --dry-run
npm run build
npm test
```

Source: `src/cli.ts` · Built CLI: `dist/cli.js` · Bundled templates: `templates/`

## Release

Before publishing:

1. Bump the version in `package.json`.
2. Run `npm test`.
3. Run `npm run prepack`.
4. Inspect contents with `npm pack --dry-run`.
5. Publish with `npm publish`.

Published package contents: `dist/`, `templates/`, `README.md`.
