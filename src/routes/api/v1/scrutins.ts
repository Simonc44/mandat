// /api/v1/scrutins — Liste et recherche des scrutins
// GET /api/v1/scrutins
//   ?legislature=  17 (défaut) ou 16
//   ?q=            Recherche dans le titre
//   ?sort=         "adopté" | "rejeté"
//   ?from=         Date ISO (YYYY-MM-DD)
//   ?to=           Date ISO (YYYY-MM-DD)
//   ?page=         Page (défaut: 1)
//   ?limit=        Résultats par page (défaut: 20, max: 100)

import { createFileRoute } from "@tanstack/react-router";
import {
  apiGuard,
  jsonError,
  optionsResponse,
  parseIntParam,
  rateLimitHeaders,
} from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/v1/scrutins")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),

      GET: async ({ request }: { request: Request }) => {
        const guard = await apiGuard(request);
        if ("error" in guard) return guard.error;
        const { rl } = guard;

        const url = new URL(request.url);
        const legislature = parseInt(url.searchParams.get("legislature") ?? "17", 10) === 16 ? 16 : 17;
        const q    = (url.searchParams.get("q") ?? "").trim();
        const sort = (url.searchParams.get("sort") ?? "").toLowerCase();
        const from = (url.searchParams.get("from") ?? "").trim();
        const to   = (url.searchParams.get("to") ?? "").trim();
        const limit  = parseIntParam(url, "limit", 20, 100);
        const page   = parseIntParam(url, "page", 1, 1000);
        const offset = (page - 1) * limit;

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          const conditions: string[] = [`legislature = ${legislature}`];
          if (q) conditions.push(`titre LIKE '%${q.replace(/'/g, "''")}%'`);
          if (sort === "adopté" || sort === "adopte") conditions.push(`sort LIKE '%adopt%'`);
          else if (sort === "rejeté" || sort === "rejete") conditions.push(`sort LIKE '%rejet%'`);
          if (from) conditions.push(`date >= '${from.replace(/'/g, "")}'`);
          if (to)   conditions.push(`date <= '${to.replace(/'/g, "")}'`);

          const where = `WHERE ${conditions.join(" AND ")}`;

          const [rows, countRow] = await Promise.all([
            db.execute(
              `SELECT numero, titre, date, sort, type,
                      nombre_pours, nombre_contres, nombre_abstentions
               FROM scrutins ${where}
               ORDER BY numero DESC
               LIMIT ${limit} OFFSET ${offset}`,
            ),
            db.execute(`SELECT COUNT(*) AS n FROM scrutins ${where}`),
          ]);

          const total = Number(countRow.rows[0]?.n ?? 0);
          const pages = Math.ceil(total / limit);

          return new Response(
            JSON.stringify({
              data: rows.rows.map((r) => ({
                numero:      r.numero,
                titre:       r.titre,
                date:        r.date,
                legislature,
                sort:        r.sort,
                type:        r.type,
                votes: {
                  pour:        Number(r.nombre_pours ?? 0),
                  contre:      Number(r.nombre_contres ?? 0),
                  abstentions: Number(r.nombre_abstentions ?? 0),
                  total:       Number(r.nombre_pours ?? 0) + Number(r.nombre_contres ?? 0) + Number(r.nombre_abstentions ?? 0),
                },
                url: `https://mandat-fr.is-a.dev/scrutin/${r.numero}`,
              })),
              meta: { total, page, pages, limit, legislature },
            }, null, 2),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
                "Access-Control-Allow-Origin": "*",
                ...rateLimitHeaders(rl.remaining, rl.reset),
              },
            },
          );
        } catch (e) {
          console.error("[api/v1/scrutins] error:", e);
          return jsonError("Erreur interne", 500, "INTERNAL_ERROR");
        }
      },
    },
  },
});
