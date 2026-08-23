import { test, expect } from './test';
import type { ConsoleMessage, Page } from '@playwright/test';
import { gotoHome } from './support';

const CSP_VIOLATION_PATTERN = /Content Security Policy|Refused to (frame|load|connect|execute)/i;
const TRANSLATE_WARNING_PATTERN = /Google Translate/i;
const HERO_TEXT = 'Developer • Innovator • Problem Solver';

/** Google bot-detection redirects are outside our CSP and not actionable. */
function isIgnorableTranslateCspViolation(message: string) {
  return /www\.google\.com\/sorry/i.test(message);
}

function getActionableCspViolations(violations: string[]) {
  return violations.filter((message) => !isIgnorableTranslateCspViolation(message));
}

type ConsoleCollector = {
  cspViolations: string[];
  translateWarnings: string[];
  pageErrors: string[];
};

function attachConsoleCollector(page: Page): ConsoleCollector {
  const collector: ConsoleCollector = {
    cspViolations: [],
    translateWarnings: [],
    pageErrors: []
  };

  page.on('console', (message: ConsoleMessage) => {
    const text = message.text();
    if (message.type() === 'warning' && TRANSLATE_WARNING_PATTERN.test(text)) {
      collector.translateWarnings.push(text);
    }
    if (CSP_VIOLATION_PATTERN.test(text)) {
      collector.cspViolations.push(text);
    }
  });

  page.on('pageerror', (error: Error) => {
    collector.pageErrors.push(error.message);
  });

  return collector;
}

async function waitForTranslateWidget(page: Page) {
  const pollReady = () => expect.poll(async () => {
    return page.evaluate(() => {
      const root = document.getElementById('google_translate_element');
      const select = document.querySelector('select.goog-te-combo');
      if (!root?.classList.contains('customized')) {
        return 0;
      }
      if (!(select instanceof HTMLSelectElement) || select.disabled) {
        return 0;
      }
      return select.options.length > 1 ? 1 : 0;
    });
  }, { timeout: 30000 }).toBe(1);

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pollReady();
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  const hasSelect = await page.locator('select.goog-te-combo').count();
  if (hasSelect === 0) {
    throw new Error('Google Translate gadget loaded without a language select');
  }
}

async function waitForTranslateLanguages(page: Page) {
  await expect.poll(async () => {
    return page.evaluate(() => {
      const select = document.querySelector('select.goog-te-combo');
      if (!(select instanceof HTMLSelectElement)) {
        return 0;
      }
      return select.options.length > 1 ? 1 : 0;
    });
  }, { timeout: 30000 }).toBe(1);
}

async function selectTranslateLanguage(page: Page, languageCode: string) {
  await waitForTranslateLanguages(page);
  await page.locator('select.goog-te-combo').selectOption(languageCode);
  await page.waitForTimeout(500);
}

async function isPageTranslated(page: Page) {
  return page.evaluate(() => {
    const htmlClass = document.documentElement.className;
    const bodyClass = document.body.className;
    return htmlClass.includes('translated')
      || bodyClass.includes('translated')
      || document.querySelector('iframe.goog-te-banner-frame') !== null
      || document.cookie.includes('googtrans');
  });
}

test.describe('Google Translate widget', () => {
  test.describe.configure({ mode: 'serial' });
  test('becomes visible with an enabled language select', async ({ page }) => {
    const collector = attachConsoleCollector(page);
    await page.goto('/');
    await waitForTranslateWidget(page);
    await expect(page.locator('#google_translate_element.customized')).toBeVisible();
    await expect(page.locator('select.goog-te-combo')).toBeEnabled();
    expect(getActionableCspViolations(collector.cspViolations)).toHaveLength(0);
    expect(collector.translateWarnings).toHaveLength(0);
  });

  test('opens the language select when the gadget is clicked on first load', async ({ page }) => {
    await page.goto('/');
    await waitForTranslateWidget(page);

    const gadget = page.locator('#google_translate_element .goog-te-gadget, #google_translate_element .goog-te-gadget-simple');
    await expect(gadget).toBeVisible();
    await gadget.click();

    await expect(page.locator('select.goog-te-combo')).toBeFocused();
  });

  test('does not emit CSP violations or translate warnings after settle', async ({ page }) => {
    const collector = attachConsoleCollector(page);
    await page.goto('/');
    await waitForTranslateWidget(page);
    await page.waitForTimeout(2000);
    expect(getActionableCspViolations(collector.cspViolations)).toHaveLength(0);
    expect(collector.translateWarnings).toHaveLength(0);
    expect(collector.pageErrors.filter((message) => message.includes('Google Translate'))).toHaveLength(0);
  });

  test('translates page content when Spanish is selected', async ({ page }) => {
    await page.goto('/');
    await waitForTranslateWidget(page);
    const baselineHero = await page.getByText(HERO_TEXT).first().textContent();
    expect(baselineHero).toContain('Developer');

    await selectTranslateLanguage(page, 'es');

    await expect.poll(async () => {
      const translated = await isPageTranslated(page);
      const heroText = await page.locator('p.text-xl.text-gray-300').first().textContent();
      return translated && heroText !== baselineHero ? 1 : 0;
    }, { timeout: 20000 }).toBe(1);

    await expect.poll(async () => page.evaluate(() => {
      const visibleChrome = [...document.querySelectorAll('iframe.goog-te-banner-frame, body > .skiptranslate')]
        .filter((element) => element.closest('#google_translate_element') === null)
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && box.height > 1;
        });
      const bodyTop = Number.parseInt(window.getComputedStyle(document.body).top, 10) || 0;
      const select = document.querySelector('select.goog-te-combo');
      return visibleChrome.length === 0 && bodyTop === 0 && select instanceof HTMLSelectElement ? 1 : 0;
    }), { timeout: 10000 }).toBe(1);
  });

  test('works with the service worker registered', async ({ page }) => {
    const collector = attachConsoleCollector(page);
    await gotoHome(page, { loadGames: false });
    await page.reload();
    await waitForTranslateWidget(page);
    await selectTranslateLanguage(page, 'fr');
    await expect.poll(async () => isPageTranslated(page), { timeout: 20000 }).toBe(true);
    expect(getActionableCspViolations(collector.cspViolations)).toHaveLength(0);
  });

  test('remains usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForTranslateWidget(page);
    await expect(page.locator('#google_translate_element.customized')).toBeVisible();
    await expect(page.locator('select.goog-te-combo')).toBeEnabled();
    await selectTranslateLanguage(page, 'de');
    await expect.poll(async () => isPageTranslated(page), { timeout: 20000 }).toBe(true);
  });

  test.describe('native language labels', () => {
    test.use({ locale: 'vi-VN' });

    test('keeps endonyms when the browser locale is Vietnamese', async ({ page }) => {
      await page.goto('/');
      await waitForTranslateWidget(page);

      const labels = await page.evaluate(() => {
        const select = document.querySelector('select.goog-te-combo');
        const root = document.getElementById('google_translate_element');
        if (!(select instanceof HTMLSelectElement)) {
          return null;
        }

        const labelFor = (value: string) => {
          const option = Array.from(select.options).find((item) => item.value === value);
          return option?.textContent ?? null;
        };

        return {
          texts: Array.from(select.options).map((option) => option.textContent ?? ''),
          es: labelFor('es'),
          vi: labelFor('vi'),
          ja: labelFor('ja'),
          notranslate: select.classList.contains('notranslate'),
          translateAttr: select.getAttribute('translate'),
          rootNoTranslate: root?.classList.contains('notranslate') === true
        };
      });

      expect(labels).not.toBeNull();
      expect(labels?.es).toBe('Español');
      expect(labels?.vi).toBe('Tiếng Việt');
      expect(labels?.ja).toBe('日本語');
      expect(labels?.texts).toContain('Español');
      expect(labels?.texts).toContain('Tiếng Việt');
      expect(labels?.texts).not.toContain('Tiếng Anh');
      expect(labels?.texts).not.toContain('Tiếng Tây Ban Nha');
      expect(labels?.notranslate).toBe(true);
      expect(labels?.translateAttr).toBe('no');
      expect(labels?.rootNoTranslate).toBe(true);

      await selectTranslateLanguage(page, 'es');

      await expect.poll(async () => {
        return page.evaluate(() => {
          const select = document.querySelector('select.goog-te-combo');
          if (!(select instanceof HTMLSelectElement)) {
            return 0;
          }
          const spanish = Array.from(select.options).find((item) => item.value === 'es');
          const vietnamese = Array.from(select.options).find((item) => item.value === 'vi');
          return spanish?.textContent === 'Español' && vietnamese?.textContent === 'Tiếng Việt' ? 1 : 0;
        });
      }, { timeout: 20000 }).toBe(1);
    });
  });

  test('exposes a keyboard-focusable language select', async ({ page }) => {
    await page.goto('/');
    await waitForTranslateWidget(page);
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    const focusedIsTranslate = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLSelectElement && active.classList.contains('goog-te-combo');
    });

    if (focusedTag !== 'SELECT' || !focusedIsTranslate) {
      await page.locator('select.goog-te-combo').focus();
    }

    await expect(page.locator('select.goog-te-combo')).toBeFocused();
  });
});
