// Service Worker for Sacred Hearts PWA
// Version: 1.6.4

const CACHE_NAME = 'sacred-hearts-v1.6.4';
const RUNTIME_CACHE = 'sacred-hearts-runtime-v1.6.4';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
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

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response (stream can only be consumed once)
            const responseToCache = response.clone();

            // Cache the response (with error handling for unsupported protocols)
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                // Only cache if the request URL is cacheable
                try {
                  cache.put(event.request, responseToCache).catch((err) => {
                    // Silently ignore cache errors (e.g., chrome-extension://, unsupported protocols)
                    // This is expected for browser extensions and some special URLs
                  });
                } catch (err) {
                  // Ignore cache errors silently
                }
              })
              .catch(() => {
                // Ignore cache open errors
              });

            return response;
          })
          .catch(() => {
            // If fetch fails and it's a navigation request, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
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
