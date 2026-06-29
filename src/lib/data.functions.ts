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
    return r.rows.map((row): Depute => ({
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
    }));
  },
);

export const getScrutinsFromDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<Scrutin[]> => {
    const c = tursoClient();
    const r = await c.execute(`SELECT * FROM scrutins ORDER BY date DESC`);
    return r.rows.map((row): Scrutin => {
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
    });
  },
);
