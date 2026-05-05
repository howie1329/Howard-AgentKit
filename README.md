# AgentKit CLI

AgentKit CLI bootstraps AI-agent-ready repositories.

It installs reusable instructions, planning templates, review docs, design system rules, and workflow guidance for developers using Codex, Cursor, GitHub Copilot, Claude Code, and similar coding agents.

AgentKit is not an AI agent. It is a small scaffolding tool for making repositories easier and safer to work on with AI-assisted development.

## Usage

Install templates into the current directory:

```bash
npx thomas-agentkit init
```

By default, `init` opens a short interactive setup flow in terminals. After choosing install options, you can optionally personalize repository-level template placeholders such as project name, description, issue tracker, docs paths, stack summary, and project commands.

Install into another directory:

```bash
npx thomas-agentkit init ./my-project
```

Accept defaults without prompts:

```bash
npx thomas-agentkit init --yes
```

`--yes` keeps installed templates generic and leaves placeholders for later editing.

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
  "preset": "next",
  "templateSet": "standard",
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

List bundled templates:

```bash
npx thomas-agentkit --list
```

List available presets:

```bash
npx thomas-agentkit --list-presets
```

## Installed Files

AgentKit copies these bundled files into the target project:

- `AGENTS.md`
- `CLAUDE.md`
- `CODE-QUALITY.md`
- `DESIGN-SYSTEM.md`
- `IMPLEMENTATION-BRIEF-TEMPLATE.md`
- `PRD-TEMPLATE.md`
- `WORKFLOWS.md`
- `.cursor/rules/agentkit.md`
- `.github/copilot-instructions.md`
- `.github/pull_request_template.md`

When a preset is selected, AgentKit also installs `STACK.md` and adds a note in `AGENTS.md` telling agents to read it before changing stack-specific code.

Existing files are skipped by default so local edits are preserved. Use `--force` when you intentionally want to refresh files from the bundled package version.

New installs wrap generated template content in AgentKit managed block markers:

```html
<!-- agentkit:start agents -->
Generated content
<!-- agentkit:end agents -->
```

`agentkit update` only replaces content inside matching managed blocks. User edits before or after those blocks are preserved. Existing legacy files without managed blocks are reported as unmanaged and left untouched.

Interactive personalization only applies during `agentkit init` when files are created or overwritten. It does not write a config file, and `agentkit update` does not reapply personalized values.

`agentkit.config.json` can set `preset`, `templateSet`, `aiTools`, and `personalization` defaults. `templateSet` may be `minimal`, `standard`, or `full`; `aiTools` may include `codex`, `cursor`, `claude`, and `copilot`. `agentkit update` only uses config `preset` and continues to update all managed bundled templates.

## Presets

Presets add stack-specific guidance without scaffolding framework app files.

- `next`
- `sveltekit`
- `express`
- `convex`
- `fullstack` (`Next.js` + `Convex`)

## CLI Reference

```text
agentkit init [target] [--force] [--dry-run] [--interactive] [--yes] [--write-config] [--preset <name>]
agentkit update [target] [--dry-run] [--preset <name>]
agentkit --list
agentkit --list-presets
agentkit --help
agentkit --version
```

Options:

- `--force`: overwrite existing files
- `--dry-run`: print planned changes without writing files
- `-i, --interactive`: explicitly prompt for install options
- `-y, --yes`: accept defaults without prompts
- `--write-config`: write resolved install defaults to `agentkit.config.json`
- `--preset <name>`: install stack-specific guidance (`next`, `sveltekit`, `express`, `convex`, `fullstack`)
- `--list`: list bundled template files
- `--list-presets`: list available presets
- `-h, --help`: show help
- `-v, --version`: show package version

For `agentkit update`, `--preset <name>` refreshes preset-specific managed content, including `STACK.md`.

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
