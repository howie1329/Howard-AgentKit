# Change Explanation Guide

## Purpose

Use this guide **after every task that modifies repository files**.

The goal is to help the developer get up to speed quickly: what changed, why it changed, how it works, what was verified, and what deserves review attention.

This is a **response format** for agent messages. Do **not** create a new markdown file per task unless the project explicitly asks for one.

Research-only tasks that do not edit files do not require this format.

## When Required

| Situation | Change explanation |
| --- | --- |
| Any bugfix, feature, refactor, config, or doc edit in the repo | **Required** — follow this guide in your final message |
| Research, options, or questions with no file edits | Not required |
| User asks only to explain existing code (no edits) | Not required |

Scale depth to the size of the change. A one-line fix still needs a short explanation; a large feature needs full sections.

## Change Explanation Format

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

Skip this section when the change is straightforward and has no meaningful trade-offs.

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

Use "None identified" when appropriate for very small, low-risk changes.

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
