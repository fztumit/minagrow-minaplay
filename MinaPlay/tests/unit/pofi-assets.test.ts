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

  test('does not ship blocked mirror tongue model states in runtime references', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/modules/main.ts'), 'utf8');
    const serviceWorker = await readFile(resolve(process.cwd(), 'public/sw.js'), 'utf8');
    const runtimeText = `${source}\n${serviceWorker}`;

    for (const blocked of ['tongue-out', 'tongue-up', 'tongue-left', 'tongue-right', 'tongue-down', 'mirrorTongue']) {
      expect(runtimeText, `${blocked} should not be referenced by Pofi runtime`).not.toContain(blocked);
    }
  });

  test('commits face parts as one preloaded team and only animates speech while speaking', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/modules/main.ts'), 'utf8');
    const styles = await readFile(resolve(process.cwd(), 'public/style.css'), 'utf8');

    expect(source).toContain('ensurePofiFaceTeam');
    expect(source).toContain('Promise.all(paths.map(preloadPofiAsset))');
    expect(source).toContain("container.dataset.pofiPoseReady = 'true'");
    expect(styles).toContain('.pofi-avatar .pofi-face-team > .pofi-face');
    expect(styles).toContain('.sentence-surface:not(.sentence-speaking) .pofi-mouth');
    expect(styles).toContain('.mirror-surface:not(.mirror-speaking) .pofi-mouth');
    expect(styles).toContain('.story-surface:not(.story-speaking) .pofi-mouth');
  });
});
