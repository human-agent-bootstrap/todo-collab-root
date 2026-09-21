import { dirname, resolve } from 'node:path';
import { fail, findUnit, parseArgs, required, safeIdentifier, writeText } from './lib.mjs';

try {
  const options = parseArgs(process.argv.slice(2));
  required(options, 'change', 'unit', 'writer', 'run');
  const changeId = safeIdentifier('change ID', options.change);
  const unitId = safeIdentifier('work unit ID', options.unit);
  const writer = safeIdentifier('writer', options.writer);
  const runId = safeIdentifier('run ID', options.run);
  const unit = findUnit(changeId, unitId);
  const packetDirectory = resolve(process.cwd(), '.task-packets');
  const packetPath = resolve(packetDirectory, `${runId}.md`);
  if (dirname(packetPath) !== packetDirectory) throw new Error('invalid run ID: task packet path escapes .task-packets');
  const packet = `# TASK\n- Change ID: ${changeId}\n- Work Unit ID: ${unit.id}\n- Writer: ${writer}\n- Run ID: ${runId}\n- Goal: ${unit.goal}\n\n# SCOPE\n- Repository: ${unit.repo}\n- Required branch: ${unit.branch}\n- Base SHA: ${unit.base_sha}\n- Allowed paths:\n${unit.write_paths.map((path) => `  - ${path}`).join('\n')}\n\n# CONTRACT\n- Read ../WORKFLOW.md and changes/${changeId}/contracts/todo-api.openapi.yaml before implementation.\n- Do not modify the Root coordination files or another repository.\n\n# VERIFY\n${unit.verify.map((command) => `- ${command} (expect exit 0)`).join('\n')}\n\n# HANDOFF\nReport changed files, head SHA, commands and exit codes, unrun checks, and next action.\n\n# STOP WHEN\nScope expansion, contract conflict, secret/production access, or an unavailable required check needs human coordination.\n`;
  if (!options.apply) {
    process.stdout.write(`DRY RUN: task packet would be written to ${packetPath}\n`);
    process.stdout.write(`No worktree or branch is created without --apply. Required branch: ${unit.branch}\n`);
  } else {
    writeText(packetPath, packet);
    process.stdout.write(`APPLIED: wrote ${packetPath}\n`);
    process.stdout.write('Worktree creation is intentionally a separate human-approved step.\n');
  }
} catch (error) {
  fail(error.message);
}
