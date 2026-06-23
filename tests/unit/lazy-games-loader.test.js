// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  resetGamesLoadStateForTests,
  shouldLoadGamesImmediately,
  showGamesLoadError
} from '../../lib/lazy-games-loader.mjs';

describe('lazy-games-loader', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="fun-games">Games</section>';
    const funGames = document.getElementById('fun-games');
    if (funGames) {
      funGames.scrollIntoView = vi.fn();
    }
    resetGamesLoadStateForTests();
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    resetGamesLoadStateForTests();
    vi.unstubAllGlobals();
  });

  it('detects hashes that should eagerly load the games bundle', () => {
    expect(shouldLoadGamesImmediately('#memory-section')).toBe(true);
    expect(shouldLoadGamesImmediately('#fun-games')).toBe(true);
    expect(shouldLoadGamesImmediately('#contact-form')).toBe(false);
    expect(shouldLoadGamesImmediately('')).toBe(false);
  });

  it('deduplicates concurrent loadGamesBundle calls', () => {
    expect(typeof window.loadGamesBundle).toBe('function');

    const first = window.loadGamesBundle?.();
    const second = window.loadGamesBundle?.();

    expect(first).toBe(second);
    expect(first).toBeInstanceOf(Promise);
  });

  it('shows an error banner when showGamesLoadError runs', () => {
    showGamesLoadError();

    const banner = document.querySelector('[data-games-load-error="true"]');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain('Games failed to load');
  });

  it('does not insert duplicate error banners', () => {
    showGamesLoadError();
    showGamesLoadError();

    const gamesSection = document.getElementById('fun-games');
    expect(gamesSection?.querySelectorAll('[data-games-load-error="true"]')).toHaveLength(1);
  });
});
