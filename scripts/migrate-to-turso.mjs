#!/usr/bin/env node
// scripts/migrate-to-turso.mjs
// Pousse deputes-17.json + scrutins-17.json (métadonnées seulement) vers Turso.
// Les votes nominatifs (308 MB) restent en fichiers statiques.
//
// Usage : TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.mjs

import { readFileSync } from "fs";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("TURSO_DATABASE_URL manquant"); process.exit(1); }

const db = createClient({ url, authToken });

console.log("→ Création du schéma…");
await db.batch([
  `CREATE TABLE IF NOT EXISTS deputes (
    id TEXT PRIMARY KEY,
    id_an TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    prenom TEXT,
    nom_de_famille TEXT,
    nom TEXT,
    sexe TEXT,
    date_naissance TEXT,
    lieu_naissance TEXT,
    num_deptmt TEXT,
    nom_circo TEXT,
    num_circo INTEGER,
    mandat_debut TEXT,
    mandat_fin TEXT,
    groupe_sigle TEXT,
    groupe_ref TEXT,
    parti_ratt_financier TEXT,
    profession TEXT,
    url_an TEXT,
    twitter TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_deputes_groupe ON deputes(groupe_sigle)`,
  `CREATE INDEX IF NOT EXISTS idx_deputes_dept ON deputes(num_deptmt)`,
  `CREATE TABLE IF NOT EXISTS scrutins (
    numero TEXT PRIMARY KEY,
    uid TEXT,
    date TEXT,
    legislature INTEGER,
    type TEXT,
    sort TEXT,
    is_adopte INTEGER,
    titre TEXT,
    dossier TEXT,
    demandeur TEXT,
    nombre_votants INTEGER,
    nombre_pours INTEGER,
    nombre_contres INTEGER,
    nombre_abstentions INTEGER,
    url_institution TEXT,
    groupes_json TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_scrutins_date ON scrutins(date DESC)`,
], "write");

console.log("→ Lecture deputes-17.json…");
const deputes = JSON.parse(readFileSync(path.join(ROOT, "public/deputes-17.json"), "utf-8"));
console.log(`  ${deputes.length} député·es`);

console.log("→ Insertion députés (par lots de 50)…");
const BATCH = 50;
for (let i = 0; i < deputes.length; i += BATCH) {
  const slice = deputes.slice(i, i + BATCH);
  await db.batch(
    slice.map((d) => ({
      sql: `INSERT OR REPLACE INTO deputes
        (id, id_an, slug, prenom, nom_de_famille, nom, sexe, date_naissance, lieu_naissance,
         num_deptmt, nom_circo, num_circo, mandat_debut, mandat_fin, groupe_sigle, groupe_ref,
         parti_ratt_financier, profession, url_an, twitter)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        d.id ?? d.id_an, d.id_an, d.slug, d.prenom ?? null, d.nom_de_famille ?? null,
        d.nom ?? null, d.sexe ?? null, d.date_naissance ?? null, d.lieu_naissance ?? null,
        d.num_deptmt ?? null, d.nom_circo ?? null, d.num_circo ?? null,
        d.mandat_debut ?? null, d.mandat_fin ?? null, d.groupe_sigle ?? null, d.groupe_ref ?? null,
        d.parti_ratt_financier ?? null, d.profession ?? null, d.url_an ?? null, d.twitter ?? null,
      ],
    })),
    "write"
  );
  process.stdout.write(`  ${Math.min(i + BATCH, deputes.length)}/${deputes.length}\r`);
}
console.log(`  ✓ ${deputes.length} députés insérés`);

console.log("→ Lecture scrutins-17.json…");
const scrutins = JSON.parse(readFileSync(path.join(ROOT, "public/scrutins-17.json"), "utf-8"));
console.log(`  ${scrutins.length} scrutins`);

console.log("→ Insertion scrutins (par lots de 100)…");
for (let i = 0; i < scrutins.length; i += 100) {
  const slice = scrutins.slice(i, i + 100);
  await db.batch(
    slice.map((s) => ({
      sql: `INSERT OR REPLACE INTO scrutins
        (numero, uid, date, legislature, type, sort, is_adopte, titre, dossier, demandeur,
         nombre_votants, nombre_pours, nombre_contres, nombre_abstentions, url_institution, groupes_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        String(s.numero), s.uid ?? null, s.date ?? null, s.legislature ?? 17, s.type ?? null,
        s.sort ?? null, s.isAdopte ? 1 : 0, s.titre ?? null, s.dossier ?? null, s.demandeur ?? null,
        Number(s.nombre_votants) || 0, Number(s.nombre_pours) || 0, Number(s.nombre_contres) || 0,
        Number(s.nombre_abstentions) || 0, s.url_institution ?? null,
        s.groupes ? JSON.stringify(s.groupes) : null,
      ],
    })),
    "write"
  );
  process.stdout.write(`  ${Math.min(i + 100, scrutins.length)}/${scrutins.length}\r`);
}
console.log(`  ✓ ${scrutins.length} scrutins insérés`);

console.log("✅ Migration terminée");
process.exit(0);
