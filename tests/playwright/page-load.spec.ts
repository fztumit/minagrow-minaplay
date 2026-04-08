import { expect, test } from '@playwright/test';
import { gotoStoriesView, openWordMode } from './helpers/navigation.js';
import { requestParentPanel, unlockParentPanel } from './helpers/parent-access.js';

test('page loads with core module blocks', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#home-mode-grid .home-mode-card')).toHaveCount(4);
  await expect(page.locator('.module-tabs .tab-btn')).toHaveCount(4);
  await expect(page.locator('.tab-btn[data-view="stories"]')).toContainText('Hikaye');
  await expect(page.locator('.home-bonus-card[data-view="peekaboo"]')).toBeVisible();
  await expect(page.locator('#view-parent')).not.toHaveClass(/active/);
  await expect(page.locator('#daily-word-record-start')).not.toBeVisible();

  await openWordMode(page);
  await expect(page.locator('#speech-stage')).toBeVisible();
  await expect(page.locator('#view-speech')).toHaveAttribute('data-scene-phase', 'awaiting-tap');
  await expect(page.locator('#speech-grid .word-card')).toHaveCount(5);
  await expect(page.locator('#speech-grid .word-object-image')).toHaveCount(4);
  await expect(page.locator('#view-speech')).toHaveAttribute('data-current-target', 'su');

  await unlockParentPanel(page);
  await expect(page.locator('#daily-word-record-start')).toBeVisible();
  await expect(page.locator('#peekaboo-audio-record-start')).toBeVisible();
  await expect(page.locator('#progress-reset-btn')).toBeVisible();

  await gotoStoriesView(page);
  await unlockParentPanel(page);
  await expect(page.locator('#story-pack-progress-summary')).toBeVisible();
  await expect(page.locator('#story-pack-compare-summary')).toBeVisible();
});

test('bonus ceee launcher opens peekaboo without changing primary navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.module-tabs .tab-btn')).toHaveCount(4);
  await page.click('.home-bonus-card[data-view="peekaboo"]');

  await expect(page.locator('#view-peekaboo')).toHaveClass(/active/);
  await expect(page.locator('.module-tabs .tab-btn')).toHaveCount(4);

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.active_view).toBe('view-peekaboo');
  expect(state?.home?.mode_count).toBe(4);
  expect(state?.home?.bonus_count).toBe(1);
  expect(state?.navigation?.primary_tab_count).toBe(4);
});

test('home story card opens the primary stories view', async ({ page }) => {
  await page.goto('/');

  await page.click('.home-mode-card[data-view="stories"]');
  await expect(page.locator('#view-stories')).toHaveClass(/active/);
  await expect(page.locator('.tab-btn[data-view="stories"]')).toHaveClass(/active/);
});

test('parent panel requires correct pin before opening', async ({ page }) => {
  await page.goto('/');

  await requestParentPanel(page);
  await page.fill('#parent-auth-input', '9999');
  await page.click('#parent-auth-form button[type="submit"]');

  await expect(page.locator('#parent-auth-error')).toContainText('Şifre yanlış.');
  await expect(page.locator('#view-parent')).not.toHaveClass(/active/);

  await page.fill('#parent-auth-input', '1234');
  await page.click('#parent-auth-form button[type="submit"]');

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#daily-word-record-start')).toBeVisible();
  await expect(page.locator('#peekaboo-audio-record-start')).toBeVisible();
});
