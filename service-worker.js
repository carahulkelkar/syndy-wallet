const CACHE_NAME = 'syndy-wallet-v16';
const ASSETS = [
  '/syndy-wallet/',
  '/syndy-wallet/index.html',
  '/syndy-wallet/styles.css',
  '/syndy-wallet/app.js',
  '/syndy-wallet/manifest.json',
  '/syndy-wallet/icon-192.png',
  '/syndy-wallet/icon-512.png'
];

self.addEventListener('install', e => {
  // Cache each asset individually — if one fails, others still cache
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request))
      .catch(() => caches.match('/syndy-wallet/index.html'))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/syndy-wallet/'));
});
