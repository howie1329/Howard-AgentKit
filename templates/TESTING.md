# Testing Guide

## Purpose

This guide defines how agents and contributors should choose, write, run, and report tests.

Optimize for fast, meaningful feedback. Run the narrowest useful check first, then broaden validation when risk or scope requires it.

## Test Selection Strategy

Choose tests based on the change:

| Change type | Expected verification |
| --- | --- |
| Pure logic, parsing, transforms | Unit tests for success and failure paths |
| API, server actions, routes, permissions | Boundary tests for valid, invalid, unauthorized, and error cases |
| UI behavior | Component or integration tests plus manual interaction checks when needed |
| Data access or schema changes | Integration tests or migration validation |
| Bug fix | Regression test that fails without the fix when practical |
| Refactor only | Existing relevant tests plus type/lint/build checks |

## Running Checks

Document project-specific commands here:

```bash
npm test
npm run lint
npm run build
```

Remove commands that do not apply.

Prefer file-scoped or package-scoped commands when available. Use full-suite checks for broad, risky, or release-bound changes.

## Writing Tests

- Test observable behavior, not implementation details.
- Cover at least one success path and relevant failure paths.
- Keep tests deterministic and isolated.
- Prefer realistic fixtures over excessive mocking.
- Name tests by behavior or scenario.
- Avoid snapshots unless they are stable and intentionally reviewed.
- Do not weaken or delete tests to make a change pass unless the task explicitly updates expected behavior.

## Mocks And Fixtures

- Mock network, time, randomness, and external services at clear boundaries.
- Keep fixtures small and relevant to the scenario.
- Reuse existing fixture helpers before adding new ones.
- Avoid global test state that can leak between tests.

## UI And Accessibility Checks

For UI changes, verify relevant states:

- loading
- empty
- error
- disabled
- hover/active/focus
- keyboard navigation
- responsive layout
- text overflow
- light/dark themes when supported

Use automated accessibility checks when available, but do not rely on automation alone for focus order, semantics, or interaction quality.

## Agent-Specific Pitfalls

Avoid these common AI-generated testing problems:

- tests that assert mocked implementation details instead of behavior
- tests that pass without exercising the changed code
- broad snapshot updates without review
- skipped tests without explanation
- invented test utilities or commands that do not exist
- replacing meaningful coverage with shallow smoke tests

## Reporting Verification

In the change explanation after coding work, include:

- checks run
- whether they passed
- checks not run and why
- any manual QA performed
- remaining test gaps or follow-up recommendations
