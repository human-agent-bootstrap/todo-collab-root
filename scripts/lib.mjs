import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exitCode = 1;
}

export function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'apply' || key === 'allow-descendant') { options[key] = true; continue; }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

export function required(options, ...names) {
  for (const name of names) {
    if (!options[name]) throw new Error(`--${name} is required`);
  }
}

export function safeIdentifier(label, value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)) {
    throw new Error(`invalid ${label}: use 1-128 letters, numbers, underscores, or hyphens`);
  }
  return value;
}

export function manifestPath(change) {
  return join(process.cwd(), 'changes', change, 'WORK_UNITS.yaml');
}

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed === '[]') return [];
  return trimmed.replace(/^['"]|['"]$/g, '');
}

export function readWorkUnits(change) {
  const path = manifestPath(change);
  if (!existsSync(path)) throw new Error(`missing manifest: ${path}`);
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const units = [];
  let current;
  let activeList;
  for (const raw of lines) {
    const indent = raw.match(/^\s*/)[0].length;
    const line = raw.trim();
    if (!line || line.startsWith('#') || line === 'work_units:') continue;
    if (indent === 2 && line.startsWith('- id:')) {
      current = { id: scalar(line.slice(5)), write_paths: [], depends_on: [], verify: [] };
      units.push(current);
      activeList = null;
      continue;
    }
    if (!current) continue;
    if (indent === 4 && line.endsWith(':')) {
      activeList = line.slice(0, -1);
      continue;
    }
    if (indent >= 6 && line.startsWith('- ') && activeList) {
      current[activeList] ??= [];
      current[activeList].push(scalar(line.slice(2)));
      continue;
    }
    if (indent === 4 && line.includes(':')) {
      const [key, ...rest] = line.split(':');
      current[key.trim()] = scalar(rest.join(':'));
      activeList = null;
    }
  }
  return units;
}

export function findUnit(change, id) {
  const unit = readWorkUnits(change).find((item) => item.id === id);
  if (!unit) throw new Error(`unknown work unit: ${id}`);
  return unit;
}

export function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}
