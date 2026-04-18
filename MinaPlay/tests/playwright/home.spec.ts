import { expect, test } from '@playwright/test';

test('home opens with six calm modes and bonus ceee', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('.mode-card')).toHaveCount(6);
  await expect(page.locator('.bonus-strip')).toContainText('Ceee');
  await expect(page.locator('.bottom-nav button')).toHaveCount(6);
});

test('parent panel records simple module activity', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await page.click('[data-track-action="touch-correct"]');
  await page.click('[data-open-parent]');

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#metric-sessions')).toHaveText('1');
  await expect(page.locator('#metric-correct')).toHaveText('1');
});
