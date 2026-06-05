# agentkit update (not yet available)

This workflow is **not shipped in v0.9.x**.

## What to tell the user

- **Template-path repos** (`installMode: template` or no config): run CLI `agentkit update` in the terminal to merge bundled content inside managed blocks.
- **Skill-path repos** (`installMode: skill`): this workflow is coming soon. For now:
  - Manually edit guidance files, or
  - Re-run the skill `agentkit init` workflow for missing files only
  - Do not improvise a full update procedure without shipped guidance

## Do not

- Guess at update merge rules beyond what `references/file-contract.md` defines
- Overwrite user content outside managed blocks
- Run CLI `agentkit update` on skill-path repos expecting file changes (CLI prints an informational message only)
