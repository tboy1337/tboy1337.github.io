import { onDomReady } from './on-dom-ready.mjs';
import { requestHashScroll, setupHashScrollListeners } from './hash-scroll.mjs';
import { getGameForHash, isGameNavigationHash } from './nav-hashes.mjs';

setupHashScrollListeners();
window.getGameForHash = getGameForHash;

/** @type {Promise<void> | null} */
let gamesLoadPromise = null;

const GAME_MENU_READY_MAX_ATTEMPTS = 30;
const GAME_MENU_READY_RETRY_MS = 50;

/**
 * @param {string} [hash]
 * @returns {boolean}
 */
function shouldLoadGamesImmediately(hash = window.location.hash) {
  return isGameNavigationHash(hash);
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

/**
 * @param {number} [attempt]
 */
function activateGameForHash(attempt = 0) {
  if (typeof window.getGameForHash !== 'function') {
    return;
  }

  if (typeof window.switchPortfolioGame !== 'function') {
    if (attempt < GAME_MENU_READY_MAX_ATTEMPTS) {
      setTimeout(() => activateGameForHash(attempt + 1), GAME_MENU_READY_RETRY_MS);
    }
    return;
  }

  const gameName = window.getGameForHash(window.location.hash);
  if (gameName) {
    window.switchPortfolioGame(gameName);
  }
}

function afterGamesBundleLoaded() {
  activateGameForHash();
  requestHashScroll();
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
  }).then(() => {
    afterGamesBundleLoaded();
  });

  return gamesLoadPromise;
}

window.loadGamesBundle = loadGamesBundle;

function loadGamesWhenHashMatches() {
  if (!shouldLoadGamesImmediately()) {
    return;
  }
  void loadGamesBundle().catch(handleGamesLoadFailure);
}

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

window.addEventListener('hashchange', loadGamesWhenHashMatches);

if (shouldLoadGamesImmediately()) {
  loadGamesWhenHashMatches();
} else {
  onDomReady(observeGamesSection);
}
