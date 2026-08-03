import { expect, test } from '@playwright/test';

const output = 'output/v1.0.34-acceptance';

async function waitForReady(page: import('@playwright/test').Page) {
  await expect(page.locator('html')).toHaveAttribute('data-minaplay-ready', 'true');
}

test('home labels stay inside icon badges and Ceee stays inside every tablet viewport', async ({ page }) => {
  for (const viewport of [
    { width: 600, height: 960, file: '01-home-600x960.png' },
    { width: 820, height: 1180, file: '02-home-820x1180.png' },
    { width: 1180, height: 820, file: '03-home-1180x820.png' },
    { width: 1280, height: 720, file: '04-home-1280x720.png' }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForReady(page);

    const geometry = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('#view-home .mode-card:not([hidden])')];
      const labels = cards.map((card) => {
        const art = card.querySelector<HTMLElement>('.mode-art')!.getBoundingClientRect();
        const label = card.querySelector<HTMLElement>('.mode-title')!.getBoundingClientRect();
        return {
          centerDelta: Math.abs((label.left + label.width / 2) - (art.left + art.width / 2)),
          centerYRatio: ((label.top + label.height / 2) - art.top) / art.height,
          insideArt: label.left >= art.left && label.right <= art.right && label.top >= art.top && label.bottom <= art.bottom
        };
      });
      const ceee = document.querySelector<HTMLElement>('.home-ceee-band')!.getBoundingClientRect();
      return {
        labels,
        ceeeInside: ceee.left >= 0 && ceee.right <= innerWidth && ceee.top >= 0 && ceee.bottom <= innerHeight,
        noOverflow: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight
      };
    });

    expect(geometry.labels).toHaveLength(6);
    expect(geometry.labels.every((label) => label.insideArt && label.centerDelta <= 1 && label.centerYRatio >= 0.84 && label.centerYRatio <= 0.96)).toBe(true);
    expect(geometry.ceeeInside).toBe(true);
    expect(geometry.noOverflow).toBe(true);
    await page.screenshot({ path: `${output}/${viewport.file}` });
  }
});

test('touch commits no text or card until both delayed images decode', async ({ page }) => {
  await page.route('**/assets/cards/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await waitForReady(page);
  await page.click('.mode-card[data-view="touch"]');

  const grid = page.locator('[data-touch-card-grid]');
  await expect(grid).toHaveAttribute('aria-busy', 'true');
  await expect(grid.locator('.touch-card')).toHaveCount(0);
  await expect(grid).toHaveText('');
  await expect(grid.locator('.touch-card-ready')).toHaveCount(2, { timeout: 10_000 });
  await expect(grid).not.toHaveAttribute('aria-busy', 'true');
  await page.screenshot({ path: `${output}/05-touch-delayed-ready.png` });
});

test('touch keeps the round and safe stacked geometry through portrait-landscape-portrait rotation', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await waitForReady(page);
  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('.touch-card-ready')).toHaveCount(2);
  const targetId = await page.locator('[data-touch-surface]').getAttribute('data-touch-target-id');

  for (const viewport of [
    { width: 1280, height: 720, file: '06-touch-landscape.png' },
    { width: 820, height: 1180, file: '07-touch-portrait-return.png' }
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.app-shell')).not.toHaveAttribute('data-viewport-settling', 'true');
    await expect(page.locator('.touch-card-ready')).toHaveCount(2);
    await expect(page.locator('[data-touch-surface]')).toHaveAttribute('data-touch-target-id', targetId ?? '');
    const geometry = await page.evaluate(() => {
      const pofi = document.querySelector<HTMLElement>('.touch-pofi-button')!.getBoundingClientRect();
      const grid = document.querySelector<HTMLElement>('.touch-card-grid')!.getBoundingClientRect();
      const face = document.querySelector<HTMLElement>('#view-touch .pofi-face-team')!.getBoundingClientRect();
      const cards = [...document.querySelectorAll<HTMLElement>('.touch-card-ready')].map((card) => card.getBoundingClientRect());
      return {
        safeGap: grid.top - pofi.bottom,
        pofiInside: pofi.left >= 0 && pofi.right <= innerWidth && pofi.top >= 0 && pofi.bottom <= innerHeight,
        faceInside: face.left >= pofi.left - 2 && face.right <= pofi.right + 2 && face.top >= pofi.top - 2 && face.bottom <= pofi.bottom + 2,
        cardsInside: cards.every((card) => card.left >= 0 && card.right <= innerWidth && card.top >= 0 && card.bottom <= innerHeight)
      };
    });
    expect(geometry.safeGap).toBeGreaterThanOrEqual(8);
    expect(geometry.pofiInside).toBe(true);
    expect(geometry.faceInside).toBe(true);
    expect(geometry.cardsInside).toBe(true);
    await page.screenshot({ path: `${output}/${viewport.file}` });
  }
});
