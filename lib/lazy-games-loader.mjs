import { onDomReady } from './on-dom-ready.mjs';

const GAME_HASH_PREFIXES = [
  '#fun-games',
  '#memory-section',
  '#snake-section',
  '#typing-section',
  '#music-studio-section'
];

/** @type {Promise<void> | null} */
let gamesLoadPromise = null;

function shouldLoadGamesImmediately() {
  const hash = window.location.hash;
  return GAME_HASH_PREFIXES.some((prefix) => hash.startsWith(prefix));
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
    void loadGamesBundle();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const isVisible = entries.some((entry) => entry.isIntersecting);
    if (isVisible) {
      observer.disconnect();
      void loadGamesBundle();
    }
  }, { rootMargin: '200px' });

  observer.observe(gamesSection);
}

if (shouldLoadGamesImmediately()) {
  void loadGamesBundle();
} else {
  onDomReady(observeGamesSection);
}
