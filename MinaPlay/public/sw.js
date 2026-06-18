const CACHE_NAME = 'minaplay-assets-v10';
const APP_SHELL = [
  '/',
  '/offline.html',
  '/style.css?v=20260618-2',
  '/js/modules/main.js',
  '/js/modules/touch-learning.js',
  '/js/modules/match-learning.js',
  '/js/modules/sentence-learning.js',
  '/js/modules/mvp-settings.js',
  '/js/modules/speech/index.js',
  '/assets/icons/app.png',
  '/assets/cards/objects/apple.png',
  '/assets/cards/objects/baby.png',
  '/assets/cards/objects/ball.png',
  '/assets/cards/objects/car.png',
  '/assets/cards/objects/cat.png',
  '/assets/cards/objects/dad.png',
  '/assets/cards/objects/dog.png',
  '/assets/cards/objects/mama.png',
  '/assets/cards/objects/mom.png',
  '/assets/cards/objects/water.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }

        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          return (await caches.match('/')) ?? (await caches.match('/offline.html'));
        }

        return Response.error();
      })
  );
});
