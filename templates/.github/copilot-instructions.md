# GitHub Copilot Instructions

Follow the repository rules in `AGENTS.md`, `CODE-QUALITY.md`, and `DESIGN-SYSTEM.md`.

## Coding Style

- Prefer simple, maintainable, production-friendly code.
- Match existing project patterns.
- Keep changes small and explicit.
- Avoid adding dependencies unless the benefit is clear.
- Do not hardcode design tokens, colors, or font families in UI code.

## Before Suggesting Code

- Inspect nearby code and reuse existing utilities or components.
- Preserve public APIs unless the task requires a change.
- Include validation at external boundaries.
- Include tests when behavior changes.

## Avoid

- Speculative abstractions.
- Broad rewrites for narrow requests.
- Unrelated formatting churn.
- Placeholder logic that looks production-ready but is incomplete.
