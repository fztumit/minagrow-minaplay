import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const completeTouchWords = [
  'su', 'baba', 'top', 'araba', 'elma', 'anne', 'bebek', 'kedi', 'kopek', 'mama', 'bardak', 'tabak', 'kasik',
  'yatak', 'tuvalet', 'mont', 'ayakkabi', 'corap', 'pantolon', 'sapka', 'gozluk', 'canta', 'kitap', 'kalem',
  'telefon', 'kapi', 'pencere', 'anahtar', 'kilit', 'masa', 'sandalye', 'lamba', 'oyuncak'
];

describe('touch default sound set', () => {
  test('ships three recorded pronunciations for every touch object', () => {
    for (const word of completeTouchWords) {
      for (const index of [1, 2, 3]) {
        const file = resolve(process.cwd(), `public/sounds/default/${word}_${index}.wav`);
        expect(existsSync(file), `${word}_${index}.wav should exist`).toBe(true);
        expect(statSync(file).size, `${word}_${index}.wav should not be empty`).toBeGreaterThan(1024);
      }
    }
  });

  test('ships recorded peekaboo voice clips', () => {
    for (const fileName of ['pofi_ceee_01.wav', 'pofi_ceee_02.wav', 'pofi_ceee_03.wav', 'pofi_ceee_04.wav', 'pofi_ceee_05.wav']) {
      const file = resolve(process.cwd(), `public/sounds/peekaboo/${fileName}`);
      expect(existsSync(file), `${fileName} should exist`).toBe(true);
      expect(statSync(file).size, `${fileName} should not be empty`).toBeGreaterThan(1024);
    }
  });

  test('keeps the complete touch vocabulary covered by recorded audio or Turkish TTS fallback', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/modules/main.ts'), 'utf8');
    const nativeSource = readFileSync(
      resolve(process.cwd(), 'android/app/src/main/java/com/minagrow/minaplay/MinaPlayKioskPlugin.java'),
      'utf8'
    );

    expect(completeTouchWords).toHaveLength(33);
    for (const word of completeTouchWords) {
      expect(source).toContain(`createDefaultTouchCard('${word}'`);
    }
    expect(source).toContain('MinaPlayKiosk?.speak');
    expect(source).toContain("utterance.lang = 'tr-TR'");
    expect(nativeSource).toContain('new Locale("tr", "TR")');
  });
});
