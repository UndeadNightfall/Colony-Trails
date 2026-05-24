const CACHE_NAME = "colony-trails-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./nest_clean.png",
  "./outworld.png.png",
  "./garden_clean.png",
  "./sandpit_clean.png",
  "./patio_clean.png",
  "./house.png",
  "./backyard.png",
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
  "./js/sfx.js",
  "./js/music.js",
  "./js/weather.js",
  "./js/title.js",
  "./js/pause.js",
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
  const path = decodeURIComponent(new URL(event.request.url).pathname);
  if (event.request.destination === "script" || event.request.destination === "document" || path.endsWith(".js") || path.endsWith(".html")) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  if (event.request.destination === "audio" || path.endsWith("/morning meadow.mp3")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
