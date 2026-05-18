# Change Explanation Guide

## Purpose

Use this guide when explaining completed work to the developer.

The goal is to help the developer understand what changed, why it changed, how the implementation works, what was verified, and what deserves review attention.

This is a reusable handoff guide. Do not create a new change-explanation file for every task unless the project explicitly asks for one.

## Handoff Format

### Summary

Briefly state the outcome in plain language. Focus on the behavior or capability delivered, not just the files edited.

### What Changed

List the main files, modules, or areas changed.

For each important area, explain:

- what changed
- why it changed
- how it fits existing project patterns

### Key Decisions

Explain notable implementation decisions.

Include when relevant:

- why this approach was chosen
- alternatives considered
- trade-offs or constraints
- assumptions made because requirements were unclear

### Verification

List checks run, such as:

- tests
- lint
- build/typecheck
- manual QA
- screenshots or visual checks for UI work

If a relevant check was skipped, say why.

### Risks Or Limitations

Call out anything the developer should know before merging or shipping:

- untested paths
- migration concerns
- UX edge cases
- security or privacy considerations
- performance concerns
- follow-up cleanup

### Suggested Review Focus

Tell the developer where to focus review attention.

Examples:

- Review the validation path in `[path]`.
- Confirm the empty/error states match product intent.
- Check whether the authorization behavior matches policy.
- Verify the new abstraction is worth keeping.

## Style Rules

- Be concise but specific.
- Mention file paths clearly.
- Explain reasoning, not only actions.
- Do not hide uncertainty or skipped validation.
- Do not claim tests passed unless they were run and passed.
- Prefer bullets for scanability.
