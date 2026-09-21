# Quick Start

## Requirements

- Git with submodule support
- Node.js 22+ (Node 26 is used in CI)
- npm

No Docker, database, or service process is needed for this pre-feature baseline.

## Clone and validate

```bash
git clone --recurse-submodules https://github.com/human-agent-bootstrap/todo-collab-root.git
cd todo-collab-root
npm test
npm run workflow:check
npm run verify:candidate
git submodule status
```

Expected child SHAs for candidate 001:

```text
front e9f0fb31c9f72fdf1c3a30923c3d7b62a69d3166
back  75c54550c79d5a86ab6685c3de428ff3fd261586
```

If cloned without `--recurse-submodules`, initialize the same snapshot:

```bash
git submodule update --init --recursive
```

## Inspect or create a task packet

```bash
# Safe preview: no file, branch, or worktree is created.
npm run bootstrap -- --change CHG-TODO-001 --unit todo-ui --writer alice --run run-001

# Explicitly write a packet under .task-packets/.
npm run bootstrap -- --change CHG-TODO-001 --unit todo-ui --writer alice --run run-001 --apply
```

Read `WORKFLOW.md` before acting on a packet. Only a human-approved workflow should create isolated child-repository worktrees.
