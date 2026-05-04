# AgentKit CLI Improvement Roadmap

## Summary

Build on the current CLI by improving setup quality, template customization, and release polish while keeping the tool simple.

The current codebase has one compact CLI file, recursive template installation, good baseline tests, and a clean template bundle. The next work should deepen usefulness without turning AgentKit into a complex framework.

## Key Improvements

### Project Personalization

- Support `agentkit init --interactive` asking for project name, stack, issue tracker, design system path, and test/build commands.
- Replace placeholders like `[Project Name]`, `[test command]`, and `[design system path]` during install.
- Keep non-interactive behavior unchanged.

### Template Selection

- Keep default behavior installing all templates.
- Add optional flags like `--no-cursor`, `--no-copilot`, `--no-claude`, or `--docs-only`.
- In interactive mode, let the user choose which agent docs to install.

### Safer Overwrite Behavior

- Keep skip-by-default.
- Add `--diff` or `--preview` to show which files would be created, skipped, or overwritten.
- Add `--backup` to save overwritten files as `.bak` when using `--force`.

### Package Polish

- Add `LICENSE`.
- Add `repository`, `homepage`, `bugs`, and `keywords` to `package.json`.
- Add a release section to `README.md` with the update/publish workflow.
- Remove `scripts/scaffold-templates.sh` unless it remains useful as a legacy helper.

### Code Maintainability

- Split `src/cli.ts` into small modules once personalization or selection logic lands.
- Suggested split:
  - CLI command wiring
  - template discovery/copying
  - interactive prompt collection
  - token replacement
- Do this when adding the next feature, not as a standalone abstraction pass.

## Best First Feature

Implement placeholder replacement during `init`.

Behavior:

- Non-interactive install keeps placeholders unchanged.
- Interactive install asks for project details and replaces known placeholders.
- `--dry-run` shows planned replacements without writing.
- `--force` keeps current overwrite semantics.

This gives the CLI a real product leap: installed docs become immediately useful instead of requiring manual cleanup.

## Test Plan

- Keep current Vitest coverage.
- Add tests for:
  - placeholder replacement
  - interactive defaults through extracted pure functions
  - skipped files are not modified
  - `--force` applies replacements when overwriting
  - nested template replacement works
  - `--dry-run` performs no writes
  - package metadata remains publish-ready

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
- Avoid profiles, plugins, remote templates, or config files for now.
- Prioritize solo-developer workflow quality over enterprise configurability.
