import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fail, parseArgs, required } from './lib.mjs';

function candidateServices(path) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const services = [];
  let current;
  for (const raw of lines) {
    const indent = raw.match(/^\s*/)[0].length;
    const line = raw.trim();
    if (indent === 2 && line.startsWith('- repo:')) {
      current = { repo: line.slice(7).trim() };
      services.push(current);
    } else if (current && indent === 4 && line.includes(':')) {
      const [key, ...rest] = line.split(':');
      current[key.trim()] = rest.join(':').trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return services;
}

try {
  const options = parseArgs(process.argv.slice(2));
  required(options, 'change');
  const path = join(process.cwd(), 'changes', options.change, 'releases', 'candidate-001.yaml');
  if (!existsSync(path)) throw new Error(`missing candidate: ${path}`);
  const services = candidateServices(path);
  if (services.length !== 2) throw new Error('candidate must list exactly front and back services');
  for (const service of services) {
    if (!service.path || !service.sha) throw new Error(`candidate service ${service.repo} needs path and sha`);
    const directory = join(process.cwd(), service.path);
    if (!existsSync(join(directory, '.git'))) throw new Error(`submodule is not initialized: ${service.path}`);
    const actual = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (actual !== service.sha) throw new Error(`${service.repo} SHA mismatch: expected ${service.sha}, found ${actual}`);
  }
  process.stdout.write(`Candidate ${options.change}: PASS (${services.map((service) => `${service.repo}@${service.sha.slice(0, 12)}`).join(', ')})\n`);
} catch (error) {
  fail(error.message);
}
