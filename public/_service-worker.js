// Self-destructing service worker.
// The previous AI Studio deployment registered a SW at this path that caches
// the old app. This replacement takes over, wipes caches, unregisters itself,
// and reloads open tabs so every device picks up the live site again.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
