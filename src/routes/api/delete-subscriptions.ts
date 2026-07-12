// /api/delete-subscriptions
// POST { email, ids: string[] }

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

export const Route = createFileRoute("/api/delete-subscriptions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }: { request: Request }) => {
        let body: { email?: string; ids?: string[] };
        try { body = await request.json(); }
        catch { return err("JSON invalide", 400); }

        const email = (body.email ?? "").trim().toLowerCase();
        const ids   = body.ids ?? [];

        if (!email || !email.includes("@")) return err("Email invalide", 400);
        if (!ids.length) return err("Aucun ID fourni", 400);

        // Sécuriser les IDs (UUID v4 uniquement)
        const safeIds = ids
          .map((id) => String(id).trim())
          .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
          .slice(0, 100);

        if (!safeIds.length) return err("IDs invalides", 400);

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          // Désactiver uniquement les abonnements appartenant à cet email
          for (const id of safeIds) {
            await db.execute({
              sql: `UPDATE subscriptions SET active = 0
                    WHERE id = ? AND email = ? AND active = 1`,
              args: [id, email],
            });
          }

          return ok({ deleted: safeIds.length, email });
        } catch (e) {
          console.error("[delete-subscriptions] db error:", e);
          return err("Erreur base de données", 500);
        }
      },
    },
  },
});
