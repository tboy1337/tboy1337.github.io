/**
 * Runtime assets precached by the service worker for offline use.
 * Keep in sync with STATIC_ASSETS in sw.js; enforced by tests/unit/sw-precache.test.js.
 */

/** @type {readonly string[]} */
export const RUNTIME_PRECACHE_ASSETS = [
  '/translation.js',
  '/lib/hash-scroll.mjs',
  '/lib/nav-hashes.mjs',
  '/lib/lazy-games-loader.mjs',
  '/lib/bootstrap-site-utils.mjs',
  '/lib/music-studio-audio.mjs',
  '/lib/on-dom-ready.mjs',
  '/lib/translate-widget.mjs',
  '/lib/game-utils.mjs',
  '/lib/typing-stats.mjs',
  '/lib/memory-game-utils.mjs',
  '/lib/contact-validation.mjs',
  '/lib/snake-logic.mjs',
  '/lib/sw-utils.mjs'
];
