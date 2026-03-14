const CACHE_VERSION = "v3";
const CACHE_NAME = `rutina-cache-${CACHE_VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json"
];

// Instalación: cache inicial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first para navigation (index/html), cache-first para assets
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Navigation requests -> network first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For other requests: try cache first, fallback network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // optionally cache same-origin assets
      if (url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    }))
  );
});

// Allow app to tell SW to skipWaiting (already in your code)
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
