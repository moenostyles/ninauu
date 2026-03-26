// Ninauu Service Worker — App Shell + seed cache
const CACHE_NAME = 'ninauu-v1'
const SHELL_ASSETS = [
  '/',
  '/gear-seed.json',
]

// ── Install: cache app shell & seed DB ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate: purge old caches ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch strategy ────────────────────────────────────────────────────
// /gear-seed.json → Cache First（ほぼ変わらないシードデータ）
// Supabase API / その他 → Network First, キャッシュにフォールバック
// /_next/ static assets → Cache First
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Supabase / auth / API calls → ネットワーク優先、失敗時はスキップ
  if (
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
    return
  }

  // gear-seed.json & _next static → キャッシュ優先
  if (url.pathname === '/gear-seed.json' || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        return res
      }))
    )
    return
  }

  // それ以外 → Network First, オフライン時はキャッシュから
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request).then((cached) => cached ?? new Response('Offline', { status: 503 })))
  )
})
