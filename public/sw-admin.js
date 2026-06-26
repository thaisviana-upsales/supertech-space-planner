/**
 * sw-admin.js — Service Worker mínimo para o Painel Administrativo Supertech
 * ──────────────────────────────────────────────────────────────────────────────
 * REGRAS DE CACHE:
 *   ✅ Cacheia: arquivos JS/CSS compilados, ícones do app, logo, manifest
 *   ❌ NÃO cacheia: leads, dados de Google Sheets, webhooks, dados pessoais
 *
 * Estratégia: Network-first (sempre tenta buscar online antes de usar cache),
 * garantindo que o painel nunca exiba dados desatualizados.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const CACHE_NAME = 'admin-panel-v2';

// Apenas assets estáticos que viabilizam a instalação
const STATIC_ASSETS = [
  '/admin/leads',
  '/admin-manifest.webmanifest',
  '/icons/admin-icon-192.png',
  '/icons/admin-icon-512.png',
  '/icons/space-planner-admin-icon.png',
  '/brand/logo-supertech-branca.png',
];

// ── Install: pré-cacheia os assets mínimos ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with individual try-catch to avoid breaking install
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => { /* Asset not available at install time — skip */ })
        )
      );
    })
  );
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting();
});

// ── Activate: remove caches from old versions ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first strategy ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache: API calls, Google Sheets webhook, external services, POST requests
  if (
    request.method !== 'GET' ||
    url.hostname !== location.hostname ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('google') ||
    url.hostname.includes('script.google') ||
    url.hostname.includes('googleapis')
  ) {
    // Pass through without touching cache
    return;
  }

  // For admin routes: network-first (fresh data is critical for lead monitoring)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Only cache static assets (JS/CSS/images/manifest)
        const isStaticAsset =
          url.pathname.match(/\.(js|css|png|svg|ico|webmanifest|woff2?)$/) ||
          STATIC_ASSETS.includes(url.pathname);

        if (isStaticAsset && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }

        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache as fallback (static assets only)
        return caches.match(request).then(
          (cached) => cached ?? new Response('Offline', { status: 503 })
        );
      })
  );
});
