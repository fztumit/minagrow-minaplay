import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sampleRate = 44100;
const durationSeconds = 64;
const totalSamples = sampleRate * durationSeconds;
const outputPaths = [
  resolve(root, 'public/sounds/sleep/pispis-ninni.wav'),
  resolve(root, 'assets-source/sounds/sleep/pispis-ninni.wav')
];

const melody = [
  { frequency: 256, length: 1.45 },
  { frequency: 288, length: 1.45 },
  { frequency: 320, length: 1.8 },
  { frequency: 288, length: 1.45 },
  { frequency: 256, length: 1.6 },
  { frequency: 216, length: 2.1 },
  { frequency: 240, length: 1.55 },
  { frequency: 256, length: 2.25 }
];
const noteStepSeconds = 1.48;
const cycleSeconds = 13.2;

function envelope(time, start, length, attack = 0.22, release = 0.52) {
  const local = time - start;
  if (local < 0 || local > length) {
    return 0;
  }
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

function softNoise(time) {
  const seed = Math.sin(time * 127.1 + Math.sin(time * 31.7) * 19.3) * 43758.5453;
  return (seed - Math.floor(seed)) * 2 - 1;
}

function lowVoice(frequency, time) {
  return (
    0.56 * sine(frequency, time) +
    0.24 * sine(frequency * 2, time + 0.004) +
    0.12 * sine(frequency * 3, time + 0.009) +
    0.08 * sine(frequency * 4, time + 0.013)
  );
}

function pishSyllable(time, start) {
  const local = time - start;
  if (local < 0 || local > 0.72) {
    return 0;
  }

  const breath = envelope(time, start, 0.34, 0.025, 0.19);
  const vowel = envelope(time, start + 0.18, 0.5, 0.1, 0.3);
  const shimmer = softNoise(time * 5.2) * 0.018 + softNoise(time * 8.7) * 0.01;
  return breath * (0.034 * softNoise(time * 17.3) + shimmer) + vowel * 0.045 * lowVoice(247, time);
}

function sampleAt(index) {
  const time = index / sampleRate;
  const fade = globalFade(time);
  const slowPulse = 0.9 + 0.1 * Math.sin(2 * Math.PI * 0.11 * time);
  let value = 0;

  value += 0.026 * sine(128, time) * slowPulse;
  value += 0.018 * sine(192, time + 0.011) * slowPulse;
  value += 0.008 * sine(64, time);
  value += 0.012 * lowVoice(192, time + 0.04) * (0.7 + 0.3 * sine(0.08, time));

  const cycleStart = Math.floor(time / cycleSeconds) * cycleSeconds;
  for (let i = 0; i < melody.length; i += 1) {
    const start = cycleStart + i * noteStepSeconds;
    const amp = envelope(time, start, melody[i].length, 0.34, 0.72);
    if (amp > 0) {
      const frequency = melody[i].frequency;
      value += 0.07 * amp * lowVoice(frequency, time);
      value += 0.02 * amp * sine(frequency / 2, time);
    }
  }

  const phraseStart = Math.floor(time / 4.8) * 4.8;
  value += pishSyllable(time, phraseStart + 0.42);
  value += pishSyllable(time, phraseStart + 1.58);

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
