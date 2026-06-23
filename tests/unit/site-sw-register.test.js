// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { PENDING_HASH_KEY } from '../../lib/hash-scroll.mjs';

describe('site-sw-register', () => {
  /** @type {Storage} */
  let sessionStorageMock;
  /** @type {() => void} */
  let updatefoundHandler;
  /** @type {() => void} */
  let statechangeHandler;
  /** @type {{ state: string, addEventListener: (event: string, handler: () => void) => void }} */
  let installingWorker;
  /** @type {ReturnType<typeof vi.fn>} */
  let reloadMock;

  beforeEach(() => {
    vi.resetModules();

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

    updatefoundHandler = () => {};
    statechangeHandler = () => {};

    installingWorker = {
      state: 'installing',
      addEventListener(event, handler) {
        if (event === 'statechange') {
          statechangeHandler = handler;
        }
      }
    };

    const mockRegistration = {
      installing: installingWorker,
      addEventListener(event, handler) {
        if (event === 'updatefound') {
          updatefoundHandler = handler;
        }
      },
      update: vi.fn()
    };

    reloadMock = vi.fn();
    window.history.replaceState({}, '', '/#fun-games');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        hash: '#fun-games',
        reload: reloadMock
      }
    });

    vi.stubGlobal('sessionStorage', sessionStorageMock);
    vi.stubGlobal('navigator', {
      serviceWorker: {
        controller: {},
        register: vi.fn().mockResolvedValue(mockRegistration)
      }
    });

    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  /**
   * @returns {Promise<void>}
   */
  async function loadAndTriggerUpdate() {
    await import('../../site-sw-register.js');
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    updatefoundHandler();
    installingWorker.state = 'installed';
    statechangeHandler();
  }

  it('shows update banner when a new service worker installs', async () => {
    await loadAndTriggerUpdate();

    const banner = document.getElementById('sw-update-banner');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute('role')).toBe('status');
    expect(banner?.getAttribute('aria-live')).toBe('polite');
    expect(document.getElementById('sw-update-refresh')).not.toBeNull();
    expect(document.getElementById('sw-update-dismiss')).not.toBeNull();
  });

  it('does not create duplicate update banners', async () => {
    await loadAndTriggerUpdate();
    await loadAndTriggerUpdate();

    expect(document.querySelectorAll('#sw-update-banner')).toHaveLength(1);
  });

  it('stores the current hash before refreshing from the update banner', async () => {
    await loadAndTriggerUpdate();

    const refreshButton = document.getElementById('sw-update-refresh');
    expect(refreshButton).not.toBeNull();
    refreshButton?.dispatchEvent(new Event('click'));

    expect(sessionStorageMock.getItem(PENDING_HASH_KEY)).toBe('#fun-games');
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('removes the update banner when Later is clicked', async () => {
    await loadAndTriggerUpdate();

    const dismissButton = document.getElementById('sw-update-dismiss');
    expect(dismissButton).not.toBeNull();
    dismissButton?.dispatchEvent(new Event('click'));

    expect(document.getElementById('sw-update-banner')).toBeNull();
  });
});
