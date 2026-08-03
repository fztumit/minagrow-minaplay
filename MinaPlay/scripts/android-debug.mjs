import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectDir = path.resolve(import.meta.dirname, '..');
const androidDir = path.join(projectDir, 'android');

function firstExistingDirectory(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

function javaMajorVersion(javaHome) {
  if (!javaHome) {
    return 0;
  }

  const result = spawnSync(path.join(javaHome, 'bin', 'java'), ['-version'], { encoding: 'utf8' });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const match = output.match(/version\s+"(?:1\.)?(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

const javaCandidates = [
  process.env.MINAPLAY_JAVA_HOME,
  process.env.JAVA_HOME,
  process.platform === 'darwin' ? '/Applications/Android Studio.app/Contents/jbr/Contents/Home' : undefined,
  process.platform === 'darwin' ? '/Applications/Android Studio.app/Contents/jre/Contents/Home' : undefined
].filter(Boolean);
const javaHome = javaCandidates.find((candidate) => javaMajorVersion(candidate) >= 21);

if (!javaHome) {
  console.error('Android debug build için Java 21 bulunamadı. Android Studio kurun veya MINAPLAY_JAVA_HOME ayarlayın.');
  process.exit(1);
}

const androidHome = firstExistingDirectory([
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.platform === 'darwin' ? path.join(homedir(), 'Library', 'Android', 'sdk') : undefined,
  process.platform === 'linux' ? path.join(homedir(), 'Android', 'Sdk') : undefined
]);

if (!androidHome) {
  console.error('Android SDK bulunamadı. Android Studio SDK Manager ile SDK kurun veya ANDROID_HOME ayarlayın.');
  process.exit(1);
}

const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const result = spawnSync(gradleCommand, ['assembleDebug'], {
  cwd: androidDir,
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome
  },
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status ?? 1);
