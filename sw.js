const CACHE_NAME = "colony-trails-v2";
const ASSETS = [
  "./",
  "./ant_colony_nest_scene.html",
  "./manifest.webmanifest",
  "./title_screen.png",
  "./app_icon.png",
  "./js/state.js",
  "./js/collision.js",
  "./js/world.js",
  "./js/colony.js",
  "./js/player.js",
  "./js/ants.js",
  "./js/spiders.js",
  "./js/nest.js",
  "./js/drawing.js",
  "./js/lifecycle.js",
  "./js/input.js",
  "./js/pwa.js",
  "./js/save.js",
  "./js/title.js",
  "./js/main.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
