// @vitest-environment jsdom
/* global Option */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachTranslateClickFallback,
  cleanupTranslateBranding,
  getTranslateSelect,
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
