import { expect, test } from '@playwright/test';
import { openPeekabooMode } from './helpers/navigation.js';

test('peekaboo mode renders a visible room scene and animated phoenix', async ({ page }) => {
  await page.goto('/');
  await openPeekabooMode(page);

  await expect(page.locator('#view-peekaboo')).toHaveClass(/active/);
  await expect(page.locator('.peekaboo-window')).toBeVisible();
  await expect(page.locator('.peekaboo-hideout-sofa')).toBeVisible();
  await expect(page.locator('.peekaboo-stage-platform')).toBeVisible();
  await expect(page.locator('#peekaboo-phoenix-shell')).toBeVisible();

  await page.waitForFunction(() => {
    const root = document.getElementById('view-peekaboo');
    return Number(root?.getAttribute('data-peek-reveals') ?? 0) >= 1;
  });

  await page.screenshot({
    path: '/Users/umitaydin/.codex/worktrees/f830/Konusu-Yorum/output/peekaboo-visual.png',
    fullPage: true
  });

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.active_view).toBe('view-peekaboo');
  expect(state?.peekaboo?.scene).toMatch(/room|center/);
  expect(state?.peekaboo?.reveals).toBeGreaterThanOrEqual(1);
});
