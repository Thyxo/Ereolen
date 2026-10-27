// Service worker: alt til læsning ligger i cachen, så appen virker offline.
// Netværk først (altid nyeste version), cache som reserve.
const CACHE = 'ereolen-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/covers.js',
  '/js/flow.js',
  '/js/reader.js',
  '/js/secret.js',
  '/js/state.js',
  '/js/ui.js',
  '/js/views.js',
  '/data/books.json',
  '/data/words.json',
  '/data/pageSets.json',
  '/fonts/barlow-semi-condensed-400.woff2',
  '/fonts/source-sans-3-400.woff2',
  '/fonts/source-sans-3-600.woff2',
  '/fonts/source-sans-3-700.woff2',
  '/fonts/source-sans-3-900.woff2',
  '/icons/ui/chevron-down.png',
  '/icons/ui/chevron-right.png',
  '/icons/ui/ebook.png',
  '/icons/ui/gear.png',
  '/icons/ui/headphones.png',
  '/icons/ui/logo-sub.png',
  '/icons/ui/logo.png',
  '/icons/ui/mp-heart.png',
  '/icons/ui/mp-history.png',
  '/icons/ui/mp-loans.png',
  '/icons/ui/mp-reserve.png',
  '/icons/ui/r-aa.png',
  '/icons/ui/r-bookmark-on.png',
  '/icons/ui/r-bookmark.png',
  '/icons/ui/r-close.png',
  '/icons/ui/r-toc.png',
  '/icons/ui/search-white.png',
  '/icons/ui/tab-home-on.png',
  '/icons/ui/tab-home.png',
  '/icons/ui/tab-menu.png',
  '/icons/ui/tab-play.png',
  '/icons/ui/tab-search.png',
  '/icons/ui/tab-user-on.png',
  '/icons/ui/tab-user.png',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
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
