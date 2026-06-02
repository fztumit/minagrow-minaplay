import { expect, test } from '@playwright/test';

test('home opens with six calm modes and bonus ceee', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('.mode-card')).toHaveCount(6);
  await expect(page.locator('.mode-card[data-view="sentence"]')).toContainText('İfade');
  await expect(page.locator('.bonus-strip')).toContainText('Ceee');
  await expect(page.locator('.bottom-nav button')).toHaveCount(6);
});

test('parent panel records simple module activity', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return Boolean(surface?.dataset.touchTargetId) && ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
  await page.click('[data-open-parent]');

  await expect(page.locator('#view-parent')).toHaveClass(/active/);
  await expect(page.locator('#metric-sessions')).toHaveText('1');
  await expect(page.locator('#metric-correct')).toHaveText('1');
});

test('module back buttons return to home', async ({ page }) => {
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep', 'peekaboo']) {
    await page.click(`[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click('.topbar-home');
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('active bottom nav button returns to home', async ({ page }) => {
  await page.goto('/');

  for (const view of ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep']) {
    await page.click(`.mode-card[data-view="${view}"]`);
    await expect(page.locator(`#view-${view}`)).toHaveClass(/active/);

    await page.click(`.bottom-nav button[data-view="${view}"]`);
    await expect(page.locator('#view-home')).toHaveClass(/active/);
    await expect(page.locator('.app-shell')).toHaveAttribute('data-active-view', 'home');
  }
});

test('touch module runs a single-target listen and touch round', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="touch"]');
  await expect(page.locator('#view-touch .touch-listen-card')).toHaveCount(0);
  await expect(page.locator('#view-touch [data-touch-bubble]')).toHaveCount(0);
  await expect(page.locator('#view-touch .touch-meaning-object')).toHaveCount(0);

  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });

  await expect(page.locator('#view-touch [data-touch-card-id]')).toHaveCount(2);
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  expect(targetId).toBeTruthy();
  await expect(page.locator(`#view-touch [data-touch-card-id="${targetId}"]`)).toHaveClass(/active-target/);
  await expect(page.locator('#view-touch .touch-pofi-hint')).toHaveCount(0);

  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-touch-state', 'success');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveClass(/touch-speaking/);
  await expect(page.locator(`#view-touch [data-touch-card-id="${targetId}"]`)).toHaveClass(/target-success/);
});

test('touch repeat is explicit and parent controlled', async ({ page }) => {
  await page.goto('/');
  await page.click('.mode-card[data-view="touch"]');

  await expect(page.locator('#view-touch [data-touch-repeat-toggle]')).toHaveCount(0);

  await page.click('[data-open-parent]');
  await expect(page.locator('[data-touch-repeat-duration]')).toHaveValue('30');
  await expect(page.locator('[data-touch-repeat-count]')).toHaveValue('8');
  await expect(page.locator('[data-touch-card-editor] [data-touch-card-admin]')).toHaveCount(5);
  await expect(page.locator('[data-touch-card-image]').first()).toHaveAttribute('accept', 'image/png,image/jpeg,image/gif');
});

test('matching module uses words mastered in touch', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top'] }));
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: { success: 5, fail: 0, hintLevels: {}, successLatencyMsTotal: 2400, successLatencySamples: 5, repeatNeeds: 0 },
        top: { success: 4, fail: 1, hintLevels: {}, successLatencyMsTotal: 2800, successLatencySamples: 4, repeatNeeds: 1 }
      })
    );
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="match"]');
  const targetId = await page.locator('[data-match-surface]').getAttribute('data-match-target-id');
  expect(['su', 'top']).toContain(targetId);
  expect(await page.locator('[data-match-choice]').count()).toBeGreaterThanOrEqual(2);
  await page.click(`[data-match-choice="${targetId}"]`, { force: true });
  await expect(page.locator('[data-match-status]')).toContainText('Evet');
});

test('matching module escalates hints and records repeat needs', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top'] }));
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: { success: 5, fail: 0, hintLevels: {}, successLatencyMsTotal: 2400, successLatencySamples: 5, repeatNeeds: 0 },
        top: { success: 4, fail: 1, hintLevels: {}, successLatencyMsTotal: 2800, successLatencySamples: 4, repeatNeeds: 1 }
      })
    );
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="match"]');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-state', 'hint', { timeout: 7000 });
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-hint-level', '1');
  await expect(page.locator('[data-match-surface]')).toHaveAttribute('data-match-hint-level', '2', { timeout: 4000 });
  const targetId = await page.locator('[data-match-surface]').getAttribute('data-match-target-id');
  const wrongChoice = page.locator(`[data-match-choice]:not([data-match-choice="${targetId}"])`).first();
  await wrongChoice.click({ force: true });

  const progress = await page.evaluate((id) => JSON.parse(localStorage.getItem('minaplay_match_progress_v1') ?? '{}')[id ?? ''], targetId);
  expect(progress.hintLevels['1']).toBeGreaterThanOrEqual(1);
  expect(progress.hintLevels['2']).toBeGreaterThanOrEqual(1);
  expect(progress.repeatNeeds).toBeGreaterThanOrEqual(2);
});

test('sentence module completes a short expression from context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('minaplay_mastered_words_v1', JSON.stringify({ masteredWords: ['su', 'top', 'baba'] }));
  });
  await page.goto('/');

  await page.click('.mode-card[data-view="sentence"]');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', /context|waiting/);
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-mode', 'learn');
  await expect(page.locator('.sentence-mode-button[data-sentence-mode="learn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-sentence-context]')).toBeHidden();
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  await expect(page.locator('[data-sentence-choice]')).toHaveCount(0);
  await expect(page.locator('[data-sentence-card] img.sentence-need-image')).toHaveCount(1);

  const sentenceKey = await page.locator('[data-sentence-surface]').getAttribute('data-sentence-key');
  await page.click('[data-sentence-card]', { force: true });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'success');
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'repeat_prompt', { timeout: 7000 });
  await expect(page.locator('[data-sentence-card]')).toHaveText('');
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem('minaplay_sentence_progress_v1') ?? '{}')[key ?? ''], sentenceKey);
  expect(progress.success).toBeGreaterThanOrEqual(1);
  expect(progress.repeatPrompts).toBeGreaterThanOrEqual(1);
});

test('sentence module offers a select and speak needs board', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="sentence"]');
  await page.click('.sentence-mode-button[data-sentence-mode="board"]');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-mode', 'board');
  await expect(page.locator('.sentence-mode-button[data-sentence-mode="board"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-sentence-board-card]')).toHaveCount(11);
  await expect(page.locator('[data-sentence-card]')).toBeHidden();

  const water = page.locator('[data-sentence-board-card="su-istiyorum"]');
  await water.click({ force: true });
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'success');
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-key', 'su_istiyorum');
  await expect(water).toHaveClass(/selected/);
  await expect(page.locator('[data-sentence-surface]')).toHaveAttribute('data-sentence-state', 'repeat_prompt', { timeout: 7000 });
});

test('story module narrates and opens an interaction point', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="story"]');
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', /attention|narration/);
  await expect(page.locator('[data-story-scene] .story-scene-image, [data-story-scene] .story-object')).toHaveCount(1);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-step', 'what-needed', { timeout: 18000 });
  await expect(page.locator('[data-story-choice]')).toHaveCount(2);

  await page.click('[data-story-choice="su"]', { force: true });
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-state', 'success');
  await expect(page.locator('[data-story-choice="su"]')).toHaveClass(/story-correct/);
  await expect(page.locator('[data-story-surface]')).toHaveAttribute('data-story-step', 'water-drink', { timeout: 11000 });
});

test('sleep module shows moon scene and toggles sleeping Pofi', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="sleep"]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'false');
  await expect(page.locator('#view-sleep .sleep-moon')).toHaveAttribute('src', /assets\/sleep\/moon\.png$/);
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toBeVisible();
  await expect(page.locator('#view-sleep .sleep-floating-pofi')).toHaveAttribute('data-pofi-state', 'sleepReady');
  await expect(page.locator('#view-sleep .sleep-floating-pofi .pofi-eyes')).toHaveAttribute('src', /half-open-v01\.png$/);
  await expect(page.locator('#view-sleep .sleeping-pofi-pose')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-sleep-label]')).toHaveText('Başlat');

  await page.click('[data-sleep-toggle]');
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'true');
  await expect(page.locator('[data-sleep-label]')).toHaveText('Durdur');
  await expect(page.locator('#view-sleep .sleeping-pofi-pose')).toHaveCSS('opacity', '1', { timeout: 2000 });
  await expect(page.locator('.topbar')).toHaveCSS('opacity', '0');
  await expect(page.locator('.bottom-nav')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-sleep-toggle]')).toHaveCSS('opacity', '0');

  await page.click('[data-sleep-surface]', { position: { x: 20, y: 20 } });
  await expect(page.locator('[data-sleep-surface]')).toHaveAttribute('data-sleep-running', 'false', { timeout: 2200 });
  await expect(page.locator('[data-sleep-label]')).toHaveText('Başlat');
});

test('mirror module starts camera-safe imitation flow', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="mirror"]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-state', /attention|exercise|waiting/);
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', 'tongue-out');
  await expect(page.locator('#view-mirror [data-pofi-avatar] .pofi-mouth')).toHaveAttribute('src', /tongue-out-v01\.png$/, { timeout: 3000 });
  await expect(page.locator('[data-mirror-video]')).toHaveCount(1);
  await expect(page.locator('[data-mirror-progress]')).toHaveCSS('--mirror-duration', '4200ms');
  await expect(page.locator('.mirror-actions')).toHaveCount(0);
  await expect(page.locator('[data-mirror-next]')).toHaveCount(0);

  await page.click('[data-mirror-repeat]');
  await expect(page.locator('[data-mirror-surface]')).toHaveAttribute('data-mirror-exercise', 'tongue-out');
});

test('parent panel shows touch word progress rows', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'minaplay_touch_progress_v1',
      JSON.stringify({
        su: { success: 3, fail: 1, hintLevels: { 1: 1 }, successLatencyMsTotal: 1800, successLatencySamples: 3, repeatNeeds: 1 }
      })
    );
  });
  await page.goto('/');

  await page.click('[data-open-parent]');
  await expect(page.locator('[data-touch-progress-table] .touch-progress-row')).toHaveCount(5);
  await expect(page.locator('[data-touch-progress-table]')).toContainText('Su');
  await expect(page.locator('[data-touch-progress-table]')).toContainText('3 doğru');
});

test('module surfaces render stateful layered Pofi parts', async ({ page }) => {
  await page.goto('/');

  await page.click('.mode-card[data-view="mirror"]');

  const mirrorPofi = page.locator('#view-mirror [data-pofi-avatar]');
  await expect(mirrorPofi).toHaveAttribute('data-pofi-state', /mirrorAttention|mirrorTongueOut/);
  await expect(mirrorPofi.locator('img')).toHaveCount(6);
  await expect(mirrorPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
  await expect(mirrorPofi.locator('.pofi-mouth')).toHaveAttribute('src', /open-smile-soft-v01\.png|tongue-out-v01\.png$/);

  await page.click('#view-mirror [data-view="home"]');
  await page.click('.mode-card[data-view="touch"]');
  await page.waitForFunction(() => {
    const surface = document.querySelector<HTMLElement>('#view-touch [data-touch-surface]');
    return Boolean(surface?.dataset.touchTargetId) && ['targeting', 'waiting'].includes(surface?.dataset.touchState ?? '');
  });
  const targetId = await page.locator('#view-touch [data-touch-surface]').getAttribute('data-touch-target-id');
  await page.click(`#view-touch [data-touch-card-id="${targetId}"]`, { force: true });

  const touchPofi = page.locator('#view-touch [data-pofi-avatar]');
  await expect(page.locator('#view-touch [data-touch-surface]')).toHaveAttribute('data-touch-state', 'success');
  await expect(touchPofi.locator('.pofi-body')).toHaveAttribute('src', /default-v01\.png$/);
});
