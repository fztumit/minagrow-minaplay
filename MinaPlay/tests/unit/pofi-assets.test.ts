import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const pofiPartFolders = {
  body: 'body',
  eyes: 'eyes',
  eyebrows: 'eyebrows',
  mouth: 'mouth',
  hands: 'hands',
  effect: 'effects'
} as const;

describe('Pofi layered asset references', () => {
  test('point to files shipped in public assets', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/modules/main.ts'), 'utf8');
    const matches = source.matchAll(/\b(body|eyes|eyebrows|mouth|hands|effect): '([^']+\.png)'/g);

    for (const match of matches) {
      const [, part, fileName] = match as [string, keyof typeof pofiPartFolders, string];
      const assetPath = resolve(process.cwd(), `public/assets/pofi/parts/${pofiPartFolders[part]}/${fileName}`);
      expect(existsSync(assetPath), `${part} asset should exist: ${fileName}`).toBe(true);
    }
  });
});
