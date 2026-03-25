const CACHE_NAME = 'minaplay-v27';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.webmanifest',
  '/assets/phoenix-ui.svg',
  '/assets/phoenix.svg',
  '/assets/phoenix-sleep.svg',
  '/assets/water-glass.svg',
  '/assets/object-ball.svg',
  '/assets/object-car.svg',
  '/assets/object-father.svg',
  '/assets/object-book.svg',
  '/assets/object-apple.svg',
  '/assets/object-milk.svg',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
