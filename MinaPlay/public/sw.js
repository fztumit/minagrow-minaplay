const CACHE_NAME = 'minaplay-assets-v34';
const APP_SHELL = [
  '/',
  '/offline.html',
  '/style.css?v=20260623-7',
  '/js/modules/main.js',
  '/js/modules/touch-learning.js',
  '/js/modules/match-learning.js',
  '/js/modules/sentence-learning.js',
  '/js/modules/mvp-settings.js',
  '/js/modules/speech/index.js',
  '/assets/brand/minagrow-logo-runtime.png',
  '/assets/brand/minagrow-logo.png',
  '/assets/brand/minaplay-icon.png',
  '/assets/brand/minaplay-logo-runtime.png',
  '/assets/brand/minaplay-logo.png',
  '/assets/brand/minaplay-wide-mark-runtime.png',
  '/assets/brand/minaplay-wide-mark.png',
  '/assets/brand/sipesystem-kirmizi-beyaz.png',
  '/assets/cards/actions/come.png',
  '/assets/cards/actions/drink.png',
  '/assets/cards/actions/eat.png',
  '/assets/cards/actions/give.png',
  '/assets/cards/actions/go.png',
  '/assets/cards/actions/listen.png',
  '/assets/cards/actions/say.png',
  '/assets/cards/actions/sleep.png',
  '/assets/cards/actions/take.png',
  '/assets/cards/objects/apple.png',
  '/assets/cards/objects/bag.png',
  '/assets/cards/objects/ball.png',
  '/assets/cards/objects/bed.png',
  '/assets/cards/objects/bed-scene.png',
  '/assets/cards/objects/book.png',
  '/assets/cards/objects/car.png',
  '/assets/cards/objects/cat.png',
  '/assets/cards/objects/chair.png',
  '/assets/cards/objects/coat.png',
  '/assets/cards/objects/cornice.png',
  '/assets/cards/objects/curtain.png',
  '/assets/cards/objects/dog.png',
  '/assets/cards/objects/door.png',
  '/assets/cards/objects/glass-of-water.png',
  '/assets/cards/objects/glass.png',
  '/assets/cards/objects/glasses.png',
  '/assets/cards/objects/hat.png',
  '/assets/cards/objects/key.png',
  '/assets/cards/objects/lamp.png',
  '/assets/cards/objects/lock.png',
  '/assets/cards/objects/mama.png',
  '/assets/cards/objects/pants.png',
  '/assets/cards/objects/pencil.png',
  '/assets/cards/objects/phone.png',
  '/assets/cards/objects/plate.png',
  '/assets/cards/objects/rug.png',
  '/assets/cards/objects/shoes.png',
  '/assets/cards/objects/socks.png',
  '/assets/cards/objects/spoon.png',
  '/assets/cards/objects/table.png',
  '/assets/cards/objects/toilet.png',
  '/assets/cards/objects/toy.png',
  '/assets/cards/objects/water.png',
  '/assets/cards/objects/window.png',
  '/assets/rooms/ceee-empty-room.png',
  '/assets/rooms/ceee-cloud-bg.png',
  '/assets/cards/people/baby.png',
  '/assets/cards/people/brother.png',
  '/assets/cards/people/child.png',
  '/assets/cards/people/dad.png',
  '/assets/cards/people/grandfather.png',
  '/assets/cards/people/grandmother.png',
  '/assets/cards/people/mom.png',
  '/assets/cards/people/sister.png',
  '/assets/cards/people/teacher.png',
  '/assets/cards/sentences/cold-child.png',
  '/assets/cards/sentences/father-come.png',
  '/assets/cards/sentences/food-eat.png',
  '/assets/cards/sentences/food-request.png',
  '/assets/cards/sentences/help-child.png',
  '/assets/cards/sentences/hot-child.png',
  '/assets/cards/sentences/mother-come.png',
  '/assets/cards/sentences/pain-child.png',
  '/assets/cards/sentences/sleepy-child.png',
  '/assets/cards/sentences/toilet-need.png',
  '/assets/cards/sentences/walk-request.png',
  '/assets/cards/sentences/water-drink.png',
  '/assets/cards/sentences/water-request.png',
  '/assets/icons/app.png',
  '/assets/icons/home/match.png',
  '/assets/icons/home/mirror.png',
  '/assets/icons/home/sentence.png',
  '/assets/icons/home/sleep.png',
  '/assets/icons/home/story.png',
  '/assets/icons/home/touch.png',
  '/assets/icons/match.png',
  '/assets/icons/mirror.png',
  '/assets/icons/sentence.png',
  '/assets/icons/sleep.png',
  '/assets/icons/story.png',
  '/assets/icons/touch.png',
  '/assets/modules/matching.png',
  '/assets/modules/mirror.png',
  '/assets/modules/sleep.png',
  '/assets/modules/touch.png',
  '/assets/pofi/parts/body/default-v01.png',
  '/assets/pofi/parts/body/default-v02.png',
  '/assets/pofi/parts/body/default-v03.png',
  '/assets/pofi/parts/body/default-v04.png',
  '/assets/pofi/parts/body/default-v05.png',
  '/assets/pofi/parts/body/default-v06.png',
  '/assets/pofi/parts/body/default-v07.png',
  '/assets/pofi/parts/body/default-v08.png',
  '/assets/pofi/parts/body/default-v09.png',
  '/assets/pofi/parts/body/default-v10.png',
  '/assets/pofi/parts/body/default-v11.png',
  '/assets/pofi/parts/effects/blush-soft-v01.png',
  '/assets/pofi/parts/eyebrows/happy-v01.png',
  '/assets/pofi/parts/eyebrows/sad-v01.png',
  '/assets/pofi/parts/eyes/base.png',
  '/assets/pofi/parts/eyes/closed-soft-v01.png',
  '/assets/pofi/parts/eyes/closed-v01.png',
  '/assets/pofi/parts/eyes/drowsy-v01.png',
  '/assets/pofi/parts/eyes/half-open-v01.png',
  '/assets/pofi/parts/eyes/happy-v01.png',
  '/assets/pofi/parts/eyes/open-v01.png',
  '/assets/pofi/parts/eyes/sad-soft-v01.png',
  '/assets/pofi/parts/eyes/surprised-v01.png',
  '/assets/pofi/parts/eyes/waiting-v01.png',
  '/assets/pofi/parts/eyes/wide-open-v01.png',
  '/assets/pofi/parts/eyes/wide-soft-v01.png',
  '/assets/pofi/parts/eyes/wink-v01.png',
  '/assets/pofi/parts/hands/pofi_body.png',
  '/assets/pofi/parts/hands/pofi_hand_click_cue_left_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_click_cue_right_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_closed_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_ok_left_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_ok_right_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_open_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_point_left_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_point_right_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_steer_clap_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_steer_left_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_steer_right_v01.png',
  '/assets/pofi/parts/hands/pofi_hand_touch_v01.png',
  '/assets/pofi/parts/mouth/archive-lips-kiss-v01.png',
  '/assets/pofi/parts/mouth/closed-v01.png',
  '/assets/pofi/parts/mouth/grimace-soft-v01.png',
  '/assets/pofi/parts/mouth/open-o-v01.png',
  '/assets/pofi/parts/mouth/open-smile-alt-v01.png',
  '/assets/pofi/parts/mouth/open-smile-soft-v01.png',
  '/assets/pofi/parts/mouth/open-smile-v01.png',
  '/assets/pofi/parts/mouth/open-vertical-big-v01.png',
  '/assets/pofi/parts/mouth/open-vertical-small-v01.png',
  '/assets/pofi/parts/mouth/pucker-v01.png',
  '/assets/pofi/parts/mouth/sad-soft-v01.png',
  '/assets/pofi/parts/mouth/smile-soft-v01.png',
  '/assets/pofi/parts/mouth/smile-v01.png',
  '/assets/pofi/parts/mouth/smirk-soft-v01.png',
  '/assets/pofi/parts/mouth/sound-a-v01.png',
  '/assets/pofi/parts/mouth/sound-o-v01.png',
  '/assets/pofi/parts/mouth/sound-u-v01.png',
  '/assets/pofi/parts/mouth/talk-small-v01.png',
  '/assets/pofi/parts/mouth/tongue-down-v01.png',
  '/assets/pofi/parts/mouth/tongue-left-v01.png',
  '/assets/pofi/parts/mouth/tongue-out-v01.png',
  '/assets/pofi/parts/mouth/tongue-right-v01.png',
  '/assets/pofi/parts/mouth/tongue-up-v01.png',
  '/assets/pofi/poses/happy.png',
  '/assets/pofi/poses/playful.png',
  '/assets/pofi/poses/sleeping.png',
  '/assets/pofi/poses/tongue.png',
  '/assets/sleep/moon.png',
  '/sounds/peekaboo/pofi_ceee_01.wav',
  '/sounds/peekaboo/pofi_ceee_02.wav',
  '/sounds/peekaboo/pofi_ceee_03.wav',
  '/sounds/peekaboo/pofi_ceee_04.wav',
  '/sounds/peekaboo/pofi_ceee_05.wav'
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
