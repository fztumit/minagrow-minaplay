import { expect, test } from '@playwright/test';
import { openSentenceMode } from './helpers/navigation.js';

test('sentence builder combines two selections into a playable sentence', async ({ page }) => {
  await page.goto('/');
  await openSentenceMode(page);

  await page.click('.sentence-choice-btn[data-actor-id="baba"]');
  await page.click('.sentence-choice-btn[data-object-id="su"]');

  await expect(page.locator('#view-sentence')).toHaveAttribute('data-current-sentence', 'Baba su içti.');
  await expect(page.locator('#view-sentence')).toHaveAttribute('data-selected-actor', 'baba');
  await expect(page.locator('#view-sentence')).toHaveAttribute('data-selected-object', 'su');
  await expect(page.locator('#sentence-preview-text')).toContainText('Baba su içti.');

  const result = await page.evaluate(() => {
    const runtime = window as Window & {
      render_game_to_text?: () => string;
      __sentenceLog?: string[];
    };

    return {
      state: typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null,
      sentenceLog: runtime.__sentenceLog ?? []
    };
  });

  expect(result.state?.active_view).toBe('view-sentence');
  expect(result.state?.sentence?.current_sentence).toBe('Baba su içti.');
  expect(result.state?.sentence?.playing).toBe(true);
  expect(result.sentenceLog.at(-1)).toBe('Baba su içti.');
});
