import { join } from 'node:path';
import { fail, findUnit, parseArgs, required, writeText } from './lib.mjs';

try {
  const options = parseArgs(process.argv.slice(2));
  required(options, 'change', 'unit', 'writer', 'run');
  const unit = findUnit(options.change, options.unit);
  const packetPath = join(process.cwd(), '.task-packets', `${options.run}.md`);
  const packet = `# TASK\n- Change ID: ${options.change}\n- Work Unit ID: ${unit.id}\n- Writer: ${options.writer}\n- Run ID: ${options.run}\n- Goal: ${unit.goal}\n\n# SCOPE\n- Repository: ${unit.repo}\n- Required branch: ${unit.branch}\n- Base SHA: ${unit.base_sha}\n- Allowed paths:\n${unit.write_paths.map((path) => `  - ${path}`).join('\n')}\n\n# CONTRACT\n- Read ../WORKFLOW.md and changes/${options.change}/contracts/todo-api.openapi.yaml before implementation.\n- Do not modify the Root coordination files or another repository.\n\n# VERIFY\n${unit.verify.map((command) => `- ${command} (expect exit 0)`).join('\n')}\n\n# HANDOFF\nReport changed files, head SHA, commands and exit codes, unrun checks, and next action.\n\n# STOP WHEN\nScope expansion, contract conflict, secret/production access, or an unavailable required check needs human coordination.\n`;
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
