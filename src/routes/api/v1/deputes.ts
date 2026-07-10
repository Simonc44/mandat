// /api/v1/deputes — Liste et recherche des députés
// GET /api/v1/deputes
//   ?q=          Recherche nom, prénom, groupe, circonscription, département
//   ?groupe=     Sigle du groupe (ex: RN, LFI, EPR)
//   ?departement= Numéro ou nom de département
//   ?page=       Page (défaut: 1)
//   ?limit=      Résultats par page (défaut: 20, max: 100)

import { createFileRoute } from "@tanstack/react-router";
import {
  apiGuard,
  jsonOk,
  jsonError,
  optionsResponse,
  parseIntParam,
  rateLimitHeaders,
} from "@/lib/api-auth.server";
import { GROUPES } from "@/lib/api";

export const Route = createFileRoute("/api/v1/deputes")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),

      GET: async ({ request }: { request: Request }) => {
        const guard = await apiGuard(request);
        if ("error" in guard) return guard.error;
        const { rl } = guard;

        const url = new URL(request.url);
        const q          = (url.searchParams.get("q") ?? "").trim();
        const groupe      = (url.searchParams.get("groupe") ?? "").trim().toUpperCase();
        const departement = (url.searchParams.get("departement") ?? "").trim();
        const limit = parseIntParam(url, "limit", 20, 100);
        const page  = parseIntParam(url, "page", 1, 1000);
        const offset = (page - 1) * limit;

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          const conditions: string[] = [];
          if (q) {
            const safe = q.replace(/'/g, "''");
            conditions.push(`(nom_de_famille LIKE '%${safe}%' OR prenom LIKE '%${safe}%' OR nom_circo LIKE '%${safe}%')`);
          }
          if (groupe) conditions.push(`groupe_sigle = '${groupe.replace(/'/g, "''")}'`);
          if (departement) {
            const safe = departement.replace(/'/g, "''");
            conditions.push(`(num_deptmt = '${safe}' OR nom_circo LIKE '%${safe}%')`);
          }

          const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

          const [rows, countRow] = await Promise.all([
            db.execute(
              `SELECT id_an, slug, prenom, nom_de_famille, sexe,
                      groupe_sigle,
                      num_circo, nom_circo, num_deptmt,
                      profession, date_naissance, mandat_debut
               FROM deputes ${where}
               ORDER BY nom_de_famille COLLATE NOCASE, prenom COLLATE NOCASE
               LIMIT ${limit} OFFSET ${offset}`,
            ),
            db.execute(`SELECT COUNT(*) AS n FROM deputes ${where}`),
          ]);

          const total = Number(countRow.rows[0]?.n ?? 0);
          const pages = Math.ceil(total / limit);

          return new Response(
            JSON.stringify({
              data: rows.rows.map((r) => {
                const sigle = String(r.groupe_sigle ?? "NI");
                const gMeta = GROUPES[sigle] ?? { nom: sigle };
                return {
                  id:            r.id_an,
                  slug:          r.slug,
                  prenom:        r.prenom,
                  nom:           r.nom_de_famille,
                  sexe:          r.sexe,
                  groupe: {
                    sigle:   sigle,
                    libelle: gMeta.nom,
                  },
                  circonscription: {
                    numero:     r.num_circo,
                    nom:        r.nom_circo,
                    departement: r.num_deptmt,
                    nom_departement: r.nom_circo,
                  },
                  profession:      r.profession,
                  date_naissance:  r.date_naissance,
                  mandat_debut:    r.mandat_debut,
                  url:             `https://mandat-fr.is-a.dev/depute/${r.slug}`,
                };
              }),
              meta: { total, page, pages, limit },
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
          console.error("[api/v1/deputes] error:", e);
          return jsonError("Erreur interne", 500, "INTERNAL_ERROR");
        }
      },
    },
  },
});
