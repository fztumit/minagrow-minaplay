import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __spokenTexts?: string[];
  }
}

const CHILD_LOCK_SETTINGS_KEY = 'minaplay_child_lock_settings_v1';
const CHILD_PROFILE_KEY = 'minaplay_child_profile_v1';
const DEFAULT_CHILD_LOCK_SETTINGS = { enabled: true, keepAwake: true, parentTapCount: 3, parentPullDistance: 80, introSeen: true };
const DEFAULT_TOUCH_CARD_COUNT = 33;

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title === 'first run teaches parent secret gesture') {
    return;
  }
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: CHILD_LOCK_SETTINGS_KEY, value: DEFAULT_CHILD_LOCK_SETTINGS });
});

async function disableChildLock(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ enabled: false, keepAwake: false, parentTapCount: 3, parentPullDistance: 80, introSeen: true }));
  }, CHILD_LOCK_SETTINGS_KEY);
}

async function openParentBySecretGesture(page: Page, taps = 3, pull = 100) {
  for (let index = 0; index < taps; index += 1) {
    await page.mouse.click(24, 24);
  }
  await page.mouse.move(24, 24);
  await page.mouse.down();
  await page.mouse.move(24, 24 + pull, { steps: 6 });
  await page.mouse.up();
}

async function openParentTab(page: Page, tab: 'Bugün' | 'Düzenle' | 'Kontrol') {
  await page.getByRole('tab', { name: tab }).click();
}

async function openParentBlock(page: Page, title: string) {
  await page.locator('details.parent-work-block').filter({ hasText: title }).first().evaluate((block) => {
    (block as HTMLDetailsElement).open = true;
  });
}

test('home opens with the active child modes', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('.mode-card')).toHaveCount(6);
  await expect(page.locator('.mode-card:visible')).toHaveCount(6);
  await expect(page.locator('.mode-card[data-view="sentence"]')).toBeVisible();
  await expect(page.locator('.mode-card[data-view="story"]')).toBeVisible();
  await expect(page.locator('.bonus-strip')).toContainText('Ceee');
  await expect(page.locator('.bottom-nav button')).toHaveCount(6);
  await expect(page.locator('.bottom-nav button:not([hidden])')).toHaveCount(6);
  await expect(page.locator('[data-open-parent]')).toHaveCount(0);
  await expect(page.locator('.topbar-home')).toHaveCount(0);
});

test('mobile home keeps navigation cards and brand bar inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const layout = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.app-shell');
    const guardedElements = [
      document.querySelector<HTMLElement>('.topbar'),
      document.querySelector<HTMLElement>('.mode-grid'),
      document.querySelector<HTMLElement>('.bonus-strip'),
      ...document.querySelectorAll<HTMLElement>('.mode-card')
    ].filter((element): element is HTMLElement => Boolean(element));

    return {
      horizontalOverflow: Boolean(shell && shell.scrollWidth > window.innerWidth + 1),
      allInside: guardedElements.every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth;
      })
    };
  });

  expect(layout).toEqual({ horizontalOverflow: false, allInside: true });
});

test('ceee mode plays a simple Pofi peekaboo loop', async ({ page }) => {
  await disableChildLock(page);
  await page.addInitScript(() => {
    const playedSources: string[] = [];
    const spokenTexts: string[] = [];
    class TestAudio {
      public volume = 1;
      public currentTime = 0;
      public preload = '';
      public duration = 1.2;
      public currentSrc: string;
      private listeners = new Map<string, Array<() => void>>();

      constructor(public src = '') {
        this.currentSrc = src;
      }

      addEventListener(type: string, listener: () => void) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }

      removeEventListener(type: string, listener: () => void) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== listener));
      }

      load() {
        setTimeout(() => {
          for (const listener of this.listeners.get('canplaythrough') ?? []) {
            listener();
          }
        }, 0);
      }

      pause() {}

      play() {
        playedSources.push(this.src);
        setTimeout(() => {
          for (const listener of this.listeners.get('ended') ?? []) {
            listener();
          }
        }, 0);
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, 'Audio', { value: TestAudio });
    Object.defineProperty(window, '__peekabooPlayedSources', { value: playedSources });
    Object.defineProperty(window, '__spokenTexts', { value: spokenTexts });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: (utterance: SpeechSynthesisUtterance) => {
          spokenTexts.push(utterance.text);
        },
        cancel: () => {
          spokenTexts.push('__cancel__');
        }
      }
    });
  });
  await page.goto('/');

  await page.click('[data-view="peekaboo"]');
  const surface = page.locator('[data-peekaboo-surface]');
  const pofi = page.locator('#view-peekaboo [data-pofi-avatar]');
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'ready');
  await expect(pofi).toHaveAttribute('data-pofi-state', 'peekaboo');
  await expect(pofi).toHaveAttribute('data-pofi-role', 'play');

  await page.click('[data-peekaboo-toggle]');
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'cover');
  await expect(pofi).toHaveCSS('animation-name', 'peekaboo-pofi-sky-drift');
  await expect(pofi).toHaveAttribute('data-pofi-state', 'peekabooHidden');
  await expect(pofi).toHaveAttribute('data-pofi-role', 'play');
  await expect(pofi.locator('.pofi-hands')).toHaveAttribute('src', /pofi_hand_closed_v01\.png$/);
  await expect(page.locator('[data-peekaboo-hint]')).toContainText('Mina nerede?');
  await expect.poll(() => page.evaluate(() => window.__spokenTexts ?? [])).toContain('Mina nerede?');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __peekabooPlayedSources: string[] }).__peekabooPlayedSources.length)).toBe(0);

  await expect
    .poll(
      () =>
        page.evaluate(() =>
          (window as unknown as { __peekabooPlayedSources: string[] }).__peekabooPlayedSources.some((source) =>
            source.endsWith('/sounds/peekaboo/pofi_ceee_01.wav')
          )
        ),
      { timeout: 9000 }
    )
    .toBe(true);
  await expect.poll(() => page.evaluate(() => window.__spokenTexts ?? [])).toContain('__cancel__');
  await expect(surface).toHaveAttribute('data-peekaboo-state', /reveal|celebrate|ready/);
  await expect(surface).toHaveAttribute('data-peekaboo-celebration', 'sparkle');
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'ready', { timeout: 3000 });
  await expect(pofi).toHaveAttribute('data-pofi-state', 'peekaboo');
});

test('ceee continues softly when the child does not interact', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await page.click('[data-view="peekaboo"]');
  const surface = page.locator('[data-peekaboo-surface]');
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'cover', { timeout: 5000 });
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'celebrate', { timeout: 9000 });
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'ready', { timeout: 4000 });
});

test('module navigation carries Pofi through a short transition bridge', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await page.click('[data-view="touch"]');
  await expect(page.locator('#view-touch')).toHaveClass(/active/);
  await page.click('.bottom-nav button[data-view="match"]');

  const bridge = page.locator('.pofi-transition-bridge');
  await expect(bridge).toHaveCount(1);
  await expect(bridge.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
  await expect(page.locator('#view-match')).toHaveClass(/active/);
  await expect(bridge).toHaveCount(0, { timeout: 1200 });
});

test('first run teaches parent secret gesture', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-parent-secret-intro]')).toBeVisible();
  await expect(page.locator('[data-parent-secret-guide]')).toContainText('Sol üst köşeye 3 kez dokunun');
  await page.click('[data-parent-secret-accept]');
  await expect(page.locator('[data-parent-secret-intro]')).toBeHidden();
});

test('parent panel records simple module activity', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return Boolean(surface?.dataset.touchTargetId) && ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
  await openParentBySecretGesture(page);

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.getByRole('tab', { name: 'Bugün' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#metric-sessions')).toHaveText('Kısa temas');
  await expect(page.locator('#metric-correct')).toHaveText('1');
  await expect(page.locator('[data-parent-insight]')).toContainText('Bugün tanıma pratiği önde');
  await expect(page.locator('[data-parent-insight]')).toContainText('Anlaşılma');
  await expect(page.locator('[data-parent-insight]')).toContainText('rehberli 3 dakika');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Bölüm ağırlığı');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Bağımsızlık dengesi');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Önerilen kelimeler');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Ev çalışması');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Dokun');
  await expect(page.locator('[data-parent-guidance] .parent-guidance-card')).toHaveCount(3);
  await expect(page.locator('[data-parent-guidance]')).toContainText('Bugünkü ritim');
  await expect(page.locator('[data-parent-guidance]')).toContainText('Sonraki sakin adım');
  await expect(page.locator('.parent-action-card')).toHaveCount(3);
});

test('MinaPlay logo returns modules to home', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep', 'peekaboo']) {
    await page.click(`[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click('.brand-home');
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('active bottom nav button returns to home', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep']) {
    await page.click(`.mode-card[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click(`.bottom-nav button[data-view="${view}"]`);
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('child lock blocks module exits and opens parent with secret gesture', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-child-lock', 'true');

  await page.click('.bottom-nav button[data-view="sleep"]', { force: true });
  await expect(page.locator('#view-touch')).toHaveClass(/active/);

  await openParentBySecretGesture(page);
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Çocuk kilidi');
  await expect(page.locator('[data-child-lock-enabled]')).toBeChecked();
  await expect(page.locator('[data-child-lock-awake]')).toBeChecked();
});

test('parent secret gesture can be updated', async ({ page }) => {
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Çocuk kilidi');
  await page.fill('[data-parent-gesture-taps]', '4');
  await page.fill('[data-parent-gesture-pull]', '120');
  await page.click('[data-parent-gesture-save]');
  await expect(page.locator('[data-child-lock-status]')).toContainText('4 kez');

  await page.click('.brand-home');
  await openParentBySecretGesture(page, 4, 140);
  await expect(page.locator('#view-parent')).toHaveClass(/active/);

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), CHILD_LOCK_SETTINGS_KEY);
  expect(saved.parentTapCount).toBe(4);
  expect(saved.parentPullDistance).toBe(120);
});

test('parent panel updates the child name used by Ceee prompts', async ({ page }) => {
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await page.fill('[data-child-profile-name]', 'Ali');
  await page.click('[data-child-profile-save]');
  await expect(page.locator('[data-child-profile-status]')).toContainText('Ali adı kaydedildi');
  await expect(page.locator('[data-parent-profile-name]')).toHaveText('Ali');
  await expect(page.locator('[data-parent-profile-initial]')).toHaveText('A');

  await page.click('.brand-home');
  await page.click('[data-view="peekaboo"]');
  await page.click('[data-peekaboo-toggle]');
  await expect(page.locator('[data-peekaboo-hint]')).toContainText('Ali nerede?');

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), CHILD_PROFILE_KEY);
  expect(saved.name).toBe('Ali');
});

test('touch module runs a single-target listen and touch round', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('#view-touch .touch-listen-card')).toHaveCount(0);
  await expect(page.locator('#view-touch [data-touch-bubble]')).toHaveCount(0);
  await expect(page.locator('#view-touch .touch-meaning-object')).toHaveCount(0);

  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });

  await expect(page.locator('#view-touch [data-touch-card-id]')).toHaveCount(2);
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  expect(targetId).toBeTruthy();
  await expect(page.locator(`#view-touch [data-touch-card-id="${targetId}"]`)).toHaveClass(/active-target/);
  await expect(page.locator('#view-touch .touch-pofi-hint')).toHaveCount(0);

  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-touch-state', 'success');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveClass(/touch-speaking/);
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-pofi-motion', 'affirm');
});

test('touch Pofi changes motion rhythm while focusing, listening and affirming', async ({ page }) => {
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');

  const surface = page.locator('#view-touch [data-touch-surface]');
  const pofi = page.locator('#view-touch [data-pofi-avatar]');
  await expect(surface).toHaveAttribute('data-pofi-motion', /focus|listen/, { timeout: 5000 });
  await expect(surface).toHaveAttribute('data-pofi-motion', 'listen', { timeout: 5000 });

  await surface.evaluate((element) => {
    element.dataset.pofiMotion = 'speak';
  });
  await expect(pofi.locator('.pofi-body')).toHaveCSS('animation-name', 'touch-pofi-speak-body');

  const targetId = await surface.getAttribute('data-touch-target-id');
  expect(targetId).toBeTruthy();
  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });

  await expect(surface).toHaveAttribute('data-pofi-motion', 'affirm');
  await expect(pofi.locator('.pofi-effect')).toHaveCSS('animation-name', 'touch-pofi-affirm-glow');
});

test('touch target changes card position between consecutive rounds', async ({ page }) => {
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');

  const surface = page.locator('#view-touch [data-touch-surface]');
  const targetIndexes: number[] = [];

  for (let round = 0; round < 4; round += 1) {
    await expect(surface).toHaveAttribute('data-touch-state', /targeting|waiting/, { timeout: 5000 });
    const targetId = await surface.getAttribute('data-touch-target-id');
    const visibleIds = await page
      .locator('#view-touch [data-touch-card-id]')
      .all()
      .then(async (cards) => Promise.all(cards.map((card) => card.getAttribute('data-touch-card-id'))));
    targetIndexes.push(visibleIds.indexOf(targetId));
    await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
    await expect(surface).toHaveAttribute('data-touch-state', 'success');
    await expect(surface).toHaveAttribute('data-touch-state', /attention|targeting|waiting/, { timeout: 5000 });
  }

  for (let index = 1; index < targetIndexes.length; index += 1) {
    expect(targetIndexes[index]).not.toBe(targetIndexes[index - 1]);
  }
});

test('touch uses Turkish speech fallback when a new card has no recorded audio', async ({ page }) => {
  await page.addInitScript(() => {
    const cardIds = [
      'su',
      'baba',
      'top',
      'araba',
      'elma',
      'anne',
      'bebek',
      'kedi',
      'kopek',
      'mama',
      'bardak',
      'tabak',
      'kasik',
      'yatak',
      'tuvalet',
      'mont',
      'ayakkabi',
      'corap',
      'pantolon',
      'sapka',
      'gozluk',
      'canta',
      'kitap',
      'kalem',
      'telefon',
      'kapi',
      'pencere',
      'anahtar',
      'kilit',
      'masa',
      'sandalye',
      'lamba',
      'oyuncak'
    ];
    localStorage.setItem(
      'minaplay_touch_settings_v1',
      JSON.stringify({
        cards: cardIds.map((id, order) => ({
          id,
          label: id === 'mont' ? 'Mont' : id,
          word: id === 'mont' ? 'Mont' : id,
          image: id === 'mont' ? '/assets/cards/objects/coat.png' : `/assets/cards/objects/${id}.png`,
          images: [id === 'mont' ? '/assets/cards/objects/coat.png' : `/assets/cards/objects/${id}.png`],
          learningGoal: 'kavramı tanıma',
          enabled: id === 'mont',
          order,
          variations:
            id === 'mont'
              ? [
                  { id: 'mont-1', label: 'Mont', text: 'Mont', rhythm: 'normal' },
                  { id: 'mont-2', label: 'Mont Mont', text: 'Mont Mont', rhythm: 'ritim-2' },
                  { id: 'mont-3', label: 'M-o-n-t', text: 'M-o-n-t', rhythm: 'ritim-3' }
                ]
              : [{ id: `${id}-1`, label: id, text: id, rhythm: 'normal' }]
        })),
        repeat: { enabled: false, focusCardId: 'mont', style: 'melodic', maxDurationSeconds: 30, maxRepeats: 8, minIntervalMs: 1800, maxIntervalMs: 3200, resourceUrl: '', note: '' }
      })
    );

    window.__spokenTexts = [];
    class SilentMissingAudio {
      public currentSrc = '';
      public duration = 0;
      public volume = 1;
      public currentTime = 0;
      public preload = '';
      private listeners = new Map<string, Array<() => void>>();

      constructor(public src = '') {
        this.currentSrc = src;
      }

      addEventListener(type: string, listener: () => void) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }

      removeEventListener(type: string, listener: () => void) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== listener));
      }

      load() {
        setTimeout(() => {
          for (const listener of this.listeners.get('error') ?? []) {
            listener();
          }
        }, 0);
      }

      pause() {}

      play() {
        return Promise.reject(new Error('missing audio'));
      }
    }
    Object.defineProperty(window, 'Audio', { value: SilentMissingAudio });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: (utterance: SpeechSynthesisUtterance) => {
          window.__spokenTexts.push(utterance.text);
          setTimeout(() => utterance.dispatchEvent(new Event('end')), 0);
        }
      }
    });
  });

  await page.goto('/offline.html');
  await page.evaluate(async () => {
    const settings = localStorage.getItem('minaplay_touch_settings_v1');
    if (!settings) {
      throw new Error('Missing touch settings seed');
    }
    const request = indexedDB.open('minaplay_touch_cards_v1', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.addEventListener('upgradeneeded', () => {
        if (!request.result.objectStoreNames.contains('touchSettings')) {
          request.result.createObjectStore('touchSettings');
        }
      });
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('touchSettings', 'readwrite');
      transaction.objectStore('touchSettings').put(JSON.parse(settings), 'minaplay_touch_settings_v1');
      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => reject(transaction.error));
    });
    db.close();
  });

  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('#view-touch [data-touch-card-id="mont"]')).toBeVisible();
  await page.evaluate(() => {
    window.__spokenTexts = [];
  });
  await page.locator('#view-touch [data-touch-card-id="mont"]').dispatchEvent('click');

  await expect
    .poll(() => page.evaluate(() => window.__spokenTexts ?? []), { timeout: 5000 })
    .toContain('Mont');
  const spokenTexts = await page.evaluate(() => window.__spokenTexts ?? []);
  expect(spokenTexts).not.toContain('Mont Mont');
  expect(spokenTexts).not.toContain('M-o-n-t');
});

test('five-card touch level keeps every card inside the play surface', async ({ page }) => {
  test.setTimeout(75000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: { success: 4, fail: 0, hintLevels: {}, successLatencyMsTotal: 1000, successLatencySamples: 4, repeatNeeds: 0 }
      })
    );
  });
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');

  const surface = page.locator('#view-touch [data-touch-surface]');
  for (let round = 0; round < 16; round += 1) {
    await expect(surface).toHaveAttribute('data-touch-state', /targeting|waiting/, { timeout: 5000 });
    const targetId = await surface.getAttribute('data-touch-target-id');
    await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
    await expect(surface).toHaveAttribute('data-touch-state', 'success');
  }

  await expect(surface).toHaveAttribute('data-touch-level', '3', { timeout: 5000 });
  await expect(page.locator('#view-touch [data-touch-card-id]')).toHaveCount(5);
  const layout = await page.evaluate(() => {
    const playSurface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    const grid = document.querySelector<HTMLElement>('#view-touch [data-touch-card-grid]');
    const cards = [...document.querySelectorAll<HTMLElement>('#view-touch [data-touch-card-id]')];
    const surfaceRect = playSurface?.getBoundingClientRect();
    return {
      allCardsInside:
        Boolean(surfaceRect) &&
        cards.every((card) => {
          const rect = card.getBoundingClientRect();
          return rect.left >= surfaceRect!.left && rect.right <= surfaceRect!.right;
        }),
      gridOverflow: Boolean(grid && grid.scrollWidth > grid.clientWidth + 1)
    };
  });
  expect(layout).toEqual({ allCardsInside: true, gridOverflow: false });
});

test('touch repeat is explicit and parent controlled', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');

  await expect(page.locator('#view-touch [data-touch-repeat-toggle]')).toHaveCount(0);

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Düzenle');
  await expect(page.locator('[data-touch-repeat-focus]')).toHaveValue('baba');
  await expect(page.locator('[data-touch-repeat-style]')).toHaveValue('melodic');
  await expect(page.locator('[data-touch-repeat-duration]')).toHaveValue('30');
  await expect(page.locator('[data-touch-repeat-count]')).toHaveValue('8');
  await expect(page.locator('[data-touch-repeat-record="audio"]')).toBeVisible();
  await expect(page.locator('[data-touch-repeat-record="video"]')).toBeVisible();
  await expect(page.locator('[data-touch-repeat-resource]')).toBeDisabled();
  await expect(page.locator('[data-touch-repeat-use-parent-audio]')).toBeDisabled();
  await page.fill('[data-touch-media-vault-pass]', 'guvenli123');
  await page.click('[data-touch-media-vault-unlock]');
  await expect(page.locator('[data-touch-parent-status]')).toContainText('Medya kasası');
  await expect(page.locator('[data-touch-repeat-resource]')).toBeEnabled();
  await expect(page.locator('[data-touch-repeat-use-parent-audio]')).toBeEnabled();
  await page.selectOption('[data-touch-repeat-focus]', 'baba');
  await page.selectOption('[data-touch-repeat-style]', 'playful');
  await page.locator('[data-touch-repeat-use-parent-audio]').setChecked(true);
  await page.fill('[data-touch-repeat-resource]', 'https://example.com/baba-tekrar.mp4');
  await page.fill('[data-touch-repeat-note]', 'Baba kelimesi için kısa gülümseyen tekrar videosu.');
  await page.click('[data-touch-repeat-save]');
  await expect(page.locator('[data-touch-parent-status]')).toContainText('Baba');
  await expect(page.locator('[data-touch-repeat-media-preview]')).toContainText('https://example.com/baba-tekrar.mp4');

  const settings = await page.evaluate(async () => {
    const local = localStorage.getItem('minaplay_touch_settings_v1');
    if (local) {
      return JSON.parse(local);
    }
    const request = indexedDB.open('minaplay_touch_cards_v1', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });
    const transaction = db.transaction('touchSettings', 'readonly');
    const get = transaction.objectStore('touchSettings').get('current');
    return await new Promise((resolve, reject) => {
      get.addEventListener('success', () => resolve(get.result));
      get.addEventListener('error', () => reject(get.error));
    });
  });
  expect(settings.repeat).toMatchObject({
    focusCardId: 'baba',
    style: 'playful',
    resourceUrl: '',
    note: 'Baba kelimesi için kısa gülümseyen tekrar videosu.',
    useParentAudio: true
  });
  const encryptedMedia = await page.evaluate(async () => {
    const request = indexedDB.open('minaplay_touch_cards_v1', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });
    const transaction = db.transaction('touchSettings', 'readonly');
    const get = transaction.objectStore('touchSettings').get('minaplay_touch_repeat_media_v1');
    return await new Promise((resolve, reject) => {
      get.addEventListener('success', () => resolve(get.result));
      get.addEventListener('error', () => reject(get.error));
    });
  });
  expect(JSON.stringify(encryptedMedia)).not.toContain('baba-tekrar');
  expect(encryptedMedia).toMatchObject({ version: 1 });
  await expect(page.locator('[data-touch-card-editor] [data-touch-card-admin]')).toHaveCount(DEFAULT_TOUCH_CARD_COUNT);
  await expect(page.locator('[data-touch-card-image]').first()).toHaveAttribute('accept', 'image/png,image/jpeg,image/gif');
});

test('matching module uses words mastered in touch', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top'] }));
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: { success: 5, fail: 0, hintLevels: {}, successLatencyMsTotal: 2400, successLatencySamples: 5, repeatNeeds: 0 },
        top: { success: 4, fail: 1, hintLevels: {}, successLatencyMsTotal: 2800, successLatencySamples: 4, repeatNeeds: 1 }
      })
    );
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="match"]');
  const targetId = await page.locator('[data-match-surface]').getAttribute('data-match-target-id');
  expect(['su', 'top']).toContain(targetId);
  expect(await page.locator('[data-match-choice]').count()).toBeGreaterThanOrEqual(2);
  await page.click(`[data-match-choice="${targetId}"]`, { force: true });
  await expect(page.locator('[data-match-status]')).toContainText('Evet');
});

test('matching module escalates hints and records repeat needs', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top'] }));
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: { success: 5, fail: 0, hintLevels: {}, successLatencyMsTotal: 2400, successLatencySamples: 5, repeatNeeds: 0 },
        top: { success: 4, fail: 1, hintLevels: {}, successLatencyMsTotal: 2800, successLatencySamples: 4, repeatNeeds: 1 }
      })
    );
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="match"]');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-state', 'waiting', { timeout: 4000 });
  await page.click('[data-match-pofi-trigger]');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-state', 'hint');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-hint-level', '1');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-hint-level', '2', { timeout: 11000 });
  const targetId = await page.locator('[data-match-surface]').getAttribute('data-match-target-id');
  const wrongChoice = page.locator(`[data-match-choice]:not([data-match-choice="${targetId}"])`).first();
  await wrongChoice.click({ force: true });

  const progress = await page.evaluate((id) => JSON.parse(localStorage.getItem('minaplay_match_progress_v1') ?? '{}')[id ?? ''], targetId);
  expect(progress.hintLevels['1']).toBeGreaterThanOrEqual(1);
  expect(progress.hintLevels['2']).toBeGreaterThanOrEqual(1);
  expect(progress.repeatNeeds).toBeGreaterThanOrEqual(2);
});

test('matching Pofi changes motion between waiting, redirect and success', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top'] }));
  });
  await page.goto('/');
  await page.click('.mode-card[data-view="match"]');

  const surface = page.locator('[data-match-surface]');
  const pofi = page.locator('#view-match [data-pofi-avatar]');
  await expect(surface).toHaveAttribute('data-match-pofi-motion', /focus|model|listen/);
  await expect(surface).toHaveAttribute('data-match-pofi-motion', 'listen', { timeout: 5000 });
  await expect(pofi.locator('.pofi-body')).toHaveCSS('animation-name', 'match-pofi-listen-body');

  const targetId = await surface.getAttribute('data-match-target-id');
  const wrongChoice = page.locator(`[data-match-choice]:not([data-match-choice="${targetId}"])`);
  expect(await wrongChoice.count()).toBeGreaterThan(0);
  await wrongChoice.first().click({ force: true });
  await expect(surface).toHaveAttribute('data-match-pofi-motion', 'reassure');
  await expect(pofi).toHaveAttribute('data-pofi-role', 'softRedirect');

  await expect(surface).toHaveAttribute('data-match-pofi-motion', 'listen', { timeout: 3000 });
  await page.click(`[data-match-choice="${targetId}"]`, { force: true });
  await expect(surface).toHaveAttribute('data-match-pofi-motion', 'affirm');
  await expect(pofi).toHaveAttribute('data-pofi-role', 'affirm');
  await expect(pofi.locator('.pofi-effect')).toHaveCSS('animation-name', 'match-pofi-affirm-glow');
});

test('sentence module completes a short expression from context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top', 'baba'] }));
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="sentence"]');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', /context|waiting/);
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-mode', 'learn');
  await expect(page.locator('.sentence-mode-button[data-sentence-mode="learn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-sentence-context]')).toBeHidden();
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  await expect(page.locator('[data-sentence-choice]')).toHaveCount(0);
  await expect(page.locator('[data-sentence-card] img.sentence-need-image')).toHaveCount(1);

  const sentenceKey = await page.locator('[data-sentence-surface]').getAttribute('data-sentence-key');
  await page.click('[data-sentence-card]', { force: true });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'success');
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'repeat_prompt', { timeout: 7000 });
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem('minaplay_sentence_progress_v1') ?? '{}')[key ?? ''], sentenceKey);
  expect(progress.success).toBeGreaterThanOrEqual(1);
  expect(progress.repeatPrompts).toBeGreaterThanOrEqual(1);
});

test('sentence module offers a select and speak needs board', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="sentence"]');
  await page.click('.sentence-mode-button[data-sentence-mode="board"]');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-mode', 'board');
  await expect(page.locator('.sentence-mode-button[data-sentence-mode="board"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-sentence-board-card]')).toHaveCount(11);
  await expect(page.locator('[data-sentence-card]')).toBeHidden();

  const water = page.locator('[data-sentence-board-card="su-istiyorum"]');
  await water.click({ force: true });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'success');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-key', 'su_istiyorum');
  await expect(water).toHaveClass(/selected/);
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'repeat_prompt', { timeout: 7000 });
});

test('story module narrates and opens an interaction point', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="story"]');
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', /attention|narration/);
  await expect(page.locator('[data-story-scene] .story-scene-image, [data-story-scene] .story-object')).toHaveCount(1);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-step', 'what-needed', { timeout: 18000 });
  await expect(page.locator('[data-story-choice]')).toHaveCount(2);

  await page.click('[data-story-choice="su"]', { force: true });
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', 'success');
  await expect(page.locator('[data-story-choice="su"]')).toHaveClass(/story-correct/);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-step', 'water-drink', { timeout: 11000 });
});

test('sleep module shows moon scene and toggles sleeping Pofi', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="sleep"]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'false');
  await expect(page.locator('#view-sleep .sleep-moon')).toHaveAttribute('src', /assets\/sleep\/moon\.png(?:\?v=[\w-]+)?$/);
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toBeVisible();
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleepReady');
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-eyes')).toHaveAttribute('src', /half-open-v01\.png$/);
  await expect(page.locator('#view-sleep .sleeping-pofi-pose')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-sleep-label]')).toHaveText('Başlat');

  await page.click('[data-sleep-toggle]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleep');
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-eyes')).toHaveAttribute('src', /drowsy-v01\.png$/);
  await expect(page.locator('[data-sleep-label]')).toHaveText('Durdur');
  await expect(page.locator('#view-sleep .sleeping-pofi-pose')).toHaveCSS('opacity', '1', { timeout: 2000 });
  await expect(page.locator('.topbar')).toHaveCSS('opacity', '0');
  await expect(page.locator('.bottom-nav')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-sleep-toggle]')).toHaveCSS('opacity', '0');

  await page.click('[data-sleep-surface]', { position: { x: 20, y: 20 } });
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');

  await page.mouse.move(20, 20);
  await page.mouse.down();
  await page.waitForTimeout(1900);
  await page.mouse.up();
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'false', { timeout: 2200 });
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleepReady');
  await expect(page.locator('[data-sleep-label]')).toHaveText('Başlat');
});

test('mirror module starts camera-safe imitation flow', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="mirror"]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-state', /attention|exercise|waiting/);
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', 'open-mouth');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-state', /exercise|waiting/, { timeout: 7000 });
  await expect(page.locator('#view-mirror [data-pofi-avatar] .pofi-mouth')).toHaveAttribute('src', /open-vertical-big-v01\.png$/);
  await expect(page.locator('[data-mirror-video]')).toHaveCount(1);
  await expect(page.locator('[data-mirror-progress]')).toHaveCSS('--mirror-duration', '3900ms');
  await expect(page.locator('.mirror-actions')).toHaveCount(0);
  await expect(page.locator('[data-mirror-next]')).toHaveCount(0);

  await page.click('[data-mirror-repeat]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', 'open-mouth');
});

test('parent panel shows touch word progress rows', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: {
          success: 4,
          fail: 1,
          hintLevels: { 1: 1 },
          successLatencyMsTotal: 1800,
          successLatencySamples: 4,
          repeatNeeds: 1,
          consecutiveCorrectCount: 3,
          recentResults: [false, true, true, true, true],
          lastPracticedAt: Date.now()
        }
      })
    );
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su'] }));
  });
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Düzenle');
  await expect(page.locator('[data-touch-progress-table] .touch-progress-row')).toHaveCount(DEFAULT_TOUCH_CARD_COUNT);
  await expect(page.locator('[data-touch-progress-table]')).toContainText('Su');
  await expect(page.locator('[data-touch-progress-table]')).toContainText('4 doğru');
  await expect(page.locator('[data-touch-progress-table]')).toContainText('Son 5: 4/5');
  await expect(page.locator('[data-touch-progress-table]')).toContainText('3 seri');
  await expect(page.locator('[data-touch-progress-table]')).toContainText('Öğrenildi');
  await expect(page.locator('[data-parent-guidance]')).toContainText('Su');
});

test('parent panel shows matching mastery and saves Ayna and Uyku preferences', async ({ page }) => {
  await disableChildLock(page);
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su'] }));
    localStorage.setItem(
      'minaplay_match_progress_v1',
      JSON.stringify({
        su: {
          success: 4,
          fail: 1,
          hintUsed: 1,
          hintLevels: { 1: 1 },
          sameImageSuccess: 2,
          conceptGeneralizationSuccess: 2,
          latencyMsTotal: 1600,
          latencySamples: 4,
          repeatNeeds: 1,
          consecutiveCorrectCount: 3,
          recentResults: [false, true, true, true, true],
          lastPracticedAt: Date.now()
        }
      })
    );
  });
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Düzenle');
  await expect(page.locator('[data-match-progress-table]')).toContainText('Son 5: 4/5');
  await expect(page.locator('[data-match-progress-table]')).toContainText('3 seri');
  await expect(page.locator('[data-match-progress-table]')).toContainText('Öğrenildi');

  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Ağız, mimik ve taklit sırası');
  await page.selectOption('[data-mirror-plan-preset]', 'mouth-first');
  await page.click('[data-mirror-plan-save]');
  await openParentBlock(page, 'Ses ve süre');
  await page.selectOption('[data-sleep-sound-setting]', 'ocean');
  await page.selectOption('[data-sleep-duration-setting]', '20');
  await page.fill('[data-sleep-volume]', '80');
  await page.click('[data-sleep-settings-save]');
  await expect(page.locator('[data-module-settings-status]')).toContainText('Uyku sesi');

  const saved = await page.evaluate(() => ({
    mirror: JSON.parse(localStorage.getItem('minaplay_mirror_plan_v1') ?? '{}'),
    sleep: JSON.parse(localStorage.getItem('minaplay_sleep_settings_v1') ?? '{}')
  }));
  expect(saved.mirror).toEqual({ preset: 'mouth-first' });
  expect(saved.sleep).toEqual({ sound: 'ocean', durationMinutes: 20, volume: 0.8 });

  await page.click('.brand-home');
  await page.click('.mode-card[data-view="mirror"]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', 'open-mouth');

  await page.click('.brand-home');
  await page.click('.mode-card[data-view="sleep"]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-sound', 'ocean');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-duration', '20');
});

test('parent panel controls visible child modules safely', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Mod görünürlüğü');
  await page.locator('[data-module-visibility="sleep"]').setChecked(false);
  await page.locator('[data-module-visibility="peekaboo"]').setChecked(false);
  await page.click('[data-module-visibility-save]');
  await expect(page.locator('[data-module-settings-status]')).toContainText('Dokun');

  await page.click('.brand-home');
  await expect(page.locator('.mode-card[data-view="sleep"]')).toBeHidden();
  await expect(page.locator('.bonus-cee')).toBeHidden();
  await expect(page.locator('.bottom-nav button[data-view="sleep"]')).toBeHidden();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('minaplay_module_visibility_v1') ?? '{}'));
  expect(saved.sleep).toBe(false);
  expect(saved.peekaboo).toBe(false);

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Mod görünürlüğü');
  for (const moduleId of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep', 'peekaboo']) {
    await page.locator(`[data-module-visibility="${moduleId}"]`).setChecked(false);
  }
  await page.click('[data-module-visibility-save]');
  await expect(page.locator('[data-module-visibility="touch"]')).toBeChecked();
});

test('parent panel shows local-first device and offline readiness', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Offline ve izinler');
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('[data-device-status] .device-status-chip')).toHaveCount(4);
  await expect(page.locator('[data-device-status]')).toContainText('Çevrimdışı');
  await expect(page.locator('[data-device-status]')).toContainText('Kamera');
  await expect(page.locator('[data-device-status]')).toContainText('Ses');
  await expect(page.locator('[data-device-status]')).toContainText('Yerel kayıt');
  await expect(page.locator('[data-device-status-note]')).toContainText('local-first');
});

test('module surfaces render stateful layered Pofi parts', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await page.click('.mode-card[data-view="mirror"]');

  const mirrorPofi = page.locator('#view-mirror [data-pofi-avatar]');
  await expect(mirrorPofi).toHaveAttribute('data-pofi-state', /mirrorAttention|mirrorOpenMouth/);
  await expect(mirrorPofi.locator('img')).toHaveCount(6);
  await expect(mirrorPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
  await expect(mirrorPofi.locator('.pofi-mouth')).toHaveAttribute('src', /open-smile-soft-v01\.png|open-vertical-big-v01\.png$/);

  await page.click('.brand-home');
  await page.click('.mode-card[data-view="touch"]');
  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return Boolean(surface?.dataset.touchTargetId) && ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });

  const touchPofi = page.locator('#view-touch [data-pofi-avatar]');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-touch-state', 'success');
  await expect(touchPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
});
