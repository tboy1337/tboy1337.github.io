/**
 * Pure service-worker helpers shared by sw.js and unit tests.
 */

export const CACHE_PREFIX = 'tboy1337-';

export const EXTERNAL_SKIP_PATTERNS = [
  'translate.google',
  'cdn.tailwindcss',
  'cdnjs.cloudflare'
];

/**
 * @param {string} method
 * @param {string} url
 * @returns {boolean}
 */
export function shouldSkipFetch(method, url) {
  if (method !== 'GET') {
    return true;
  }
  return EXTERNAL_SKIP_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * @param {URL} url
 * @param {string} [destination]
 * @returns {boolean}
 */
export function isHtmlRequest(url, destination = '') {
  return destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname === '/'
    || !url.pathname.includes('.');
}

/**
 * @param {URL} url
 * @returns {boolean}
 */
export function isScriptRequest(url) {
  return url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs');
}

/**
 * @param {string[]} cacheNames
 * @param {string} activeCacheName
 * @returns {string[]}
 */
export function getStaleCacheNames(cacheNames, activeCacheName) {
  return cacheNames.filter(
    (cacheName) => cacheName !== activeCacheName && cacheName.startsWith(CACHE_PREFIX)
  );
}
