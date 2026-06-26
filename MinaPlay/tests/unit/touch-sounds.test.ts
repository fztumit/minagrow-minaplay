import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const defaultWords = ['su', 'baba', 'top', 'araba', 'elma'];

describe('touch default sound set', () => {
  test('ships three fallback recordings for every starter card', () => {
    for (const word of defaultWords) {
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

  test('ships the recorded pis pis sleep loop', () => {
    const file = resolve(process.cwd(), 'public/sounds/sleep/pispis-ninni.wav');
    expect(existsSync(file), 'pispis-ninni.wav should exist').toBe(true);
    expect(statSync(file).size, 'pispis-ninni.wav should contain a full sleep loop').toBeGreaterThan(1_000_000);
  });
});
