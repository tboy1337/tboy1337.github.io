/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {any} */ (self));
// Service Worker for tboy1337.github.io
// Provides offline support and caching for better performance

import {
  shouldSkipFetch,
  isHtmlRequest,
  getStaleCacheNames
} from './lib/sw-utils.mjs';

const CACHE_NAME = 'tboy1337-v1.2.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/games.css',
  '/games.js',
  '/translation.js',
  '/site.webmanifest',
  '/lib/game-utils.mjs',
  '/lib/bootstrap-site-utils.mjs',
  '/lib/sw-utils.mjs',
  '/lib/typing-stats.mjs',
  '/lib/memory-game-utils.mjs',
  '/lib/contact-validation.mjs',
  '/lib/snake-logic.mjs'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  const installEvent = /** @type {ExtendableEvent} */ (event);
  console.log('Service Worker installing...');
  sw.skipWaiting();

  installEvent.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Caching static assets...');
        await Promise.all(
          STATIC_ASSETS.map((asset) => cache.add(asset))
        );
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const activateEvent = /** @type {ExtendableEvent} */ (event);
  console.log('Service Worker activating...');
  activateEvent.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          getStaleCacheNames(cacheNames, CACHE_NAME).map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all clients immediately
      sw.clients.claim()
    ])
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event);
  if (shouldSkipFetch(fetchEvent.request.method, fetchEvent.request.url)) {
    return;
  }

  const url = new URL(fetchEvent.request.url);
  const isHTML = isHtmlRequest(url, fetchEvent.request.destination);

  fetchEvent.respondWith(
    isHTML ? handleHTMLRequest(fetchEvent.request) : handleAssetRequest(fetchEvent.request, fetchEvent)
  );
});

// Network-first strategy for HTML files to ensure fresh content
/** @param {Request} request */
async function handleHTMLRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      // Cache the fresh response
      const responseClone = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Ultimate fallback to index.html for navigation requests
    const indexFallback = await caches.match('/index.html');
    if (indexFallback) {
      return indexFallback;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy for assets
/** @param {Request} request @param {FetchEvent} event */
async function handleAssetRequest(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await caches.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    return null;
  });

  // Return cached version immediately if available, otherwise wait for network
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
