/**
 * Restores scroll position for allowlisted in-page navigation hashes.
 * Independent of Google Translate so deep links work even when translate fails to load.
 */

import { getHashTarget } from './nav-hashes.mjs';
import { onDomReady } from './on-dom-ready.mjs';

export const PENDING_HASH_KEY = 'tboy1337-pending-hash';

const MAX_HASH_RESTORE_ATTEMPTS = 30;
const HASH_RESTORE_RETRY_MS = 100;
const LOAD_RESTORE_DELAY_MS = 150;

let hashScrollRestored = false;
let hashRestoreAttempts = 0;

/**
 * Hash deep links should jump immediately.
 *
 * @returns {ScrollBehavior}
 */
function getHashScrollBehavior() {
  return 'instant';
}

export function rememberHashForRestore() {
  if (!window.location.hash) {
    return;
  }

  window.sessionStorage.setItem(PENDING_HASH_KEY, window.location.hash);
  hashScrollRestored = false;
  hashRestoreAttempts = 0;
}

/**
 * Scroll to the current or pending hash target when present in the DOM.
 */
export function restoreHashScroll() {
  if (hashScrollRestored) {
    return;
  }

  const hash = window.sessionStorage.getItem(PENDING_HASH_KEY) || window.location.hash;
  if (!hash) {
    return;
  }

  const target = getHashTarget(hash);
  if (!target) {
    hashRestoreAttempts += 1;
    if (hashRestoreAttempts < MAX_HASH_RESTORE_ATTEMPTS) {
      setTimeout(restoreHashScroll, HASH_RESTORE_RETRY_MS);
    }
    return;
  }

  hashScrollRestored = true;
  window.sessionStorage.removeItem(PENDING_HASH_KEY);

  window.requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: getHashScrollBehavior(), block: 'start' });
  });
}

export function requestHashScroll() {
  hashScrollRestored = false;
  hashRestoreAttempts = 0;
  restoreHashScroll();
}

export function setupHashScrollListeners() {
  onDomReady(() => {
    rememberHashForRestore();
    window.addEventListener('hashchange', () => {
      rememberHashForRestore();
      restoreHashScroll();
    });
    window.addEventListener('load', () => {
      setTimeout(restoreHashScroll, LOAD_RESTORE_DELAY_MS);
    });
    setTimeout(restoreHashScroll, LOAD_RESTORE_DELAY_MS);
  });
}
