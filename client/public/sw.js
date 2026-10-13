/* AT-ICT service worker: shows Web Push notifications and opens the right page when one is tapped.
 * It does no caching, so it can never serve an outdated version of the site. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'AT-ICT', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'AT-ICT';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: data.tag ? `${data.tag}-${data.id || ''}` : undefined,
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Reuse an open tab of the site if there is one, otherwise open a new one.
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) return open.navigate(target).then((w) => (w || open).focus()).catch(() => open.focus());
      return self.clients.openWindow(target);
    })
  );
});
