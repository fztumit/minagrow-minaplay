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

test('module surfaces render stateful layered Pofi parts', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="mirror"]');

  const mirrorPofi = page.locator('#view-mirror [data-pofi-avatar]');
  await expect(mirrorPofi).toHaveAttribute('data-pofi-state', 'exercise');
  await expect(mirrorPofi.locator('img')).toHaveCount(3);
  await expect(mirrorPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v10\.png$/);
  await expect(mirrorPofi.locator('.pofi-mouth')).toHaveAttribute('src', /tongue-out-v01\.png$/);

  await page.click('#view-mirror [data-view="home"]');
  await page.click('.mode-card[data-view="touch"]');
  await page.click('[data-track-action="touch-offtarget"]');

  const touchPofi = page.locator('#view-touch [data-pofi-avatar]');
  await expect(touchPofi).toHaveAttribute('data-pofi-state', 'tryAgain');
  await expect(touchPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v03\.png$/);
});
