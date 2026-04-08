import { expect, test } from '@playwright/test';
import { openSleepMode } from './helpers/navigation.js';

test('sleep mode starts calming audio flow and updates state', async ({ page }) => {
  await page.goto('/');
  await openSleepMode(page);

  await expect(page.locator('.sleep-stage')).toBeVisible();
  await expect(page.locator('#sleep-toggle')).toContainText('Uyku Sesini Başlat');

  await page.click('#sleep-toggle');

  await expect(page.locator('#view-sleep')).toHaveAttribute('data-running', 'true');
  await expect(page.locator('#sleep-toggle')).toContainText('Uyku Sesini Durdur');
  await expect(page.locator('#sleep-status')).toContainText('Çalıyor');
  await page.screenshot({
    path: '/Users/umitaydin/.codex/worktrees/f830/Konusu-Yorum/output/sleep-stage.png',
    fullPage: true
  });

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.active_view).toBe('view-sleep');
  expect(state?.sleep?.running).toBe(true);
});
