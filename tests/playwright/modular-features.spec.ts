import { expect, test, type Page } from '@playwright/test';
import { unlockParentPanel } from './helpers/parent-access.js';

function getState() {
  const runtime = window as Window & { render_game_to_text?: () => string };
  if (typeof runtime.render_game_to_text !== 'function') {
    return null;
  }
  return JSON.parse(runtime.render_game_to_text());
}

async function openParentPanel(page: Page) {
  await unlockParentPanel(page);
}

async function closeParentPanel(page: Page, expectedView = 'speech') {
  await page.click('#parent-panel-close');
  await expect(page.locator(`#view-${expectedView}`)).toHaveClass(/active/);
}

test('stories pack selector switches dataset and content', async ({ page }) => {
  await page.goto('/');
  await page.click('.tab-btn[data-view="stories"]');

  await openParentPanel(page);
  await expect(page.locator('#story-pack-select')).toHaveValue('core');
  await page.selectOption('#story-pack-select', 'animals');
  await closeParentPanel(page, 'stories');
  await expect(page.locator('#story-sentence')).toContainText('Kedi gel');

  const state = await page.evaluate(getState);
  expect(state?.stories?.pack).toBe('animals');
  expect(state?.stories?.active_story_id).toBe('hayvan-kolay-1');
});

test('stories pack progress summary reflects selected pack metrics', async ({ page }) => {
  await page.addInitScript(() => {
    const toDateKey = (offset: number) => {
      const now = new Date();
      now.setDate(now.getDate() - offset);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    localStorage.setItem(
      'konusu_yorum_custom_audio_v1',
      JSON.stringify({
        'kedi gel': 'data:audio/webm;base64,AAAA',
        'tavuk gez': 'data:audio/webm;base64,BBBB'
      })
    );
    localStorage.setItem(
      'konusu_yorum_listen_progress_v1',
      JSON.stringify({
        wordListens: {},
        sentenceListens: {},
        packSentenceListens: {
          'animals::kedi gel': 5,
          'animals::kopek bak': 2,
          'core::su iç': 9
        },
        packDailyListens: {
          [`animals::${toDateKey(0)}`]: 3,
          [`animals::${toDateKey(2)}`]: 2,
          [`animals::${toDateKey(8)}`]: 1,
          [`core::${toDateKey(1)}`]: 4
        }
      })
    );
  });

  await page.goto('/');
  await page.click('.tab-btn[data-view="stories"]');
  await openParentPanel(page);
  await page.selectOption('#story-pack-select', 'animals');

  await expect(page.locator('#story-pack-progress-summary')).toContainText('Paket dinleme: 7');
  await expect(page.locator('#story-pack-progress-summary')).toContainText('2/8');
  await expect(page.locator('#story-pack-progress-summary')).toContainText('Haftalık artış: +4');
  await expect(page.locator('#story-pack-progress-list')).toContainText('Kedi gel (5)');
  await expect(page.locator('#story-pack-progress-list')).toContainText('2/8');
  await expect(page.locator('#story-pack-progress-list')).toContainText('Bu hafta dinleme');

  const state = await page.evaluate(getState);
  expect(state?.stories?.pack).toBe('animals');
  expect(state?.stories?.pack_total_listens).toBe(7);
  expect(state?.stories?.pack_recording_coverage).toBe('2/8');
  expect(state?.stories?.pack_top_sentence).toBe('Kedi gel');
  expect(state?.stories?.pack_top_sentence_count).toBe(5);
  expect(state?.stories?.pack_weekly_current).toBe(5);
  expect(state?.stories?.pack_weekly_change).toBe(4);
  expect(state?.stories?.compare_leader_pack).toBe('core');
});

test('pack comparison cards show leader and weekly momentum', async ({ page }) => {
  await page.addInitScript(() => {
    const toDateKey = (offset: number) => {
      const now = new Date();
      now.setDate(now.getDate() - offset);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    localStorage.setItem(
      'konusu_yorum_listen_progress_v1',
      JSON.stringify({
        wordListens: {},
        sentenceListens: {},
        packSentenceListens: {
          'core::su iç': 12,
          'animals::kedi gel': 6,
          'daily::yuz yika': 2
        },
        packDailyListens: {
          [`core::${toDateKey(0)}`]: 5,
          [`core::${toDateKey(1)}`]: 4,
          [`core::${toDateKey(8)}`]: 2,
          [`animals::${toDateKey(0)}`]: 1,
          [`animals::${toDateKey(1)}`]: 1,
          [`animals::${toDateKey(8)}`]: 4
        }
      })
    );
  });

  await page.goto('/');
  await page.click('.tab-btn[data-view="stories"]');
  await openParentPanel(page);

  await expect(page.locator('#story-pack-compare-summary')).toContainText('Lider paket: Temel Paket');
  await expect(page.locator('#story-pack-compare-list')).toContainText('Temel Paket');
  await expect(page.locator('#story-pack-compare-list')).toContainText('Toplam: 12');
  await expect(page.locator('#story-pack-compare-list')).toContainText('Haftalık: +7');
  await expect(page.locator('#story-pack-compare-list')).toContainText('Hayvanlar');
  await expect(page.locator('#story-pack-compare-list')).toContainText('Haftalık: -2');

  const state = await page.evaluate(getState);
  expect(state?.stories?.compare_leader_pack).toBe('core');
  expect(state?.stories?.compare_leader_total).toBe(12);
});

test('story audio panel lets parent choose a pack sentence directly', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'konusu_yorum_custom_audio_v1',
      JSON.stringify({
        'kedi gel': 'data:audio/webm;base64,AAAA'
      })
    );
  });

  await page.goto('/');
  await page.click('.tab-btn[data-view="stories"]');
  await openParentPanel(page);
  await page.selectOption('#story-pack-select', 'animals');

  await expect(page.locator('#story-audio-sentence-list')).toContainText('Kedi gel');
  await page.click('.story-audio-sentence-btn:has-text("Kedi gel")');
  await expect(page.locator('#story-audio-target')).toContainText('Kedi gel');
  await expect(page.locator('.story-audio-sentence-btn:has-text("Kedi gel")')).toHaveClass(/active/);
  await expect(page.locator('#story-audio-play')).toBeEnabled();

  await page.click('#story-audio-play');
  await expect(page.locator('#story-audio-status')).toContainText('Kedi gel');
});

test('daily word card uses parent recording map for today', async ({ page }) => {
  await page.addInitScript(() => {
    const labels = ['su', 'anne', 'baba', 'top', 'araba', 'kitap', 'elma', 'süt', 'ekmek'];
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayIndex = Math.floor(dayStart / 86_400_000);
    const todayWord = labels[Math.abs(dayIndex) % labels.length];

    localStorage.setItem(
      'konusu_yorum_custom_audio_v1',
      JSON.stringify({
        [todayWord]: 'data:audio/webm;base64,AAAA'
      })
    );
  });

  await page.goto('/');
  await openParentPanel(page);

  await expect(page.locator('#daily-word-play')).toBeEnabled();
  await expect(page.locator('#daily-word-record-status')).toContainText('hazir');

  let state = await page.evaluate(getState);
  expect(state?.daily_word_audio?.has_recording).toBe(true);

  await page.click('#daily-word-delete');
  state = await page.evaluate(getState);
  expect(state?.daily_word_audio?.has_recording).toBe(false);
});

test('daily activity card tracks words, story, and interaction', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('konusu_yorum_daily_activity_v1');
  });

  await page.goto('/');

  await page.click('.word-card[data-word-id="su"]');
  await page.waitForFunction(() => {
    return document.getElementById('view-speech')?.getAttribute('data-current-target') === 'baba';
  });
  await page.click('.word-card[data-word-id="baba"]');
  await page.waitForFunction(() => {
    return document.getElementById('view-speech')?.getAttribute('data-current-target') === 'top';
  });
  await page.click('.word-card[data-word-id="top"]');

  await page.click('.tab-btn[data-view="stories"]');
  await page.click('#story-listen');

  await openParentPanel(page);
  await expect(page.locator('#daily-activity-summary')).toContainText('3/3');
  await expect(page.locator('#daily-task-words')).toContainText('3/3');
  await expect(page.locator('#daily-task-story')).toContainText('1/1');
  await expect(page.locator('#daily-task-interaction')).toContainText('1/1');

  const state = await page.evaluate(getState);
  expect(state?.daily_activity?.completed_count).toBe(3);
  expect(state?.daily_activity?.words).toBe(3);
  expect(state?.daily_activity?.story).toBe(1);
  expect(state?.daily_activity?.interaction).toBe(1);
});

test('daily activity resets when stored date is stale', async ({ page }) => {
  await page.addInitScript(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    localStorage.setItem(
      'konusu_yorum_daily_activity_v1',
      JSON.stringify({
        dateKey,
        words: ['su', 'anne', 'baba'],
        stories: ['su iç'],
        interactions: 3
      })
    );
  });

  await page.goto('/');
  await openParentPanel(page);

  await expect(page.locator('#daily-activity-summary')).toContainText('0/3');

  const state = await page.evaluate(getState);
  expect(state?.daily_activity?.completed_count).toBe(0);
  expect(state?.daily_activity?.words).toBe(0);
  expect(state?.daily_activity?.story).toBe(0);
  expect(state?.daily_activity?.interaction).toBe(0);
});

test('custom audio backup import updates recording library and state', async ({ page }) => {
  await page.goto('/');
  await openParentPanel(page);

  const backupPayload = {
    version: 1,
    exportedAt: '2026-03-06T00:00:00.000Z',
    recordings: {
      su: 'data:audio/webm;base64,AAAA'
    }
  };

  await page.setInputFiles('#recording-import-input', {
    name: 'konusu-yorum-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backupPayload))
  });

  await expect(page.locator('#recording-backup-status')).toContainText('Yukleme tamamlandi');
  await expect(page.locator('#recording-library-summary')).toContainText('Toplam kayit: 1');

  const state = await page.evaluate(getState);
  expect(state?.speech?.custom_audio_count).toBe(1);
});

test('progress metrics increase when recorded word is played', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'konusu_yorum_custom_audio_v1',
      JSON.stringify({
        su: 'data:audio/webm;base64,AAAA'
      })
    );
    localStorage.removeItem('konusu_yorum_listen_progress_v1');
  });

  await page.goto('/');
  await openParentPanel(page);
  await closeParentPanel(page);
  await page.click('.word-card[data-word-id="su"]');
  await page.waitForTimeout(2500);

  const state = await page.evaluate(getState);
  expect(state?.speech?.word_recording_coverage).toBe('1/9');
  expect(state?.speech?.total_word_listens).toBe(3);
});

test('progress reset clears listen counters and keeps recordings', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'konusu_yorum_custom_audio_v1',
      JSON.stringify({
        su: 'data:audio/webm;base64,AAAA'
      })
    );
    localStorage.setItem(
      'konusu_yorum_listen_progress_v1',
      JSON.stringify({
        wordListens: {
          su: 4
        },
        sentenceListens: {
          'su iç': 2
        }
      })
    );
  });

  await page.goto('/');
  await openParentPanel(page);

  await expect(page.locator('#progress-summary')).toContainText('Toplam kelime dinleme: 4');
  await expect(page.locator('#progress-reset-btn')).toBeEnabled();

  await page.click('#progress-reset-btn');
  await expect(page.locator('#progress-reset-status')).toContainText('sıfırlandı');

  const state = await page.evaluate(getState);
  expect(state?.speech?.custom_audio_count).toBe(1);
  expect(state?.speech?.word_recording_coverage).toBe('1/9');
  expect(state?.speech?.total_word_listens).toBe(0);
  expect(state?.speech?.top_sentence_count).toBe(0);

  const rawProgress = await page.evaluate(() => localStorage.getItem('konusu_yorum_listen_progress_v1'));
  expect(rawProgress).toBeTruthy();
  expect(rawProgress).toContain('"wordListens":{}');
  expect(rawProgress).toContain('"sentenceListens":{}');
});

test('progress word rows provide direct recording actions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'konusu_yorum_custom_audio_v1',
      JSON.stringify({
        baba: 'data:audio/webm;base64,AAAA'
      })
    );
  });

  await page.goto('/');
  await openParentPanel(page);

  await expect(page.locator('.progress-row[data-word-id="baba"] .progress-record-btn[data-action="record"]')).toBeVisible();
  await expect(page.locator('.progress-row[data-word-id="baba"] .progress-record-btn[data-action="play"]')).toBeEnabled();
  await expect(page.locator('.progress-row[data-word-id="su"] .progress-record-btn[data-action="play"]')).toBeDisabled();

  await page.click('.progress-row[data-word-id="baba"] .progress-record-btn[data-action="delete"]');
  await expect(page.locator('.progress-row[data-word-id="baba"]')).toContainText('Kayit: Yok');
  await expect(page.locator('#custom-audio-status')).toContainText('baba');
});

test('parent can rename a word and add a matching image from the progress list', async ({ page }) => {
  await page.goto('/');
  await openParentPanel(page);

  await page.fill('.progress-row[data-word-id="elma"] .progress-word-input', 'Meyve');
  await page.click('.progress-row[data-word-id="elma"] .progress-record-btn[data-action="save-label"]');

  await expect(page.locator('.progress-row[data-word-id="elma"] .progress-word-input')).toHaveValue('Meyve');
  await expect(page.locator('#custom-audio-status')).toContainText('Meyve');
  await expect(page.locator('.word-card[data-word-id="elma"]')).toHaveAttribute('aria-label', 'Meyve');

  await page.setInputFiles('.progress-row[data-word-id="elma"] .progress-image-input', {
    name: 'meyve.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="16" fill="#ffe08a"/><circle cx="32" cy="34" r="18" fill="#ff9f4a"/><rect x="30" y="10" width="4" height="12" rx="2" fill="#5f8d3b"/></svg>'
    )
  });

  await expect(page.locator('.progress-row[data-word-id="elma"] .progress-word-preview img')).toHaveAttribute(
    'src',
    /data:image/
  );
  await expect(page.locator('.word-card[data-word-id="elma"] .word-object-image')).toHaveAttribute('src', /data:image/);
});
