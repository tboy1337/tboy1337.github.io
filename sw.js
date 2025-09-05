// Service Worker for tboy1337.github.io
// Provides offline support and caching for better performance

const CACHE_NAME = 'tboy1337-v1.0.4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/games.css',
  '/games.js',
  '/translation.js',
  '/site.webmanifest'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  // Skip waiting and immediately activate new service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
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
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
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
  // Skip non-GET requests and external APIs
  if (event.request.method !== 'GET' || 
      event.request.url.includes('translate.google') ||
      event.request.url.includes('cdn.tailwindcss') ||
      event.request.url.includes('cdnjs.cloudflare')) {
    return;
  }

  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' || 
                 url.pathname.endsWith('.html') || 
                 url.pathname === '/' || 
                 !url.pathname.includes('.');

  event.respondWith(
    isHTML ? handleHTMLRequest(event.request) : handleAssetRequest(event.request)
  );
});

// Network-first strategy for HTML files to ensure fresh content
async function handleHTMLRequest(request) {
  try {
    console.log('Fetching fresh HTML:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      // Cache the fresh response
      const responseClone = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseClone);
      console.log('Cached fresh HTML:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for HTML, trying cache:', request.url);
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
      console.log('Updated cached asset:', request.url);
    }
    return response;
  }).catch(error => {
    console.log('Failed to update asset:', request.url, error);
    return null;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  if (cachedResponse) {
    console.log('Serving cached asset:', request.url);
    fetchPromise; // Update cache in background
    return cachedResponse;
  } else {
    console.log('No cached asset, waiting for network:', request.url);
    return fetchPromise;
  }
}
