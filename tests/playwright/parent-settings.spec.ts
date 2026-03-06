import { expect, test } from '@playwright/test';

test('parent settings repeat mode overrides default repeat count', async ({ page }) => {
  await page.goto('/');

  await page.selectOption('#speech-repeat-mode', '2');
  await page.click('.word-card[data-word="su"]');
  await page.waitForTimeout(1700);

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    if (typeof runtime.render_game_to_text !== 'function') {
      return null;
    }
    return JSON.parse(runtime.render_game_to_text());
  });

  const speechLog = await page.evaluate(() => {
    const runtime = window as Window & { __speechLog?: string[] };
    return runtime.__speechLog ?? [];
  });

  expect(state?.speech?.repeat_mode).toBe('2');
  expect(speechLog.filter((word) => word === 'su').length).toBe(2);
});
