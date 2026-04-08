import { expect, test } from '@playwright/test';
import { openWordMode } from './helpers/navigation.js';

test('guided transition moves phoenix to the next word target', async ({ page }) => {
  await page.goto('/');
  await openWordMode(page);

  await page.click('.word-card[data-word-id="su"]');

  await page.waitForFunction(() => {
    const speechRoot = document.getElementById('view-speech');
    return speechRoot?.getAttribute('data-next-word') === 'baba';
  });

  await expect(page.locator('.word-card[data-word-id="baba"]')).toHaveClass(/is-next-target/);
  await expect(page.locator('#speech-focus-card')).toContainText('Baba');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-guide-active', 'true');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-guide-prompt', 'Babaya dokun.');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-scene-phase', 'awaiting-tap');

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

  expect(state.state?.speech?.active_set).toBe('starter-first-words');
  expect(state.state?.speech?.next_word).toBe('baba');
  expect(state.state?.speech?.current_target).toBe('baba');
  expect(state.state?.speech?.guided_target).toBe('baba');
  expect(state.state?.speech?.focused_word).toBe('baba');
  expect(state.state?.speech?.set_completion).toBe('1/3');
  expect(state.state?.speech?.guide_active).toBe(true);
  expect(state.prompts.at(-1)).toBe('Şimdi buna dokun.');
  expect(state.sounds.at(-1)).toBe('guide-chime');
});

test('off-target tap plays audio but keeps the guided target', async ({ page }) => {
  await page.goto('/');
  await openWordMode(page);

  await page.click('.word-card[data-word-id="baba"]');
  await page.waitForTimeout(900);

  await expect(page.locator('#view-speech')).toHaveAttribute('data-current-target', 'su');
  await expect(page.locator('#speech-focus-card')).toContainText('Su');

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

  expect(state.state?.speech?.guided_target).toBe('su');
  expect(state.state?.speech?.set_completion).toBe('0/3');
  expect(state.speechLog).toContain('baba');
});
