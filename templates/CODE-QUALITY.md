# Code Quality Guide

## Purpose

This guide defines the baseline quality bar for changes in this repository.

Agents and contributors should optimize for code that is simple, readable, testable, and safe to modify.

## Principles

- Prefer small, explicit changes over broad rewrites.
- Keep public APIs narrow and intentional.
- Use clear names and direct control flow.
- Avoid speculative abstractions and dependency bloat.
- Match existing project patterns before introducing new ones.
- Make failure modes explicit at system boundaries.

## Review Checklist

- The change solves the stated problem and does not expand scope unexpectedly.
- The diff is small enough to review confidently.
- No unrelated formatting churn or broad refactors were introduced.
- New behavior has relevant tests or a clear reason tests were not added.
- External inputs are validated at boundaries.
- Errors are actionable and do not leak secrets.
- User-facing copy is clear and specific.
- UI changes include loading, empty, error, disabled, and focus states where relevant.

## Testing Expectations

Run the narrowest useful checks first, then broaden verification for larger changes.

Document project commands here:

```bash
npm test
npm run lint
npm run build
```

Remove commands that do not apply.

## Dependency Policy

Add a dependency only when it clearly reduces real complexity or improves correctness. Prefer existing project utilities and platform APIs for small features.

Before adding a dependency, confirm:

- The package is actively maintained.
- The API surface is small enough for the need.
- The behavior would be meaningfully harder or riskier to implement locally.
- The dependency does not create avoidable runtime, security, or bundle-size risk.

## Handoff Standard

Every completed change should include:

- What changed.
- Why it changed.
- What checks were run.
- Known risks or limitations.
- Follow-up work, if any.
