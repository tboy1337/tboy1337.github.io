import { test, expect, type Page } from './test';
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

  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'warning' && TRANSLATE_WARNING_PATTERN.test(text)) {
      collector.translateWarnings.push(text);
    }
    if (CSP_VIOLATION_PATTERN.test(text)) {
      collector.cspViolations.push(text);
    }
  });

  page.on('pageerror', (error) => {
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
      if (select instanceof HTMLSelectElement && !select.disabled) {
        return 1;
      }
      const gadget = root.querySelector('.goog-te-gadget, .goog-te-gadget-simple');
      return gadget && window.googleTranslateInitialized ? 1 : 0;
    });
  }, { timeout: 25000 }).toBe(1);

  try {
    await pollReady();
  } catch {
    await page.reload();
    await pollReady();
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
  }, { timeout: 25000 }).toBe(1);
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
