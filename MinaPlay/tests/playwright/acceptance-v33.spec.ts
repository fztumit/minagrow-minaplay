import { expect, test } from '@playwright/test';

const output = 'output/v1.0.33-acceptance';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_child_lock_settings_v1', JSON.stringify({
      enabled: true,
      keepAwake: true,
      parentTapCount: 3,
      parentPullDistance: 80,
      introSeen: true,
      parentPin: '2468'
    }));
  });
});

async function waitForReady(page: import('@playwright/test').Page) {
  await expect(page.locator('html')).toHaveAttribute('data-minaplay-ready', 'true');
}

test('home is complete at every acceptance viewport', async ({ page }) => {
  for (const viewport of [
    { width: 600, height: 960, file: '01-home-600x960.png' },
    { width: 820, height: 1180, file: '02-home-820x1180.png' },
    { width: 1180, height: 820, file: '03-home-1180x820.png' }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForReady(page);
    const cards = page.locator('#view-home .mode-card:not([hidden])');
    await expect(cards).toHaveCount(6);
    await expect(page.locator('.home-ceee-band')).toBeVisible();
    const sizes = await cards.evaluateAll((items) => items.map((item) => {
      const icon = item.querySelector<HTMLImageElement>('.mode-icon')!;
      const rect = icon.getBoundingClientRect();
      return { width: rect.width, height: rect.height, naturalWidth: icon.naturalWidth };
    }));
    expect(sizes.every((size) => size.naturalWidth > 0)).toBe(true);
    expect(Math.max(...sizes.map((size) => size.width)) - Math.min(...sizes.map((size) => size.width))).toBeLessThan(2);
    expect(sizes.every((size) => size.width >= 140 && size.height >= 140)).toBe(true);
    await page.screenshot({ path: `${output}/${viewport.file}` });
  }
});

test('touch opens atomically with two decoded cards in portrait and landscape', async ({ page }) => {
  for (const viewport of [
    { width: 820, height: 1180, file: '04-touch-portrait.png' },
    { width: 1180, height: 820, file: '05-touch-landscape.png' }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForReady(page);
    await page.click('.mode-card[data-view="touch"]');
    await expect(page.locator('#view-touch .touch-card-ready')).toHaveCount(2);
    await expect(page.locator('#view-touch input:focus, #view-touch select:focus')).toHaveCount(0);
    const images = page.locator('#view-touch [data-touch-runtime-image]');
    await expect(images).toHaveCount(2);
    for (let index = 0; index < 2; index += 1) {
      await expect.poll(() => images.nth(index).evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: `${output}/${viewport.file}` });
  }
});

test('mirror, story and Ceee use recorded Pofi guidance', async ({ page }) => {
  test.setTimeout(50_000);
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await waitForReady(page);

  await page.click('.mode-card[data-view="mirror"]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-state', /attention|exercise|waiting/);
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name))).toContainEqual(expect.stringContaining('/sounds/pofi-guides/01-bana-bak.mp3'));
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name)), { timeout: 10_000 }).toContainEqual(expect.stringContaining('/sounds/pofi-guides/02-simdi-sen-yap.mp3'));
  await page.screenshot({ path: `${output}/06-mirror-active.png` });

  await page.click('.child-home-button');
  await page.click('.mode-card[data-view="story"]');
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', /attention|narration/);
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name))).toContainEqual(expect.stringContaining('/sounds/pofi-guides/18-bak.mp3'));
  await expect(page.locator('[data-story-scene] img')).toHaveCount(1);
  await page.screenshot({ path: `${output}/07-story-active.png` });

  await page.click('.child-home-button');
  await page.click('.home-ceee-band');
  const peekaboo = page.locator('[data-peekaboo-surface]');
  await expect(peekaboo).toHaveAttribute('data-peekaboo-state', /ready|cover|reveal|celebrate/);
  for (let round = 1; round <= 3; round += 1) {
    await expect.poll(async () => Number(await peekaboo.getAttribute('data-peekaboo-search-audio-count')), { timeout: 12_000 }).toBeGreaterThanOrEqual(round);
    await expect.poll(async () => Number(await peekaboo.getAttribute('data-peekaboo-reveal-audio-count')), { timeout: 12_000 }).toBeGreaterThanOrEqual(round);
  }
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name)), { timeout: 9000 }).toContainEqual(expect.stringMatching(/\/sounds\/pofi-guides\/(13-neredesin|14-haniymis|15-seni-bulabilecek-miyim|16-nereye-saklandn)\.mp3/));
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name)), { timeout: 9000 }).toContainEqual(expect.stringContaining('/sounds/pofi-guides/17-ceee.mp3'));
  await page.screenshot({ path: `${output}/08-ceee-speaking.png` });
});
