# agentkit init (skill workflow)

Create AgentKit guidance files from repository context. This runs **in the agent** after `agentkit skill install` — not in the terminal.

## Preconditions

- `agentkit.config.json` exists with `installMode: skill` (or user explicitly requests guidance creation)
- Read `references/file-contract.md` before editing files

## Procedure

### 1. Plan

1. Read `agentkit.config.json` — note `templateSet`, `preset`, `designSystem`, `aiTools`, `personalization`
2. Inspect the repository per `references/file-contract.md`
3. Build the file inventory from `templateSet` + `aiTools` + `preset`
4. List which files exist vs missing
5. Tell the user the planned files before writing (brief list)

### 2. Gather facts

From the repo, collect:

- Project name and description
- Test, lint, build, dev commands from `package.json` scripts
- Stack signals (framework, language, data layer, styling, test tools)
- Issue tracker hint (GitHub Issues, Linear, etc.)
- Docs paths for design system and briefs

Use `personalization` from config when repo facts are missing. Never invent npm scripts.

### 3. Create files (missing only)

For each file in the inventory that does not exist:

1. Create parent directories if needed
2. Write content appropriate to the file role:
   - **`AGENTS.md`** — primary router; project-specific commands, stack summary, triggers for companions
   - **`CHANGE-EXPLANATION.md`** — handoff format guide
   - **`CODE-QUALITY.md`** — review and refactor checklist
   - **`DESIGN-SYSTEM.md`** — follow `designSystem` from config; align with existing UI patterns in repo when visible
   - **`STACK.md`** — only when `preset` is set; stack rules from repo + preset type
   - **AI adapters** — thin pointers to `AGENTS.md`
   - **Planning/testing/security guides** — only for `full` template set
3. Wrap AgentKit-generated body in managed blocks per `references/file-contract.md`
4. Replace all bracket placeholders with real values

Skip files that already exist unless the user asks to refresh them.

### 4. Verify

Before finishing:

- [ ] Every planned missing file was created or explicitly deferred with reason
- [ ] No `[Project Name]` or similar placeholders remain
- [ ] Project Commands table matches `package.json` scripts
- [ ] Managed block markers are well-formed
- [ ] `AGENTS.md` references `STACK.md` when preset is set and `STACK.md` was created
- [ ] No application source files were modified
- [ ] User content outside managed blocks was not overwritten

### 5. Report

Tell the user:

- Files created (paths)
- Files skipped (already existed)
- Key values inferred (commands, stack)
- Next steps: edit guidance as needed; skill `agentkit update` coming in a future release for ongoing sync

## Partial completion

If init spans multiple sessions:

- Re-run this workflow to create remaining missing files
- Do not overwrite existing guidance unless user requests it

## Re-init / refresh

If user asks to regenerate an existing file:

- Confirm which files to refresh
- Preserve user edits outside managed blocks
- Only replace content inside managed blocks when refreshing
