import { expect, test } from '@playwright/test';

test('speech trigger repeats "su" three times', async ({ page }) => {
  await page.goto('/');

  await page.click('.word-card[data-word="su"]');
  await page.waitForTimeout(1500);

  const speechLog = await page.evaluate(() => {
    const runtime = window as Window & { __speechLog?: string[] };
    return runtime.__speechLog ?? [];
  });

  const suCount = speechLog.filter((item) => item === 'su').length;
  expect(suCount).toBe(3);
});
