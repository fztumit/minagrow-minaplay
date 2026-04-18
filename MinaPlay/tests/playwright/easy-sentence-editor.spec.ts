import { expect, test } from '@playwright/test';

test('easy sentence editor adds and removes custom two-word sentence', async ({ page }) => {
  await page.goto('/');

  await page.click('.tab-btn[data-view="stories"]');
  await expect(page.locator('#story-level-select')).toHaveValue('easy');

  await page.fill('#easy-sentence-input', 'Dede bak');
  await page.click('#easy-sentence-form button[type="submit"]');
  await expect(page.locator('#easy-sentence-list')).toContainText('Dede bak');

  const addedState = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    if (typeof runtime.render_game_to_text !== 'function') {
      return null;
    }
    return JSON.parse(runtime.render_game_to_text());
  });

  expect(addedState?.stories?.custom_easy_sentence_count).toBe(1);
  expect(addedState?.stories?.story_count).toBe(3);

  await page.click('.easy-sentence-delete');
  await expect(page.locator('#easy-sentence-list')).not.toContainText('Dede bak');

  const removedState = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    if (typeof runtime.render_game_to_text !== 'function') {
      return null;
    }
    return JSON.parse(runtime.render_game_to_text());
  });

  expect(removedState?.stories?.custom_easy_sentence_count).toBe(0);
  expect(removedState?.stories?.story_count).toBe(2);
});
