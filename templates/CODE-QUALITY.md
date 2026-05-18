# Code Quality Guide

## Purpose

This guide defines the baseline quality bar for changes in this repository.

Agents and contributors should optimize for code that is simple, readable, testable, secure, and safe to modify.

## Principles

- Prefer small, explicit changes over broad rewrites.
- Keep public APIs narrow and intentional.
- Use clear names and direct control flow.
- Avoid speculative abstractions and dependency bloat.
- Match existing project patterns before introducing new ones.
- Make failure modes explicit at system boundaries.
- Validate external input and avoid leaking secrets or private data.
- Preserve behavior unless the task explicitly changes it.

## Review Severity

Use clear severity when reviewing or explaining issues:

- **Blocker**: likely bug, data loss, security issue, broken build, failing tests, or unmet requirement.
- **Concern**: maintainability, test gap, confusing behavior, or risk that should be addressed soon.
- **Suggestion**: optional improvement that does not block shipping.

## Review Checklist

- The change solves the stated problem and does not expand scope unexpectedly.
- The diff is small enough to review confidently.
- No unrelated formatting churn or broad refactors were introduced.
- Existing patterns were reused where practical.
- New behavior has relevant tests or a clear reason tests were not added.
- External inputs are validated at boundaries.
- Authorization checks remain server-side and resource-specific.
- Errors are actionable and do not leak secrets or sensitive data.
- User-facing copy is clear and specific.
- UI changes include loading, empty, error, disabled, and focus states where relevant.
- Documentation was updated when behavior, setup, or commands changed.

## Testing Expectations

Run the narrowest useful checks first, then broaden verification for larger changes.

Document project commands here:

```bash
npm test
npm run lint
npm run build
```

Remove commands that do not apply.

For deeper testing guidance, use `TESTING.md` when present.

## Dependency Policy

Add a dependency only when it clearly reduces real complexity or improves correctness. Prefer existing project utilities and platform APIs for small features.

Before adding a dependency, confirm:

- The package is actively maintained.
- The API surface is small enough for the need.
- The behavior would be meaningfully harder or riskier to implement locally.
- The dependency does not create avoidable runtime, security, licensing, or bundle-size risk.

## AI-Specific Quality Risks

Watch for common AI-generated issues:

- invented APIs, commands, environment variables, or project conventions
- placeholder logic that appears production-ready
- broad abstractions created before duplication exists
- tests that do not exercise the changed behavior
- silent error swallowing or vague fallback behavior
- client-only validation or authorization for sensitive actions
- excessive comments explaining obvious code instead of clarifying intent

## Handoff Standard

Every completed change should include:

- What changed.
- Why it changed.
- What checks were run.
- Known risks or limitations.
- Follow-up work, if any.

Use `CHANGE-EXPLANATION.md` when present for the final developer-facing handoff.
