import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

declare global {
  interface Window {
    __spokenTexts?: string[];
  }
}

const CHILD_LOCK_SETTINGS_KEY = 'minaplay_child_lock_settings_v1';
const CHILD_PROFILE_KEY = 'minaplay_child_profile_v1';
const DEFAULT_PARENT_PIN = '2468';
const DEFAULT_CHILD_LOCK_SETTINGS = {
  enabled: true,
  keepAwake: true,
  parentTapCount: 3,
  parentPullDistance: 80,
  introSeen: true,
  parentPin: DEFAULT_PARENT_PIN
};
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
    localStorage.setItem(
      key,
      JSON.stringify({ enabled: false, keepAwake: false, parentTapCount: 3, parentPullDistance: 80, introSeen: true, parentPin: '2468' })
    );
  }, CHILD_LOCK_SETTINGS_KEY);
}

async function waitForAppBoot(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-minaplay-boot', /2026\d{4}-/);
}

async function openParentPinModalByGesture(page: Page, pull = 100) {
  await expect(page.locator('html')).toHaveAttribute('data-minaplay-boot', /2026\d{4}-/);
  await page.locator('[data-parent-gesture-zone]').dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: 30,
    clientY: 30
  });
  await page.waitForTimeout(50);
  await page.locator('[data-parent-gesture-zone]').dispatchEvent('pointermove', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: 30,
    clientY: 30 + pull
  });
  await page.locator('[data-parent-gesture-zone]').dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: 30,
    clientY: 30 + pull
  });
  await expect(page.locator('[data-parent-pin-modal]')).toBeVisible();
}

async function openParentPinModalByHold(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-minaplay-boot', /2026\d{4}-/);
  await page.locator('[data-parent-gesture-zone]').dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    clientX: 30,
    clientY: 30
  });
  await page.waitForTimeout(50);
  await page.locator('[data-parent-gesture-zone]').dispatchEvent('pointerup', {
    pointerId: 2,
    pointerType: 'touch',
    clientX: 30,
    clientY: 34
  });
  await expect(page.locator('[data-parent-pin-modal]')).toBeVisible();
}

async function openParentBySecretGesture(page: Page, pull = 100, pin = DEFAULT_PARENT_PIN) {
  await openParentPinModalByGesture(page, pull);
  await page.fill('[data-parent-pin-input]', pin);
  await page.locator('[data-parent-pin-form]').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.locator('[data-parent-pin-modal]')).toBeHidden();
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
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

test('tablet portrait home uses the lower screen area for Ceee', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');

  const layout = await page.evaluate(() => {
    const rectOf = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
    const logo = rectOf('.topbar-logo');
    const home = rectOf('#view-home');
    const bonus = rectOf('.bonus-strip');
    const cee = rectOf('.home-ceee-band');
    const motivationElement = document.querySelector<HTMLElement>('.bonus-motivation');
    const cards = [...document.querySelectorAll<HTMLElement>('.mode-card')].map((card) => card.getBoundingClientRect());
    const lowestCardBottom = Math.max(...cards.map((card) => card.bottom));

    return {
      bonusBottomGap: bonus ? window.innerHeight - bonus.bottom : 999,
      bonusHeightRatio: bonus ? bonus.height / window.innerHeight : 0,
      ceeWidthRatio: cee ? cee.width / window.innerWidth : 0,
      homeHeightRatio: home ? home.height / window.innerHeight : 0,
      logoWidthRatio: logo ? logo.width / window.innerWidth : 0,
      motivationHidden: !motivationElement || window.getComputedStyle(motivationElement).display === 'none',
      verticalOrder: Boolean(bonus && lowestCardBottom <= bonus.top)
    };
  });

  expect(layout.homeHeightRatio).toBeGreaterThan(0.86);
  expect(layout.logoWidthRatio).toBeGreaterThan(0.42);
  expect(layout.bonusHeightRatio).toBeGreaterThan(0.12);
  expect(layout.bonusBottomGap).toBeLessThanOrEqual(24);
  expect(layout.ceeWidthRatio).toBeGreaterThan(0.9);
  expect(layout.motivationHidden).toBe(true);
  expect(layout.verticalOrder).toBe(true);
});

test('ceee mode plays a simple Pofi peekaboo loop', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');
  await waitForAppBoot(page);

  await page.click('[data-view="peekaboo"]');
  const surface = page.locator('[data-peekaboo-surface]');
  const pofi = page.locator('#view-peekaboo [data-pofi-avatar]');
  await expect(surface).toHaveAttribute('data-peekaboo-state', /cover|reveal|celebrate|ready/);
  await expect(surface).toHaveAttribute('data-peekaboo-contract', 'classic-cover-reveal');
  await expect(surface).toHaveAttribute('data-peekaboo-score', 'false');
  await expect(surface).not.toHaveAttribute('data-peekaboo-spot', /.+/);
  await expect(pofi).toHaveAttribute('data-pofi-role', 'play');
  await expect(pofi).toHaveCSS('animation-name', 'v33-ceee-safe-flight');
  await expect(page.locator('.peekaboo-status')).not.toContainText(/saklandı|puan|tur/i);
  await expect.poll(async () => Number(await surface.getAttribute('data-peekaboo-search-audio-count')), { timeout: 9000 }).toBeGreaterThanOrEqual(1);
  await expect.poll(async () => Number(await surface.getAttribute('data-peekaboo-reveal-audio-count')), { timeout: 9000 }).toBeGreaterThanOrEqual(1);
  await expect(surface).toHaveAttribute('data-peekaboo-state', /reveal|celebrate|ready/);
  await expect(surface).toHaveAttribute('data-peekaboo-celebration', 'sparkle');
  await expect(surface).toHaveAttribute('data-peekaboo-state', /ready|cover/, { timeout: 5000 });
  await expect(pofi).toHaveAttribute('data-pofi-state', 'peekaboo');
});

test('ceee continues softly when the child does not interact', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');
  await waitForAppBoot(page);

  await page.click('[data-view="peekaboo"]');
  const surface = page.locator('[data-peekaboo-surface]');
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'cover', { timeout: 5000 });
  await expect(surface).toHaveAttribute('data-peekaboo-state', 'celebrate', { timeout: 9000 });
  await expect(surface).toHaveAttribute('data-peekaboo-state', /ready|cover/, { timeout: 5000 });
});

test('child home button returns modules home before another mode starts', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await page.click('[data-view="touch"]');
  await expect(page.locator('#view-touch')).toHaveClass(/active/);
  await expect(page.locator('.child-home-button')).toBeVisible();

  await page.click('.child-home-button');
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await page.click('.mode-card[data-view="match"]');
  await expect(page.locator('#view-match')).toHaveClass(/active/);
  await expect(page.locator('.pofi-transition-bridge')).toHaveCount(0);
});

test('first run teaches parent secret gesture', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-parent-secret-intro]')).toBeHidden();
  await openParentPinModalByGesture(page);
  await page.fill('[data-parent-pin-input]', '0000');
  await page.locator('[data-parent-pin-form]').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.locator('[data-parent-pin-modal]')).toBeVisible();
  await expect(page.locator('[data-parent-pin-status]')).toContainText('Şifre yanlış');
  await page.fill('[data-parent-pin-input]', DEFAULT_PARENT_PIN);
  await page.locator('[data-parent-pin-form]').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
});

test('parent pin opens after holding the star without a captured drag', async ({ page }) => {
  await page.goto('/');

  await openParentPinModalByHold(page);
  await page.fill('[data-parent-pin-input]', DEFAULT_PARENT_PIN);
  await page.locator('[data-parent-pin-form]').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
});

test('parent panel has a clear MinaPlay logo and home exit on tablet', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');

  await openParentBySecretGesture(page);
  const brand = page.locator('.parent-home-brand');
  const homeAction = page.locator('.parent-home-action');
  await expect(brand.locator('img[alt="MinaPlay"]')).toBeVisible();
  await expect(homeAction).toBeVisible();
  await expect(homeAction).toHaveText('Ana ekran');

  const layout = await page.evaluate(() => {
    const brandRect = document.querySelector<HTMLElement>('.parent-home-brand')?.getBoundingClientRect();
    const actionRect = document.querySelector<HTMLElement>('.parent-home-action')?.getBoundingClientRect();
    const tabsRect = document.querySelector<HTMLElement>('.parent-tabs')?.getBoundingClientRect();
    return {
      brandInside: Boolean(brandRect && brandRect.left >= 0 && brandRect.right <= window.innerWidth),
      actionInside: Boolean(actionRect && actionRect.left >= 0 && actionRect.right <= window.innerWidth),
      brandAboveTabs: Boolean(brandRect && tabsRect && brandRect.bottom <= tabsRect.top)
    };
  });
  expect(layout).toEqual({ brandInside: true, actionInside: true, brandAboveTabs: true });

  await homeAction.click();
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  await expect(page.locator('#view-home')).toHaveClass(/active/);
});

test('parent panel records simple module activity', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return Boolean(surface?.dataset.touchTargetId) && surface?.dataset.touchState === 'waiting';
  });
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
  await openParentBySecretGesture(page);

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.getByRole('tab', { name: 'Bugün' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#metric-sessions')).toHaveText('Kısa temas');
  await expect(page.locator('#metric-correct')).toHaveText('1');
  await expect(page.locator('#metric-soft')).toHaveText('0');
  await expect(page.locator('[data-parent-insight]')).toContainText('Bugün tanıma pratiği önde');
  await expect(page.locator('[data-parent-insight]')).toContainText('Anlaşılma');
  await expect(page.locator('[data-parent-insight]')).toContainText('rehberli 3 dakika');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Bölüm ağırlığı');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Bağımsızlık dengesi');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Pofi destek türleri');
  await expect(page.locator('[data-parent-today-summary]')).toContainText(/Yumuşak yönlendirme|Henüz Pofi destek izi yok/);
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Detaylı destek izi');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Önerilen kelimeler');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Ev çalışması');
  await expect(page.locator('[data-parent-today-summary]')).toContainText('Dokun');
  await page.locator('.parent-detail-drawer').evaluate((drawer) => {
    (drawer as HTMLDetailsElement).open = true;
  });
  await expect(page.locator('[data-parent-detail-analysis]')).toContainText('Bugünün odak kararı');
  await expect(page.locator('[data-parent-detail-analysis]')).toContainText('Sıradaki mod');
  await expect(page.locator('[data-parent-guidance] .parent-guidance-card')).toHaveCount(3);
  await expect(page.locator('[data-parent-guidance]')).toContainText('Bugünkü ritim');
  await expect(page.locator('[data-parent-guidance]')).toContainText('Sonraki sakin adım');
  await expect(page.locator('.parent-action-card')).toHaveCount(3);
});

test('child home button returns modules to home', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'peekaboo']) {
    await page.click(`[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click('.child-home-button');
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('child home button stays visible across primary child modes', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror']) {
    await page.click(`.mode-card[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await expect(page.locator('.child-home-button')).toBeVisible();
    await page.click('.child-home-button');
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('MinaPlay home remains inside native child lock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-child-lock', 'true');
  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'touch');
  await page.click('.child-home-button');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-child-lock', 'true');
});

test('child lock blocks native back and opens parent with secret PIN gesture', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-child-lock', 'true');

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('#view-touch')).toHaveClass(/active/);

  await openParentBySecretGesture(page);
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('[data-app-update-check]').first()).toBeVisible();
  await expect(page.locator('[data-app-update-quick]')).toBeHidden();
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Çocuk kilidi');
  await expect(page.locator('[data-child-lock-enabled]')).toBeChecked();
  await expect(page.locator('[data-child-lock-awake]')).toBeChecked();

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
});

test('tablet child modules maximize usable screen area', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }, { key: CHILD_LOCK_SETTINGS_KEY, value: DEFAULT_CHILD_LOCK_SETTINGS });
  await page.goto('/');
  await waitForAppBoot(page);

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror']) {
    await page.click(`.mode-card[data-view="${view}"]`, { force: true });
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', view);

    const metrics = await page.evaluate((view) => {
      const topbar = document.querySelector('.topbar')?.getBoundingClientRect();
      const module = document.querySelector('.module-view.active')?.getBoundingClientRect();
      const surface = document.querySelector('.module-view.active [data-module-surface]')?.getBoundingClientRect();
      const keyElement = view === 'touch'
        ? document.querySelector('#view-touch .touch-pofi-button')?.getBoundingClientRect()
        : view === 'sentence'
          ? document.querySelector('#view-sentence .sentence-pofi-button')?.getBoundingClientRect()
          : view === 'story'
            ? document.querySelector('#view-story .story-pofi-button')?.getBoundingClientRect()
            : view === 'mirror'
              ? document.querySelector('#view-mirror .mirror-camera-card')?.getBoundingClientRect()
              : document.querySelector('#view-match .match-pofi-button')?.getBoundingClientRect();
      const homeButton = document.querySelector('.child-home-button')?.getBoundingClientRect();
      const parentStar = document.querySelector('[data-parent-gesture-zone]')?.getBoundingClientRect();
      return {
        topbarHeight: topbar?.height ?? 0,
        moduleHeight: module?.height ?? 0,
        surfaceHeight: surface?.height ?? 0,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        keyInsideViewport: Boolean(
          keyElement
          && keyElement.left >= 0
          && keyElement.top >= 0
          && keyElement.right <= window.innerWidth
          && keyElement.bottom <= window.innerHeight
        ),
        homeInsideViewport: Boolean(homeButton && homeButton.left >= 0 && homeButton.right <= window.innerWidth && homeButton.top >= 0),
        parentStarInsideViewport: Boolean(parentStar && parentStar.left >= 0 && parentStar.right <= window.innerWidth && parentStar.top >= 0)
      };
    }, view);

    expect(metrics.topbarHeight).toBeLessThanOrEqual(66);
    expect(metrics.moduleHeight / metrics.viewportHeight).toBeGreaterThan(0.9);
    expect(metrics.surfaceHeight / metrics.viewportHeight).toBeGreaterThan(0.84);
    expect(metrics.keyInsideViewport).toBe(true);
    expect(metrics.homeInsideViewport).toBe(true);
    expect(metrics.parentStarInsideViewport).toBe(true);

    await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
    await openParentBySecretGesture(page);
    await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('tablet learning layouts keep Pofi, target and choices in one clear visual flow', async ({ page }) => {
  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 600, height: 960 },
    { width: 1180, height: 820 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForAppBoot(page);

    for (const view of ['touch', 'match', 'sentence', 'story', 'mirror']) {
      await page.click(`.mode-card[data-view="${view}"]`, { force: true });
      await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', view);
      await page.waitForTimeout(350);

      const metrics = await page.evaluate((view) => {
        const selectorMap: Record<string, string[]> = {
          touch: ['.touch-pofi-button', '.touch-card'],
          match: ['.match-pofi-button', '.match-target', '.match-choice'],
          sentence: ['.sentence-pofi-button', '.sentence-card', '.sentence-choice-grid'],
          story: ['.story-pofi-button', '.story-scene', '.story-choice-grid'],
          mirror: ['.mirror-pofi-card', '.mirror-camera-card']
        };
        const rects = selectorMap[view]
          .flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)].map((element) => ({ selector, rect: element.getBoundingClientRect() })))
          .filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);
        const overlaps = [];
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const a = rects[i].rect;
            const b = rects[j].rect;
            const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            if (overlapX > 2 && overlapY > 2) {
              overlaps.push({ a: rects[i].selector, b: rects[j].selector, overlapX, overlapY });
            }
          }
        }
        const pofi = rects.find((entry) => entry.selector.includes('pofi'))?.rect;
        const nonPofi = rects.filter((entry) => !entry.selector.includes('pofi')).map((entry) => entry.rect);
        const nearestBelowGap = pofi
          ? Math.min(...nonPofi.map((rect) => rect.top - pofi.bottom).filter((gap) => gap >= 0), 9999)
          : 9999;
        const matchTarget = document.querySelector<HTMLElement>('#view-match .match-target')?.getBoundingClientRect();
        const matchChoices = document.querySelector<HTMLElement>('#view-match .match-choice-grid')?.getBoundingClientRect();
        return {
          allInside: rects.every(({ rect }) => rect.left >= -2 && rect.right <= window.innerWidth + 2 && rect.top >= -2 && rect.bottom <= window.innerHeight + 2),
          matchTargetChoiceGap: view === 'match' && matchTarget && matchChoices ? matchChoices.top - matchTarget.bottom : null,
          nearestBelowGap,
          overlapCount: overlaps.length
        };
      }, view);

      expect(metrics.allInside, `${view} ${viewport.width}x${viewport.height}`).toBe(true);
      if (!(view === 'match' && viewport.width === 600)) {
        expect(metrics.overlapCount, `${view} ${viewport.width}x${viewport.height}`).toBe(0);
      }
      if (view === 'touch' && viewport.width < viewport.height) {
        expect(metrics.nearestBelowGap).toBeGreaterThanOrEqual(16);
        expect(metrics.nearestBelowGap).toBeLessThanOrEqual(90);
      }
      if (view === 'match') {
        expect(metrics.matchTargetChoiceGap).not.toBeNull();
        expect(metrics.matchTargetChoiceGap ?? 0).toBeGreaterThanOrEqual(-5);
        expect(metrics.matchTargetChoiceGap ?? 0).toBeLessThanOrEqual(viewport.width < viewport.height ? 90 : 160);
      }

      await page.click('.child-home-button', { force: true });
      await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
    }
  }
});

test('compact tablet touch mode uses the full child surface', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 1024 });
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: CHILD_LOCK_SETTINGS_KEY, value: DEFAULT_CHILD_LOCK_SETTINGS });
  await page.goto('/');
  await waitForAppBoot(page);
  await waitForAppBoot(page);

  await page.click('.mode-card[data-view="touch"]', { force: true });
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'touch');
  await page.waitForTimeout(600);

  const metrics = await page.evaluate(() => {
    const module = document.querySelector('#view-touch')?.getBoundingClientRect();
    const surface = document.querySelector('#view-touch [data-touch-surface]')?.getBoundingClientRect();
    const pofi = document.querySelector('#view-touch .touch-pofi-button')?.getBoundingClientRect();
    const cards = [...document.querySelectorAll<HTMLElement>('#view-touch .touch-card.active, #view-touch .touch-card.active-target')]
      .map((card) => card.getBoundingClientRect())
      .filter((card) => card.width > 0 && card.height > 0);
    return {
      cardCount: cards.length,
      cardsInside: cards.every((card) => card.left >= 0 && card.right <= window.innerWidth && card.top >= 0 && card.bottom <= window.innerHeight),
      moduleHeightRatio: module ? module.height / window.innerHeight : 0,
      pofiInside: Boolean(pofi && pofi.left >= 0 && pofi.right <= window.innerWidth && pofi.top >= 0 && pofi.bottom <= window.innerHeight),
      surfaceHeightRatio: surface ? surface.height / window.innerHeight : 0
    };
  });

  expect(metrics.moduleHeightRatio).toBeGreaterThan(0.96);
  expect(metrics.surfaceHeightRatio).toBeGreaterThan(0.92);
  expect(metrics.cardCount).toBeGreaterThanOrEqual(1);
  expect(metrics.cardsInside).toBe(true);
  expect(metrics.pofiInside).toBe(true);
});

test('Pofi-first expression, story and mirror stages use the tablet viewport', async ({ page }) => {
  await disableChildLock(page);
  for (const viewport of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await page.click('.mode-card[data-view="sentence"]');
    await expect(page.locator('.sentence-mode-switch')).toBeVisible();
    const sentence = await page.evaluate(() => {
      const pofi = document.querySelector('#view-sentence .sentence-pofi-button')?.getBoundingClientRect();
      const card = document.querySelector('#view-sentence .sentence-card')?.getBoundingClientRect();
      const toggle = document.querySelector('#view-sentence .sentence-mode-switch')?.getBoundingClientRect();
      return { pofiWidth: pofi?.width ?? 0, cardWidth: card?.width ?? 0, toggleTop: toggle?.top ?? -1, toggleBottom: toggle?.bottom ?? 99999 };
    });
    expect(sentence.pofiWidth).toBeGreaterThanOrEqual(sentence.cardWidth * 0.85);
    expect(sentence.toggleTop).toBeGreaterThanOrEqual(0);
    expect(sentence.toggleBottom).toBeLessThanOrEqual(viewport.height);
    await page.click('.child-home-button');

    await page.click('.mode-card[data-view="story"]');
    const storyPofi = await page.locator('#view-story .story-pofi-button').boundingBox();
    expect(storyPofi?.width ?? 0).toBeGreaterThanOrEqual(viewport.width * (viewport.width < viewport.height ? 0.75 : 0.38));
    await page.click('.child-home-button');

    await page.click('.mode-card[data-view="mirror"]');
    const mirrorPofi = await page.locator('#view-mirror .mirror-pofi-card').boundingBox();
    expect(mirrorPofi?.width ?? 0).toBeGreaterThanOrEqual(viewport.width * (viewport.width < viewport.height ? 0.78 : 0.38));
    await page.click('.child-home-button');
  }
});

test('tablet portrait touch hides the brand header and fills the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: CHILD_LOCK_SETTINGS_KEY, value: DEFAULT_CHILD_LOCK_SETTINGS });
  await page.goto('/');
  await waitForAppBoot(page);

  await page.click('.mode-card[data-view="touch"]', { force: true });
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'touch');
  await page.waitForTimeout(600);

  const metrics = await page.evaluate(() => {
    const module = document.querySelector('#view-touch')?.getBoundingClientRect();
    const surface = document.querySelector('#view-touch [data-touch-surface]')?.getBoundingClientRect();
    const pofi = document.querySelector('#view-touch .touch-pofi-button')?.getBoundingClientRect();
    const topbar = document.querySelector<HTMLElement>('.topbar');
    const topbarStyle = topbar ? getComputedStyle(topbar) : null;
    const cards = [...document.querySelectorAll<HTMLElement>('#view-touch .touch-card.active, #view-touch .touch-card.active-target')]
      .map((card) => card.getBoundingClientRect())
      .filter((card) => card.width > 0 && card.height > 0);

    return {
      cardCount: cards.length,
      cardsInside: cards.every((card) => card.left >= 0 && card.right <= window.innerWidth && card.top >= 0 && card.bottom <= window.innerHeight),
      moduleBottomGap: module ? window.innerHeight - module.bottom : 999,
      moduleHeightRatio: module ? module.height / window.innerHeight : 0,
      pofiInside: Boolean(pofi && pofi.left >= 0 && pofi.right <= window.innerWidth && pofi.top >= 0 && pofi.bottom <= window.innerHeight),
      surfaceHeightRatio: surface ? surface.height / window.innerHeight : 0,
      topbarHidden: topbarStyle ? topbarStyle.display === 'none' && topbarStyle.visibility === 'hidden' : false
    };
  });

  expect(metrics.topbarHidden).toBe(true);
  expect(metrics.moduleHeightRatio).toBeGreaterThan(0.98);
  expect(metrics.surfaceHeightRatio).toBeGreaterThan(0.96);
  expect(metrics.moduleBottomGap).toBeLessThanOrEqual(2);
  expect(metrics.cardCount).toBeGreaterThanOrEqual(1);
  expect(metrics.cardsInside).toBe(true);
  expect(metrics.pofiInside).toBe(true);
});

test('landscape matching keeps Pofi and choices inside the play surface', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: CHILD_LOCK_SETTINGS_KEY, value: DEFAULT_CHILD_LOCK_SETTINGS });
  await page.goto('/');
  await waitForAppBoot(page);

  await page.click('.mode-card[data-view="match"]', { force: true });
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'match');

  const metrics = await page.evaluate(() => {
    const target = document.querySelector('#view-match [data-match-target]')?.getBoundingClientRect();
    const choices = document.querySelector('#view-match .match-choice-grid')?.getBoundingClientRect();
    const boxes = [
      document.querySelector('#view-match .match-pofi-button')?.getBoundingClientRect(),
      target,
      choices,
      ...[...document.querySelectorAll<HTMLElement>('#view-match .match-choice-grid > *')].map((choice) => choice.getBoundingClientRect())
    ].filter((box): box is DOMRect => Boolean(box));
    const surface = document.querySelector('#view-match [data-match-surface]')?.getBoundingClientRect();
    return {
      allInsideSurface: Boolean(surface && boxes.every((box) => box.left >= surface.left && box.right <= surface.right && box.top >= surface.top && box.bottom <= surface.bottom)),
      allInsideViewport: boxes.every((box) => box.left >= 0 && box.right <= window.innerWidth && box.top >= 0 && box.bottom <= window.innerHeight),
      choiceCount: document.querySelectorAll('#view-match .match-choice-grid > *').length,
      targetAboveChoices: Boolean(target && choices && target.bottom <= choices.top),
      surfaceHeightRatio: surface ? surface.height / window.innerHeight : 0
    };
  });

  expect(metrics.surfaceHeightRatio).toBeGreaterThan(0.86);
  expect(metrics.choiceCount).toBeGreaterThanOrEqual(2);
  expect(metrics.targetAboveChoices).toBe(true);
  expect(metrics.allInsideViewport).toBe(true);
  expect(metrics.allInsideSurface).toBe(true);
});

test('parent secret gesture can be updated', async ({ page }) => {
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Çocuk kilidi');
  await page.fill('[data-parent-pin-setting]', '1357');
  await page.fill('[data-parent-gesture-pull]', '120');
  await page.click('[data-parent-gesture-save]');
  await expect(page.locator('[data-child-lock-status]')).toContainText('yıldıza dokunun');

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  await openParentBySecretGesture(page, 140, '1357');
  await expect(page.locator('#view-parent')).toHaveClass(/active/);

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), CHILD_LOCK_SETTINGS_KEY);
  expect(saved.parentPin).toBe('1357');
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

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  await page.click('[data-view="peekaboo"]');
  await page.click('[data-peekaboo-toggle]');
  await expect(page.locator('[data-peekaboo-hint]')).toContainText(/Neredesin|Haniymiş|Seni bulabilecek miyim|Nereye saklandın/);

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), CHILD_PROFILE_KEY);
  expect(saved.name).toBe('Ali');
});

test('touch module runs a single-target listen and touch round', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('#view-touch .touch-listen-card')).toHaveCount(0);
  await expect(page.locator('#view-touch [data-touch-bubble]')).toHaveCount(0);
  await expect(page.locator('#view-touch .touch-meaning-object')).toHaveCount(0);
  await expect(page.locator('#view-touch [data-touch-status]')).not.toHaveClass(/active/);

  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });

  await expect(page.locator('#view-touch [data-touch-card-id]')).toHaveCount(2);
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  expect(targetId).toBeTruthy();
  await expect(page.locator(`#view-touch [data-touch-card-id="${targetId}"]`)).toHaveClass(/active-target/);
  await expect(page.locator('#view-touch .touch-pofi-hint')).toHaveCount(0);
  await expect(page.locator('#view-touch .touch-card-variation').first()).toBeEmpty();

  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-touch-state', 'success');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-pofi-motion', 'affirm');
});

test('touch landscape keeps Pofi above two large image-ready cards', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('#view-touch .touch-card')).toHaveCount(2);
  await expect(page.locator('#view-touch .touch-card.touch-card-ready')).toHaveCount(2);
  const layout = await page.evaluate(() => {
    const pofi = document.querySelector<HTMLElement>('#view-touch .touch-pofi-button')?.getBoundingClientRect();
    const cards = [...document.querySelectorAll<HTMLElement>('#view-touch .touch-card')].map((card) => card.getBoundingClientRect());
    return {
      pofiInside: Boolean(pofi && pofi.left >= 0 && pofi.right <= innerWidth && pofi.top >= 0 && pofi.bottom <= innerHeight),
      pofiAbove: Boolean(pofi && cards.every((card) => card.top >= pofi.bottom - 2)),
      cardsInside: cards.every((card) => card.left >= 0 && card.right <= innerWidth && card.top >= 0 && card.bottom <= innerHeight),
      equalHeight: cards.length === 2 ? Math.abs(cards[0].height - cards[1].height) < 2 : false
    };
  });
  expect(layout).toEqual({ pofiInside: true, pofiAbove: true, cardsInside: true, equalHeight: true });
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

test('rapid touch taps count once and do not backlog the next round', async ({ page }) => {
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');
  const surface = page.locator('#view-touch [data-touch-surface]');
  await expect(surface).toHaveAttribute('data-touch-state', /targeting|waiting/, { timeout: 5000 });
  const targetId = await surface.getAttribute('data-touch-target-id');
  expect(targetId).toBeTruthy();

  await page.locator(`#view-touch [data-touch-card-id="${targetId}"]`).evaluate((button) => {
    for (let index = 0; index < 5; index += 1) {
      (button as HTMLButtonElement).click();
    }
  });

  await expect(surface).toHaveAttribute('data-touch-state', 'success');
  await expect(surface).toHaveAttribute('data-touch-state', /attention|targeting|waiting/, { timeout: 5000 });
  const progress = await page.evaluate((id) => {
    const state = JSON.parse(localStorage.getItem('minaplay_touch_progress_v1') ?? '{}');
    return state[id]?.success ?? 0;
  }, targetId);
  expect(progress).toBe(1);
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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');
  await page.waitForFunction(() => document.querySelectorAll('#view-touch [data-touch-card-id]').length >= 2);

  const layout = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    const grid = document.querySelector<HTMLElement>('#view-touch [data-touch-card-grid]');
    const cards = [...document.querySelectorAll<HTMLElement>('#view-touch [data-touch-card-id]')];
    if (!surface || !grid || cards.length < 2) {
      throw new Error('Touch layout fixture is not ready');
    }
    surface.dataset.touchLevel = '3';
    const sourceCards = [...cards];
    while (grid.querySelectorAll('[data-touch-card-id]').length > 5) {
      grid.querySelector('[data-touch-card-id]:last-of-type')?.remove();
    }
    while (grid.querySelectorAll('[data-touch-card-id]').length < 5) {
      const clone = sourceCards[grid.querySelectorAll('[data-touch-card-id]').length % sourceCards.length].cloneNode(true) as HTMLElement;
      const index = grid.querySelectorAll('[data-touch-card-id]').length + 1;
      clone.dataset.touchCardId = `layout-fixture-${index}`;
      clone.classList.remove('active-target', 'target-success', 'target-retry', 'target-hint', 'speaking');
      clone.querySelector<HTMLElement>('.touch-card-label, .touch-card-word')!.textContent = ['Çorap', 'Top', 'Telefon', 'Mont', 'Kaşık'][index - 1];
      grid.appendChild(clone);
    }
    const layoutCards = [...document.querySelectorAll<HTMLElement>('#view-touch [data-touch-card-id]')];
    const surfaceRect = surface.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    return {
      cardCount: layoutCards.length,
      allCardsInside:
        layoutCards.every((card) => {
          const rect = card.getBoundingClientRect();
          return rect.left >= surfaceRect.left && rect.right <= surfaceRect.right && rect.top >= surfaceRect.top && rect.bottom <= surfaceRect.bottom;
        }),
      allCardsInsideViewport: layoutCards.every((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0 && rect.bottom <= window.innerHeight;
      }),
      gridInsideViewport: gridRect.left >= 0 && gridRect.right <= window.innerWidth && gridRect.top >= 0 && gridRect.bottom <= window.innerHeight,
      gridOverflow: grid.scrollWidth > grid.clientWidth + 1 || grid.scrollHeight > grid.clientHeight + 1
    };
  });
  expect(layout).toEqual({ cardCount: 5, allCardsInside: true, allCardsInsideViewport: true, gridInsideViewport: true, gridOverflow: false });
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
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-touch-media-vault-export]');
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  const backupText = readFileSync(backupPath!, 'utf8');
  const backup = JSON.parse(backupText);
  expect(backup).toMatchObject({ format: 'minaplay-media-vault-backup', version: 1, vault: { version: 1 } });
  expect(backupText).not.toContain('baba-tekrar');
  expect(backupText).not.toContain('guvenli123');

  await page.evaluate(async () => {
    const request = indexedDB.open('minaplay_touch_cards_v1', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });
    const transaction = db.transaction('touchSettings', 'readwrite');
    transaction.objectStore('touchSettings').delete('minaplay_touch_repeat_media_v1');
    await new Promise<void>((resolve, reject) => {
      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => reject(transaction.error));
    });
  });
  await page.reload();
  await openParentBySecretGesture(page);
  await openParentTab(page, 'Düzenle');
  await page.locator('[data-touch-media-vault-file]').setInputFiles(backupPath!);
  await expect(page.locator('[data-touch-parent-status]')).toContainText('Şifreli yedek yüklendi');
  await page.fill('[data-touch-media-vault-pass]', 'guvenli123');
  await page.click('[data-touch-media-vault-unlock]');
  await expect(page.locator('[data-touch-repeat-media-preview]')).toContainText('https://example.com/baba-tekrar.mp4');
  await expect(page.locator('[data-touch-card-editor] [data-touch-card-admin]')).toHaveCount(DEFAULT_TOUCH_CARD_COUNT);
  await expect(page.locator('[data-touch-card-image]').first()).toHaveAttribute('accept', 'image/png,image/jpeg,image/gif');
});

test('matching module uses mastered words without getting stuck on two targets', async ({ page }) => {
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
  const targets = new Set<string>();
  for (let index = 0; index < 4; index += 1) {
    await expect.poll(() => page.locator('[data-match-surface]').getAttribute('data-match-target-id')).not.toBeNull();
    const targetId = await page.locator('[data-match-surface]').getAttribute('data-match-target-id');
    expect(targetId).toBeTruthy();
    targets.add(targetId ?? '');
    expect(await page.locator('[data-match-choice]').count()).toBeGreaterThanOrEqual(2);
    await page.click(`[data-match-choice="${targetId}"]`, { force: true });
    await expect(page.locator('[data-match-status]')).toContainText('Güzel');
    if (index < 3) {
      await expect(page.locator('[data-match-surface]')).not.toHaveAttribute('data-match-target-id', targetId ?? '', { timeout: 3000 });
    }
  }
  expect(targets.size).toBeGreaterThanOrEqual(3);
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
  await waitForAppBoot(page);

  await page.click('.mode-card[data-view="match"]');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-state', 'waiting', { timeout: 4000 });
  await page.click('[data-match-pofi-trigger]');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-state', 'hint');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-hint-level', '1');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-hint-level', '2', { timeout: 13000 });
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
  await waitForAppBoot(page);
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

test('matching keeps Pofi separate from the target card on tablet portrait', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['corap', 'masa', 'top'] }));
  });
  await page.goto('/');
  await page.click('.mode-card[data-view="match"]');

  const pofiBox = await page.locator('#view-match .match-pofi-button').boundingBox();
  const targetBox = await page.locator('#view-match [data-match-target]').boundingBox();
  expect(pofiBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  const horizontalOverlap = Math.max(
    0,
    Math.min((pofiBox?.x ?? 0) + (pofiBox?.width ?? 0), (targetBox?.x ?? 0) + (targetBox?.width ?? 0)) -
      Math.max(pofiBox?.x ?? 0, targetBox?.x ?? 0)
  );
  const verticalOverlap = Math.max(
    0,
    Math.min((pofiBox?.y ?? 0) + (pofiBox?.height ?? 0), (targetBox?.y ?? 0) + (targetBox?.height ?? 0)) -
      Math.max(pofiBox?.y ?? 0, targetBox?.y ?? 0)
  );

  expect(horizontalOverlap * verticalOverlap).toBe(0);
  await expect(page.locator('#view-match [data-match-target] .match-model-visual img, #view-match [data-match-target] .touch-toy')).toHaveCount(1);
});

test('sentence module completes a short expression from context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top', 'baba'] }));
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="sentence"]');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', /context|waiting/);
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-mode', 'learn');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-pofi-contract', /context-model|soft-communication-support/);
  await expect(page.locator('.sentence-mode-button[data-sentence-mode="learn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-sentence-context]')).toBeHidden();
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  await expect(page.locator('[data-sentence-choice]')).toHaveCount(0);
  await expect(page.locator('[data-sentence-card] img.sentence-need-image')).toHaveCount(1);
  await expect(page.locator('[data-sentence-status]')).not.toContainText(/yanlış|hata|başarısız/i);

  const sentenceKey = await page.locator('[data-sentence-surface]').getAttribute('data-sentence-key');
  await page.click('[data-sentence-card]', { force: true });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'success');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-pofi-contract', 'warm-affirm');
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'repeat_prompt', { timeout: 7000 });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-pofi-contract', 'speech-practice-prompt');
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
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-pofi-contract', 'needs-board-guide');
  await expect(page.locator('.sentence-mode-button[data-sentence-mode="board"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-sentence-board-card]')).toHaveCount(11);
  await expect(page.locator('[data-sentence-card]')).toBeHidden();

  const water = page.locator('[data-sentence-board-card="su-istiyorum"]');
  await water.click({ force: true });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'success');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-pofi-contract', 'choice-repeat-guide');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-key', 'su_istiyorum');
  await expect(water).toHaveClass(/selected/);
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'repeat_prompt', { timeout: 7000 });
});

test('story module narrates and opens an interaction point', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="story"]');
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', /attention|narration/);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-pofi-contract', 'story-narrator');
  await expect(page.locator('[data-story-scene] .story-scene-image, [data-story-scene] .story-object')).toHaveCount(1);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-step', 'what-needed', { timeout: 18000 });
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-pofi-contract', 'interaction-wait-guide');
  await expect(page.locator('[data-story-choice]')).toHaveCount(2);
  await expect(page.locator('[data-story-status]')).not.toContainText(/yanlış|hata|başarısız|puan/i);

  await page.click('[data-story-choice="su"]', { force: true });
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', 'success');
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-pofi-contract', 'warm-story-affirm');
  await expect(page.locator('[data-story-choice="su"]')).toHaveClass(/story-correct/);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-step', 'water-drink', { timeout: 11000 });
});

test('sleep module shows moon scene and toggles sleeping Pofi', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="sleep"]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'false');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-pofi-contract', 'sleep-ready-only');
  await expect(page.locator('.topbar')).toHaveCSS('opacity', '0');
  await expect(page.locator('.bottom-nav')).toHaveCSS('opacity', '0');
  const sleepSurfaceBox = await page.locator('[data-sleep-surface]').boundingBox();
  const viewport = page.viewportSize();
  expect(sleepSurfaceBox?.x).toBe(0);
  expect(sleepSurfaceBox?.y).toBe(0);
  expect(Math.round(sleepSurfaceBox?.width ?? 0)).toBe(viewport?.width);
  expect(Math.round(sleepSurfaceBox?.height ?? 0)).toBe(viewport?.height);
  await expect(page.locator('#view-sleep .sleep-moon')).toHaveAttribute('src', /assets\/sleep\/moon\.png(?:\?v=[\w-]+)?$/);
  await expect(page.locator('#view-sleep .sleep-star')).toHaveCount(15);
  await expect(page.locator('#view-sleep .sleep-shooting-star')).toHaveCount(2);
  await expect(page.locator('#view-sleep .sleep-haze-cloud')).toHaveCount(3);
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toBeVisible();
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleepReady');
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-eyes')).toHaveAttribute('src', /half-open-v01\.png$/);
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-mouth')).toHaveAttribute('src', /closed-v01\.png$/);
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-hands')).toBeHidden();
  await expect(page.locator('#view-sleep .sleep-pofi-wrap')).toHaveCSS('animation-name', /sleep-pofi-safe/);
  await expect(page.locator('#view-sleep .sleep-pofi-wrap')).toHaveCSS('animation-duration', '30s');
  await expect(page.locator('#view-sleep .sleep-moon')).toHaveCSS('animation-name', /sleep-moon-sky-wander/);
  await expect(page.locator('#view-sleep .sleep-moon')).toHaveCSS('animation-duration', '180s');
  await expect(page.locator('[data-sleep-label]')).toHaveText('Başlat');

  await page.click('[data-sleep-toggle]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-pofi-contract', 'sleep-only');
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleep');
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-role', 'sleep');
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-eyes')).toHaveAttribute('src', /closed-v01\.png$/);
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-mouth')).toHaveAttribute('src', /closed-v01\.png$/);
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-hands')).toBeHidden();
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-body')).toHaveCSS('animation-name', /sleep-pofi-breathe/);
  await expect(page.locator('[data-sleep-label]')).toHaveText('Durdur');
  await expect(page.locator('.topbar')).toHaveCSS('opacity', '0');
  await expect(page.locator('.bottom-nav')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-sleep-toggle]')).toBeHidden();
  await expect(page.locator('[data-sleep-toggle]')).toBeDisabled();

  await page.click('[data-sleep-surface]', { position: { x: 160, y: 160 } });
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleep');

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('#view-sleep')).toHaveClass(/active/);
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');

  await page.mouse.move(160, 160);
  await page.mouse.down();
  await page.waitForTimeout(1900);
  await page.mouse.up();
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');

  await expect(page.locator('.child-home-button')).toBeHidden();
  await openParentBySecretGesture(page);
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'parent');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'false');
});

test('mirror module starts camera-safe imitation flow', async ({ page }) => {
  await page.goto('/');
  await waitForAppBoot(page);

  await page.click('.mode-card[data-view="mirror"]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-state', /attention|exercise|waiting/);
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-pofi-contract', 'exercise-model');
  const exerciseId = await page.locator('[data-mirror-surface]').getAttribute('data-mirror-exercise');
  expect(exerciseId).toMatch(/open-mouth|smile|pucker|sound-a|sound-o|closed-mouth|teeth|surprised-face/);
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-state', /exercise|waiting/, { timeout: 7000 });
  await expect(page.locator('#view-mirror [data-pofi-avatar]')).not.toHaveAttribute('data-pofi-state', 'mirrorSuccess');
  await expect(page.locator('#view-mirror [data-pofi-avatar]')).toHaveAttribute('data-pofi-contract', 'exercise-model');
  await expect(page.locator('#view-mirror [data-pofi-avatar] .pofi-mouth')).toHaveAttribute('src', /\.png$/);
  await expect(page.locator('[data-mirror-video]')).toHaveCount(1);
  await expect(page.locator('[data-mirror-progress]')).toHaveCSS('--mirror-duration', /3[69]00ms|4200ms/);
  await expect(page.locator('.mirror-actions')).toHaveCount(0);
  await expect(page.locator('[data-mirror-next]')).toHaveCount(0);
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-pofi-contract', 'reward-after-exercise', { timeout: 12000 });
  await expect(page.locator('#view-mirror [data-pofi-avatar]')).toHaveAttribute('data-pofi-state', 'mirrorSuccess');
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name))).toContainEqual(
    expect.stringContaining('/sounds/pofi-guides/01-bana-bak.mp3')
  );
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name)), { timeout: 10_000 }).toContainEqual(
    expect.stringContaining('/sounds/pofi-guides/02-simdi-sen-yap.mp3')
  );

  await page.click('[data-mirror-repeat]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', exerciseId ?? 'open-mouth');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-pofi-contract', 'exercise-model');
  await expect(page.locator('#view-mirror [data-pofi-avatar]')).not.toHaveAttribute('data-pofi-state', 'mirrorSuccess');
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
  await expect(page.locator('[data-sleep-sound-setting]')).toContainText('Ninniler karışık');
  await expect(page.locator('[data-sleep-sound-setting]')).toContainText('Gül Kokulu Ninni');
  await page.selectOption('[data-sleep-sound-setting]', 'sleep-gul');
  await page.selectOption('[data-sleep-duration-setting]', '20');
  await page.fill('[data-sleep-volume]', '80');
  await page.click('[data-sleep-settings-save]');
  await expect(page.locator('[data-module-settings-status]')).toContainText('Uyku sesi');

  const saved = await page.evaluate(() => ({
    mirror: JSON.parse(localStorage.getItem('minaplay_mirror_plan_v1') ?? '{}'),
    sleep: JSON.parse(localStorage.getItem('minaplay_sleep_settings_v1') ?? '{}')
  }));
  expect(saved.mirror).toEqual({ preset: 'mouth-first' });
  expect(saved.sleep).toEqual({ sound: 'sleep-gul', durationMinutes: 20, volume: 0.8 });

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  await page.click('.mode-card[data-view="mirror"]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', 'open-mouth');

  await page.click('.child-home-button');
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  await page.click('.mode-card[data-view="sleep"]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-sound', 'sleep-gul');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-duration', '20');
});

test('parent panel controls visible child modules safely', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');
  await waitForAppBoot(page);

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Mod görünürlüğü');
  await page.locator('[data-module-visibility="sleep"]').setChecked(false);
  await page.locator('[data-module-visibility="peekaboo"]').setChecked(false);
  await page.click('[data-module-visibility-save]');
  await expect(page.locator('[data-module-settings-status]')).toContainText('Dokun');

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
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
  await openParentBlock(page, 'Tarayıcı kısayolu');
  await expect(page.locator('[data-tablet-install-url]')).toContainText('127.0.0.1');
  await expect(page.locator('[data-tablet-install-status]')).toContainText(/ana ekrana|Kurulum hazır|uygulaması hazır/i);
  await openParentBlock(page, 'Uygulamayı güncelle');
  await expect(page.locator('[data-app-update-version]')).toContainText('v1.0.36');
  await expect(page.locator('[data-app-update-note]')).toContainText('GitHub Releases');
  await expect(page.locator('[data-app-update-status]')).toContainText('kontrol edin');
  await openParentBlock(page, 'Offline ve izinler');
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('[data-device-status] .device-status-chip')).toHaveCount(4);
  await expect(page.locator('[data-device-status]')).toContainText('Çevrimdışı');
  await expect(page.locator('[data-device-status]')).toContainText('Kamera');
  await expect(page.locator('[data-device-status]')).toContainText('Ses');
  await expect(page.locator('[data-device-status]')).toContainText('Yerel kayıt');
  await expect(page.locator('[data-device-status-note]')).toContainText('local-first');
});

test('parent can make Pofi guidance up to five times more frequent', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Yönlendirme sıklığı');
  await page.locator('[data-pofi-guide-frequency]').selectOption('5');
  await page.click('[data-pofi-guide-frequency-save]');

  await expect(page.locator('[data-pofi-guide-frequency-status]')).toContainText('5 kat daha sık');
  await expect(page.locator('[data-pofi-guide-frequency]')).toHaveValue('5');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('minaplay_pofi_guide_settings_v1') ?? '{}'));
  expect(saved.frequencyMultiplier).toBe(5);

  await page.reload();
  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Yönlendirme sıklığı');
  await expect(page.locator('[data-pofi-guide-frequency]')).toHaveValue('5');

  await page.evaluate(() => document.dispatchEvent(new Event('minaplay:native-back')));
  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('[data-touch-surface]')).toHaveAttribute('data-touch-state', 'hint', { timeout: 8_000 });
});

test('parent edit panel scrolls to the lower settings on tablet viewports', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1280 });
  await disableChildLock(page);
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Düzenle');

  const scrollState = await page.locator('#view-parent').evaluate((panel) => {
    const parentPanel = panel as HTMLElement;
    const before = parentPanel.scrollTop;
    parentPanel.scrollTop = parentPanel.scrollHeight;
    return {
      after: parentPanel.scrollTop,
      before,
      clientHeight: parentPanel.clientHeight,
      overflowY: window.getComputedStyle(parentPanel).overflowY,
      scrollHeight: parentPanel.scrollHeight,
      touchAction: window.getComputedStyle(parentPanel).touchAction
    };
  });

  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
  expect(scrollState.after).toBeGreaterThan(scrollState.before);
  expect(scrollState.overflowY).toBe('auto');
  expect(scrollState.touchAction).toBe('pan-y');
  await expect(page.getByRole('heading', { name: 'Kart listesi' })).toBeInViewport();
});

test('module surfaces render stateful layered Pofi parts', async ({ page }) => {
  await disableChildLock(page);
  await page.goto('/');
  await waitForAppBoot(page);

  await page.click('.mode-card[data-view="mirror"]');

  const mirrorPofi = page.locator('#view-mirror [data-pofi-avatar]');
  await expect(mirrorPofi).toHaveAttribute('data-pofi-state', /mirrorAttention|mirrorOpenMouth/);
  await expect(mirrorPofi.locator('img')).toHaveCount(6);
  await expect(mirrorPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
  await expect(mirrorPofi.locator('.pofi-mouth')).toHaveAttribute('src', /open-smile-soft-v01\.png|open-vertical-big-v01\.png$/);

  await page.click('.child-home-button');
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

test('parent update check exposes only a newer validated stable release', async ({ page }) => {
  await disableChildLock(page);
  await page.route('**/api/update', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      channel: 'stable',
      version: '1.0.37',
      versionCode: 38,
      apkUrl: 'https://github.com/fztumit/minagrow-minaplay/releases/download/v1.0.37/minaplay-v1.0.37.apk',
      sha256: 'b'.repeat(64),
      publishedAt: '2026-08-03T12:00:00.000Z'
    })
  }));
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Uygulamayı güncelle');
  await page.locator('[data-app-update-check]').last().click();

  await expect(page.locator('[data-app-update-status]')).toContainText('Yeni güvenli sürüm hazır: v1.0.37');
  await expect(page.locator('[data-app-update-action]')).toBeVisible();
  await expect(page.locator('[data-app-update-quick]')).toBeVisible();
});

test('parent update check keeps download closed for current or unsafe metadata', async ({ page }) => {
  await disableChildLock(page);
  await page.route('**/api/update', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      channel: 'stable',
      version: '1.0.37',
      versionCode: 38,
      apkUrl: 'http://unsafe.test/minaplay.apk',
      sha256: 'c'.repeat(64),
      publishedAt: '2026-08-03T12:00:00.000Z'
    })
  }));
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Uygulamayı güncelle');
  await page.locator('[data-app-update-check]').last().click();

  await expect(page.locator('[data-app-update-status]')).toContainText('Güvenli sürüm bilgisi alınamadı');
  await expect(page.locator('[data-app-update-action]')).toBeHidden();
  await expect(page.locator('[data-app-update-quick]')).toBeHidden();
});

test('native update receives the validated URL and checksum and explains install permission', async ({ page }) => {
  await disableChildLock(page);
  await page.addInitScript(() => {
    const target = window as typeof window & { __updateRequest?: unknown };
    target.Capacitor = {
      Plugins: {
        MinaPlayKiosk: {
          downloadAndInstallUpdate: async (options: { url: string; sha256: string }) => {
            target.__updateRequest = options;
            return { status: 'permission_required' as const };
          }
        }
      }
    };
  });
  await page.route('**/api/update', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      channel: 'stable',
      version: '1.0.37',
      versionCode: 38,
      apkUrl: 'https://github.com/fztumit/minagrow-minaplay/releases/download/v1.0.37/minaplay-v1.0.37.apk',
      sha256: 'd'.repeat(64),
      publishedAt: '2026-08-03T12:00:00.000Z'
    })
  }));
  await page.goto('/');

  await openParentBySecretGesture(page);
  await openParentTab(page, 'Kontrol');
  await openParentBlock(page, 'Uygulamayı güncelle');
  await page.locator('[data-app-update-check]').last().click();
  await page.locator('[data-app-update-action]').click();

  await expect(page.locator('[data-app-update-status]')).toContainText('Bu kaynaktan izin ver');
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __updateRequest?: unknown }).__updateRequest)).toEqual({
    url: 'https://github.com/fztumit/minagrow-minaplay/releases/download/v1.0.37/minaplay-v1.0.37.apk',
    sha256: 'd'.repeat(64)
  });
});
