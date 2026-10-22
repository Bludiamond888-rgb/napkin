const CACHE = 'napkin-__VERSION__'
const PRECACHE = __PRECACHE__
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE))); self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res }).catch(() => caches.match('./index.html'))))
})
