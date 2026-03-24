import { expect, test } from '@playwright/test';

test('guided transition moves phoenix to the next word target', async ({ page }) => {
  await page.goto('/');

  await page.click('.word-card[data-word-id="su"]');

  await page.waitForFunction(() => {
    const speechRoot = document.getElementById('view-speech');
    return speechRoot?.getAttribute('data-next-word') === 'top';
  });

  await expect(page.locator('.word-card[data-word-id="top"]')).toHaveClass(/is-next-target/);
  await expect(page.locator('#view-speech')).toHaveAttribute('data-guide-active', 'true');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-guide-prompt', 'Şimdi buna dokun');

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

  expect(state.state?.speech?.next_word).toBe('top');
  expect(state.state?.speech?.guide_active).toBe(true);
  expect(state.prompts.at(-1)).toBe('Şimdi buna dokun.');
  expect(state.sounds.at(-1)).toBe('guide-chime');
});
