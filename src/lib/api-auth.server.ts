// src/lib/api-auth.server.ts
// Utilitaires partagés pour l'API publique Mandat
// - Validation de la clé API (header X-Api-Key ou ?api_key=)
// - Rate limiting léger en mémoire (par clé, par minute)
// - Helpers réponses JSON

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  ...CORS_HEADERS,
};

export const NO_CACHE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  ...CORS_HEADERS,
};

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function jsonOk(data: unknown, cache = true): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: cache ? JSON_HEADERS : NO_CACHE_HEADERS,
  });
}

export function jsonError(message: string, status: number, code?: string): Response {
  return new Response(
    JSON.stringify({ error: { message, code: code ?? "ERROR", status } }),
    { status, headers: NO_CACHE_HEADERS },
  );
}

// ─── Validation de la clé API ───────────────────────────────────────────────
// Les clés valides sont stockées dans MANDAT_API_KEYS (env)
// Format : clés séparées par des virgules
// Ex: MANDAT_API_KEYS="mk_live_abc123,mk_live_def456"

export function extractApiKey(request: Request): string | null {
  // 1. Header X-Api-Key
  const headerKey = request.headers.get("X-Api-Key");
  if (headerKey) return headerKey.trim();
  // 2. Header Authorization: Bearer <key>
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  // 3. Query param ?api_key=
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("api_key");
  if (queryKey) return queryKey.trim();
  return null;
}

export function validateApiKey(key: string | null): boolean {
  if (!key) return false;
  const raw = process.env.MANDAT_API_KEYS ?? "";
  if (!raw) {
    // En dev, accepter toutes les clés commençant par "mk_test_"
    return key.startsWith("mk_test_");
  }
  const valid = raw.split(",").map((k) => k.trim()).filter(Boolean);
  return valid.includes(key);
}

// ─── Rate limiting in-memory ─────────────────────────────────────────────────
// Simple sliding window : 60 requêtes / minute par clé API
// En production, remplacer par KV/Redis pour multi-instance

const RATE_LIMIT = 60; // requêtes
const WINDOW_MS = 60_000; // 1 minute

const _store = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(key: string): { ok: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = _store.get(key);

  if (!entry || now > entry.reset) {
    _store.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }

  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT - entry.count);
  return { ok: entry.count <= RATE_LIMIT, remaining, reset: entry.reset };
}

export function rateLimitHeaders(remaining: number, reset: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
  };
}

// ─── Guard complet : auth + rate limit ──────────────────────────────────────

export function apiGuard(
  request: Request,
): { error: Response } | { key: string; rl: ReturnType<typeof checkRateLimit> } {
  const key = extractApiKey(request);

  if (!validateApiKey(key)) {
    return {
      error: jsonError(
        "Clé API manquante ou invalide. Passez X-Api-Key: <votre_clé> dans le header, ou ?api_key= en query param.",
        401,
        "UNAUTHORIZED",
      ),
    };
  }

  const rl = checkRateLimit(key!);
  if (!rl.ok) {
    return {
      error: new Response(
        JSON.stringify({ error: { message: "Trop de requêtes. Limit: 60 req/min.", code: "RATE_LIMITED", status: 429 } }),
        {
          status: 429,
          headers: {
            ...NO_CACHE_HEADERS,
            ...rateLimitHeaders(rl.remaining, rl.reset),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      ),
    };
  }

  return { key: key!, rl };
}

// ─── Helper : parse les query params avec valeurs par défaut ─────────────────

export function parseIntParam(url: URL, name: string, def: number, max: number): number {
  const v = parseInt(url.searchParams.get(name) ?? "", 10);
  return isNaN(v) ? def : Math.min(Math.max(1, v), max);
}
