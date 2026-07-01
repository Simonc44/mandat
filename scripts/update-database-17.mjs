#!/usr/bin/env node
/**
 * scripts/update-database-17.mjs
 * ================================================================
 * Pipeline complet et automatisé de mise à jour de la base de données
 * de la 17e législature (députés + scrutins).
 *
 *   1. Télécharge les jeux de données officiels sur data.assemblee-nationale.fr
 *   2. Les parse dans le schéma riche attendu par la base Turso
 *   3. Écrit public/deputes-17.json et public/scrutins-17.json
 *   4. Pousse les données vers Turso (si TURSO_DATABASE_URL / TURSO_AUTH_TOKEN définis)
 *
 * Remplace fetch-data-17.mjs + parse-local-data.mjs + migrate-to-turso.mjs :
 *   - Plus de téléchargement manuel / dossiers Windows en dur
 *   - Plus de désactivation de la vérification SSL (faille corrigée)
 *   - Schéma de sortie aligné avec celui attendu par la table `deputes`/`scrutins`
 *   - Garde-fous : abandon si les données récupérées semblent incomplètes/vides,
 *     pour ne jamais écraser une base saine avec des données cassées.
 *
 * Usage :
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/update-database-17.mjs
 *
 *   Sans les variables Turso, le script télécharge et régénère uniquement
 *   les fichiers JSON dans public/ (utile pour tester en local).
 */

import {
  createWriteStream,
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
  statSync,
} from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const TMP = path.join(ROOT, ".tmp-data-17");

const SOURCES = {
  deputes: {
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip",
    outZip: path.join(TMP, "deputes.zip"),
    outDir: path.join(TMP, "deputes"),
  },
  scrutins: {
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip",
    outZip: path.join(TMP, "scrutins.zip"),
    outDir: path.join(TMP, "scrutins"),
  },
};

// Seuils de garde-fous : si le nombre d'éléments parsés tombe sous ces valeurs,
// on considère la source suspecte et on abandonne AVANT d'écraser la base.
const MIN_DEPUTES = 400; // l'Assemblée compte 577 sièges
const MIN_SCRUTINS = 1;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}
function ensure(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ─── Téléchargement (SSL vérifié, pas de bypass) ─────────────────────────────

async function download(url, dest, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      log(`⬇️  Tentative ${i + 1} : téléchargement de ${url.split("/").pop()}...`);
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      log("✅ Téléchargement réussi.");
      return;
    } catch (error) {
      log(`⚠️  Erreur : ${error.message}.`);
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function unzip(zipPath, outDir) {
  const { default: AdmZip } = await import("adm-zip");
  new AdmZip(zipPath).extractAllTo(outDir, true);
}

function findJsonFiles(dir, folderMustInclude) {
  const results = [];
  if (!existsSync(dir)) return results;
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = path.join(d, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".json")) {
        if (!folderMustInclude || d.toLowerCase().includes(folderMustInclude)) {
          results.push(full);
        }
      }
    }
  }
  walk(dir);
  return results;
}

// ─── Utilitaires de parsing (mêmes règles que scripts/parse-local-data.mjs) ──

function sanitize(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

function slugify(prenom, nom) {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DEPT_NOMS = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes",
  "09": "Ariège", 10: "Aube", 11: "Aude", 12: "Aveyron", 13: "Bouches-du-Rhône",
  14: "Calvados", 15: "Cantal", 16: "Charente", 17: "Charente-Maritime", 18: "Cher",
  19: "Corrèze", "2A": "Corse-du-Sud", "2B": "Haute-Corse", 21: "Côte-d'Or",
  22: "Côtes-d'Armor", 23: "Creuse", 24: "Dordogne", 25: "Doubs", 26: "Drôme",
  27: "Eure", 28: "Eure-et-Loir", 29: "Finistère", 30: "Gard", 31: "Haute-Garonne",
  32: "Gers", 33: "Gironde", 34: "Hérault", 35: "Ille-et-Vilaine", 36: "Indre",
  37: "Indre-et-Loire", 38: "Isère", 39: "Jura", 40: "Landes", 41: "Loir-et-Cher",
  42: "Loire", 43: "Haute-Loire", 44: "Loire-Atlantique", 45: "Loiret", 46: "Lot",
  47: "Lot-et-Garonne", 48: "Lozère", 49: "Maine-et-Loire", 50: "Manche",
  51: "Marne", 52: "Haute-Marne", 53: "Mayenne", 54: "Meurthe-et-Moselle",
  55: "Meuse", 56: "Morbihan", 57: "Moselle", 58: "Nièvre", 59: "Nord",
  60: "Oise", 61: "Orne", 62: "Pas-de-Calais", 63: "Puy-de-Dôme",
  64: "Pyrénées-Atlantiques", 65: "Hautes-Pyrénées", 66: "Pyrénées-Orientales",
  67: "Bas-Rhin", 68: "Haut-Rhin", 69: "Rhône", 70: "Haute-Saône",
  71: "Saône-et-Loire", 72: "Sarthe", 73: "Savoie", 74: "Haute-Savoie",
  75: "Paris", 76: "Seine-Maritime", 77: "Seine-et-Marne", 78: "Yvelines",
  79: "Deux-Sèvres", 80: "Somme", 81: "Tarn", 82: "Tarn-et-Garonne", 83: "Var",
  84: "Vaucluse", 85: "Vendée", 86: "Vienne", 87: "Haute-Vienne", 88: "Vosges",
  89: "Yonne", 90: "Territoire de Belfort", 91: "Essonne", 92: "Hauts-de-Seine",
  93: "Seine-Saint-Denis", 94: "Val-de-Marne", 95: "Val-d'Oise",
  971: "Guadeloupe", 972: "Martinique", 973: "Guyane", 974: "La Réunion",
  976: "Mayotte", 986: "Wallis-et-Futuna", 987: "Polynésie française",
  988: "Nouvelle-Calédonie", ZX: "Français établis hors de France",
};

function buildOrganesMap(rootDir) {
  const map = {};
  for (const file of findJsonFiles(rootDir, "organe")) {
    let data;
    try {
      data = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      continue;
    }
    const organe = data?.organe;
    if (!organe) continue;
    const uid = organe.uid?.["#text"] ?? organe.uid ?? "";
    if (!uid) continue;
    map[uid] = {
      sigle: sanitize(organe.libelleAbrev ?? organe.libelle ?? ""),
      nom: sanitize(organe.libelle ?? ""),
    };
  }
  log(`   ${Object.keys(map).length} organes indexés`);
  return map;
}

function parseActeur(data, organesMap) {
  const acteur = data?.acteur;
  if (!acteur) return null;

  const uid = acteur.uid?.["#text"] ?? acteur.uid ?? "";
  if (!uid) return null;

  const ident = acteur.etatCivil?.ident ?? {};
  const naissance = acteur.etatCivil?.infoNaissance ?? {};
  const prenom = sanitize(ident.prenom ?? "");
  const nom = sanitize(ident.nom ?? "");
  if (!prenom || !nom) return null;

  const mandatsList = acteur.mandats?.mandat ?? [];
  const mandats = Array.isArray(mandatsList) ? mandatsList : [mandatsList];

  let groupeRef = "";
  let groupeSigle = "NI";
  let numDept = "";
  let numCirco = 0;
  let mandatDebut = "";
  let region = "";

  for (const m of mandats) {
    if (!m) continue;
    if (m.typeOrgane === "ASSEMBLEE") {
      mandatDebut = m.dateDebut ?? mandatDebut;
      const lieu = m.election?.lieu ?? {};
      numDept = sanitize(lieu.numDepartement ?? "");
      numCirco = parseInt(lieu.numCirco ?? "0") || 0;
      region = sanitize(lieu.region ?? "");
    }
    if (m.typeOrgane === "GP" && !m.dateFin) {
      groupeRef = m.organes?.organeRef ?? "";
    }
  }

  if (groupeRef && organesMap[groupeRef]) {
    groupeSigle = organesMap[groupeRef].sigle || "NI";
  }
  if (groupeSigle === "NI") {
    for (const m of mandats) {
      if (m?.typeOrgane === "GP") {
        const ref = m.organes?.organeRef ?? "";
        if (ref && organesMap[ref]) {
          groupeSigle = organesMap[ref].sigle || "NI";
          break;
        }
      }
    }
  }

  const nomCirco = DEPT_NOMS[numDept] ?? region ?? `Département ${numDept}`;

  return {
    id: uid,
    id_an: uid,
    nom: `${prenom} ${nom}`,
    nom_de_famille: nom,
    prenom,
    sexe: ident.civ === "Mme" ? "F" : "H",
    date_naissance: naissance.dateNais ?? "",
    lieu_naissance: sanitize(naissance.villeNais ?? ""),
    num_deptmt: numDept,
    nom_circo: nomCirco,
    num_circo: numCirco,
    mandat_debut: mandatDebut,
    mandat_fin: "",
    groupe_sigle: sanitize(groupeSigle),
    groupe_ref: groupeRef,
    parti_ratt_financier: sanitize(groupeSigle),
    profession: sanitize(acteur.profession?.libelleCourant ?? ""),
    url_an: `https://www.assemblee-nationale.fr/dyn/deputes/${uid}`,
    slug: slugify(prenom, nom),
    twitter: "",
  };
}

function parseScrutin(data) {
  const s = data?.scrutin;
  if (!s) return null;

  const numero = String(s.numero ?? "");
  if (!numero) return null;

  const synthese = s.syntheseVote ?? {};
  const decompte = synthese.decompte ?? {};

  const pours = parseInt(decompte.pour ?? "0") || 0;
  const contres = parseInt(decompte.contre ?? "0") || 0;
  const abstentions = parseInt(decompte.abstentions ?? "0") || 0;
  const votants =
    parseInt(synthese.nombreVotants ?? "0") || pours + contres + abstentions;

  const sortCode = sanitize(s.sort?.code ?? s.sort?.libelle ?? "");
  const sortLibelle = sanitize(s.sort?.libelle ?? sortCode);
  const isAdopte =
    (/adopt/i.test(sortCode) && !/non/i.test(sortCode)) ||
    (/adopt/i.test(sortLibelle) && !/non/i.test(sortLibelle));

  const groupes = [];
  const ventilation = s.ventilationVotes?.organe?.groupes?.groupe;
  const groupesList = Array.isArray(ventilation)
    ? ventilation
    : ventilation
      ? [ventilation]
      : [];
  for (const g of groupesList) {
    if (!g) continue;
    const decompteVoix = g.vote?.decompteVoix ?? {};
    groupes.push({
      organeRef: g.organeRef ?? "",
      nombreMembres: parseInt(g.nombreMembresGroupe ?? "0") || 0,
      positionMajoritaire: sanitize(g.vote?.positionMajoritaire ?? ""),
      pour: parseInt(decompteVoix.pour ?? "0") || 0,
      contre: parseInt(decompteVoix.contre ?? "0") || 0,
      abstentions: parseInt(decompteVoix.abstentions ?? "0") || 0,
      nonVotants: parseInt(decompteVoix.nonVotants ?? "0") || 0,
    });
  }

  return {
    uid: s.uid ?? "",
    numero,
    date: s.dateScrutin ?? "",
    legislature: parseInt(s.legislature ?? "17"),
    type: sanitize(s.typeVote?.libelleTypeVote ?? "scrutin public"),
    sort: isAdopte ? "adopté" : "rejeté",
    isAdopte,
    titre: sanitize(s.titre ?? s.objet?.libelle ?? ""),
    dossier: sanitize(s.objet?.dossierLegislatif?.libelle ?? ""),
    demandeur: sanitize(s.demandeur?.texte ?? ""),
    nombre_votants: String(votants),
    nombre_pours: String(pours),
    nombre_contres: String(contres),
    nombre_abstentions: String(abstentions),
    url_institution: `https://www.assemblee-nationale.fr/dyn/17/scrutins/${numero}`,
    groupes,
  };
}

// ─── Turso ────────────────────────────────────────────────────────────────

async function pushToTurso(deputes, scrutins) {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    log(
      "⚠️  TURSO_DATABASE_URL / TURSO_AUTH_TOKEN non définis : fichiers JSON régénérés dans public/, base de données NON mise à jour.",
    );
    return;
  }

  const { createClient } = await import("@libsql/client");
  const db = createClient({ url, authToken });

  log("→ Création du schéma…");
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS deputes (
        id TEXT PRIMARY KEY, id_an TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
        prenom TEXT, nom_de_famille TEXT, nom TEXT, sexe TEXT,
        date_naissance TEXT, lieu_naissance TEXT, num_deptmt TEXT,
        nom_circo TEXT, num_circo INTEGER, mandat_debut TEXT, mandat_fin TEXT,
        groupe_sigle TEXT, groupe_ref TEXT, parti_ratt_financier TEXT,
        profession TEXT, url_an TEXT, twitter TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_deputes_groupe ON deputes(groupe_sigle)`,
      `CREATE INDEX IF NOT EXISTS idx_deputes_dept ON deputes(num_deptmt)`,
      `CREATE TABLE IF NOT EXISTS scrutins (
        numero TEXT PRIMARY KEY, uid TEXT, date TEXT, legislature INTEGER,
        type TEXT, sort TEXT, is_adopte INTEGER, titre TEXT, dossier TEXT,
        demandeur TEXT, nombre_votants INTEGER, nombre_pours INTEGER,
        nombre_contres INTEGER, nombre_abstentions INTEGER,
        url_institution TEXT, groupes_json TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_scrutins_date ON scrutins(date DESC)`,
      `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`,
    ],
    "write",
  );

  log(`→ Insertion de ${deputes.length} député·es (par lots de 50)…`);
  for (let i = 0; i < deputes.length; i += 50) {
    const slice = deputes.slice(i, i + 50);
    await db.batch(
      slice.map((d) => ({
        sql: `INSERT OR REPLACE INTO deputes
          (id, id_an, slug, prenom, nom_de_famille, nom, sexe, date_naissance, lieu_naissance,
           num_deptmt, nom_circo, num_circo, mandat_debut, mandat_fin, groupe_sigle, groupe_ref,
           parti_ratt_financier, profession, url_an, twitter)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          d.id, d.id_an, d.slug, d.prenom, d.nom_de_famille, d.nom, d.sexe,
          d.date_naissance, d.lieu_naissance, d.num_deptmt, d.nom_circo,
          d.num_circo, d.mandat_debut, d.mandat_fin, d.groupe_sigle,
          d.groupe_ref, d.parti_ratt_financier, d.profession, d.url_an, d.twitter,
        ],
      })),
      "write",
    );
  }
  log(`   ✓ ${deputes.length} député·es insérés`);

  log(`→ Insertion de ${scrutins.length} scrutins (par lots de 100)…`);
  for (let i = 0; i < scrutins.length; i += 100) {
    const slice = scrutins.slice(i, i + 100);
    await db.batch(
      slice.map((s) => ({
        sql: `INSERT OR REPLACE INTO scrutins
          (numero, uid, date, legislature, type, sort, is_adopte, titre, dossier, demandeur,
           nombre_votants, nombre_pours, nombre_contres, nombre_abstentions, url_institution, groupes_json)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          s.numero, s.uid, s.date, s.legislature, s.type, s.sort,
          s.isAdopte ? 1 : 0, s.titre, s.dossier, s.demandeur,
          Number(s.nombre_votants) || 0, Number(s.nombre_pours) || 0,
          Number(s.nombre_contres) || 0, Number(s.nombre_abstentions) || 0,
          s.url_institution, s.groupes ? JSON.stringify(s.groupes) : null,
        ],
      })),
      "write",
    );
  }
  log(`   ✓ ${scrutins.length} scrutins insérés`);

  await db.execute({
    sql: `INSERT OR REPLACE INTO meta (key, value) VALUES ('last_updated', ?)`,
    args: [new Date().toISOString()],
  });

  log("✅ Base Turso mise à jour");
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  ensure(TMP);
  ensure(PUBLIC);
  try {
    // Députés
    await download(SOURCES.deputes.url, SOURCES.deputes.outZip);
    await unzip(SOURCES.deputes.outZip, SOURCES.deputes.outDir);
    const organesMap = buildOrganesMap(SOURCES.deputes.outDir);
    const acteurFiles = findJsonFiles(SOURCES.deputes.outDir, "acteur");
    log(`   ${acteurFiles.length} fichiers acteurs trouvés`);
    const deputes = acteurFiles
      .map((f) => {
        try {
          return parseActeur(JSON.parse(readFileSync(f, "utf-8")), organesMap);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (deputes.length < MIN_DEPUTES) {
      throw new Error(
        `Seulement ${deputes.length} député·es parsé·es (minimum attendu : ${MIN_DEPUTES}). ` +
          `La source semble incomplète ou son format a changé — abandon avant d'écraser la base.`,
      );
    }
    writeFileSync(
      path.join(PUBLIC, "deputes-17.json"),
      JSON.stringify(deputes, null, 0),
      "utf-8",
    );
    log(`✅ ${deputes.length} député·es écrits dans public/deputes-17.json`);

    // Scrutins
    await download(SOURCES.scrutins.url, SOURCES.scrutins.outZip);
    await unzip(SOURCES.scrutins.outZip, SOURCES.scrutins.outDir);
    const scrutinFiles = findJsonFiles(SOURCES.scrutins.outDir).filter((f) =>
      path.basename(f).startsWith("VTANR"),
    );
    log(`   ${scrutinFiles.length} fichiers scrutins trouvés`);
    const scrutins = scrutinFiles
      .map((f) => {
        try {
          return parseScrutin(JSON.parse(readFileSync(f, "utf-8")));
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (scrutins.length < MIN_SCRUTINS) {
      throw new Error(
        `Aucun scrutin parsé — la source semble incomplète ou son format a changé — abandon avant d'écraser la base.`,
      );
    }
    scrutins.sort((a, b) => b.date.localeCompare(a.date));
    writeFileSync(
      path.join(PUBLIC, "scrutins-17.json"),
      JSON.stringify(scrutins, null, 0),
      "utf-8",
    );
    log(`✅ ${scrutins.length} scrutins écrits dans public/scrutins-17.json`);

    // Turso
    await pushToTurso(deputes, scrutins);

    log("🎉 Mise à jour de la base 17e législature terminée avec succès !");
  } catch (err) {
    console.error("❌ Erreur fatale :", err.message);
    process.exit(1);
  } finally {
    if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  }
}

main();
