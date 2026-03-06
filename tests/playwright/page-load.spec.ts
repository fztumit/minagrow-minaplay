import { expect, test } from '@playwright/test';

test('page loads with core module blocks', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Konuşu-Yorum' })).toBeVisible();
  await expect(page.getByText('Bugünün Kelimesi', { exact: true })).toBeVisible();
  await expect(page.locator('#daily-word-record-start')).toBeVisible();
  await expect(page.locator('#daily-word-play')).toBeVisible();
  await expect(page.locator('#daily-activity-summary')).toBeVisible();
  await expect(page.locator('#speech-grid .word-card')).toHaveCount(9);
  await expect(page.locator('#custom-audio-record-start')).toBeVisible();
  await expect(page.locator('#progress-reset-btn')).toBeVisible();

  await page.click('.tab-btn[data-view="stories"]');
  await expect(page.locator('#story-pack-progress-summary')).toBeVisible();
  await expect(page.locator('#story-pack-compare-summary')).toBeVisible();
});
