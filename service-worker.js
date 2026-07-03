const CACHE_NAME = 'syndy-wallet-v18';
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
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW v18] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for app.js and index.html — always get fresh
  if (e.request.url.includes('app.js') || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache first for everything else
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
      .catch(() => caches.match('/syndy-wallet/index.html'))
  );
});
