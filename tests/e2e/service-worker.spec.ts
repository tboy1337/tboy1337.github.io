import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './test';
import { mockAudio, gotoHome } from './support';

const swSource = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../../sw.js'),
  'utf8'
);
const cacheNameMatch = swSource.match(/const CACHE_NAME = '([^']+)'/);
const expectedCacheName = cacheNameMatch?.[1] ?? 'tboy1337-v1.2.0';

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await gotoHome(page);
});

test.describe('Service worker', () => {
  test('registers with the expected cache version', async ({ page }) => {
    await expect.poll(async () => {
      return page.evaluate(async (cacheName) => {
        if (!('serviceWorker' in navigator)) {
          return 0;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration?.active) {
          return 0;
        }
        const cacheNames = await caches.keys();
        return cacheNames.includes(cacheName) ? 1 : 0;
      }, expectedCacheName);
    }, { timeout: 30000 }).toBe(1);
  });

  test('translation bootstrap does not throw on load', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cspViolations: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'warning' && /Google Translate/i.test(text)) {
        warnings.push(text);
      }
      if (/Content Security Policy|Refused to (frame|load|connect|execute)/i.test(text)) {
        cspViolations.push(text);
      }
    });

    await page.reload();
    await expect.poll(async () => {
      return page.evaluate(() => {
        const root = document.getElementById('google_translate_element');
        const select = document.querySelector('select.goog-te-combo');
        if (!root?.classList.contains('customized')) {
          return 0;
        }
        if (select instanceof HTMLSelectElement && !select.disabled) {
          return 1;
        }
        return window.googleTranslateInitialized ? 1 : 0;
      });
    }, { timeout: 25000 }).toBe(1);

    await expect(page.locator('select.goog-te-combo')).toBeEnabled({ timeout: 5000 });

    const translationErrors = errors.filter((message) => message.includes('Google Translate'));
    expect(translationErrors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
    expect(cspViolations).toHaveLength(0);
  });

  test('hash navigation to fun-games survives initial load', async ({ page }) => {
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
      }
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    });

    await page.goto('/#fun-games');
    await page.waitForFunction(
      () => typeof window.GameUtils !== 'undefined' && typeof window.MusicStudioAudio !== 'undefined'
    );
    await expect.poll(async () => {
      return page.evaluate(() => {
        const section = document.getElementById('fun-games');
        if (!section) {
          return 0;
        }
        const rect = section.getBoundingClientRect();
        return rect.top >= -40 && rect.top < window.innerHeight * 0.85 ? 1 : 0;
      });
    }, { timeout: 15000 }).toBe(1);
    await expect(page.locator('#fun-games')).toBeVisible();
  });

  test('hash navigation to music studio activates the music studio game', async ({ page }) => {
    await page.goto('/#music-studio-section');
    await page.waitForFunction(
      () => typeof window.switchPortfolioGame === 'function' && typeof window.GameUtils !== 'undefined'
    );
    await expect.poll(async () => {
      return page.evaluate(() => {
        const section = document.getElementById('music-studio-section');
        const menuItem = document.querySelector('.game-menu-item[data-game="music-studio"]');
        return section && !section.classList.contains('hidden') && menuItem?.classList.contains('active')
          ? 1
          : 0;
      });
    }, { timeout: 15000 }).toBe(1);
    await expect(page.locator('#music-studio-section')).toBeVisible();
  });

  test('loads and activates games when the hash changes after initial load', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.getGameForHash === 'function');
    await page.evaluate(() => {
      window.location.hash = '#music-studio-section';
    });
    await page.waitForFunction(
      () => typeof window.switchPortfolioGame === 'function' && typeof window.GameUtils !== 'undefined'
    );
    await expect.poll(async () => {
      return page.evaluate(() => {
        const section = document.getElementById('music-studio-section');
        const menuItem = document.querySelector('.game-menu-item[data-game="music-studio"]');
        return section && !section.classList.contains('hidden') && menuItem?.classList.contains('active')
          ? 1
          : 0;
      });
    }, { timeout: 15000 }).toBe(1);
  });

  test('precaches achievement images for offline use', async ({ page }) => {
    await expect.poll(async () => {
      return page.evaluate(async (cacheName) => {
        if (!('caches' in window)) {
          return 0;
        }
        const cache = await caches.open(cacheName);
        const response = await cache.match('/quickdraw-default.png');
        return response?.ok ? 1 : 0;
      }, expectedCacheName);
    }, { timeout: 30000 }).toBe(1);
  });
});
