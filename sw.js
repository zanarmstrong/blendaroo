// Blendaroo. © 2026 Zan Armstrong. PolyForm Noncommercial License 1.0.0.
// Offline support. The page itself is fetched fresh when online (so updates arrive) and from the cache when offline;
// fonts and icons come from the cache. A new version replaces the old cache. Word recordings (audio/) are kept in their
// own cache once played, across versions, so a word heard online can be heard offline.
const CACHE = 'slide-read-d5332b2da0';
const FILES = ["./", "index.html", "manifest.webmanifest", "fonts/Andika-Regular.ttf", "fonts/Andika-Bold.ttf", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/icon-maskable-512.png"];
const AUDIO = 'blendaroo-audio-v1';   // change the name if recordings are ever replaced
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // fetch the page fresh; keep it for offline only if it's a good, direct answer (not an error page or a redirect)
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok && !r.redirected) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); } return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  if (new URL(req.url).pathname.includes('/audio/')) {
    e.respondWith(caches.open(AUDIO).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
