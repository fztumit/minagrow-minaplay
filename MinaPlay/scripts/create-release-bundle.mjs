import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';

const [apkInput, outputInput] = process.argv.slice(2);
if (!apkInput || !outputInput) {
  throw new Error('Usage: node scripts/create-release-bundle.mjs <apk-path> <output-dir>');
}

const projectDir = resolve(import.meta.dirname, '..');
const release = JSON.parse(await readFile(resolve(projectDir, 'release.json'), 'utf8'));
const repository = process.env.GITHUB_REPOSITORY || 'fztumit/minagrow-minaplay';
const tag = `v${release.version}`;
const apkName = `minaplay-${tag}.apk`;
const apkPath = resolve(projectDir, apkInput);
const outputDir = resolve(projectDir, outputInput);
const outputApk = resolve(outputDir, apkName);
const apk = await readFile(apkPath);
const sha256 = createHash('sha256').update(apk).digest('hex');

await mkdir(outputDir, { recursive: true });
await copyFile(apkPath, outputApk);
await writeFile(resolve(outputDir, `${apkName}.sha256`), `${sha256}  ${apkName}\n`, 'utf8');
await writeFile(
  resolve(outputDir, 'minaplay-release.json'),
  `${JSON.stringify({
    channel: release.channel,
    version: release.version,
    versionCode: release.versionCode,
    apkUrl: `https://github.com/${repository}/releases/download/${tag}/${apkName}`,
    sha256,
    publishedAt: new Date().toISOString()
  }, null, 2)}\n`,
  'utf8'
);

console.log(`Created ${basename(outputApk)} and stable release metadata.`);
