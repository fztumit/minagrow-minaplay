import { expect, test } from '@playwright/test';
import { gotoStoriesView, openWordMode } from './helpers/navigation.js';
import { requestParentPanel, unlockParentPanel } from './helpers/parent-access.js';

test('page loads with core module blocks', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#home-mode-grid .home-mode-card')).toHaveCount(4);
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
