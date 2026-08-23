// @vitest-environment jsdom
/* global Option */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTranslateLanguageLabels,
  attachTranslateLanguageLabels,
  getLanguageEndonym,
  INCLUDED_LANGUAGES,
  LANGUAGE_ENDONYMS,
  TRANSLATE_PLACEHOLDER_LABEL
} from '../../lib/translate-languages.mjs';
import {
  attachTranslateChromeHider,
  attachTranslateClickFallback,
  cleanupTranslateBranding,
  getTranslateSelect,
  hideTranslateChrome,
  isTranslateSelectReady,
  isTranslateSelectVisible,
  openTranslateSelect,
  READY_POLL_INTERVAL_MS,
  READY_POLL_MAX_MS,
  waitForTranslateSelectReady
} from '../../lib/translate-widget.mjs';

function createTranslateRoot() {
  const root = document.createElement('section');
  root.id = 'google_translate_element';
  document.body.appendChild(root);
  return root;
}

function mockVisibleSelect(select) {
  vi.spyOn(select, 'getClientRects').mockReturnValue([{
    x: 0,
    y: 0,
    width: 100,
    height: 24,
    top: 0,
    right: 100,
    bottom: 24,
    left: 0,
    toJSON: () => ({})
  }]);
}

describe('translate-widget readiness', () => {
  it('returns false when the select reference is null', () => {
    expect(isTranslateSelectVisible(null)).toBe(false);
  });

  it('returns false when the select is missing', () => {
    const root = createTranslateRoot();
    expect(isTranslateSelectReady(root)).toBe(false);
    root.remove();
  });

  it('returns false when the select has one or fewer options', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'));
    root.append(select);

    expect(isTranslateSelectReady(root)).toBe(false);
    root.remove();
  });

  it('returns true when the select has multiple options and is visible', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    mockVisibleSelect(select);
    root.append(select);

    expect(isTranslateSelectVisible(select)).toBe(true);
    expect(isTranslateSelectReady(root)).toBe(true);
    root.remove();
  });

  it('returns false when the select is disabled', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.disabled = true;
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    root.append(select);

    expect(isTranslateSelectReady(root)).toBe(false);
    root.remove();
  });

  it('returns false when the select or parent span is hidden', () => {
    const root = createTranslateRoot();
    const span = document.createElement('span');
    span.style.display = 'none';
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    span.append(select);
    root.append(span);

    expect(isTranslateSelectVisible(select)).toBe(false);
    expect(isTranslateSelectReady(root)).toBe(false);
    root.remove();
  });

  it('returns false when the select itself is hidden', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.style.display = 'none';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    root.append(select);

    expect(isTranslateSelectVisible(select)).toBe(false);
    root.remove();
  });
});

describe('translate-widget branding cleanup', () => {
  it('no-ops when the root is missing', () => {
    expect(() => cleanupTranslateBranding(null)).not.toThrow();
  });

  it('removes only the branding anchor when it shares a span with the select', () => {
    const root = createTranslateRoot();
    const span = document.createElement('span');
    const anchor = document.createElement('a');
    anchor.href = 'https://translate.google.com';
    anchor.textContent = 'Powered by Google';
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));

    span.append(anchor, select);
    root.append(span);

    cleanupTranslateBranding(root);

    expect(root.querySelector('a[href*="translate.google.com"]')).toBeNull();
    expect(getTranslateSelect(root)).toBe(select);
    root.remove();
  });

  it('removes the powered-by span when it does not contain the select', () => {
    const root = createTranslateRoot();
    const poweredBySpan = document.createElement('span');
    const anchor = document.createElement('a');
    anchor.href = 'https://translate.google.com';
    poweredBySpan.append(anchor);

    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));

    root.append(poweredBySpan, select);
    cleanupTranslateBranding(root);

    expect(root.querySelector('span')).toBeNull();
    expect(getTranslateSelect(root)).toBe(select);
    root.remove();
  });

  it('removes whitespace text nodes from gadget wrappers', () => {
    const root = createTranslateRoot();
    const gadget = document.createElement('div');
    gadget.className = 'goog-te-gadget';
    gadget.append(document.createTextNode(' Select Language '));
    root.append(gadget);

    cleanupTranslateBranding(root);

    expect(gadget.textContent).toBe('');
    root.remove();
  });
});

describe('translate-widget banner chrome', () => {
  afterEach(() => {
    document.querySelectorAll('.goog-te-banner-frame, .skiptranslate').forEach((node) => {
      if (node.id !== 'google_translate_element') {
        node.remove();
      }
    });
    document.body.style.removeProperty('top');
  });

  it('hides the banner iframe and resets body offset', () => {
    const banner = document.createElement('iframe');
    banner.className = 'goog-te-banner-frame skiptranslate';
    document.body.append(banner);
    document.body.style.top = '40px';

    expect(hideTranslateChrome()).toBeGreaterThan(0);
    expect(document.querySelector('.goog-te-banner-frame')).toBe(banner);
    expect(banner.style.getPropertyValue('display')).toBe('none');
    expect(banner.getAttribute('aria-hidden')).toBe('true');
    expect(document.body.style.getPropertyValue('top')).toBe('0px');
  });

  it('hides a skiptranslate banner that is a direct child of body', () => {
    const banner = document.createElement('div');
    banner.className = 'skiptranslate';
    const iframe = document.createElement('iframe');
    iframe.className = 'skiptranslate';
    banner.append(iframe);
    document.body.append(banner);

    hideTranslateChrome();

    const bodyBanner = document.body.querySelector(':scope > .skiptranslate');
    expect(bodyBanner).toBe(banner);
    expect(banner.style.getPropertyValue('display')).toBe('none');
  });

  it('does not remove the language gadget inside the widget root', () => {
    const root = createTranslateRoot();
    const gadget = document.createElement('div');
    gadget.className = 'skiptranslate goog-te-gadget';
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    gadget.append(select);
    root.append(gadget);

    hideTranslateChrome();

    expect(root.querySelector('.goog-te-gadget')).toBe(gadget);
    expect(getTranslateSelect(root)).toBe(select);
    root.remove();
  });

  it('hides banner chrome that Google injects after attach', async () => {
    expect(attachTranslateChromeHider()).toBe(true);
    expect(attachTranslateChromeHider()).toBe(true);

    const banner = document.createElement('iframe');
    banner.className = 'goog-te-banner-frame';
    document.body.append(banner);

    await vi.waitFor(() => {
      expect(banner.style.getPropertyValue('display')).toBe('none');
    });
  });
});

describe('translate-widget openTranslateSelect', () => {
  it('returns false when the select is missing', () => {
    const root = createTranslateRoot();
    expect(openTranslateSelect(root)).toBe(false);
    root.remove();
  });

  it('returns false when the root is missing', () => {
    expect(openTranslateSelect(null)).toBe(false);
  });

  it('focuses the select and uses showPicker when available', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    root.append(select);

    const showPicker = vi.fn();
    select.showPicker = showPicker;
    const click = vi.spyOn(select, 'click');

    expect(openTranslateSelect(root)).toBe(true);
    expect(document.activeElement).toBe(select);
    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(click).not.toHaveBeenCalled();
    root.remove();
  });

  it('falls back to click when showPicker throws', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    root.append(select);

    select.showPicker = vi.fn(() => {
      throw new Error('NotAllowedError');
    });
    const click = vi.spyOn(select, 'click');

    expect(openTranslateSelect(root)).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    root.remove();
  });

  it('falls back to click when showPicker is unavailable', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    root.append(select);

    const click = vi.spyOn(select, 'click');

    expect(openTranslateSelect(root)).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    root.remove();
  });
});

describe('translate-widget click fallback', () => {
  it('opens the select when the gadget wrapper is clicked', () => {
    const root = createTranslateRoot();
    const gadget = document.createElement('div');
    gadget.className = 'goog-te-gadget';
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    gadget.append(select);
    root.append(gadget);

    const showPicker = vi.fn();
    select.showPicker = showPicker;
    attachTranslateClickFallback(root);
    gadget.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(showPicker).toHaveBeenCalledTimes(1);
    root.remove();
  });

  it('does not intercept direct select clicks', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    root.append(select);

    select.showPicker = vi.fn();
    attachTranslateClickFallback(root);
    attachTranslateClickFallback(root);
    select.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(select.showPicker).not.toHaveBeenCalled();
    root.remove();
  });

  it('ignores clicks outside the gadget wrapper', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    select.showPicker = vi.fn();
    root.append(select);

    attachTranslateClickFallback(root);
    root.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(select.showPicker).not.toHaveBeenCalled();
    root.remove();
  });
});

describe('translate-widget readiness polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onReady when the select becomes ready', () => {
    const root = createTranslateRoot();
    const onReady = vi.fn();
    const onTimeout = vi.fn();

    waitForTranslateSelectReady(onReady, onTimeout, root);

    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Spanish', 'es'));
    mockVisibleSelect(select);
    root.append(select);

    vi.advanceTimersByTime(READY_POLL_INTERVAL_MS);

    expect(onReady).toHaveBeenCalledWith(root);
    expect(onTimeout).not.toHaveBeenCalled();
    root.remove();
  });

  it('calls onTimeout when readiness never arrives', () => {
    const root = createTranslateRoot();
    const onReady = vi.fn();
    const onTimeout = vi.fn();

    waitForTranslateSelectReady(onReady, onTimeout, root);
    vi.advanceTimersByTime(READY_POLL_MAX_MS + READY_POLL_INTERVAL_MS);

    expect(onReady).not.toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalledWith(root);
    root.remove();
  });

  it('calls onTimeout when the root is missing', () => {
    const onReady = vi.fn();
    const onTimeout = vi.fn();

    waitForTranslateSelectReady(onReady, onTimeout, null);

    expect(onReady).not.toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalledWith(document);
  });
});

describe('translate language labels', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives includedLanguages from the endonym map in insertion order', () => {
    expect(INCLUDED_LANGUAGES).toBe(Object.keys(LANGUAGE_ENDONYMS).join(','));
    expect(INCLUDED_LANGUAGES).toContain('en');
    expect(INCLUDED_LANGUAGES).toContain('vi');
    expect(INCLUDED_LANGUAGES).toContain('zh-CN');
    expect(INCLUDED_LANGUAGES).toContain('zh-TW');
  });

  it('returns native names for known codes, including underscore and case variants', () => {
    expect(getLanguageEndonym('en')).toBe('English');
    expect(getLanguageEndonym('es')).toBe('Español');
    expect(getLanguageEndonym('vi')).toBe('Tiếng Việt');
    expect(getLanguageEndonym('zh-CN')).toBe('中文（简体）');
    expect(getLanguageEndonym('zh_TW')).toBe('中文（繁體）');
    expect(getLanguageEndonym('ZH-cn')).toBe('中文（简体）');
  });

  it('returns undefined for empty or unknown codes', () => {
    expect(getLanguageEndonym('')).toBeUndefined();
    expect(getLanguageEndonym('xx')).toBeUndefined();
  });

  it('returns 0 and warns when the select is missing', () => {
    expect(applyTranslateLanguageLabels(null)).toBe(0);
    expect(applyTranslateLanguageLabels(/** @type {HTMLSelectElement} */ ({}))).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });

  it('maps every included language code to a non-empty native name', () => {
    const select = document.createElement('select');
    for (const code of Object.keys(LANGUAGE_ENDONYMS)) {
      select.append(new Option(code, code));
    }

    applyTranslateLanguageLabels(select);

    for (const option of select.options) {
      expect(option.textContent).toBe(LANGUAGE_ENDONYMS[option.value]);
      expect(option.textContent?.length).toBeGreaterThan(0);
    }
  });

  it('rewrites option labels to endonyms and marks the select as untranslated', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(
      new Option('Chọn ngôn ngữ', ''),
      new Option('Tiếng Anh', 'en'),
      new Option('Tây Ban Nha', 'es'),
      new Option('Tiếng Việt', 'vi')
    );
    root.append(select);

    const updated = applyTranslateLanguageLabels(select);

    expect(updated).toBe(3);
    expect(select.options[0]?.textContent).toBe(TRANSLATE_PLACEHOLDER_LABEL);
    expect(select.options[1]?.textContent).toBe('English');
    expect(select.options[2]?.textContent).toBe('Español');
    expect(select.options[3]?.textContent).toBe('Tiếng Việt');
    expect(select.classList.contains('notranslate')).toBe(true);
    expect(select.getAttribute('translate')).toBe('no');
    expect(select.options[1]?.classList.contains('notranslate')).toBe(true);
    expect(select.options[1]?.getAttribute('translate')).toBe('no');
    expect(applyTranslateLanguageLabels(select)).toBe(0);
    root.remove();
  });

  it('leaves unknown language codes unchanged and warns', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('English', 'en'), new Option('Klingon', 'xx'));
    root.append(select);

    applyTranslateLanguageLabels(select);

    expect(select.querySelector('option[value="xx"]')?.textContent).toBe('Klingon');
    expect(console.warn).toHaveBeenCalled();
    root.remove();
  });

  it('returns false when the translate root is missing', () => {
    expect(attachTranslateLanguageLabels(null)).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });

  it('returns false when the language select is missing', () => {
    const root = createTranslateRoot();
    expect(attachTranslateLanguageLabels(root)).toBe(false);
    expect(console.warn).toHaveBeenCalled();
    root.remove();
  });

  it('labels the select when the root is a document fragment', () => {
    const fragment = document.createDocumentFragment();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('Tiếng Anh', 'en'), new Option('Tây Ban Nha', 'es'));
    fragment.append(select);

    expect(attachTranslateLanguageLabels(fragment)).toBe(true);
    expect(select.querySelector('option[value="en"]')?.textContent).toBe('English');
  });

  it('uses the page translate root when no root is passed', () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('Tiếng Anh', 'en'), new Option('Tây Ban Nha', 'es'));
    root.append(select);

    expect(attachTranslateLanguageLabels()).toBe(true);
    expect(select.querySelector('option[value="en"]')?.textContent).toBe('English');
    expect(root.classList.contains('notranslate')).toBe(true);
    expect(root.getAttribute('translate')).toBe('no');
    root.remove();
  });

  it('re-applies native labels when Google mutates option text', async () => {
    const root = createTranslateRoot();
    const select = document.createElement('select');
    select.className = 'goog-te-combo';
    select.append(new Option('Tiếng Anh', 'en'), new Option('Tây Ban Nha', 'es'));
    root.append(select);

    expect(attachTranslateLanguageLabels(root)).toBe(true);
    expect(attachTranslateLanguageLabels(root)).toBe(true);
    expect(select.querySelector('option[value="en"]')?.textContent).toBe('English');

    const englishOption = select.querySelector('option[value="en"]');
    if (!englishOption) {
      throw new Error('Expected an English option');
    }
    englishOption.textContent = 'Tiếng Anh';

    await vi.waitFor(() => {
      expect(englishOption.textContent).toBe('English');
    });

    root.remove();
  });
});
