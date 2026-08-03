import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectDir = resolve(import.meta.dirname, '..');
const release = JSON.parse(await readFile(resolve(projectDir, 'release.json'), 'utf8'));
const tag = process.argv[2] || process.env.GITHUB_REF_NAME || '';
const expectedTag = `v${release.version}`;

if (tag !== expectedTag) {
  throw new Error(`Release tag ${tag || '<missing>'} does not match release.json (${expectedTag})`);
}
console.log(`Verified MinaPlay release tag ${tag}.`);
