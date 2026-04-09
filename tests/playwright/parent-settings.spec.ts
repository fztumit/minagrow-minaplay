import { expect, test } from '@playwright/test';
import { openMatchingMode, openWordMode } from './helpers/navigation.js';
import { unlockParentPanel } from './helpers/parent-access.js';

test('parent settings repeat mode overrides default repeat count', async ({ page }) => {
  await page.goto('/');

  await unlockParentPanel(page);
  await page.selectOption('#speech-repeat-mode', '2');
  await page.click('#parent-panel-close');
  await openWordMode(page);
  await page.locator('#view-speech .word-card[data-word-id="su"]').click();
  await page.waitForTimeout(1700);

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    if (typeof runtime.render_game_to_text !== 'function') {
      return null;
    }
    return JSON.parse(runtime.render_game_to_text());
  });

  const speechLog = await page.evaluate(() => {
    const runtime = window as Window & { __speechLog?: string[] };
    return runtime.__speechLog ?? [];
  });

  expect(state?.speech?.repeat_mode).toBe('2');
  expect(speechLog.filter((word) => word === 'su').length).toBe(2);
});

test('parent settings can switch set and pin active dokun collection', async ({ page }) => {
  await page.goto('/');

  await unlockParentPanel(page);
  await page.selectOption('#speech-level-select', 'starter');
  await page.selectOption('#speech-set-select', 'starter-play-set');
  await page.check('#speech-pin-set');
  await page.click('#parent-panel-close');

  await openMatchingMode(page);
  const matchingRoot = page.locator('#view-matching');
  await expect(matchingRoot.locator('#speech-grid .word-card')).toHaveCount(3);
  await expect(matchingRoot.locator('.word-card[data-word-id="araba"]')).toBeVisible();
  await expect(matchingRoot.locator('.word-card[data-word-id="elma"]')).toBeVisible();
  await expect(matchingRoot.locator('.word-card[data-word-id="kitap"]')).toBeVisible();
  await expect(matchingRoot).toHaveAttribute('data-active-set', 'starter-play-set');
  await expect(matchingRoot).toHaveAttribute('data-auto-progress', 'false');

  await matchingRoot.locator('.word-card[data-word-id="araba"]').click();
  await page.waitForFunction(() => {
    return document.getElementById('view-matching')?.getAttribute('data-current-target') === 'elma';
  });
  await matchingRoot.locator('.word-card[data-word-id="elma"]').click();
  await page.waitForFunction(() => {
    return document.getElementById('view-matching')?.getAttribute('data-current-target') === 'kitap';
  });
  await matchingRoot.locator('.word-card[data-word-id="kitap"]').click();
  await page.waitForFunction(() => {
    const speechRoot = document.getElementById('view-matching');
    return (
      speechRoot?.getAttribute('data-scene-phase') === 'awaiting-tap' &&
      speechRoot.getAttribute('data-current-target') === 'araba'
    );
  });

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.matching?.active_set).toBe('starter-play-set');
  expect(state?.matching?.guided_target).toBe('araba');
  expect(state?.matching?.auto_progress).toBe(false);
});
