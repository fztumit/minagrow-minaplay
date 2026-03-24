import { expect, test } from '@playwright/test';

test('water object interaction triggers spill animation', async ({ page }) => {
  await page.goto('/');

  const waterCard = page.locator('.word-card[data-word-id="su"]');
  await waterCard.click();

  const waterOverlay = page.locator('#water-focus-overlay');
  await expect(waterOverlay).toHaveClass(/is-active/);
  await expect(waterOverlay).toHaveClass(/is-spilling/);
  const focusStageMetrics = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#water-focus-overlay .water-focus-stage');
    if (!stage) {
      return null;
    }

    const computed = window.getComputedStyle(stage);
    const width = Number.parseFloat(computed.width);
    const height = Number.parseFloat(computed.height);
    return {
      widthRatio: width / window.innerWidth,
      heightRatio: height / window.innerHeight
    };
  });
  expect(focusStageMetrics).not.toBeNull();
  if (focusStageMetrics) {
    expect(focusStageMetrics.widthRatio).toBeGreaterThanOrEqual(0.45);
    expect(focusStageMetrics.heightRatio).toBeGreaterThanOrEqual(0.45);
  }
  await expect(page.locator('#view-speech')).toHaveAttribute('data-last-word', 'su');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-water-spilled', 'true');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-water-expanded', 'true');
  await expect(page.locator('#view-speech')).toHaveAttribute('data-water-expanded', 'false', {
    timeout: 4000
  });
});
