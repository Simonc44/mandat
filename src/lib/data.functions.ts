// src/lib/data.functions.ts
// Server functions qui lisent députés + scrutins depuis Turso.
// Utilisées en SSR pour éviter les fetch HTTP de fichiers statiques.

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { tursoClient } from "./turso.server";
import { sanitizeSearchInput, sanitizeText, sanitizeSlug, sanitizeNumero } from "./api";
import type { Depute, Scrutin } from "./api";

// Cache CDN + navigateur : les données ne changent qu'une fois par jour
// (deploy hook à 04h00). On peut donc servir la même réponse depuis le
// edge cache pendant 5 min, avec revalidation en arrière-plan pendant 1h.
function setEdgeCache(maxAge = 300, swr = 3600) {
  try {
    setResponseHeader(
      "cache-control",
      `public, max-age=60, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    );
  } catch {
    /* ignore : appelé hors contexte requête (ex : loader client) */
  }
}

// ─── Mapping partagé (une seule source de vérité pour le format des lignes) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeputeRow(row: any): Depute {
  return {
    id: String(row.id ?? ""),
    id_an: String(row.id_an ?? ""),
    slug: String(row.slug ?? ""),
    prenom: String(row.prenom ?? ""),
    nom_de_famille: String(row.nom_de_famille ?? ""),
    nom: String(
      row.nom ?? `${row.prenom ?? ""} ${row.nom_de_famille ?? ""}`.trim(),
    ),
    sexe: (row.sexe === "F" ? "F" : "H") as "H" | "F",
    date_naissance: String(row.date_naissance ?? ""),
    lieu_naissance: String(row.lieu_naissance ?? ""),
    num_deptmt: String(row.num_deptmt ?? ""),
    nom_circo: String(row.nom_circo ?? ""),
    num_circo: Number(row.num_circo ?? 0),
    mandat_debut: String(row.mandat_debut ?? ""),
    mandat_fin: row.mandat_fin ? String(row.mandat_fin) : null,
    ancien_depute: 0,
    groupe_sigle: String(row.groupe_sigle ?? "NI"),
    groupe_ref: row.groupe_ref ? String(row.groupe_ref) : undefined,
    parti_ratt_financier: String(row.parti_ratt_financier ?? ""),
    profession: String(row.profession ?? ""),
    url_an: String(row.url_an ?? ""),
    twitter: row.twitter ? String(row.twitter) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScrutinRow(row: any): Scrutin {
  let groupes: Scrutin["groupes"] = [];
  try {
    if (row.groupes_json) groupes = JSON.parse(String(row.groupes_json));
  } catch {
    /* ignore */
  }
  return {
    numero: String(row.numero ?? ""),
    uid: row.uid ? String(row.uid) : undefined,
    date: String(row.date ?? ""),
    legislature: Number(row.legislature ?? 17),
    type: String(row.type ?? ""),
    sort: String(row.sort ?? ""),
    isAdopte: Number(row.is_adopte) === 1,
    titre: String(row.titre ?? ""),
    dossier: row.dossier ? String(row.dossier) : undefined,
    demandeur: row.demandeur ? String(row.demandeur) : undefined,
    nombre_votants: String(row.nombre_votants ?? 0),
    nombre_pours: String(row.nombre_pours ?? 0),
    nombre_contres: String(row.nombre_contres ?? 0),
    nombre_abstentions: String(row.nombre_abstentions ?? 0),
    url_institution: String(row.url_institution ?? ""),
    groupes,
  };
}

// ─── Requêtes complètes (pages listing : /deputes, /scrutins) ───────────────

export const getDeputesFromDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<Depute[]> => {
    setEdgeCache(600, 3600);
    const c = tursoClient();
    const r = await c.execute(
      `SELECT * FROM deputes ORDER BY nom_de_famille COLLATE NOCASE`,
    );
    return r.rows.map(mapDeputeRow);
  },
);

export const getScrutinsFromDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<Scrutin[]> => {
    setEdgeCache(600, 3600);
    const c = tursoClient();
    const r = await c.execute(`SELECT * FROM scrutins ORDER BY date DESC`);
    return r.rows.map(mapScrutinRow);
  },
);

// ─── Requête légère : un seul scrutin par numéro ─────────────────────────────
// FIX bug 404 SSR : la page /scrutin/:numero chargeait AVANT tout le fichier
// scrutins-17.json (24 Mo) + votes-17.json (95 Mo) côté serveur pour trouver
// UN SEUL scrutin. Ça fait planter (mémoire/temps) la fonction serverless à
// chaque premier chargement direct → notFound() → 404. Cette requête Turso
// ne récupère que la ligne demandée (métadonnées uniquement, pas les votes
// nominatifs qui restent hors Turso — voir scripts/migrate-to-turso.mjs).
// FIX bug 404 SSR sur /depute/:slug — même raison que getScrutinByNumero :
// éviter de faire charger `deputes-17.json` (plusieurs Mo) par la fonction
// serverless au premier chargement direct. Une requête Turso monoligne
// suffit pour le loader.
export const getDeputeBySlug = createServerFn({ method: "GET" })
  .validator((data: unknown): { slug: string } => {
    const raw =
      data && typeof data === "object" && "slug" in data
        ? String((data as Record<string, unknown>).slug ?? "")
        : "";
    return { slug: sanitizeSlug(raw) };
  })
  .handler(async ({ data }): Promise<Depute | null> => {
    if (!data.slug) return null;
    setEdgeCache(600, 3600);
    const c = tursoClient();
    const r = await c.execute({
      sql: `SELECT * FROM deputes WHERE slug = ? LIMIT 1`,
      args: [data.slug],
    });
    if (!r.rows.length) return null;
    return mapDeputeRow(r.rows[0]);
  });

export const getScrutinByNumero = createServerFn({ method: "GET" })
  .validator((data: unknown): { numero: string } => {
    const raw =
      data && typeof data === "object" && "numero" in data
        ? String((data as Record<string, unknown>).numero ?? "")
        : "";
    return { numero: sanitizeNumero(raw) || raw };
  })
  .handler(async ({ data }): Promise<Scrutin | null> => {
    setEdgeCache(600, 3600);
    const c = tursoClient();
    const r = await c.execute({
      sql: `SELECT * FROM scrutins WHERE numero = ? OR uid = ? LIMIT 1`,
      args: [data.numero, data.numero],
    });
    if (!r.rows.length) return null;
    return mapScrutinRow(r.rows[0]);
  });

// ─── Requêtes légères (page d'accueil) ───────────────────────────────────────
// La page d'accueil n'affiche que des compteurs + les 6 derniers scrutins.
// Charger les 577 député·es et ~7900 scrutins en entier pour ça alourdissait
// le HTML SSR de plusieurs dizaines de Mo et le temps de réponse serveur.

export type HomeStats = {
  deputesCount: number;
  scrutinsCount: number;
  groupesCount: number;
};

export const getHomeStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeStats> => {
    const c = tursoClient();
    const [d, s, g] = await Promise.all([
      c.execute(`SELECT COUNT(*) as n FROM deputes`),
      c.execute(`SELECT COUNT(*) as n FROM scrutins`),
      c.execute(
        `SELECT COUNT(DISTINCT groupe_sigle) as n FROM deputes WHERE groupe_sigle IS NOT NULL AND groupe_sigle != ''`,
      ),
    ]);
    return {
      deputesCount: Number(d.rows[0]?.n ?? 0),
      scrutinsCount: Number(s.rows[0]?.n ?? 0),
      groupesCount: Number(g.rows[0]?.n ?? 0),
    };
  },
);

export const getLatestScrutins = createServerFn({ method: "GET" }).handler(
  async (): Promise<Scrutin[]> => {
    const c = tursoClient();
    const r = await c.execute(
      `SELECT * FROM scrutins ORDER BY date DESC LIMIT 6`,
    );
    return r.rows.map(mapScrutinRow);
  },
);

// ─── Recherche côté serveur (barre de recherche page d'accueil / /recherche) ─
// Remplace le filtrage client-side qui nécessitait de télécharger tous les
// député·es et scrutins dans le navigateur.

export type SearchResults = { deputes: Depute[]; scrutins: Scrutin[] };

export const searchHome = createServerFn({ method: "GET" })
  .validator((data: unknown): { q: string } => {
    const raw =
      data && typeof data === "object" && "q" in data
        ? String((data as Record<string, unknown>).q ?? "")
        : "";
    return { q: sanitizeSearchInput(raw) };
  })
  .handler(async ({ data }): Promise<SearchResults> => {
    const q = data.q.trim();
    if (q.length < 2) return { deputes: [], scrutins: [] };

    const like = `%${q}%`;
    const c = tursoClient();
    const [dRes, sRes] = await Promise.all([
      c.execute({
        sql: `SELECT * FROM deputes
              WHERE prenom LIKE ? OR nom_de_famille LIKE ?
                 OR nom_circo LIKE ? OR groupe_sigle LIKE ?
              LIMIT 5`,
        args: [like, like, like, like],
      }),
      c.execute({
        sql: `SELECT * FROM scrutins WHERE titre LIKE ? LIMIT 5`,
        args: [like],
      }),
    ]);

    return {
      deputes: dRes.rows.map(mapDeputeRow).map((d) => ({
        ...d,
        slug: sanitizeSlug(d.slug),
      })),
      scrutins: sRes.rows.map(mapScrutinRow).map((s) => ({
        ...s,
        titre: sanitizeText(s.titre, 500),
      })),
    };
  });
