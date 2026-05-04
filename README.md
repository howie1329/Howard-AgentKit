# AgentKit CLI

AgentKit CLI bootstraps AI-agent-ready repositories.

It installs reusable instructions, planning templates, review docs, design system rules, and workflow guidance for developers using Codex, Cursor, GitHub Copilot, Claude Code, and similar coding agents.

AgentKit is not an AI agent. It is a small scaffolding tool for making repositories easier and safer to work on with AI-assisted development.

## Usage

Install templates into the current directory:

```bash
npx agentkit init
```

Install into another directory:

```bash
npx agentkit init ./my-project
```

Preview changes without writing files:

```bash
npx agentkit init --dry-run
```

Overwrite existing files:

```bash
npx agentkit init --force
```

Use the optional interactive flow:

```bash
npx agentkit init --interactive
```

List bundled templates:

```bash
npx agentkit --list
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

Existing files are skipped by default so local edits are preserved. Use `--force` when you intentionally want to refresh files from the bundled package version.

## CLI Reference

```text
agentkit init [target] [--force] [--dry-run] [--interactive] [--yes]
agentkit --list
agentkit --help
agentkit --version
```

Options:

- `--force`: overwrite existing files
- `--dry-run`: print planned changes without writing files
- `-i, --interactive`: prompt for install options
- `-y, --yes`: accept defaults for non-interactive runs
- `--list`: list bundled template files
- `-h, --help`: show help
- `-v, --version`: show package version

## Local Development

```bash
npm install
npm run dev -- init ./tmp-demo --dry-run
npm run build
npm test
```

The package command is `agentkit`, backed by the compiled TypeScript entrypoint at `dist/cli.js`.

## Philosophy

AgentKit should stay:

- simple
- practical
- easy to inspect
- easy to modify
- safe by default
- useful immediately
- not overengineered
