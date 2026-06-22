import { test, expect } from './test';
import { mockAudio, gotoHome } from './support';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Service worker', () => {
  test('registers with the expected cache version', async ({ page }) => {
    await expect.poll(async () => {
      return page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) {
          return 0;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration?.active) {
          return 0;
        }
        const cacheNames = await caches.keys();
        return cacheNames.includes('tboy1337-v1.2.0') ? 1 : 0;
      });
    }, { timeout: 30000 }).toBe(1);
  });

  test('translation bootstrap does not throw on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.reload();
    await page.waitForTimeout(2000);
    const translationErrors = errors.filter((message) => message.includes('Google Translate'));
    expect(translationErrors).toHaveLength(0);
  });
});
