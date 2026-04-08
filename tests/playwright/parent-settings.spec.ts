import { expect, test } from '@playwright/test';
import { openWordMode } from './helpers/navigation.js';
import { unlockParentPanel } from './helpers/parent-access.js';

test('parent settings repeat mode overrides default repeat count', async ({ page }) => {
  await page.goto('/');

  await unlockParentPanel(page);
  await page.selectOption('#speech-repeat-mode', '2');
  await page.click('#parent-panel-close');
  await openWordMode(page);
  await page.click('.word-card[data-word-id="su"]');
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

  await openWordMode(page);
  await expect(page.locator('#speech-grid .word-card')).toHaveCount(3);
  await expect(page.locator('.word-card[data-word-id="araba"]')).toBeVisible();
  await expect(page.locator('.word-card[data-word-id="elma"]')).toBeVisible();
  await expect(page.locator('.word-card[data-word-id="kitap"]')).toBeVisible();
  await expect(page.locator('#view-speech')).toHaveAttribute('data-active-set', 'starter-play-set');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-auto-progress', 'false');

  await page.click('.word-card[data-word-id="araba"]');
  await page.waitForFunction(() => {
    return document.getElementById('view-speech')?.getAttribute('data-current-target') === 'elma';
  });
  await page.click('.word-card[data-word-id="elma"]');
  await page.waitForFunction(() => {
    return document.getElementById('view-speech')?.getAttribute('data-current-target') === 'kitap';
  });
  await page.click('.word-card[data-word-id="kitap"]');
  await page.waitForFunction(() => {
    const speechRoot = document.getElementById('view-speech');
    return (
      speechRoot?.getAttribute('data-scene-phase') === 'awaiting-tap' &&
      speechRoot.getAttribute('data-current-target') === 'araba'
    );
  });

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.speech?.active_set).toBe('starter-play-set');
  expect(state?.speech?.guided_target).toBe('araba');
  expect(state?.speech?.auto_progress).toBe(false);
});
