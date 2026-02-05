// Service Worker for Sacred Hearts PWA
// Version: 2.2.1

const CACHE_NAME = 'sacred-hearts-v2.2.1';
const RUNTIME_CACHE = 'sacred-hearts-runtime-v2.2.1';

// Don't precache index.html so we always get fresh HTML (correct asset hashes after deploy)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => caches.delete(cacheName))
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

// Handle push notifications — show notification when app is in background
self.addEventListener('push', (event) => {
  let title = 'Sacred Hearts';
  let body = 'New update';
  let url = '/';
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.url) url = data.url;
    } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'sacred-hearts-push',
      renotify: true,
      data: { url: url },
    })
  );
});

// Handle notification clicks — open app (and focus if already open)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const wc of windowClients) {
        if (wc.url.startsWith(self.location.origin) && 'focus' in wc) {
          wc.navigate(url);
          return wc.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
