# Workflow Contract

This repository is a vendor-neutral coordination repository. `WORKFLOW.md` is the canonical instruction file; do not add tool-specific instruction files as a substitute.

## Start

1. Read `changes/CHG-TODO-001/PLAN.md`, `WORK_UNITS.yaml`, and the API contract.
2. Select exactly one declared work unit.
3. Confirm its repository, branch, base SHA, allowed paths, dependencies, and verification commands.
4. Use an isolated branch and worktree. One work unit has one writer.

Use this prompt format with any coding agent:

```text
Read WORKFLOW.md and execute work unit <WORK-UNIT-ID> for change <CHANGE-ID>.
Do not exceed its declared write scope.
```

## Boundaries

- Root coordination files and submodule pointers are Coordinator-only.
- Front and Back writers modify only their assigned child repository and declared paths.
- Never directly commit or push to `main`; never force-push, merge, approve PRs, alter settings, access secrets, deploy, or publish packages.
- Do not infer an API shape: use `changes/<CHANGE-ID>/contracts/todo-api.openapi.yaml`.
- A branch name must be `<type>/<CHANGE-ID>/<work-unit>` and start at the manifest `base_sha`.

## Bootstrap and verification

`npm run bootstrap -- --change CHG-TODO-001 --unit todo-ui --writer <name> --run <id>` is dry-run by default. Add `--apply` only to write a task packet; it never creates a worktree automatically.

Run each work unit's manifest commands and report their actual exit codes. The Coordinator runs:

```bash
npm test
npm run workflow:check
npm run verify:candidate
```

## Required handoff

Report: Change ID; work unit; branch; head SHA; changed files; commands and exit codes; checks not run; known risks; and the next action.

## Stop and ask a human

Stop if scope expansion, a contract conflict, a changed dependency/base SHA, secrets or production access, destructive work, or an unavailable required validation is encountered. Do not fabricate passing evidence.
