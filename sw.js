/// <reference lib="webworker" />

// Service Worker for tboy1337.github.io
// Provides offline support and caching for better performance

import {
  shouldSkipFetch,
  isHtmlRequest,
  getStaleCacheNames
} from './lib/sw-utils.mjs';

const CACHE_NAME = 'tboy1337-v1.2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/games.css',
  '/games.js',
  '/translation.js',
  '/site.webmanifest',
  '/lib/game-utils.mjs',
  '/lib/bootstrap-site-utils.mjs',
  '/lib/sw-utils.mjs'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Caching static assets...');
        await Promise.allSettled(
          STATIC_ASSETS.map((asset) => cache.add(asset))
        );
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
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
      self.clients.claim()
    ])
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  if (shouldSkipFetch(event.request.method, event.request.url)) {
    return;
  }

  const url = new URL(event.request.url);
  const isHTML = isHtmlRequest(url, event.request.destination);

  event.respondWith(
    isHTML ? handleHTMLRequest(event.request) : handleAssetRequest(event.request)
  );
});

// Network-first strategy for HTML files to ensure fresh content
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
    return caches.match('/index.html');
  }
}

// Stale-while-revalidate strategy for assets
async function handleAssetRequest(request) {
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
    fetchPromise; // Update cache in background
    return cachedResponse;
  }

  return fetchPromise;
}
