// Service Worker for Expert Chat System Gamification Notifications

const CACHE_NAME = 'expert-chat-system-v1';
const OFFLINE_URL = '/offline.html';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll([
        OFFLINE_URL,
        '/',
        '/index.html',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/icons/achievement.png',
        '/icons/challenge.png',
        '/icons/referral.png',
        '/icons/reward.png',
        '/icons/streak.png',
        '/icons/tier.png',
        '/notification-icon.png',
        '/notification-badge.png',
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - for offline support
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // If we got a valid response, open the cache and clone the response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // If fetch fails (e.g., offline), show offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'New Notification',
      body: event.data.text(),
      icon: '/notification-icon.png'
    };
  }

  const title = notificationData.title || 'Expert Chat System';
  const options = {
    body: notificationData.body || 'You have a new notification!',
    icon: notificationData.icon || '/notification-icon.png',
    badge: '/notification-badge.png',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [],
    vibrate: [100, 50, 100],
    tag: notificationData.tag || 'default',
    renotify: notificationData.renotify || false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received');

  event.notification.close();

  let url = '/';

  // If we have action data
  if (event.action) {
    // Do something based on action
    if (event.notification.data && event.notification.data.actionUrls) {
      url = event.notification.data.actionUrls[event.action] || '/';
    }
  } else {
    // Default action
    if (event.notification.data && event.notification.data.url) {
      url = event.notification.data.url;
    }
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // If no open window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification close Received');

  // Analytics or tracking of closed notifications could be added here
});
