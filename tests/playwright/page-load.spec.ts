import { expect, test } from '@playwright/test';

test('page loads with core module blocks', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#speech-stage')).toBeVisible();
  await expect(page.locator('#speech-grid .word-card')).toHaveCount(6);
  await expect(page.locator('#speech-grid .word-object-image')).toHaveCount(5);
  await expect(page.locator('#view-parent')).not.toHaveClass(/active/);
  await expect(page.locator('#daily-word-record-start')).not.toBeVisible();

  await page.evaluate(() => {
    (document.getElementById('parent-panel-trigger') as HTMLButtonElement | null)?.click();
  });

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#daily-word-record-start')).toBeVisible();
  await expect(page.locator('#progress-reset-btn')).toBeVisible();

  await page.click('.tab-btn[data-view="stories"]');
  await page.evaluate(() => {
    (document.getElementById('parent-panel-trigger') as HTMLButtonElement | null)?.click();
  });
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#story-pack-progress-summary')).toBeVisible();
  await expect(page.locator('#story-pack-compare-summary')).toBeVisible();
});
