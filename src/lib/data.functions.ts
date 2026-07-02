// src/lib/data.functions.ts
// Server functions qui lisent députés + scrutins depuis Turso.
// Utilisées en SSR pour éviter les fetch HTTP de fichiers statiques.

import { createServerFn } from "@tanstack/react-start";
import { tursoClient } from "./turso.server";
import type { Depute, Scrutin } from "./api";

export const getDeputesFromDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<Depute[]> => {
    const c = tursoClient();
    const r = await c.execute(
      `SELECT * FROM deputes ORDER BY nom_de_famille COLLATE NOCASE`,
    );
    return r.rows.map((row) => mapRowToDepute(row));
  },
);

export const getScrutinsFromDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<Scrutin[]> => {
    const c = tursoClient();
    const r = await c.execute(`SELECT * FROM scrutins ORDER BY date DESC`);
    return r.rows.map((row): Scrutin => mapRowToScrutin(row));
  },
);

export const getLatestScrutinsFromDb = createServerFn({
  method: "GET",
}).handler(async (): Promise<Scrutin[]> => {
  const c = tursoClient();
  const r = await c.execute(
    `SELECT * FROM scrutins ORDER BY date DESC LIMIT 6`,
  );
  return r.rows.map((row): Scrutin => mapRowToScrutin(row));
});

export const getGlobalStatsFromDb = createServerFn({ method: "GET" }).handler(
  async () => {
    const c = tursoClient();
    const [deputesCount, scrutinsCount, groupesCount] = await Promise.all([
      c.execute("SELECT COUNT(*) as total FROM deputes"),
      c.execute("SELECT COUNT(*) as total FROM scrutins"),
      c.execute("SELECT COUNT(DISTINCT groupe_sigle) as total FROM deputes"),
    ]);

    return {
      deputes: Number(deputesCount.rows[0].total),
      scrutins: Number(scrutinsCount.rows[0].total),
      groupes: Number(groupesCount.rows[0].total),
    };
  },
);

export const getScrutinsPaginatedFromDb = createServerFn({ method: "GET" })
  .validator(
    (v: { page: number; pageSize: number; q?: string; sort?: string }) => v,
  )
  .handler(async ({ data }) => {
    const { page, pageSize, q, sort } = data;
    const c = tursoClient();
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    if (q) {
      whereClause += " AND titre LIKE ?";
      params.push(`%${q}%`);
    }

    if (sort === "adopte") {
      whereClause += " AND is_adopte = 1";
    } else if (sort === "rejete") {
      whereClause += " AND is_adopte = 0";
    }

    const [itemsResult, countResult] = await Promise.all([
      c.execute({
        sql: `SELECT * FROM scrutins ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`,
        args: [...params, pageSize, offset],
      }),
      c.execute({
        sql: `SELECT COUNT(*) as total FROM scrutins ${whereClause}`,
        args: params,
      }),
    ]);

    return {
      items: itemsResult.rows.map((row) => mapRowToScrutin(row)),
      total: Number(countResult.rows[0].total),
    };
  });

export const searchDeputesAndScrutinsFromDb = createServerFn({ method: "GET" })
  .validator((q: string) => q)
  .handler(async ({ data: q }) => {
    const c = tursoClient();
    const n = q.trim();
    if (n.length < 2) return { ds: [], ss: [] };

    const [deputesResult, scrutinsResult] = await Promise.all([
      c.execute({
        sql: `SELECT * FROM deputes WHERE prenom LIKE ? OR nom_de_famille LIKE ? OR nom_circo LIKE ? OR groupe_sigle LIKE ? LIMIT 5`,
        args: [`%${n}%`, `%${n}%`, `%${n}%`, `%${n}%`],
      }),
      c.execute({
        sql: `SELECT * FROM scrutins WHERE titre LIKE ? ORDER BY date DESC LIMIT 5`,
        args: [`%${n}%`],
      }),
    ]);

    return {
      ds: deputesResult.rows.map((row): Depute => mapRowToDepute(row)),
      ss: scrutinsResult.rows.map((row): Scrutin => mapRowToScrutin(row)),
    };
  });

// ─── HELPERS ────────────────────────────────────────────────────────────────

function mapRowToDepute(row: Record<string, unknown>): Depute {
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

function mapRowToScrutin(row: Record<string, unknown>): Scrutin {
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
