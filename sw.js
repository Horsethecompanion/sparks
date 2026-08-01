/**
 * SERVICE WORKER for Sparks PWA
 * 
 * Handles:
 * - Push notification delivery (FCM)
 * - Service worker installation & lifecycle
 * - Asset caching for offline support
 */

const CACHE_NAME = 'sparks-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ══════════════════════════════════════════════════════════════
// INSTALL: Cache static assets
// ══════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Don't fail install if cache fails (network issues, etc)
        console.warn('Cache add failed (non-critical):', err);
      });
    })
  );
  self.skipWaiting();
});

// ══════════════════════════════════════════════════════════════
// ACTIVATE: Clean up old caches
// ══════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('✨ Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ══════════════════════════════════════════════════════════════
// FETCH: Serve from cache, fallback to network
// ══════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase/external API calls (always use network)
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) return response;

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses for static assets
          if (response && response.status === 200 && 
              (event.request.url.includes('/sparks/') || 
               event.request.url.endsWith('.html'))) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          console.log('Offline - returning cached or default response');
          return new Response('Offline. Please check your connection.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
    })
  );
});

// ══════════════════════════════════════════════════════════════
// PUSH: Handle incoming FCM notifications
// ══════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  console.log('📢 Push notification received:', event);

  let notificationData = {
    title: 'Sparks ⚡',
    body: 'Park update',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%234CAF50" width="192" height="192"/><text x="96" y="120" font-size="120" font-weight="bold" fill="white" text-anchor="middle">⚡</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%234CAF50" width="192" height="192" rx="45"/><text x="96" y="120" font-size="120" font-weight="bold" fill="white" text-anchor="middle">⚡</text></svg>',
    tag: 'sparks-notification',
    requireInteraction: true,
  };

  // Extract notification data from FCM payload
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.notification) {
        notificationData = {
          ...notificationData,
          title: data.notification.title || notificationData.title,
          body: data.notification.body || notificationData.body,
        };
      }
    } catch (err) {
      console.log('Could not parse push data:', err);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: [
        {
          action: 'open',
          title: 'Open Sparks',
        },
        {
          action: 'close',
          title: 'Dismiss',
        },
      ],
    })
  );
});

// ══════════════════════════════════════════════════════════════
// NOTIFICATION CLICK: Focus Sparks window or open it
// ══════════════════════════════════════════════════════════════

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus Sparks window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if Sparks is already open
      for (const client of clientList) {
        if (client.url.includes('/sparks/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/sparks/');
      }
    })
  );
});

// ══════════════════════════════════════════════════════════════
// MESSAGE: Handle post-messages from clients
// ══════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  console.log('💬 Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Sparks Service Worker loaded');
