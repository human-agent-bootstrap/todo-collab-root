# TODO Collaboration Root

This is the **pre-feature coordination baseline** for a multi-repository TODO demo. No TODO UI, API, database, or runtime behavior exists here yet.

The root pins intentionally empty child repositories as Git submodules and records one plan-first change. Product implementation belongs in the child repositories only after the contract is approved.

## Start here

```bash
git clone --recurse-submodules https://github.com/human-agent-bootstrap/todo-collab-root.git
cd todo-collab-root
npm test
npm run workflow:check
npm run verify:candidate
```

Read [QUICKSTART.md](./QUICKSTART.md) for the local validation path and [WORKFLOW.md](./WORKFLOW.md) before assigning a work unit.

## Baseline contents

- `services/front` → pinned empty Front repository
- `services/back` → pinned empty Back repository
- `changes/CHG-TODO-001` → approved scope, work units, API contract, status, PR tracking, and candidate SHA snapshot
- `scripts/` → safe bootstrap and local workflow/candidate checks

No Docker is required.
