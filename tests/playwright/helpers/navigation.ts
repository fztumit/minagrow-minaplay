import { expect, type Page } from '@playwright/test';

export async function openWordMode(page: Page): Promise<void> {
  await page.click('.tab-btn[data-view="speech"]');
  await expect(page.locator('#view-speech')).toHaveClass(/active/);
}

export async function openSentenceMode(page: Page): Promise<void> {
  await page.click('.tab-btn[data-view="sentence"]');
  await expect(page.locator('#view-sentence')).toHaveClass(/active/);
}

export async function openPeekabooMode(page: Page): Promise<void> {
  await page.click('.tab-btn[data-view="peekaboo"]');
  await expect(page.locator('#view-peekaboo')).toHaveClass(/active/);
}

export async function openStoriesMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('activate-primary-view', { detail: 'stories' }));
  });
  await expect(page.locator('#view-stories')).toHaveClass(/active/);
}

export async function gotoStoriesView(page: Page): Promise<void> {
  await page.goto('/?view=stories');
  await expect(page.locator('#view-stories')).toHaveClass(/active/);
}
