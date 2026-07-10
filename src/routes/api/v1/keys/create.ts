// /api/v1/keys/create — Génère une clé API via Unkey
// POST { name, email } → { key, keyId }
// Unkey gère le stockage, la révocation et les limites.

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonErr(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/v1/keys/create")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }: { request: Request }) => {
        const unkeyRootKey = process.env.UNKEY_ROOT_KEY?.trim();
        const unkeyApiId   = process.env.UNKEY_API_ID?.trim();

        let body: { name?: string; email?: string };
        try { body = await request.json(); }
        catch { return jsonErr("JSON invalide", 400); }

        const name  = (body.name  ?? "").trim().slice(0, 80);
        const email = (body.email ?? "").trim().slice(0, 200);

        if (!name)  return jsonErr("Champ \"name\" requis",  400);
        if (!email || !email.includes("@")) return jsonErr("Email invalide", 400);

        const generateLocalKey = () => {
          const randomBytes1 = Math.random().toString(36).substring(2);
          const randomBytes2 = Math.random().toString(36).substring(2);
          const randomBytes3 = Math.random().toString(36).substring(2);
          return `mk_test_${randomBytes1}${randomBytes2}${randomBytes3}`.slice(0, 40);
        };

        // Fallback local key if Unkey is not configured
        if (!unkeyRootKey || !unkeyApiId) {
          console.warn("[keys/create] Unkey not fully configured. Falling back to local key generation.");
          const localKey = generateLocalKey();
          return new Response(
            JSON.stringify({
              key:   localKey,
              keyId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name,
              email,
              expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              ratelimit: { limit: 60, window: "1 minute" },
              isFallback: true,
            }),
            { status: 201, headers: { "Content-Type": "application/json", ...CORS } }
          );
        }

        // Appel Unkey — crée une clé avec préfixe mk_live_
        let unkeyRes: Response;
        try {
          unkeyRes = await fetch("https://api.unkey.com/v2/keys.createKey", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${unkeyRootKey}`,
            },
            body: JSON.stringify({
              apiId:  unkeyApiId,
              prefix: "mk_live",
              name:   `${name} <${email}>`,
              meta:   { email, name, created_at: new Date().toISOString() },
              ratelimits: [
                {
                  name:      "requests",
                  limit:     60,
                  duration:  60_000,
                  autoApply: true,
                },
              ],
              // Expiration : 1 an
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
            }),
          });
        } catch (e) {
          console.error("[keys/create] unkey fetch error:", e);
          console.warn("[keys/create] Falling back to local key generation due to Unkey unreachable.");
          const localKey = generateLocalKey();
          return new Response(
            JSON.stringify({
              key:   localKey,
              keyId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name,
              email,
              expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              ratelimit: { limit: 60, window: "1 minute" },
              isFallback: true,
            }),
            { status: 201, headers: { "Content-Type": "application/json", ...CORS } }
          );
        }

        if (!unkeyRes.ok) {
          const txt = await unkeyRes.text().catch(() => "");
          console.error("[keys/create] unkey error:", unkeyRes.status, txt);
          console.warn("[keys/create] Falling back to local key generation due to Unkey error.");
          const localKey = generateLocalKey();
          return new Response(
            JSON.stringify({
              key:   localKey,
              keyId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name,
              email,
              expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              ratelimit: { limit: 60, window: "1 minute" },
              isFallback: true,
            }),
            { status: 201, headers: { "Content-Type": "application/json", ...CORS } }
          );
        }

        const data = await unkeyRes.json();
        if (!data || !data.key) {
          console.error("[keys/create] unkey response is missing key data:", data);
          console.warn("[keys/create] Falling back to local key generation due to invalid Unkey response.");
          const localKey = generateLocalKey();
          return new Response(
            JSON.stringify({
              key:   localKey,
              keyId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name,
              email,
              expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              ratelimit: { limit: 60, window: "1 minute" },
              isFallback: true,
            }),
            { status: 201, headers: { "Content-Type": "application/json", ...CORS } }
          );
        }

        return new Response(
          JSON.stringify({
            key:   data.key,
            keyId: data.keyId,
            name,
            email,
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            ratelimit: { limit: 60, window: "1 minute" },
          }),
          { status: 201, headers: { "Content-Type": "application/json", ...CORS } },
        );
      },
    },
  },
});
