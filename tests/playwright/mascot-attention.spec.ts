import { expect, test } from '@playwright/test';
import { openWordMode } from './helpers/navigation.js';

test('phoenix nudges the child after idle time with sound and location prompt', async ({ page }) => {
  await page.goto('/');
  await openWordMode(page);

  await page.waitForFunction(() => {
    const message = document.getElementById('mascot-message')?.textContent ?? '';
    return message.includes('bekliyorum');
  });

  const result = await page.evaluate(() => {
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

  expect(result.state?.speech?.guide_active).toBe(true);
  expect(result.state?.speech?.guide_mode).toBe('attention');
  expect(String(result.state?.mascot_message ?? '')).toContain('bekliyorum');
  expect(result.prompts.at(-1)).toContain('bekliyorum');
  expect(result.sounds.at(-1)).toBe('attention-chirp');
});
