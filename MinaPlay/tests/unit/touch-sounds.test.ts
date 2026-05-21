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
});
