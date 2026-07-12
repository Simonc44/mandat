// src/lib/api-auth.server.ts
// Utilitaires partagés pour l'API publique Mandat
// - Validation de la clé API (header X-Api-Key ou ?api_key=)
// - Rate limiting (Unkey ou local en mémoire)
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

export function extractApiKey(request: Request): string | null {
  const headerKey = request.headers.get("X-Api-Key");
  if (headerKey) return headerKey.trim();
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("api_key");
  if (queryKey) return queryKey.trim();
  return null;
}

// Valide une clé UNIQUEMENT via MANDAT_API_KEYS (env var CSV).
// Les clés mk_test_* ne sont plus acceptées en fallback local —
// elles passent toujours par Unkey pour être vérifiées strictement.
export function validateApiKeyLocal(key: string | null): boolean {
  if (!key) return false;
  const raw = process.env.MANDAT_API_KEYS ?? "";
  if (!raw) return false;
  const valid = raw.split(",").map((k) => k.trim()).filter(Boolean);
  return valid.includes(key);
}

// ─── Unkey Integration ──────────────────────────────────────────────────────

async function verifyWithUnkey(key: string): Promise<{
  valid: boolean;
  ratelimit?: { limit: number; remaining: number; reset: number };
  error?: string;
}> {
  const apiId = process.env.UNKEY_API_ID;
  if (!apiId) return { valid: false, error: "UNKEY_API_ID not configured" };

  try {
    const res = await fetch("https://api.unkey.com/v2/keys.verifyKey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, apiId }),
    });

    if (!res.ok) {
      console.error("[Unkey] verification failed:", res.status, await res.text());
      return { valid: false, error: `Unkey error ${res.status}` };
    }

    const payload = await res.json();
    return {
      valid: payload.data?.valid ?? false,
      ratelimit: payload.data?.ratelimit,
    };
  } catch (e) {
    console.error("[Unkey] fetch error:", e);
    return { valid: false, error: "Unkey unreachable" };
  }
}

// ─── Rate limiting in-memory (fallback) ─────────────────────────────────────

const LOCAL_RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const _store = new Map<string, { count: number; reset: number }>();

export function checkRateLimitLocal(key: string) {
  const now = Date.now();
  const entry = _store.get(key);

  if (!entry || now > entry.reset) {
    _store.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, limit: LOCAL_RATE_LIMIT, remaining: LOCAL_RATE_LIMIT - 1, reset: now + WINDOW_MS };
  }

  entry.count++;
  const remaining = Math.max(0, LOCAL_RATE_LIMIT - entry.count);
  return { ok: entry.count <= LOCAL_RATE_LIMIT, limit: LOCAL_RATE_LIMIT, remaining, reset: entry.reset };
}

export function rateLimitHeaders(remaining: number, reset: number, limit = LOCAL_RATE_LIMIT): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
  };
}

// ─── Guard complet : auth + rate limit ──────────────────────────────────────
// Stratégie :
//   1. Si UNKEY_API_ID est configuré → TOUTES les clés (y compris mk_test_*)
//      sont vérifiées strictement via Unkey. Aucun bypass local.
//   2. Sinon → fallback sur MANDAT_API_KEYS (liste CSV d'env var).
//      Les clés mk_test_* ne sont PAS acceptées automatiquement.

export async function apiGuard(
  request: Request,
): Promise<{ error: Response } | { key: string; rl: { limit: number; remaining: number; reset: number } }> {
  const key = extractApiKey(request);

  if (!key) {
    return {
      error: jsonError(
        "Clé API manquante. Passez X-Api-Key: <votre_clé> dans le header, ou ?api_key= en query param.",
        401,
        "UNAUTHORIZED",
      ),
    };
  }

  // 1. Unkey si configuré — TOUTES les clés passent par Unkey, sans exception
  if (process.env.UNKEY_API_ID) {
    const unkey = await verifyWithUnkey(key);
    if (!unkey.valid) {
      return { error: jsonError("Clé API invalide ou révoquée.", 401, "UNAUTHORIZED") };
    }
    const rl = unkey.ratelimit ?? { limit: LOCAL_RATE_LIMIT, remaining: 59, reset: Date.now() + WINDOW_MS };
    if (rl.remaining < 0) {
      return {
        error: new Response(
          JSON.stringify({ error: { message: "Trop de requêtes (Unkey).", code: "RATE_LIMITED", status: 429 } }),
          {
            status: 429,
            headers: {
              ...NO_CACHE_HEADERS,
              ...rateLimitHeaders(0, rl.reset, rl.limit),
              "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
            },
          },
        ),
      };
    }
    return { key, rl };
  }

  // 2. Fallback local — MANDAT_API_KEYS uniquement
  if (!validateApiKeyLocal(key)) {
    return { error: jsonError("Clé API invalide.", 401, "UNAUTHORIZED") };
  }

  const rl = checkRateLimitLocal(key);
  if (!rl.ok) {
    return {
      error: new Response(
        JSON.stringify({ error: { message: "Trop de requêtes. Limit: 60 req/min.", code: "RATE_LIMITED", status: 429 } }),
        {
          status: 429,
          headers: {
            ...NO_CACHE_HEADERS,
            ...rateLimitHeaders(rl.remaining, rl.reset, rl.limit),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      ),
    };
  }

  return { key, rl };
}

export function parseIntParam(url: URL, name: string, def: number, max: number): number {
  const v = parseInt(url.searchParams.get(name) ?? "", 10);
  return isNaN(v) ? def : Math.min(Math.max(1, v), max);
}
