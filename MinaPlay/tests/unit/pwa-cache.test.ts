import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const publicDir = resolve(__dirname, '../../public');

describe('PWA offline shell', () => {
  test('caches the offline page and client module graph', () => {
    const serviceWorker = readFileSync(resolve(publicDir, 'sw.js'), 'utf8');

    expect(serviceWorker).toContain("'/offline.html'");
    expect(serviceWorker).toContain("'/js/modules/main.js?v=20260803-1'");
    expect(serviceWorker).toContain("'/v34.css?v=20260712-4'");
    expect(serviceWorker).toContain("'/sounds/pofi-guides/manifest.json'");
    expect(serviceWorker).toContain("'/js/modules/touch-learning.js'");
    expect(serviceWorker).toContain("'/js/modules/match-learning.js'");
    expect(serviceWorker).toContain("'/js/modules/sentence-learning.js'");
    expect(serviceWorker).toContain("'/js/modules/mvp-settings.js'");
    expect(serviceWorker).toContain("'/js/modules/pofi-contracts.js'");
    expect(serviceWorker).toContain("'/js/modules/media-vault-backup.js'");
    expect(serviceWorker).toContain("'/js/modules/speech/index.js'");
    expect(serviceWorker).toContain("'/assets/cards/objects/water.png'");
    expect(serviceWorker).toContain("'/assets/cards/people/dad.png'");
    expect(serviceWorker).toContain("'/assets/cards/objects/apple.png'");
    expect(serviceWorker).toContain("'/assets/cards/actions/drink.png'");
    expect(serviceWorker).toContain("'/assets/cards/sentences/water-request.png'");
    expect(serviceWorker).toContain("'/sounds/peekaboo/pofi_ceee_01.wav'");
    expect(serviceWorker).toContain("'/sounds/peekaboo/pofi_ceee_05.wav'");
    expect(serviceWorker).not.toContain("'/sounds/sleep/Gül Kokulu Ninni.wav'");
    expect(serviceWorker).not.toContain("'/assets/cards/objects/dad.png'");
    expect(serviceWorker).toContain("await caches.match('/offline.html')");
  });

  test('keeps a calm Turkish offline fallback page', () => {
    const offlinePage = readFileSync(resolve(publicDir, 'offline.html'), 'utf8');

    expect(offlinePage).toContain('lang="tr"');
    expect(offlinePage).toContain('MinaPlay hazır');
    expect(offlinePage).toContain('Ana ekrana dön');
  });
});
