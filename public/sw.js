// Service Worker for Sacred Hearts PWA
// Version: 2.0.0

const CACHE_NAME = 'sacred-hearts-v2.0.0';
const RUNTIME_CACHE = 'sacred-hearts-runtime-v2.0.0';

// Don't precache index.html so we always get fresh HTML (correct asset hashes after deploy)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip unsupported protocols (chrome-extension://, file://, etc.)
  const url = new URL(event.request.url);
  if (
    url.protocol === 'chrome-extension:' ||
    url.protocol === 'chrome:' ||
    url.protocol === 'moz-extension:' ||
    url.protocol === 'file:' ||
    url.protocol === 'about:'
  ) {
    return; // Skip browser extensions and unsupported protocols
  }

  // Skip Supabase API calls and external resources (they should always be fresh)
  if (
    url.origin.includes('supabase.co') ||
    url.origin.includes('dicebear.com') ||
    url.origin.includes('api.') ||
    (url.protocol === 'https:' && url.hostname !== self.location.hostname)
  ) {
    return; // Let these go to network
  }

  // Network-first for document (index.html) so deploy always serves correct asset hashes
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, responseToCache).catch(() => {})).catch(() => {});
            return response;
          });
      })
  );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  // Future: Handle push notifications here
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
