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
  await page.click('#view-touch [data-touch-card-id="baba"]');
  await page.click('[data-open-parent]');

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#metric-sessions')).toHaveText('1');
  await expect(page.locator('#metric-correct')).toHaveText('1');
});

test('module back buttons return to home', async ({ page }) => {
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep', 'peekaboo']) {
    await page.click(`[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click('.topbar-home');
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('active bottom nav button returns to home', async ({ page }) => {
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep']) {
    await page.click(`.mode-card[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click(`.bottom-nav button[data-view="${view}"]`);
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('touch module renders five cards without choice bubbles', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('#view-touch .touch-listen-card')).toHaveCount(0);
  await expect(page.locator('#view-touch [data-touch-card-id="su"]')).toContainText('Su');
  await expect(page.locator('#view-touch [data-touch-card-id]')).toHaveCount(5);
  await expect(page.locator('#view-touch [data-touch-bubble]')).toHaveCount(0);
  await expect(page.locator('#view-touch .touch-meaning-object')).toHaveCount(0);

  await page.click('#view-touch [data-touch-card-id="top"]', { force: true });
  await expect(page.locator('#view-touch [data-touch-card-id="top"]')).toContainText('Top');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveClass(/touch-speaking/);
  await expect(page.locator('#view-touch [data-touch-card-id="top"]')).toHaveClass(/speaking/);
});

test('touch repeat is explicit and parent controlled', async ({ page }) => {
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');

  await expect(page.locator('#view-touch [data-touch-repeat-toggle]')).toHaveCount(0);

  await page.click('[data-open-parent]');
  await expect(page.locator('[data-touch-repeat-duration]')).toHaveValue('30');
  await expect(page.locator('[data-touch-repeat-count]')).toHaveValue('8');
  await expect(page.locator('[data-touch-card-editor] [data-touch-card-admin]')).toHaveCount(5);
  await expect(page.locator('[data-touch-card-image]').first()).toHaveAttribute('accept', 'image/png,image/jpeg,image/gif');
});

test('module surfaces render stateful layered Pofi parts', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="mirror"]');

  const mirrorPofi = page.locator('#view-mirror [data-pofi-avatar]');
  await expect(mirrorPofi).toHaveAttribute('data-pofi-state', 'exercise');
  await expect(mirrorPofi.locator('img')).toHaveCount(6);
  await expect(mirrorPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
  await expect(mirrorPofi.locator('.pofi-mouth')).toHaveAttribute('src', /tongue-out-v01\.png$/);

  await page.click('#view-mirror [data-view="home"]');
  await page.click('.mode-card[data-view="touch"]');
  await page.click('#view-touch [data-touch-card-id="baba"]', { force: true });

  const touchPofi = page.locator('#view-touch [data-pofi-avatar]');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveClass(/touch-speaking/);
  await expect(touchPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
});
