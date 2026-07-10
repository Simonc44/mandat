// /api/v1/groupes — Liste des groupes politiques avec stats
// GET /api/v1/groupes

import { createFileRoute } from "@tanstack/react-router";
import {
  apiGuard,
  jsonError,
  optionsResponse,
  rateLimitHeaders,
} from "@/lib/api-auth.server";
import { GROUPES } from "@/lib/api";

export const Route = createFileRoute("/api/v1/groupes")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),

      GET: async ({ request }: { request: Request }) => {
        const guard = await apiGuard(request);
        if ("error" in guard) return guard.error;
        const { rl } = guard;

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          const r = await db.execute(
            `SELECT groupe_sigle, COUNT(*) AS nb_deputes
             FROM deputes
             WHERE groupe_sigle IS NOT NULL
             GROUP BY groupe_sigle
             ORDER BY nb_deputes DESC`,
          );

          return new Response(
            JSON.stringify({
              data: r.rows.map((row) => {
                const sigle = String(row.groupe_sigle ?? "NI");
                const gMeta = GROUPES[sigle] ?? { nom: sigle };
                return {
                  sigle:       sigle,
                  libelle:     gMeta.nom,
                  nb_deputes:  Number(row.nb_deputes ?? 0),
                  url:         `https://mandat-fr.is-a.dev/groupes`,
                };
              }),
              meta: { total: r.rows.length },
            }, null, 2),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=600",
                "Access-Control-Allow-Origin": "*",
                ...rateLimitHeaders(rl.limit, rl.remaining, rl.reset),
              },
            },
          );
        } catch (e) {
          console.error("[api/v1/groupes] error:", e);
          return jsonError("Erreur interne", 500, "INTERNAL_ERROR");
        }
      },
    },
  },
});
