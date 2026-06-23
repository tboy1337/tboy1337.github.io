import { onDomReady } from './on-dom-ready.mjs';
import { restoreHashScroll, requestHashScroll, setupHashScrollListeners } from './hash-scroll.mjs';
import { GAME_HASH_PREFIXES } from './nav-hashes.mjs';

setupHashScrollListeners();

/** @type {Promise<void> | null} */
let gamesLoadPromise = null;

function shouldLoadGamesImmediately() {
  const hash = window.location.hash;
  return GAME_HASH_PREFIXES.some((prefix) => hash.startsWith(prefix));
}

function showGamesLoadError() {
  const gamesSection = document.getElementById('fun-games');
  if (!gamesSection || gamesSection.querySelector('[data-games-load-error="true"]')) {
    return;
  }

  const banner = document.createElement('div');
  banner.dataset.gamesLoadError = 'true';
  banner.setAttribute('role', 'alert');
  banner.className = 'mb-4 rounded-lg border border-red-500/40 bg-red-950/60 px-4 py-3 text-red-200';
  banner.textContent = 'Games failed to load — refresh to retry.';
  gamesSection.prepend(banner);
}

/** @param {unknown} error */
function handleGamesLoadFailure(error) {
  console.error('Failed to load games bundle:', error);
  showGamesLoadError();
}

function loadGamesBundle() {
  if (gamesLoadPromise) {
    return gamesLoadPromise;
  }

  gamesLoadPromise = import('./bootstrap-site-utils.mjs').then(() => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-games-bundle="true"]');
      if (existingScript) {
        if (typeof window.GameUtils !== 'undefined') {
          resolve(undefined);
          return;
        }
        existingScript.addEventListener('load', () => resolve(undefined));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load games.js')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'games.js';
      script.defer = true;
      script.dataset.gamesBundle = 'true';
      script.addEventListener('load', () => resolve(undefined));
      script.addEventListener('error', () => reject(new Error('Failed to load games.js')));
      document.body.appendChild(script);
    });
  });

  return gamesLoadPromise;
}

window.loadGamesBundle = loadGamesBundle;

function observeGamesSection() {
  const gamesSection = document.getElementById('fun-games');
  if (!gamesSection) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    void loadGamesBundle().catch(handleGamesLoadFailure);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const isVisible = entries.some((entry) => entry.isIntersecting);
    if (isVisible) {
      observer.disconnect();
      void loadGamesBundle().catch(handleGamesLoadFailure);
    }
  }, { rootMargin: '200px' });

  observer.observe(gamesSection);
}

if (shouldLoadGamesImmediately()) {
  void loadGamesBundle()
    .then(() => {
      if (shouldLoadGamesImmediately()) {
        requestHashScroll();
      }
    })
    .catch(handleGamesLoadFailure);
} else {
  onDomReady(observeGamesSection);
}
