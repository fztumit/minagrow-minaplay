import { expect, test } from '@playwright/test';
import { openMatchingMode } from './helpers/navigation.js';

test('guided transition moves phoenix to the next word target', async ({ page }) => {
  await page.goto('/');
  await openMatchingMode(page);

  const matchingRoot = page.locator('#view-matching');
  await matchingRoot.locator('.word-card[data-word-id="su"]').click();

  await page.waitForFunction(() => {
    const matchingRoot = document.getElementById('view-matching');
    return matchingRoot?.getAttribute('data-next-word') === 'baba';
  });

  await expect(matchingRoot.locator('.word-card[data-word-id="baba"]')).toHaveClass(/is-next-target/);
  await expect(matchingRoot.locator('#speech-focus-card')).toContainText('Baba');
  await expect(matchingRoot).toHaveAttribute('data-guide-active', 'true');
  await expect(matchingRoot).toHaveAttribute('data-guide-prompt', 'Babaya dokun.');
  await expect(matchingRoot).toHaveAttribute('data-scene-phase', 'awaiting-tap');

  const state = await page.evaluate(() => {
    const runtime = window as Window & {
      render_game_to_text?: () => string;
      __mascotPromptLog?: string[];
      __mascotSoundLog?: string[];
    };
    return {
      state: typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null,
      prompts: runtime.__mascotPromptLog ?? [],
      sounds: runtime.__mascotSoundLog ?? []
    };
  });

  expect(state.state?.matching?.active_set).toBe('starter-first-words');
  expect(state.state?.matching?.next_word).toBe('baba');
  expect(state.state?.matching?.current_target).toBe('baba');
  expect(state.state?.matching?.guided_target).toBe('baba');
  expect(state.state?.matching?.focused_word).toBe('baba');
  expect(state.state?.matching?.set_completion).toBe('1/3');
  expect(state.state?.matching?.guide_active).toBe(true);
  expect(state.prompts.at(-1)).toBe('Şimdi buna dokun.');
  expect(state.sounds.at(-1)).toBe('guide-chime');
});

test('off-target tap plays audio but keeps the guided target', async ({ page }) => {
  await page.goto('/');
  await openMatchingMode(page);

  const matchingRoot = page.locator('#view-matching');
  await matchingRoot.locator('.word-card[data-word-id="baba"]').click();
  await page.waitForTimeout(900);

  await expect(matchingRoot).toHaveAttribute('data-current-target', 'su');
  await expect(matchingRoot.locator('#speech-focus-card')).toContainText('Su');

  const state = await page.evaluate(() => {
    const runtime = window as Window & {
      render_game_to_text?: () => string;
      __speechLog?: string[];
    };

    return {
      state: typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null,
      speechLog: runtime.__speechLog ?? []
    };
  });

  expect(state.state?.matching?.guided_target).toBe('su');
  expect(state.state?.matching?.set_completion).toBe('0/3');
  expect(state.speechLog).toContain('baba');
});
