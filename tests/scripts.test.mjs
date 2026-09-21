import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const scripts = join(root, 'scripts');
const frontSha = 'e9f0fb31c9f72fdf1c3a30923c3d7b62a69d3166';
const backSha = '75c54550c79d5a86ab6685c3de428ff3fd261586';

function run(script, args, cwd = root) {
  return spawnSync(process.execPath, [join(scripts, script), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'todo-collab-root-'));
  mkdirSync(join(dir, 'changes/CHG-TODO-001/releases'), { recursive: true });
  mkdirSync(join(dir, 'services/front'), { recursive: true });
  mkdirSync(join(dir, 'services/back'), { recursive: true });
  writeFileSync(join(dir, 'changes/CHG-TODO-001/WORK_UNITS.yaml'), `change_id: CHG-TODO-001\nwork_units:\n  - id: todo-ui\n    repo: front\n    branch: feat/CHG-TODO-001/todo-ui\n    base_sha: ${frontSha}\n    write_paths:\n      - src/**\n      - tests/**\n    depends_on:\n      - contract\n    verify:\n      - npm test\n`);
  writeFileSync(join(dir, 'changes/CHG-TODO-001/releases/candidate-001.yaml'), `change_id: CHG-TODO-001\ncandidate: 1\nservices:\n  - repo: front\n    path: services/front\n    sha: ${frontSha}\n  - repo: back\n    path: services/back\n    sha: ${backSha}\n`);
  return dir;
}

test('bootstrap defaults to dry-run and writes no task packet', () => {
  const dir = fixture();
  try {
    const result = run('bootstrap.mjs', ['--change', 'CHG-TODO-001', '--unit', 'todo-ui', '--writer', 'alice', '--run', 'run-1'], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /DRY RUN/);
    assert.match(result.stdout, /feat\/CHG-TODO-001\/todo-ui/);
    assert.throws(() => readFileSync(join(dir, '.task-packets/run-1.md')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('bootstrap apply writes a packet and refuses unknown unit', () => {
  const dir = fixture();
  try {
    const applied = run('bootstrap.mjs', ['--change', 'CHG-TODO-001', '--unit', 'todo-ui', '--writer', 'alice', '--run', 'run-2', '--apply'], dir);
    assert.equal(applied.status, 0, applied.stderr);
    const packet = readFileSync(join(dir, '.task-packets/run-2.md'), 'utf8');
    assert.match(packet, /# TASK/);
    assert.match(packet, /# HANDOFF/);
    const missing = run('bootstrap.mjs', ['--change', 'CHG-TODO-001', '--unit', 'missing', '--writer', 'alice', '--run', 'run-3'], dir);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /unknown work unit/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('workflow check rejects an incorrect branch before validation', () => {
  const dir = fixture();
  try {
    execFileSync('git', ['init', '-q'], { cwd: dir });
    execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: dir });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
    writeFileSync(join(dir, 'README.md'), 'fixture');
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: dir });
    const result = run('workflow-check.mjs', ['--change', 'CHG-TODO-001', '--unit', 'todo-ui'], dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /branch mismatch/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('candidate verification accepts matching submodule SHAs', () => {
  const dir = fixture();
  try {
    const actualShas = new Map();
    for (const service of ['front', 'back']) {
      const serviceDir = join(dir, 'services', service);
      execFileSync('git', ['init', '-q'], { cwd: serviceDir });
      execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: serviceDir });
      execFileSync('git', ['config', 'user.name', 'Test'], { cwd: serviceDir });
      writeFileSync(join(serviceDir, 'README.md'), service);
      execFileSync('git', ['add', '.'], { cwd: serviceDir });
      execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: serviceDir });
      actualShas.set(service, execFileSync('git', ['rev-parse', 'HEAD'], { cwd: serviceDir, encoding: 'utf8' }).trim());
    }
    writeFileSync(join(dir, 'changes/CHG-TODO-001/releases/candidate-001.yaml'), `change_id: CHG-TODO-001\ncandidate: 1\nservices:\n  - repo: front\n    path: services/front\n    sha: ${actualShas.get('front')}\n  - repo: back\n    path: services/back\n    sha: ${actualShas.get('back')}\n`);
    const result = run('verify-candidate.mjs', ['--change', 'CHG-TODO-001'], dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Candidate CHG-TODO-001: PASS/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
