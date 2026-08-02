/**
 * SERVICE WORKER for Sparks PWA
 * 
 * Handles:
 * - Push notification delivery (FCM)
 * - Service worker installation & lifecycle
 * - Asset caching for offline support
 */

const CACHE_NAME = 'sparks-v2';
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

// Realtime Database REST endpoint - the 'parks' node has public read/write
// rules already, so a plain fetch() PATCH works here without any auth,
// letting Accept/Reject act directly from the notification even if the
// app itself is fully closed.
const FIREBASE_DB_URL = 'https://sparks-carpark-default-rtdb.firebaseio.com';

self.addEventListener('push', (event) => {
  console.log('📢 Push notification received:', event);

  let notificationData = {
    title: 'Sparks',
    body: 'Park update',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'sparks-notification',
    requireInteraction: true,
    data: {},
  };

  // Extract notification + data payload from FCM
  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        notificationData.title = payload.notification.title || notificationData.title;
        notificationData.body = payload.notification.body || notificationData.body;
      }
      if (payload.data) {
        // parkNum / requestedBy / guestName - set by the Cloud Function so
        // Accept/Reject below know exactly what to update in Firebase.
        notificationData.data = payload.data;
        if (payload.data.parkNum) {
          notificationData.tag = 'park-' + payload.data.parkNum;
        }
      }
    } catch (err) {
      console.log('Could not parse push data:', err);
    }
  }

  const hasParkNum = !!notificationData.data.parkNum;

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      // Only offer Accept/Reject when we actually have a park to act on;
      // fall back to a plain notification otherwise.
      actions: hasParkNum ? [
        { action: 'accept', title: '✅ Accept' },
        { action: 'reject', title: '❌ Reject' },
      ] : [],
    })
  );
});

// ══════════════════════════════════════════════════════════════
// NOTIFICATION CLICK: Accept / Reject inline, or open/focus the app
// ══════════════════════════════════════════════════════════════

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);

  const data = event.notification.data || {};
  const action = event.action;
  event.notification.close();

  if (action === 'accept' || action === 'reject') {
    event.waitUntil(handleQuickAction(action, data));
    return;
  }

  // Default (tapped the notification body, not a button): open or focus Sparks.
  // Uses the SW's own registration scope rather than a hardcoded path, so
  // this keeps working regardless of which subpath Sparks is hosted under.
  const targetUrl = self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Accept or reject a park request directly against Firebase, without
// needing the app open. Mirrors the same field updates the app itself
// makes in respondToRequest().
async function handleQuickAction(action, data) {
  const parkNum = data.parkNum;
  if (!parkNum) return;

  const body = action === 'accept'
    ? {
        status: 'occupied',
        claimedBy: data.requestedBy || null,
        claimedByGuest: data.guestName || null,
        requestedBy: null,
        guestName: null,
      }
    : {
        status: 'available',
        claimedBy: null,
        requestedBy: (data.requestedBy || '') + '_rejected',
        guestName: null,
      };

  try {
    const res = await fetch(FIREBASE_DB_URL + '/parks/' + parkNum + '.json', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Firebase PATCH failed: ' + res.status);

    // Confirm the action - the original notification is already closed,
    // so a fresh one is the only way to give visible feedback here.
    await self.registration.showNotification(
      action === 'accept' ? '✅ Approved' : '❌ Declined',
      {
        body: action === 'accept'
          ? 'Park #' + parkNum + ' approved.'
          : 'Request for Park #' + parkNum + ' declined.',
        icon: 'icon-192.png',
        tag: 'park-' + parkNum + '-result',
      }
    );
  } catch (err) {
    console.error('Quick action failed:', err);
    await self.registration.showNotification('⚠️ Action failed', {
      body: 'Could not update Park #' + parkNum + '. Please open Sparks to respond.',
      icon: 'icon-192.png',
      tag: 'park-' + parkNum + '-error',
    });
  }
}

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
