import { expect, type Page } from '@playwright/test';

export const DEFAULT_PARENT_PIN = '1234';

export async function requestParentPanel(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.getElementById('parent-panel-trigger') as HTMLButtonElement | null)?.click();
  });
  await expect(page.locator('#parent-auth-overlay')).toHaveClass(/is-active/);
}

export async function unlockParentPanel(page: Page, pin = DEFAULT_PARENT_PIN): Promise<void> {
  await requestParentPanel(page);
  await page.fill('#parent-auth-input', pin);
  await page.click('#parent-auth-form button[type="submit"]');
  await expect(page.locator('#parent-auth-overlay')).not.toHaveClass(/is-active/);
  await expect(page.locator('#view-parent')).toHaveClass(/active/);
}
