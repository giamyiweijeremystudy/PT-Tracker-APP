// PT App — Service Worker
// Handles push notifications and basic offline caching

const CACHE_NAME = 'pt-app-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ── Push notification handler ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'PT App', body: event.data.text() };
  }

  const { title = 'PT App', body = '', url = '/', icon = '/favicon.ico', badge = '/favicon.ico', tag } = payload;

  const options = {
    body,
    icon,
    badge,
    tag: tag || 'pt-app-notification',
    renotify: true,
    requireInteraction: false,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — open/focus the app ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
