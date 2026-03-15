const CACHE_VERSION = 'v1'
const STATIC_CACHE = `safereport-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `safereport-runtime-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/badge-72.svg',
  '/barlow-condensed-700.woff2',
]

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: purge old cache versions ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: cache strategies ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests from our own origin
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // API routes: network-only (live data required; don't cache)
  if (url.pathname.startsWith('/api/')) return

  // Static assets (_next/static, images, fonts): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|svg|ico|woff2|jpg|jpeg|webp|avif|gif)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation (page loads): network-first, fall back to cached version or '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match('/'))
        )
    )
    return
  }
})

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json()
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:               payload.body,
      icon:               payload.icon  ?? '/icon-192.svg',
      badge:              payload.badge ?? '/badge-72.svg',
      data:               payload.data,
      requireInteraction: payload.requireInteraction ?? false,
    })
  )
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
