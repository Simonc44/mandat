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
        const unkeyRootKey = process.env.UNKEY_ROOT_KEY;
        const unkeyApiId   = process.env.UNKEY_API_ID;

        if (!unkeyRootKey || !unkeyApiId) {
          return jsonErr("Service de clés non configuré", 503);
        }

        let body: { name?: string; email?: string };
        try { body = await request.json(); }
        catch { return jsonErr("JSON invalide", 400); }

        const name  = (body.name  ?? "").trim().slice(0, 80);
        const email = (body.email ?? "").trim().slice(0, 200);

        if (!name)  return jsonErr("Champ \"name\" requis",  400);
        if (!email || !email.includes("@")) return jsonErr("Email invalide", 400);

        // Appel Unkey — crée une clé avec préfixe mk_live_
        let unkeyRes: Response;
        try {
          unkeyRes = await fetch("https://api.unkey.dev/v1/keys.createKey", {
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
              ratelimit: {
                type:           "fast",
                limit:          60,
                refillRate:     60,
                refillInterval: 60_000,
              },
              // Expiration : 1 an
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
            }),
          });
        } catch (e) {
          console.error("[keys/create] unkey fetch error:", e);
          return jsonErr("Impossible de joindre Unkey", 502);
        }

        if (!unkeyRes.ok) {
          const txt = await unkeyRes.text().catch(() => "");
          console.error("[keys/create] unkey error:", unkeyRes.status, txt);
          return jsonErr(`Erreur Unkey ${unkeyRes.status}`, 502);
        }

        const data = await unkeyRes.json();

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
