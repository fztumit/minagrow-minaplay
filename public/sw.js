const CACHE_NAME = 'minaplay-v72';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.webmanifest',
  '/assets/pofi-body.png',
  '/assets/pofi-reference.png',
  '/assets/pofi/emotions/pofi_smile.png',
  '/assets/pofi/emotions/pofi_happy.png',
  '/assets/pofi/emotions/pofi_happy_wide.png',
  '/assets/pofi/emotions/pofi_happy_teeth.png',
  '/assets/pofi/emotions/pofi_grin_soft.png',
  '/assets/pofi/emotions/pofi_smile_open.png',
  '/assets/pofi/emotions/pofi_happy_tilt.png',
  '/assets/pofi/emotions/pofi_smirk.png',
  '/assets/pofi/emotions/pofi_side_smile.png',
  '/assets/pofi/emotions/pofi_cheeky.png',
  '/assets/pofi/emotions/pofi_playful.png',
  '/assets/pofi/emotions/pofi_silly.png',
  '/assets/pofi/emotions/pofi_tongue.png',
  '/assets/pofi/emotions/pofi_nervous.png',
  '/assets/pofi/emotions/pofi_scared.png',
  '/assets/pofi/emotions/pofi_sad.png',
  '/assets/pofi/emotions/pofi_sad_cry.png',
  '/assets/pofi/emotions/pofi_calm_happy.png',
  '/assets/pofi/emotions/pofi_surprised.png',
  '/assets/pofi/emotions/pofi_sleep.png',
  '/assets/pofi-pack/hands-hide.svg',
  '/assets/water-glass.svg',
  '/assets/object-ball.svg',
  '/assets/object-car.svg',
  '/assets/object-father.svg',
  '/assets/object-book.svg',
  '/assets/object-apple.svg',
  '/assets/object-milk.svg',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/js/main.js',
  '/js/mascot/index.js',
  '/js/peekaboo/index.js',
  '/js/shared/parentGesture.js',
  '/js/sentence/index.js',
  '/js/speech/index.js',
  '/js/sleep/index.js'
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
