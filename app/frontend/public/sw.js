const CACHE = 'pratham-v3'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  // never cache API calls
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return

  // HTML/navigation: network-first so the latest build always loads
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // static assets: cache-first, but update every time a request comes through
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(event.request, copy))
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})