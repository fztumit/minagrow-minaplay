import { expect, test } from '@playwright/test';

const output = 'output/final-revision';

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

test('captures final portrait child stages', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await page.screenshot({ path: `${output}/50-home-portrait-final.png` });

  for (const [view, file] of [
    ['sentence', '51-sentence-portrait-final.png'],
    ['story', '52-story-portrait-final.png']
  ] as const) {
    await page.click(`.mode-card[data-view="${view}"]`);
    await expect(page.locator(`#view-${view} [data-pofi-avatar]`)).toHaveAttribute('data-pofi-pose-ready', 'true');
    await page.screenshot({ path: `${output}/${file}` });
    await page.click('.child-home-button');
  }
});

test('captures final landscape child stages', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto('/');
  await page.screenshot({ path: `${output}/53-home-landscape-final.png` });

  for (const [view, file] of [
    ['touch', '54-touch-landscape-final.png'],
    ['sentence', '55-sentence-landscape-final.png'],
    ['story', '56-story-landscape-final.png'],
    ['mirror', '57-mirror-landscape-final.png'],
    ['sleep', '58-sleep-landscape-final.png']
  ] as const) {
    await page.click(`.mode-card[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);
    if (view !== 'sleep') {
      await expect(page.locator(`#view-${view} [data-pofi-avatar]`)).toHaveAttribute('data-pofi-pose-ready', 'true');
    }
    if (view === 'touch') {
      await expect(page.locator('#view-touch .touch-card-ready')).toHaveCount(2);
      const images = page.locator('#view-touch .touch-card-ready [data-touch-runtime-image]');
      await expect(images).toHaveCount(2);
      for (let index = 0; index < 2; index += 1) {
        await expect.poll(() => images.nth(index).evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await expect(images.nth(index)).toHaveCSS('opacity', '1');
      }
    }
    if (view === 'sentence') {
      await expect.poll(() => page.locator('.sentence-need-image').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    if (view === 'story') {
      await expect.poll(() => page.locator('.story-scene img').first().evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: `${output}/${file}` });
    if (view !== 'sleep') {
      await page.click('.child-home-button');
    }
  }
});
