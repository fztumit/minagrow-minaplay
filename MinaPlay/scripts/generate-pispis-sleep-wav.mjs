import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sampleRate = 44100;
const durationSeconds = 32;
const totalSamples = sampleRate * durationSeconds;
const outputPaths = [
  resolve(root, 'public/sounds/sleep/pispis-ninni.wav'),
  resolve(root, 'assets-source/sounds/sleep/pispis-ninni.wav')
];

const melody = [392, 370, 330, 294, 330, 370, 392, 330, 294, 262];
const noteStepSeconds = 0.72;
const cycleSeconds = 7.6;

function envelope(time, start, length) {
  const local = time - start;
  if (local < 0 || local > length) {
    return 0;
  }
  const attack = 0.16;
  const release = 0.38;
  if (local < attack) {
    return local / attack;
  }
  if (local > length - release) {
    return Math.max(0, (length - local) / release);
  }
  return 1;
}

function globalFade(time) {
  const fadeIn = Math.min(1, time / 1.2);
  const fadeOut = Math.min(1, (durationSeconds - time) / 1.8);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function sine(frequency, time) {
  return Math.sin(2 * Math.PI * frequency * time);
}

function sampleAt(index) {
  const time = index / sampleRate;
  const fade = globalFade(time);
  const slowPulse = 0.84 + 0.16 * Math.sin(2 * Math.PI * 0.18 * time);
  let value = 0;

  value += 0.028 * sine(131, time) * slowPulse;
  value += 0.018 * sine(196, time + 0.013) * slowPulse;
  value += 0.006 * sine(65.5, time);

  const cycleStart = Math.floor(time / cycleSeconds) * cycleSeconds;
  for (let i = 0; i < melody.length; i += 1) {
    const start = cycleStart + i * noteStepSeconds;
    const amp = envelope(time, start, 0.68);
    if (amp > 0) {
      const frequency = melody[i];
      value += 0.11 * amp * sine(frequency, time);
      value += 0.024 * amp * sine(frequency * 2, time);
    }
  }

  const hushCycle = time % 2.4;
  const hush = envelope(time, time - hushCycle + 0.12, 0.82);
  value += 0.012 * hush * sine(247, time);

  return Math.max(-0.96, Math.min(0.96, value * fade));
}

function createWavBuffer() {
  const dataBytes = totalSamples * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < totalSamples; i += 1) {
    buffer.writeInt16LE(Math.round(sampleAt(i) * 32767), 44 + i * 2);
  }

  return buffer;
}

const wav = createWavBuffer();
for (const outputPath of outputPaths) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, wav);
  console.log(outputPath);
}
