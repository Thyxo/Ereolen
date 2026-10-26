// Service worker: alt til læsning ligger i cachen, så appen virker offline.
// Netværk først (altid nyeste version), cache som reserve.
const CACHE = 'ereolen-v1';
const ASSETS = [
  '/', '/index.html', '/css/app.css',
  '/js/app.js', '/js/state.js', '/js/views.js', '/js/reader.js', '/js/covers.js', '/js/secret.js', '/js/ui.js',
  '/data/books.json', '/data/words.json', '/data/pageSets.json',
  '/manifest.webmanifest', '/icons/icon-192.png', '/icons/apple-touch-icon.png', '/icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Fremtidig live-del (/api) skal aldrig caches
  if (url.pathname.startsWith('/api/')) return;
  const isNav = req.mode === 'navigate';
  const key = isNav ? '/index.html' : url.pathname;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([fetch(req), timeout(3500)]);
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch {
      const hit = await cache.match(key);
      if (hit) return hit;
      if (isNav) return (await cache.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
