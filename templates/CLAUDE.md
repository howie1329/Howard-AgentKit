# CLAUDE.md

## Purpose

Project guidance for Claude-based coding and agent workflows.

## Local Commands

Replace these examples with the project’s real commands:

```bash
npm install
npm test
npm run build
npm run lint
```

## Coding Standards

- Keep changes focused on the requested behavior.
- Prefer clear names and direct control flow.
- Avoid new abstractions until duplication or complexity justifies them.
- Preserve existing public interfaces unless the task requires a change.
- Update nearby documentation when behavior or setup changes.

## Agent Development

- Document each agent’s goal, inputs, outputs, tools, and permission boundaries.
- Keep prompts and tool schemas versioned with the code that depends on them.
- Make failure modes explicit: retries, timeouts, partial results, and user-facing errors.
- Use deterministic tests for core orchestration logic.

## Review And Verification

- Run the narrowest relevant test command first.
- For UI changes, verify responsive behavior and obvious accessibility states.
- For agent changes, test success, tool failure, invalid input, and timeout paths.
- Summarize verification results in the final handoff.

## Secrets

- Use environment variables for local credentials.
- Do not paste secrets into prompts, logs, fixtures, or committed files.
- Provide `.env.example` entries for required variables without real values.
