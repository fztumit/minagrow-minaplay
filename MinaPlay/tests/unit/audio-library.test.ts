import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const sleepFiles = [
  'Beşik Başında (Sade Ninni).m4a',
  'Bulutların Üzerinde Uyku.m4a',
  'Dünya Biraz Dursun.m4a',
  'Eşek senin ağzınla.m4a',
  'Gül Kokulu Ninni.m4a',
  'Pofi ile Derin Uyku.m4a',
  "Pofi'nin Ninnisi (Vokalli) - Versiyon 2.mp4",
  "Pofi'nin Ninnisi (Vokalli).mp4",
  "Pofi'nin Pış Pış Ninnisi (Vokalli).m4a",
  "Pofi'nin Pışşş Ninnisi .m4a",
  "Pofi'nin Uyku Frekansı (Ambient).m4a",
  "Pofi'nin Uyku Frekansı - Versiyon 2.m4a",
  'Pış Pış (Hipnotik Ninni).m4a',
  'Yum Gözlerini Canım Bebeğim.m4a'
];

describe('complete audio library', () => {
  test('ships recorded speech for every core expression', () => {
    const sentenceDirectory = resolve(process.cwd(), 'public/sounds/sentence');
    const files = readdirSync(sentenceDirectory).filter((fileName) => fileName.endsWith('.wav'));
    expect(files).toHaveLength(15);
    for (const fileName of files) {
      expect(statSync(resolve(sentenceDirectory, fileName)).size).toBeGreaterThan(10_000);
    }
  });

  test('ships every configured sleep recording as a non-empty media file', () => {
    const sleepDirectory = resolve(process.cwd(), 'public/sounds/sleep');
    const actualFiles = new Map(readdirSync(sleepDirectory).map((fileName) => [fileName.normalize('NFC'), fileName]));

    expect(sleepFiles).toHaveLength(14);
    for (const fileName of sleepFiles) {
      const actualFileName = actualFiles.get(fileName.normalize('NFC'));
      expect(actualFileName, `${fileName} should exist`).toBeTruthy();
      const file = resolve(sleepDirectory, actualFileName!);
      expect(statSync(file).size, `${fileName} should contain audio data`).toBeGreaterThan(1_000_000);
    }
  });

  test('ships a complete natural Pofi guide pack for mirror, story and Ceee', () => {
    const guideDirectory = resolve(process.cwd(), 'public/sounds/pofi-guides');
    const manifest = JSON.parse(readFileSync(resolve(guideDirectory, 'manifest.json'), 'utf8')) as Record<string, string>;
    const required = ['bana bak', 'şimdi sen yap', 'ağzını aç', 'ceee', 'neredesin', 'bak', 'çocuk susadı', 'ne istiyor', 'iyi uykular'];
    for (const phrase of required) {
      expect(manifest[phrase], `${phrase} should have recorded audio`).toBeTruthy();
    }
    const files = [...new Set(Object.values(manifest))];
    expect(files.length).toBeGreaterThanOrEqual(45);
    for (const publicPath of files) {
      const file = resolve(process.cwd(), 'public', publicPath.replace(/^\//, ''));
      expect(statSync(file).size, `${publicPath} should contain audio data`).toBeGreaterThan(3_000);
    }
  });
});
