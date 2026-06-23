/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {any} */ (self));

import {
  shouldSkipFetch,
  isHtmlRequest,
  isScriptRequest,
  getStaleCacheNames
} from './lib/sw-utils.mjs';

const CACHE_NAME = 'tboy1337-v1.3.4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/tailwind.css',
  '/games.css',
  '/games.js',
  '/translation.js',
  '/site-sw-register.js',
  '/contact-form.js',
  '/sw.js',
  '/site.webmanifest',
  '/lib/game-utils.mjs',
  '/lib/bootstrap-site-utils.mjs',
  '/lib/lazy-games-loader.mjs',
  '/lib/on-dom-ready.mjs',
  '/lib/nav-hashes.mjs',
  '/lib/sw-utils.mjs',
  '/lib/typing-stats.mjs',
  '/lib/memory-game-utils.mjs',
  '/lib/contact-validation.mjs',
  '/lib/snake-logic.mjs',
  '/lib/music-studio-audio.mjs'
];

const IMAGE_ASSETS = [
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/quickdraw-default.png',
  '/pull-shark-default.png',
  '/pair-extraordinaire-default.png',
  '/yolo-default.png',
  '/starstruck-default.png'
];

const PRECACHE_ASSETS = [...STATIC_ASSETS, ...IMAGE_ASSETS];

self.addEventListener('install', (event) => {
  const installEvent = /** @type {ExtendableEvent} */ (event);
  sw.skipWaiting();

  installEvent.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset);
            if (!response.ok) {
              console.warn(`Failed to precache ${asset}: ${response.status}`);
              return;
            }
            await cache.put(asset, response);
          } catch (error) {
            console.warn(`Failed to precache ${asset}:`, error);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  const activateEvent = /** @type {ExtendableEvent} */ (event);
  activateEvent.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          getStaleCacheNames(cacheNames, CACHE_NAME).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      }),
      sw.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event);
  if (shouldSkipFetch(fetchEvent.request.method, fetchEvent.request.url)) {
    return;
  }

  const url = new URL(fetchEvent.request.url);
  const isHTML = isHtmlRequest(url, fetchEvent.request.destination);

  if (isHTML) {
    fetchEvent.respondWith(handleHTMLRequest(fetchEvent.request));
    return;
  }

  if (isScriptRequest(url)) {
    fetchEvent.respondWith(handleScriptRequest(fetchEvent.request));
    return;
  }

  fetchEvent.respondWith(handleAssetRequest(fetchEvent.request, fetchEvent));
});

/** @param {Request} request */
async function handleHTMLRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const indexFallback = await caches.match('/index.html');
    if (indexFallback) {
      return indexFallback;
    }
    return new Response('Offline', { status: 503 });
  }
}

/** @param {Request} request */
async function handleScriptRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

/** @param {Request} request @param {FetchEvent} event */
async function handleAssetRequest(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    return null;
  });

  if (cachedResponse) {
    event.waitUntil(fetchPromise);
    return cachedResponse;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response('Not found', { status: 404 });
}
