import { expect, test } from '@playwright/test';

test('peekaboo mode runs an automatic ceee reveal cycle', async ({ page }) => {
  await page.goto('/');
  await page.click('.tab-btn[data-view="peekaboo"]');
  await page.click('#peekaboo-stage-tap');

  await expect(page.locator('#view-peekaboo')).toHaveClass(/active/);
  await expect(page.locator('#peekaboo-stage')).toBeVisible();

  await page.waitForFunction(() => {
    return Number(document.getElementById('view-peekaboo')?.getAttribute('data-peek-reveals') ?? 0) >= 1;
  });

  await page.waitForFunction(() => {
    const runtime = window as Window & { __peekabooSoundLog?: string[] };
    return (runtime.__peekabooSoundLog ?? []).includes('ceee') && (runtime.__peekabooSoundLog ?? []).includes('sparkle');
  });

  const result = await page.evaluate(() => {
    const runtime = window as Window & {
      render_game_to_text?: () => string;
      __peekabooPromptLog?: string[];
      __peekabooSoundLog?: string[];
    };

    return {
      state: typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null,
      prompts: runtime.__peekabooPromptLog ?? [],
      sounds: runtime.__peekabooSoundLog ?? []
    };
  });

  expect(result.state?.active_view).toBe('view-peekaboo');
  expect(result.state?.peekaboo?.reveals).toBeGreaterThanOrEqual(1);
  expect(result.prompts).toContain('Ceee!');
  expect(result.sounds).toContain('ceee');
  expect(result.sounds).toContain('sparkle');
});

test('peekaboo environment hide can be revealed by tapping the hideout', async ({ page }) => {
  await page.goto('/');
  await page.click('.tab-btn[data-view="peekaboo"]');

  await page.waitForFunction(() => {
    const root = document.getElementById('view-peekaboo');
    return root?.getAttribute('data-hide-mode') === 'environment' && root?.getAttribute('data-peek-state') === 'wait';
  });

  const hideout = await page.locator('#view-peekaboo').getAttribute('data-current-hideout');
  expect(hideout).toBeTruthy();

  await page.click(`.peekaboo-hideout[data-hideout="${hideout}"]`);

  await page.waitForFunction(() => {
    const root = document.getElementById('view-peekaboo');
    return root?.getAttribute('data-peek-state') === 'reveal';
  });

  const result = await page.evaluate(() => {
    const runtime = window as Window & {
      render_game_to_text?: () => string;
      __peekabooSoundLog?: string[];
    };

    return {
      state: typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null,
      sounds: runtime.__peekabooSoundLog ?? []
    };
  });

  expect(result.state?.peekaboo?.reveals).toBeGreaterThanOrEqual(1);
  expect(result.sounds).toContain('ceee');
  expect(result.sounds).toContain('sparkle');
});

test('peekaboo opening delivers multiple reveal beats quickly', async ({ page }) => {
  await page.goto('/?view=peekaboo');
  await page.click('#peekaboo-stage-tap');

  await page.waitForFunction(() => {
    return Number(document.getElementById('view-peekaboo')?.getAttribute('data-peek-reveals') ?? 0) >= 2;
  }, { timeout: 12000 });

  const state = await page.evaluate(() => {
    const runtime = window as Window & { render_game_to_text?: () => string };
    return typeof runtime.render_game_to_text === 'function' ? JSON.parse(runtime.render_game_to_text()) : null;
  });

  expect(state?.active_view).toBe('view-peekaboo');
  expect(state?.peekaboo?.reveals).toBeGreaterThanOrEqual(2);
  expect(state?.peekaboo?.sequence).toMatch(/opening|loop/);
});
