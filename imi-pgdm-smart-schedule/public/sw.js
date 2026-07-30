// Bumped to v3: forces every existing visitor's browser to drop the old
// (stale-serving) cache the moment this new service worker activates —
// needed again now because the icon files themselves changed.
const CACHE_NAME = 'pgdm-session-board-v3';
const APP_SHELL = ['/', '/events', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Sheet data: network-first, falling back to the last cached response when offline.
  if (url.pathname === '/api/sheet') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Next.js build output under /_next/static/ is content-hashed and
  // immutable per deploy (the filename itself changes when the content
  // changes) — safe to serve straight from cache forever, no re-check needed.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else — pages ("/", "/events", "/settings", ...), the
  // manifest, icons: network-first. This is the important part — it means
  // the moment you deploy an update, the very next time anyone opens or
  // reloads the app they get the new version immediately, with no need to
  // refresh twice. Only falls back to the cached copy if they're actually
  // offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
