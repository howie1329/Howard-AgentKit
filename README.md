# AgentKit CLI

AgentKit CLI bootstraps AI-agent-ready repositories.

It installs reusable instructions, planning templates, review docs, design system rules, and workflow guidance for developers using Codex, Cursor, GitHub Copilot, Claude Code, and similar coding agents.

AgentKit is not an AI agent. It is a small scaffolding tool for making repositories easier and safer to work on with AI-assisted development.

## Usage

Install templates into the current directory:

```bash
npx thomas-agentkit init
```

Install into another directory:

```bash
npx thomas-agentkit init ./my-project
```

Preview changes without writing files:

```bash
npx thomas-agentkit init --dry-run
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

Use the optional interactive flow:

```bash
npx thomas-agentkit init --interactive
```

Install stack-specific agent guidance:

```bash
npx thomas-agentkit init --preset next
```

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

## Presets

Presets add stack-specific guidance without scaffolding framework app files.

- `next`
- `sveltekit`
- `express`
- `convex`
- `fullstack` (`Next.js` + `Convex`)

## CLI Reference

```text
agentkit init [target] [--force] [--dry-run] [--interactive] [--yes] [--preset <name>]
agentkit update [target] [--dry-run] [--preset <name>]
agentkit --list
agentkit --list-presets
agentkit --help
agentkit --version
```

Options:

- `--force`: overwrite existing files
- `--dry-run`: print planned changes without writing files
- `-i, --interactive`: prompt for install options
- `-y, --yes`: accept defaults for non-interactive runs
- `--preset <name>`: install stack-specific guidance (`next`, `sveltekit`, `express`, `convex`, `fullstack`)
- `--list`: list bundled template files
- `--list-presets`: list available presets
- `-h, --help`: show help
- `-v, --version`: show package version

For `agentkit update`, `--preset <name>` refreshes preset-specific managed content, including `STACK.md`.

## Local Development

```bash
npm install
npm run dev -- init ./tmp-demo --dry-run
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
