// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  PENDING_HASH_KEY,
  rememberHashForRestore,
  restoreHashScroll,
  requestHashScroll
} from '../../lib/hash-scroll.mjs';

describe('hash-scroll', () => {
  /** @type {Storage} */
  let sessionStorageMock;

  beforeEach(() => {
    sessionStorageMock = {
      store: /** @type {Record<string, string>} */ ({}),
      getItem(key) {
        return this.store[key] ?? null;
      },
      setItem(key, value) {
        this.store[key] = value;
      },
      removeItem(key) {
        delete this.store[key];
      }
    };

    vi.stubGlobal('sessionStorage', sessionStorageMock);
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback(0);
      return 0;
    });

    document.body.innerHTML = '<main><section id="fun-games">Games</section></main>';
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('stores the current hash for later restoration', () => {
    window.history.replaceState({}, '', '/#fun-games');
    rememberHashForRestore();
    expect(sessionStorageMock.getItem(PENDING_HASH_KEY)).toBe('#fun-games');
  });

  it('scrolls to an allowlisted hash target', () => {
    const target = document.getElementById('fun-games');
    expect(target).not.toBeNull();
    const scrollIntoView = vi.fn();
    if (target) {
      target.scrollIntoView = scrollIntoView;
    }

    window.history.replaceState({}, '', '/#fun-games');
    rememberHashForRestore();
    restoreHashScroll();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
    expect(sessionStorageMock.getItem(PENDING_HASH_KEY)).toBeNull();
  });

  it('re-applies scroll after deferred content loads', () => {
    const target = document.getElementById('fun-games');
    const scrollIntoView = vi.fn();
    if (target) {
      target.scrollIntoView = scrollIntoView;
    }

    window.history.replaceState({}, '', '/#fun-games');
    rememberHashForRestore();
    restoreHashScroll();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    requestHashScroll();
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('waits for game sections to become visible before scrolling', () => {
    document.body.innerHTML = '<main><section id="music-studio-section" hidden>Studio</section></main>';
    const target = document.getElementById('music-studio-section');
    const scrollIntoView = vi.fn();
    if (target) {
      target.scrollIntoView = scrollIntoView;
    }

    window.history.replaceState({}, '', '/#music-studio-section');
    rememberHashForRestore();
    restoreHashScroll();
    expect(scrollIntoView).not.toHaveBeenCalled();

    target?.removeAttribute('hidden');
    restoreHashScroll();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
  });
});
