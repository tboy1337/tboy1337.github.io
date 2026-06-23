// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_NAV_HASHES,
  GAME_HASH_PREFIXES,
  getGameForHash,
  getHashTarget,
  isAllowedNavHash,
  isGameNavigationHash
} from '../../lib/nav-hashes.mjs';

describe('nav-hashes', () => {
  it('allows known in-page navigation hashes', () => {
    expect(isAllowedNavHash('#contact-form')).toBe(true);
    expect(isAllowedNavHash('#memory-section')).toBe(true);
    expect(isAllowedNavHash('#evil')).toBe(false);
  });

  it('exposes game hash prefixes as a subset of allowed hashes', () => {
    for (const hash of GAME_HASH_PREFIXES) {
      expect(ALLOWED_NAV_HASHES.has(hash)).toBe(true);
    }
  });

  it('returns null for disallowed hashes', () => {
    expect(getHashTarget('#not-real')).toBeNull();
    expect(getHashTarget('')).toBeNull();
  });

  it('maps game section hashes to game menu ids', () => {
    expect(getGameForHash('#music-studio-section')).toBe('music-studio');
    expect(getGameForHash('#snake-section')).toBe('snake');
    expect(getGameForHash('#fun-games')).toBeNull();
    expect(getGameForHash('#contact-form')).toBeNull();
  });

  it('detects hashes that should eagerly load the games bundle', () => {
    expect(isGameNavigationHash('#fun-games')).toBe(true);
    expect(isGameNavigationHash('#music-studio-section')).toBe(true);
    expect(isGameNavigationHash('#contact-form')).toBe(false);
    expect(isGameNavigationHash('')).toBe(false);
  });

  it('returns matching elements for allowed hashes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<section id="contact-form"></section>';
    expect(getHashTarget('#contact-form', root)).not.toBeNull();
  });

  it('returns null when querySelector throws for an allowed hash', () => {
    const root = {
      querySelector() {
        throw new SyntaxError('bad selector');
      }
    };
    expect(getHashTarget('#contact-form', /** @type {ParentNode} */ (root))).toBeNull();
  });
});
