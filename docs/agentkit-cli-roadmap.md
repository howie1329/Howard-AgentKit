# AgentKit CLI Improvement Roadmap

## Summary

Build on the current CLI by improving setup quality and template maintenance while keeping the tool simple.

The current codebase has one compact CLI file, recursive template installation, managed-block updates, interactive setup, config support, personalization, good baseline tests, and a clean template bundle. The next work should deepen usefulness without turning AgentKit into a complex framework.

## Key Improvements

### Completed

- `agentkit init --interactive` supports project type, AI tool, template set, design system, conflict, and personalization prompts.
- Placeholder replacement is supported during install for repository-level templates.
- `agentkit.config.json` supports install defaults for presets, template sets, AI tools, design systems, and personalization.
- Package metadata, release docs, and the `files` publishing whitelist are in place.

### In progress — Skills path (v0.9.x)

See [agentkit-skills-path-implementation.md](./agentkit-skills-path-implementation.md).

- `agentkit skill install` — copy bundled skill to `.agents/skills/agentkit/`
- Bundled `agentkit` Agent Skill with init workflow (`references/init.md`, `references/file-contract.md`)
- `installMode` and `agentkitVersion` in `agentkit.config.json`
- README bootstrap-path documentation
- Interactive cross-prompts on `agentkit init` and `agentkit skill install`

**Deferred:** skill `agentkit update` and `agentkit doctor` workflows, multi-tool skill install paths (Cursor, Claude Code), unified `agentkit setup` dispatcher, template-to-skill upgrade.

### Template Selection

- Keep default behavior installing all templates.
- Consider optional non-interactive selection flags like `--no-cursor`, `--no-copilot`, `--no-claude`, or `--docs-only`.

### Safer Overwrite Behavior

- Keep skip-by-default.
- Add `--diff` or `--preview` to show which files would be created, skipped, or overwritten.
- Add `--backup` to save overwritten files as `.bak` when using `--force`.

### Code Maintainability

- Split `src/cli.ts` into small modules if the next feature makes the single file harder to inspect.
- Suggested split:
  - CLI command wiring
  - template discovery/copying
  - interactive prompt collection
  - token replacement
- Do this when feature complexity justifies it, not as a standalone abstraction pass.

## Test Plan

- Keep current Vitest coverage.
- Add tests for:
  - any new non-interactive selection flags
  - managed-block update edge cases
  - config validation changes
  - publishing/package metadata changes

## npm Publishing Note

Plan docs should not be published with the CLI package by default.

This project already prevents that with the `files` whitelist in `package.json`:

```json
"files": [
  "dist",
  "templates",
  "README.md"
]
```

Because `docs` is not listed there, files like this roadmap are excluded from `npm publish` and `npm pack`.

To keep internal docs private, do not add `docs` to the `files` list. If the package ever removes the `files` whitelist, add a `.npmignore` entry for `docs/`.

## Assumptions

- Keep the package name `thomas-agentkit`.
- Keep the installed command name `agentkit`.
- Avoid profiles, plugins, or remote templates for now.
- Prioritize solo-developer workflow quality over enterprise configurability.
