import { expect, test } from '@playwright/test';

test('stories easy level provides two-word starter sentences', async ({ page }) => {
  await page.goto('/');

  await page.click('.tab-btn[data-view="stories"]');
  await page.evaluate(() => {
    (document.getElementById('parent-panel-trigger') as HTMLButtonElement | null)?.click();
  });
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#story-level-select')).toHaveValue('easy');
  await expect(page.locator('#story-audio-record-start')).toBeVisible();
  await expect(page.locator('#story-audio-play')).toBeVisible();
  await page.click('#parent-panel-close');
  await expect(page.locator('#view-stories')).toHaveClass(/active/);

  const firstSentence = (await page.locator('#story-sentence').innerText()).trim();
  expect(firstSentence).toBe('Su iç');
  expect(firstSentence.split(/\s+/).length).toBe(2);

  await page.click('#story-listen');
  await page.waitForTimeout(350);

  const initialState = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    if (typeof runtime.render_game_to_text !== 'function') {
      return null;
    }

    return JSON.parse(runtime.render_game_to_text());
  });

  await page.click('#story-next');
  const secondSentence = (await page.locator('#story-sentence').innerText()).trim();

  const nextState = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    if (typeof runtime.render_game_to_text !== 'function') {
      return null;
    }

    return JSON.parse(runtime.render_game_to_text());
  });

  expect(initialState?.active_view).toBe('view-stories');
  expect(initialState?.stories?.level).toBe('easy');
  expect(initialState?.stories?.active_story_id).toBe('ilk-cumleler-1');
  expect(String(initialState?.stories?.last_spoken_sentence ?? '')).toBe('Su iç');
  expect(initialState?.stories?.current_sentence_has_audio).toBe(false);
  expect(secondSentence).toBe('Top at');
  expect(secondSentence.split(/\s+/).length).toBe(2);
  expect(nextState?.stories?.sentence_index).toBe(1);
});
