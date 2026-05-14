# AgentKit CLI

AgentKit CLI bootstraps AI-agent-ready repositories.

It installs reusable instructions, planning templates, review docs, design system rules, and workflow guidance for developers using Codex, Cursor, GitHub Copilot, Claude Code, and similar coding agents.

AgentKit is not an AI agent. It is a small scaffolding tool for making repositories easier and safer to work on with AI-assisted development.

## Usage

Install templates into the current directory:

```bash
npx thomas-agentkit init
```

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

Config values are validated when loaded. Unknown config keys, invalid preset/template/design-system names, invalid AI tool names, and non-string personalization values exit with an error.

List bundled templates:

```bash
npx thomas-agentkit --list
```

List available presets:

```bash
npx thomas-agentkit --list-presets
```

List bundled design systems (source variants for `DESIGN-SYSTEM.md`):

```bash
npx thomas-agentkit --list-design-systems
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

Bundled design system guidance is stored under `templates/design-systems/` in this repository (for example `linear.md`, `apple.md`). The CLI installs the chosen variant into `DESIGN-SYSTEM.md` in the target project; variant paths are not separate install targets.

Existing files are skipped by default so local edits are preserved. Use `--force` when you intentionally want to refresh files from the bundled package version.

New installs wrap generated template content in AgentKit managed block markers:

```html
<!-- agentkit:start agents -->
Generated content
<!-- agentkit:end agents -->
```

`agentkit update` creates missing managed files. For existing files, it only replaces content inside matching managed blocks. User edits before or after those blocks are preserved. Existing legacy files without managed blocks are reported as unmanaged and left untouched. Files with malformed managed block markers are skipped.

Interactive personalization only applies during `agentkit init` when files are created or overwritten. It does not write a config file unless `--write-config` is passed, and `agentkit update` does not reapply personalized values.

`agentkit.config.json` can set `preset`, `templateSet`, `designSystem`, `aiTools`, and `personalization` defaults. `templateSet` may be `minimal`, `standard`, or `full`; `designSystem` selects which bundled design-system variant fills `DESIGN-SYSTEM.md` (`linear` or `apple`); `aiTools` may include `codex`, `cursor`, `claude`, and `copilot`. `agentkit update` uses config `preset` and `designSystem` and continues to update all managed bundled templates.

Template set mappings:

- `minimal`: `AGENTS.md`
- `standard`: `AGENTS.md`, `CODE-QUALITY.md`, `DESIGN-SYSTEM.md`, `WORKFLOWS.md`
- `full`: all bundled templates

AI tool mappings:

- `codex`: `AGENTS.md`
- `cursor`: `.cursor/rules/agentkit.md`
- `claude`: `CLAUDE.md`
- `copilot`: `.github/copilot-instructions.md`

## Presets

Presets add stack-specific guidance without scaffolding framework app files.

- `next`
- `sveltekit`
- `express`
- `convex`
- `fullstack` (`Next.js` + `Convex`)

## CLI Reference

```text
agentkit init [target] [--force] [--dry-run] [--interactive] [--yes] [--write-config] [--preset <name>] [--design-system <name>]
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
- `--write-config`: write resolved install defaults to `agentkit.config.json`
- `--preset <name>`: install stack-specific guidance (`next`, `sveltekit`, `express`, `convex`, `fullstack`)
- `--design-system <name>`: design system variant for `DESIGN-SYSTEM.md` (`linear`, `apple`)
- `--list`: list bundled template files
- `--list-presets`: list available presets
- `--list-design-systems`: list available design systems
- `-h, --help`: show help
- `-v, --version`: show package version

For `agentkit update`, `--preset <name>` refreshes preset-specific managed content, including `STACK.md`. `--design-system <name>` refreshes the managed `DESIGN-SYSTEM.md` body from the matching bundled variant.

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
