# agentkit doctor (not yet available)

This workflow is **not shipped in v0.9.x**.

## What to tell the user

The `agentkit doctor` guidance audit workflow is coming in a future release. It will check for:

- Stale placeholders (`[Project Name]`, example commands)
- Commands that do not match `package.json` scripts
- Missing companion files for the configured `templateSet`
- Malformed managed block markers
- Thin adapters that duplicate `AGENTS.md` instead of pointing to it

## Do not

- Improvise a full audit checklist without shipped guidance
- Modify files unless the user explicitly asks for fixes during a manual review

For now, the user can manually compare guidance against `references/file-contract.md` and their repository.
