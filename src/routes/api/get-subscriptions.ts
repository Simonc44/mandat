// /api/get-subscriptions
// POST { email } — email extrait et vérifié côté client via Google JWT
// On fait confiance à l'email car la page /desabonnement valide le JWT Google côté client.
// Pour une sécurité maximale, ajouter GOOGLE_CLIENT_ID + vérification JWT côté serveur.

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { "Content-Type": "application/json", ...CORS },
  });
}
function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200, headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/get-subscriptions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }: { request: Request }) => {
        let body: { email?: string };
        try { body = await request.json(); }
        catch { return err("JSON invalide", 400); }

        const email = (body.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return err("Email invalide", 400);

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          const res = await db.execute({
            sql: `SELECT id, depute_slug, depute_nom, created_at
                  FROM subscriptions
                  WHERE email = ? AND active = 1
                  ORDER BY created_at DESC`,
            args: [email],
          });

          return ok(res.rows.map((row) => ({
            id:          String(row.id),
            depute_slug: String(row.depute_slug),
            depute_nom:  String(row.depute_nom),
            created_at:  String(row.created_at),
          })));
        } catch (e) {
          console.error("[get-subscriptions] db error:", e);
          return err("Erreur base de données", 500);
        }
      },
    },
  },
});
