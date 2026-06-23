/**
 * Allowlisted in-page navigation hashes shared across scripts.
 */

export const ALLOWED_NAV_HASHES = new Set([
  '#main-content',
  '#fun-games',
  '#contact-form',
  '#memory-section',
  '#snake-section',
  '#typing-section',
  '#music-studio-section'
]);

export const GAME_HASH_PREFIXES = [
  '#fun-games',
  '#memory-section',
  '#snake-section',
  '#typing-section',
  '#music-studio-section'
];

/** @type {Readonly<Record<string, 'memory' | 'snake' | 'typing' | 'music-studio'>>} */
export const HASH_GAME_MAP = {
  '#memory-section': 'memory',
  '#snake-section': 'snake',
  '#typing-section': 'typing',
  '#music-studio-section': 'music-studio'
};

/** @type {ReadonlySet<string>} */
const GAME_NAVIGATION_HASHES = new Set(GAME_HASH_PREFIXES);

/**
 * @param {string} hash
 * @returns {boolean}
 */
export function isGameNavigationHash(hash) {
  return GAME_NAVIGATION_HASHES.has(hash);
}

/**
 * @param {string} hash
 * @returns {'memory' | 'snake' | 'typing' | 'music-studio' | null}
 */
export function getGameForHash(hash) {
  return HASH_GAME_MAP[hash] ?? null;
}

/**
 * @param {string} hash
 * @returns {boolean}
 */
export function isAllowedNavHash(hash) {
  return ALLOWED_NAV_HASHES.has(hash);
}

/**
 * @param {string} hash
 * @param {ParentNode} [root]
 * @returns {Element | null}
 */
export function getHashTarget(hash, root = document) {
  if (!hash || !isAllowedNavHash(hash)) {
    return null;
  }

  try {
    const target = root.querySelector(hash);
    return target instanceof Element ? target : null;
  } catch {
    return null;
  }
}
