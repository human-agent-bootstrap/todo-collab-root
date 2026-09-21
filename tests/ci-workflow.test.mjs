import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const workflow = readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8');

test('main pushes skip work-unit branch validation but still verify the candidate', () => {
  assert.match(
    workflow,
    /if:\s*github\.event_name\s*==\s*['"]pull_request['"][\s\S]*npm run workflow:check/,
    'workflow:check must be gated to pull_request events because its manifest requires the coordination branch',
  );
  assert.match(workflow, /npm run verify:candidate/);
});