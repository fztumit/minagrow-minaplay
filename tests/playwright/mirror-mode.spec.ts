import { expect, test } from '@playwright/test';
import { openMirrorMode } from './helpers/navigation.js';

test('mirror mode cycles an exercise and gives calm reward feedback', async ({ page }) => {
  await page.goto('/');
  await openMirrorMode(page);

  await expect(page.locator('#mirror-exercise-label')).toContainText('Mutlu yüz');
  await expect(page.locator('#view-mirror')).toHaveAttribute('data-current-category', 'yuz');

  await page.waitForFunction(() => {
    const root = document.getElementById('view-mirror');
    return root?.getAttribute('data-last-reward') === 'happy';
  });

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.mirror?.last_reward).toBe('happy');
  expect(state?.mirror?.current_exercise).not.toBe('');
  expect(['requesting', 'ready', 'fallback']).toContain(state?.mirror?.camera_state);
});
