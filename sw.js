// Woobi Service Worker for Daily Streak Reminders and Notification Handling
const CACHE_NAME = 'woobi-streak-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification interaction (focus existing tab or open application without opening duplicate tabs)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find if an existing tab/window of this application is already open
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url, self.location.origin);
          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        } catch (e) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      // If no window is currently open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});

// Handle incoming Web Push notifications (if configured with backend)
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Woobi Daily Outfit Reminder 🔥';
  const options = {
    body: payload.body || 'Snap your outfit today to maintain your streak!',
    icon: payload.icon || 'assets/welcome_hero.jpg',
    badge: payload.badge || 'assets/welcome_hero.jpg',
    tag: payload.tag || 'woobi-streak-reminder',
    renotify: false,
    data: { url: './' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
