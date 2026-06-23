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
