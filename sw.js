// Meine Bibliothek — Service Worker
const CACHE = 'bibliothek-v9';
const ASSETS = [
  './bibliothek.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap'
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API requests (Google Books, Open Library) and cover images go straight to
//   network and are never cached, so book data and covers stay fresh.
// - The html5-qrcode library from unpkg is fetched live to always get latest.
// - App shell files: cache-first, fall back to network.
self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.includes('googleapis.com/books') ||
      url.includes('openlibrary.org') ||
      url.includes('covers.openlibrary.org') ||
      url.includes('books.google.com') ||
      url.includes('lobid.org') ||
      url.includes('jsonbin.io') ||
      url.includes('unpkg.com')) {
    return; // let the browser handle it normally (no caching)
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
