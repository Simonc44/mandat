// /api/v1/scrutins/$numero — Détail d'un scrutin
// GET /api/v1/scrutins/:numero?legislature=17

import { createFileRoute } from "@tanstack/react-router";
import {
  apiGuard,
  jsonOk,
  jsonError,
  optionsResponse,
  rateLimitHeaders,
} from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/v1/scrutins/$numero")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),

      GET: async ({ request, params }: { request: Request; params: { numero: string } }) => {
        const guard = await apiGuard(request);
        if ("error" in guard) return guard.error;
        const { rl } = guard;

        const numero = params.numero.replace(/[^0-9]/g, "");
        if (!numero) return jsonError("Numéro de scrutin invalide", 400, "INVALID_PARAM");

        const url = new URL(request.url);
        const legislature = parseInt(url.searchParams.get("legislature") ?? "17", 10) === 16 ? 16 : 17;

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          const r = await db.execute(
            `SELECT numero, titre, date, sort, type,
                    nombre_pours, nombre_contres, nombre_abstentions
             FROM scrutins
             WHERE numero = '${numero}' AND legislature = ${legislature}
             LIMIT 1`,
          );

          if (!r.rows.length) {
            return jsonError(`Scrutin n°${numero} introuvable (législature ${legislature})`, 404, "NOT_FOUND");
          }

          const s = r.rows[0];
          const pour  = Number(s.nombre_pours ?? 0);
          const contre = Number(s.nombre_contres ?? 0);
          const abst   = Number(s.nombre_abstentions ?? 0);

          return new Response(
            JSON.stringify({
              data: {
                numero:      s.numero,
                titre:       s.titre,
                date:        s.date,
                legislature,
                sort:        s.sort,
                type:        s.type,
                adopte:      /adopt/i.test(String(s.sort ?? "")),
                votes: {
                  pour,
                  contre,
                  abstentions: abst,
                  total:       pour + contre + abst,
                  majorite:    Math.floor((pour + contre + abst) / 2) + 1,
                },
                url: `https://mandat-fr.is-a.dev/scrutin/${s.numero}`,
              },
            }, null, 2),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=300",
                "Access-Control-Allow-Origin": "*",
                ...rateLimitHeaders(rl.limit, rl.remaining, rl.reset),
              },
            },
          );
        } catch (e) {
          console.error("[api/v1/scrutins/$numero] error:", e);
          return jsonError("Erreur interne", 500, "INTERNAL_ERROR");
        }
      },
    },
  },
});
