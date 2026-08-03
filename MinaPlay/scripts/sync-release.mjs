import { copyFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectDir = resolve(import.meta.dirname, '..');
const sourcePath = resolve(projectDir, 'release.json');
const publicPath = resolve(projectDir, 'public/release.json');
const release = JSON.parse(await readFile(sourcePath, 'utf8'));

if (release.channel !== 'stable') {
  throw new Error('release.json channel must be stable');
}
if (typeof release.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(release.version)) {
  throw new Error('release.json version must use x.y.z format');
}
if (!Number.isSafeInteger(release.versionCode) || release.versionCode < 1) {
  throw new Error('release.json versionCode must be a positive integer');
}
const metadataUrl = new URL(release.metadataUrl);
if (metadataUrl.protocol !== 'https:' || metadataUrl.username || metadataUrl.password) {
  throw new Error('release.json metadataUrl must be a credential-free HTTPS URL');
}

await copyFile(sourcePath, publicPath);
console.log(`Synced MinaPlay ${release.version} (${release.versionCode}) release identity.`);
