# AgentKit CLI

AgentKit CLI bootstraps AI-agent-ready repositories.

It installs reusable agent instructions, workflow guides, quality checklists, design system rules, planning templates, and tool adapters for developers using Codex, Cursor, GitHub Copilot, Claude Code, and similar coding agents.

AgentKit is not an AI agent. It is a small scaffolding tool for making repositories easier and safer to work on with AI-assisted development.

## Bootstrap paths

AgentKit supports two first-time setup paths. Pick one — they are not interchangeable.

| | Template path | Skill path |
| --- | --- | --- |
| **CLI command** | `agentkit init` | `agentkit skill install` |
| **When to use** | Immediate offline setup; you want files now | Agent-guided setup; guidance created from your repo in a later session |
| **What you get** | Bundled `.md` templates copied into the project | Bundled `agentkit` Agent Skill installed; no guidance `.md` files yet |
| **Ongoing maintenance** | CLI `agentkit update` (managed-block merge) | Skill routes in your agent: `/agentkit update`, `/agentkit doctor`, `/agentkit repair`, `/agentkit learn` |
| **Config** | `installMode: template` | `installMode: skill` |

```text
FIRST-TIME SETUP (terminal)
├── agentkit init              → copies templates, installMode: template
└── agentkit skill install     → copies skill to .agents/skills/agentkit/, installMode: skill

ONGOING WORK (agent + skill path only)
├── /agentkit init   → agent creates AGENTS.md and companion files from repo context
├── /agentkit update → agent syncs guidance after code changes
├── /agentkit doctor → agent audits guidance quality
├── /agentkit repair → agent repairs guidance structure when explicitly requested
└── /agentkit learn  → agent teaches what changed after implementation
```

Interactive `agentkit init` asks whether to copy templates or install the AgentKit skill, then runs the chosen path in the same session.

## Usage

### Template path

Install templates into the current directory:

```bash
npx thomas-agentkit init
```

### Skill path

Install the bundled AgentKit skill (v0.9.x+). This does **not** create `AGENTS.md` or other guidance files — run `/agentkit init` in your agent afterward:

```bash
npx thomas-agentkit skill install
```

Preview skill install without writing files:

```bash
npx thomas-agentkit skill install --dry-run
```

Overwrite an existing skill install:

```bash
npx thomas-agentkit skill install --force
```

After install, the CLI prints:

```text
Installed AgentKit skill in .agents/skills/agentkit/
Wrote agentkit.config.json (installMode: skill)

Next step: In your agent, run agentkit init.
The skill will create AGENTS.md and companion files from your repository.
```

After skill install, use the project-local skill from your agent:

- `/agentkit init` creates missing guidance files from repository context.
- `/agentkit update` syncs managed guidance with current repository context.
- `/agentkit doctor` audits guidance quality without editing by default.
- `/agentkit repair` repairs guidance structure, such as malformed managed blocks or thick AI adapters, after an explicit request.
- `/agentkit learn` teaches recent codebase changes, design decisions, edge cases, validation, and impact without writing files by default.

If the package is installed in a project, use the local `agentkit` binary:

```bash
npm install -D thomas-agentkit
npx agentkit init
```

By default, `init` opens a short interactive setup flow in terminals. It asks where to install files, what project type or preset to use, which AI tools you use, which template set to install, how to handle existing files, and whether to personalize repository-level placeholders such as project name, description, issue tracker, docs paths, stack summary, and project commands.

Install into another directory:

```bash
npx thomas-agentkit init ./my-project
```

Accept defaults without prompts:

```bash
npx thomas-agentkit init --yes
```

`--yes` installs the `standard` template set, keeps templates generic, and leaves placeholders for later editing.

Preview changes without writing files:

```bash
npx thomas-agentkit init --yes --dry-run
```

Overwrite existing files:

```bash
npx thomas-agentkit init --force
```

Update AgentKit-managed template sections:

```bash
npx thomas-agentkit update
```

Preview updates without writing files:

```bash
npx thomas-agentkit update --dry-run
```

Explicitly request the interactive flow:

```bash
npx thomas-agentkit init --interactive
```

Install stack-specific agent guidance:

```bash
npx thomas-agentkit init --preset next
```

Standardize install defaults with `agentkit.config.json`:

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

AgentKit reads `agentkit.config.json` from the target directory first. When installing into another target that does not have a config file, it falls back to the current working directory. Config values are defaults: explicit CLI flags override them.

Create a config file from resolved install choices:

```bash
npx thomas-agentkit init --write-config
```

`--write-config` writes `agentkit.config.json` in the target directory. Existing config files are skipped by default; use `--force` to overwrite one intentionally.

`installMode` is `"template"` or `"skill"` and records how the project was bootstrapped. `agentkitVersion` records the package version at install time. Configs without `installMode` are treated as template-path installs.

Config values are validated when loaded. Unknown config keys, invalid preset/template/design-system names, invalid AI tool names, invalid `installMode` values, and non-string personalization values exit with an error.

List bundled templates:

```bash
npx thomas-agentkit --list
```

List available presets:

```bash
npx thomas-agentkit --list-presets
```

List bundled design baselines (source variants for `DESIGN.md`):

```bash
npx thomas-agentkit --list-design-systems
```

## Installed Files

AgentKit can copy these bundled files into the target project:

- `AGENTS.md`
- `CHANGE-EXPLANATION.md`
- `CLAUDE.md`
- `CODE-QUALITY.md`
- `DESIGN.md`
- `IMPLEMENTATION-BRIEF-TEMPLATE.md`
- `PRD-TEMPLATE.md`
- `SECURITY-CHECKLIST.md`
- `TESTING.md`
- `WORKFLOWS.md`
- `.cursor/rules/agentkit.md`
- `.github/copilot-instructions.md`
- `.github/pull_request_template.md`

When a preset is selected, AgentKit also installs `STACK.md` and adds a note in `AGENTS.md` telling agents to read it before changing stack-specific code.

Bundled design baselines are stored under `templates/design-systems/` in this repository (`linear`, `apple`, `cursor`, `framer`, `notion`, `warp`). The CLI installs the chosen variant into `DESIGN.md` in the target project; variant paths are not separate install targets. The bundled AgentKit skill also ships copies under `references/design-baselines/` for `/agentkit design`.

Existing files are skipped by default so local edits are preserved. Use `--force` when you intentionally want to refresh files from the bundled package version.

New installs wrap generated template content in AgentKit managed block markers:

```html
<!-- agentkit:start agents -->
Generated content
<!-- agentkit:end agents -->
```

`agentkit update` creates missing managed files. For existing files, it only replaces content inside matching managed blocks. User edits before or after those blocks are preserved. Existing legacy files without managed blocks are reported as unmanaged and left untouched. Files with malformed managed block markers are skipped.

Interactive personalization only applies during `agentkit init` when files are created or overwritten. It does not write a config file unless `--write-config` is passed, and `agentkit update` does not reapply personalized values.

`agentkit.config.json` can set `preset`, `templateSet`, `designSystem`, `aiTools`, and `personalization` defaults. `templateSet` may be `minimal`, `standard`, or `full`; `designSystem` selects which bundled baseline fills `DESIGN.md` (`linear`, `apple`, `cursor`, `framer`, `notion`, or `warp`); `aiTools` may include `codex`, `cursor`, `claude`, and `copilot`. `agentkit update` uses config `preset` and `designSystem` and continues to update all managed bundled templates.

Template set mappings:

- `minimal`: `AGENTS.md`
- `standard`: `AGENTS.md`, `CHANGE-EXPLANATION.md`, `CODE-QUALITY.md`, `DESIGN.md`, `.github/pull_request_template.md`
- `full`: all bundled templates, including AI tool adapters and planning/testing/security guides

AI tool mappings:

- `codex`: `AGENTS.md`
- `cursor`: `.cursor/rules/agentkit.md`
- `claude`: `CLAUDE.md`
- `copilot`: `.github/copilot-instructions.md`

AI tool adapters are thin compatibility files that point back to `AGENTS.md` as the source of truth. They are installed when selected through AI tools or when using the `full` template set.

## Presets

Presets add stack-specific guidance without scaffolding framework app files.

- `next`
- `sveltekit`
- `express`
- `convex`
- `fullstack` (`Next.js` + `Convex`)

## CLI vs agent commands

The same names mean different things in the terminal vs in an agent session:

| Name | Where | What |
| --- | --- | --- |
| `agentkit init` | Terminal | Install **templates** |
| `agentkit skill install` | Terminal | Install **bundled skill** + config |
| `agentkit init` | Agent | Create **guidance files** (skill path) |
| `agentkit update` | Terminal | Template-path managed-block merge only |
| `agentkit update` | Agent | Sync guidance to repo changes |
| `agentkit doctor` | Agent | Audit guidance quality |
| `agentkit repair` | Agent | Repair guidance structure after explicit request |
| `agentkit learn` | Agent | Teach recent codebase changes and check understanding |
| `agentkit design` | Agent | Create or refresh `DESIGN.md` from a bundled baseline |

Never use CLI `agentkit init` for skill installation.

On skill-path repos (`installMode: skill`), CLI `agentkit update` prints an informational message and does not modify guidance files. Use `/agentkit update` in your agent for skill-path guidance sync.

## CLI Reference

```text
agentkit init [target] [--force] [--dry-run] [--interactive] [--yes] [--write-config] [--preset <name>] [--design-system <name>]
agentkit skill install [target] [--force] [--dry-run] [--yes] [--preset <name>] [--design-system <name>]
agentkit update [target] [--dry-run] [--preset <name>] [--design-system <name>]
agentkit --list
agentkit --list-presets
agentkit --list-design-systems
agentkit --help
agentkit --version
```

Options:

- `--force`: overwrite existing files
- `--dry-run`: print planned changes without writing files
- `-i, --interactive`: explicitly prompt for install options
- `-y, --yes`: accept defaults without prompts
- `--write-config`: write resolved template install defaults to `agentkit.config.json`
- `--preset <name>`: install stack-specific guidance (`next`, `sveltekit`, `express`, `convex`, `fullstack`)
- `--design-system <name>`: design baseline for `DESIGN.md` (`linear`, `apple`, `cursor`, `framer`, `notion`, `warp`)
- `--list`: list bundled template files
- `--list-presets`: list available presets
- `--list-design-systems`: list available design systems
- `-h, --help`: show help
- `-v, --version`: show package version

For `agentkit update`, `--preset <name>` refreshes preset-specific managed content, including `STACK.md`. `--design-system <name>` refreshes the managed `DESIGN.md` body from the matching bundled baseline.

## Local Development

```bash
npm install
npm run dev -- init ./tmp-demo --yes --dry-run
npm run build
npm test
```

The npm package is `thomas-agentkit`. The installed CLI command is `agentkit`, backed by the compiled TypeScript entrypoint at `dist/cli.js`.

## Release

Before publishing a new package version:

1. Update the version in `package.json` intentionally.
2. Run the full test suite:

   ```bash
   npm test
   ```

3. Run the package build step:

   ```bash
   npm run prepack
   ```

4. Inspect the publish contents:

   ```bash
   npm pack --dry-run
   ```

5. Publish to npm:

   ```bash
   npm publish
   ```

## Philosophy

AgentKit should stay:

- simple
- practical
- easy to inspect
- easy to modify
- safe by default
- useful immediately
- not overengineered

Installed guidance is **AGENTS-first**: `AGENTS.md` is enough for daily coding, including required change explanations after file edits. Companion files are loaded on explicit triggers (UI, review, security, stack, planning when requested), not on every task. The `full` template set adds optional guides such as `WORKFLOWS.md`, `TESTING.md`, and planning templates.
