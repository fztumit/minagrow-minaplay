import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const publicDir = resolve(__dirname, '../../public');

describe('PWA offline shell', () => {
  test('caches the offline page and client module graph', () => {
    const serviceWorker = readFileSync(resolve(publicDir, 'sw.js'), 'utf8');

    expect(serviceWorker).toContain("'/offline.html'");
    expect(serviceWorker).toContain("'/js/modules/main.js'");
    expect(serviceWorker).toContain("'/js/modules/touch-learning.js'");
    expect(serviceWorker).toContain("'/js/modules/match-learning.js'");
    expect(serviceWorker).toContain("'/js/modules/sentence-learning.js'");
    expect(serviceWorker).toContain("'/js/modules/mvp-settings.js'");
    expect(serviceWorker).toContain("'/js/modules/speech/index.js'");
    expect(serviceWorker).toContain("'/assets/cards/objects/water.png'");
    expect(serviceWorker).toContain("'/assets/cards/objects/dad.png'");
    expect(serviceWorker).toContain("'/assets/cards/objects/apple.png'");
    expect(serviceWorker).toContain("await caches.match('/offline.html')");
  });

  test('keeps a calm Turkish offline fallback page', () => {
    const offlinePage = readFileSync(resolve(publicDir, 'offline.html'), 'utf8');

    expect(offlinePage).toContain('lang="tr"');
    expect(offlinePage).toContain('MinaPlay hazır');
    expect(offlinePage).toContain('Ana ekrana dön');
  });
});
