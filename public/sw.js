/**
 * 🔧 Mandat — Service Worker PWA
 * ================================
 * Stratégie : Cache-first pour les assets statiques,
 * Network-first pour les données JSON (toujours fraîches).
 *
 * Enregistrement : src/start.ts
 */

const CACHE_NAME = "mandat-v1";
const DATA_CACHE_NAME = "mandat-data-v1";

// Assets statiques à pré-cacher au premier chargement
const STATIC_ASSETS = [
  "/",
  "/deputes",
  "/scrutins",
  "/favicon.svg",
  "/manifest.json",
  "/og-image.png",
];

// Patterns d'URL à mettre en cache côté données
const DATA_PATTERNS = ["/deputes-17.json", "/scrutins-17.json"];

// ── Install ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pré-cache silencieux — n'échoue pas si une ressource manque
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            // Silencieux — la ressource sera mise en cache à la première visite
          })
        )
      );
    })
  );
  // Active immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — Stratégie hybride ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les API externes
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.hostname.includes("fonts.googleapis.com")) return;

  // Données JSON → Network-first (fraîcheur prioritaire)
  if (DATA_PATTERNS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirst(request, DATA_CACHE_NAME));
    return;
  }

  // Google Fonts → Cache-first (ne changent pas)
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Assets statiques → Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

// ── Helpers de stratégie ─────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("Réseau indisponible", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  return cached ?? networkPromise;
}
