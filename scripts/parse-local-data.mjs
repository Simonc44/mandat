#!/usr/bin/env node
/**
 * parse-local-data.mjs — Mandat 17e législature
 * ================================================
 * Lit les fichiers JSON locaux (dézippés) et génère :
 *   → public/deputes-17.json   (liste allégée des députés actifs)
 *   → public/scrutins-17.json  (liste allégée des scrutins)
 *   → public/votes-17.json     (index votes : scrutinNum → {pours, contres, abstentions, nonVotants})
 *   → public/sitemap.xml       (sitemap complet)
 *
 * Usage :
 *   node scripts/parse-local-data.mjs
 *
 * Chemins attendus (modifiables via variables d'environnement) :
 *   ACTEURS_DIR  = dossier contenant les PA*.json
 *   ORGANES_DIR  = dossier contenant les organes
 *   SCRUTINS_DIR = dossier contenant les VTANR*.json
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const SITE_URL = "https://mandat-fr.vercel.app";

// ─── Chemins sources (adapter si besoin) ─────────────────────────────────────
const ACTEURS_DIR =
  process.env.ACTEURS_DIR ||
  "C:\\Users\\admin\\Downloads\\AMO10_deputes_actifs_mandats_actifs_organes.json\\json\\acteur";
const ORGANES_DIR =
  process.env.ORGANES_DIR ||
  "C:\\Users\\admin\\Downloads\\AMO10_deputes_actifs_mandats_actifs_organes.json\\json\\organe";
const SCRUTINS_DIR =
  process.env.SCRUTINS_DIR ||
  "C:\\Users\\admin\\Downloads\\Scrutins.json\\json";

// ─── Utilitaires sécurisés ────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}
function warn(msg) {
  console.warn(`[WARN] ${msg}`);
}

/** Sanitize un texte — supprime balises HTML et caractères dangereux */
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

/** Lit un fichier JSON de façon sécurisée */
function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    return null;
  }
}

/** Slugifie un nom complet */
function slugify(prenom, nom) {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── MAP ORGANES (groupes politiques) ────────────────────────────────────────

function buildOrganesMap() {
  const map = {};
  if (!existsSync(ORGANES_DIR)) {
    warn(`Dossier organes introuvable : ${ORGANES_DIR}`);
    return map;
  }
  const files = readdirSync(ORGANES_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const data = readJson(path.join(ORGANES_DIR, file));
    const organe = data?.organe;
    if (!organe) continue;
    const uid = organe.uid?.["#text"] ?? organe.uid ?? "";
    if (!uid) continue;
    map[uid] = {
      sigle: sanitize(organe.libelleAbrev ?? organe.libelle ?? ""),
      nom: sanitize(organe.libelle ?? ""),
      type: organe.codeType ?? "",
    };
  }
  log(`   ${Object.keys(map).length} organes indexés`);
  return map;
}

// ─── PARSE DEPUTÉS ────────────────────────────────────────────────────────────

const DEPT_NOMS = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardèche",
  "08": "Ardennes",
  "09": "Ariège",
  10: "Aube",
  11: "Aude",
  12: "Aveyron",
  13: "Bouches-du-Rhône",
  14: "Calvados",
  15: "Cantal",
  16: "Charente",
  17: "Charente-Maritime",
  18: "Cher",
  19: "Corrèze",
  "2A": "Corse-du-Sud",
  "2B": "Haute-Corse",
  21: "Côte-d'Or",
  22: "Côtes-d'Armor",
  23: "Creuse",
  24: "Dordogne",
  25: "Doubs",
  26: "Drôme",
  27: "Eure",
  28: "Eure-et-Loir",
  29: "Finistère",
  30: "Gard",
  31: "Haute-Garonne",
  32: "Gers",
  33: "Gironde",
  34: "Hérault",
  35: "Ille-et-Vilaine",
  36: "Indre",
  37: "Indre-et-Loire",
  38: "Isère",
  39: "Jura",
  40: "Landes",
  41: "Loir-et-Cher",
  42: "Loire",
  43: "Haute-Loire",
  44: "Loire-Atlantique",
  45: "Loiret",
  46: "Lot",
  47: "Lot-et-Garonne",
  48: "Lozère",
  49: "Maine-et-Loire",
  50: "Manche",
  51: "Marne",
  52: "Haute-Marne",
  53: "Mayenne",
  54: "Meurthe-et-Moselle",
  55: "Meuse",
  56: "Morbihan",
  57: "Moselle",
  58: "Nièvre",
  59: "Nord",
  60: "Oise",
  61: "Orne",
  62: "Pas-de-Calais",
  63: "Puy-de-Dôme",
  64: "Pyrénées-Atlantiques",
  65: "Hautes-Pyrénées",
  66: "Pyrénées-Orientales",
  67: "Bas-Rhin",
  68: "Haut-Rhin",
  69: "Rhône",
  70: "Haute-Saône",
  71: "Saône-et-Loire",
  72: "Sarthe",
  73: "Savoie",
  74: "Haute-Savoie",
  75: "Paris",
  76: "Seine-Maritime",
  77: "Seine-et-Marne",
  78: "Yvelines",
  79: "Deux-Sèvres",
  80: "Somme",
  81: "Tarn",
  82: "Tarn-et-Garonne",
  83: "Var",
  84: "Vaucluse",
  85: "Vendée",
  86: "Vienne",
  87: "Haute-Vienne",
  88: "Vosges",
  89: "Yonne",
  90: "Territoire de Belfort",
  91: "Essonne",
  92: "Hauts-de-Seine",
  93: "Seine-Saint-Denis",
  94: "Val-de-Marne",
  95: "Val-d'Oise",
  971: "Guadeloupe",
  972: "Martinique",
  973: "Guyane",
  974: "La Réunion",
  976: "Mayotte",
  986: "Wallis-et-Futuna",
  987: "Polynésie française",
  988: "Nouvelle-Calédonie",
  ZX: "Français établis hors de France",
};

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

  // Mandats : chercher le mandat de député (ASSEMBLEE) et le mandat GP
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

    // Mandat de député à l'Assemblée
    if (m.typeOrgane === "ASSEMBLEE") {
      mandatDebut = m.dateDebut ?? mandatDebut;
      const lieu = m.election?.lieu ?? {};
      numDept = sanitize(lieu.numDepartement ?? "");
      numCirco = parseInt(lieu.numCirco ?? "0") || 0;
      region = sanitize(lieu.region ?? "");
    }

    // Groupe politique
    if (m.typeOrgane === "GP" && !m.dateFin) {
      groupeRef = m.organes?.organeRef ?? "";
    }
  }

  // Résoudre le sigle depuis la map des organes
  if (groupeRef && organesMap[groupeRef]) {
    groupeSigle = organesMap[groupeRef].sigle || "NI";
  }

  // Fallback sigle depuis PARPOL ou autre mandat GP avec dateFin
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
    ancien_depute: 0,
    groupe_sigle: sanitize(groupeSigle),
    groupe_ref: groupeRef,
    parti_ratt_financier: sanitize(groupeSigle),
    profession: sanitize(acteur.profession?.libelleCourant ?? ""),
    url_an: `https://www.assemblee-nationale.fr/dyn/deputes/${uid}`,
    slug: slugify(prenom, nom),
    photo_url: `https://www2.assemblee-nationale.fr/static/tribun/17/photos/${uid}.jpg`,
  };
}

// ─── PARSE SCRUTINS ───────────────────────────────────────────────────────────

function parseScrutin(data) {
  const s = data?.scrutin;
  if (!s) return null;

  const uid = s.uid ?? "";
  const numero = String(s.numero ?? "");
  if (!numero) return null;

  const synthese = s.syntheseVote ?? {};
  const decompte = synthese.decompte ?? {};

  const pours = parseInt(decompte.pour ?? "0") || 0;
  const contres = parseInt(decompte.contre ?? "0") || 0;
  const abstentions = parseInt(decompte.abstentions ?? "0") || 0;
  const nonVotants = parseInt(decompte.nonVotants ?? "0") || 0;
  const nonVotantsVolontaires =
    parseInt(decompte.nonVotantsVolontaires ?? "0") || 0;
  const votants =
    parseInt(synthese.nombreVotants ?? "0") || pours + contres + abstentions;

  // Résultat (sort)
  const sortCode = sanitize(s.sort?.code ?? s.sort?.libelle ?? "");
  const sortLibelle = sanitize(s.sort?.libelle ?? sortCode);
  const isAdopte =
    (/adopt/i.test(sortCode) && !/non/i.test(sortCode)) ||
    (/adopt/i.test(sortLibelle) && !/non/i.test(sortLibelle));
  const sort = isAdopte ? "adopté" : "rejeté";

  // Titre
  const titre = sanitize(s.titre ?? s.objet?.libelle ?? "");

  // Type
  const type = sanitize(s.typeVote?.libelleTypeVote ?? "scrutin public");

  // Dossier législatif
  const dossier = sanitize(s.objet?.dossierLegislatif?.libelle ?? "");

  // Votes par groupe (pour le détail)
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
    const groupe = {
      organeRef: g.organeRef ?? "",
      nombreMembres: parseInt(g.nombreMembresGroupe ?? "0") || 0,
      positionMajoritaire: sanitize(g.vote?.positionMajoritaire ?? ""),
      pour: parseInt(decompteVoix.pour ?? "0") || 0,
      contre: parseInt(decompteVoix.contre ?? "0") || 0,
      abstentions: parseInt(decompteVoix.abstentions ?? "0") || 0,
      nonVotants: parseInt(decompteVoix.nonVotants ?? "0") || 0,
    };

    // Votes nominatifs par groupe
    const nominatif = g.vote?.decompteNominatif ?? {};
    const extractVotants = (node) => {
      if (!node) return [];
      const list = Array.isArray(node.votant)
        ? node.votant
        : node.votant
          ? [node.votant]
          : [];
      return list.map((v) => ({
        acteurRef: v.acteurRef ?? "",
        parDelegation: v.parDelegation === "true",
      }));
    };
    groupe.pours = extractVotants(nominatif.pours);
    groupe.contres = extractVotants(nominatif.contres);
    groupe.abs = extractVotants(nominatif.abstentions);
    groupe.nv = extractVotants(nominatif.nonVotants);

    groupes.push(groupe);
  }

  return {
    uid,
    numero,
    date: s.dateScrutin ?? "",
    legislature: parseInt(s.legislature ?? "17"),
    session: sanitize(s.sessionRef ?? ""),
    type,
    sort,
    isAdopte,
    titre,
    dossier,
    demandeur: sanitize(s.demandeur?.texte ?? ""),
    nombre_votants: String(votants),
    nombre_pours: String(pours),
    nombre_contres: String(contres),
    nombre_abstentions: String(abstentions),
    nombre_non_votants: String(nonVotants + nonVotantsVolontaires),
    url_institution: `https://www.assemblee-nationale.fr/dyn/17/scrutins/${numero}`,
    groupes,
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  log("🏛️  Mandat — Parse données locales 17e législature");
  log("=====================================================");
  mkdirSync(PUBLIC, { recursive: true });

  // ── 1. ORGANES ──
  log("\n📦 Chargement des organes (groupes politiques)...");
  const organesMap = buildOrganesMap();

  // ── 2. DEPUTÉS ──
  log("\n👤 Parsing des député·es...");
  if (!existsSync(ACTEURS_DIR)) {
    throw new Error(`Dossier acteurs introuvable : ${ACTEURS_DIR}`);
  }
  const acteursFiles = readdirSync(ACTEURS_DIR).filter((f) =>
    f.endsWith(".json"),
  );
  log(`   ${acteursFiles.length} fichiers acteurs trouvés`);

  const deputes = [];
  for (const file of acteursFiles) {
    const data = readJson(path.join(ACTEURS_DIR, file));
    const d = parseActeur(data, organesMap);
    if (d) deputes.push(d);
  }
  deputes.sort((a, b) =>
    a.nom_de_famille.localeCompare(b.nom_de_famille, "fr"),
  );
  log(`   ✅ ${deputes.length} député·es parsés`);

  // Construire une map id_an → député (pour les votes)
  const deputeById = new Map(deputes.map((d) => [d.id_an, d]));

  writeFileSync(
    path.join(PUBLIC, "deputes-17.json"),
    JSON.stringify(deputes, null, 0),
    "utf-8",
  );
  log(`   💾 Sauvegardé : public/deputes-17.json`);

  // ── 3. SCRUTINS ──
  log("\n🗳️  Parsing des scrutins...");
  if (!existsSync(SCRUTINS_DIR)) {
    throw new Error(`Dossier scrutins introuvable : ${SCRUTINS_DIR}`);
  }
  const scrutinsFiles = readdirSync(SCRUTINS_DIR).filter(
    (f) => f.startsWith("VTANR") && f.endsWith(".json"),
  );
  log(`   ${scrutinsFiles.length} fichiers scrutins trouvés`);

  const scrutins = [];
  // Index votes : acteurRef → [{ numero, position }]
  const votesByActeur = {};
  // Votes nominatifs complets par scrutin (pour la page détail)
  const votesByScrutin = {};

  let parsed = 0;
  for (const file of scrutinsFiles) {
    const data = readJson(path.join(SCRUTINS_DIR, file));
    const s = parseScrutin(data);
    if (!s) continue;
    parsed++;

    // Version allégée pour la liste
    const scrutinLight = {
      uid: s.uid,
      numero: s.numero,
      date: s.date,
      legislature: s.legislature,
      type: s.type,
      sort: s.sort,
      isAdopte: s.isAdopte,
      titre: s.titre,
      dossier: s.dossier,
      demandeur: s.demandeur,
      nombre_votants: s.nombre_votants,
      nombre_pours: s.nombre_pours,
      nombre_contres: s.nombre_contres,
      nombre_abstentions: s.nombre_abstentions,
      url_institution: s.url_institution,
      // Stats par groupe (sans nominatif)
      groupes: s.groupes.map((g) => ({
        organeRef: g.organeRef,
        nombreMembres: g.nombreMembres,
        positionMajoritaire: g.positionMajoritaire,
        pour: g.pour,
        contre: g.contre,
        abstentions: g.abstentions,
        nonVotants: g.nonVotants,
      })),
    };
    scrutins.push(scrutinLight);

    // Votes nominatifs : index par acteur et par scrutin
    const votesNominatifs = {
      pours: [],
      contres: [],
      abstentions: [],
      nonVotants: [],
    };
    for (const g of s.groupes) {
      const ref = g.organeRef;
      for (const v of g.pours || []) {
        if (v.acteurRef) {
          votesNominatifs.pours.push({
            acteurRef: v.acteurRef,
            organeRef: ref,
            parDelegation: v.parDelegation,
          });
          if (!votesByActeur[v.acteurRef]) votesByActeur[v.acteurRef] = [];
          votesByActeur[v.acteurRef].push({
            numero: s.numero,
            position: "pour",
          });
        }
      }
      for (const v of g.contres || []) {
        if (v.acteurRef) {
          votesNominatifs.contres.push({
            acteurRef: v.acteurRef,
            organeRef: ref,
            parDelegation: v.parDelegation,
          });
          if (!votesByActeur[v.acteurRef]) votesByActeur[v.acteurRef] = [];
          votesByActeur[v.acteurRef].push({
            numero: s.numero,
            position: "contre",
          });
        }
      }
      for (const v of g.abs || []) {
        if (v.acteurRef) {
          votesNominatifs.abstentions.push({
            acteurRef: v.acteurRef,
            organeRef: ref,
            parDelegation: v.parDelegation,
          });
          if (!votesByActeur[v.acteurRef]) votesByActeur[v.acteurRef] = [];
          votesByActeur[v.acteurRef].push({
            numero: s.numero,
            position: "abstention",
          });
        }
      }
      for (const v of g.nv || []) {
        if (v.acteurRef) {
          votesNominatifs.nonVotants.push({
            acteurRef: v.acteurRef,
            organeRef: ref,
            parDelegation: v.parDelegation,
          });
          if (!votesByActeur[v.acteurRef]) votesByActeur[v.acteurRef] = [];
          votesByActeur[v.acteurRef].push({
            numero: s.numero,
            position: "nonVotant",
          });
        }
      }
    }
    votesByScrutin[s.numero] = votesNominatifs;

    if (parsed % 500 === 0) log(`   ... ${parsed} scrutins traités`);
  }

  // Trier par date décroissante
  scrutins.sort((a, b) => b.date.localeCompare(a.date));
  log(`   ✅ ${scrutins.length} scrutins parsés`);

  writeFileSync(
    path.join(PUBLIC, "scrutins-17.json"),
    JSON.stringify(scrutins, null, 0),
    "utf-8",
  );
  log(`   💾 Sauvegardé : public/scrutins-17.json`);

  // ── 4. VOTES PAR SCRUTIN (index nominatif) ──
  log("\n🗂️  Génération de l'index des votes nominatifs...");
  // On construit un objet léger : numero → { pours: [acteurRef], contres: [...], ... }
  // avec résolution des noms depuis deputeById
  const votesIndex = {};
  for (const [numero, votes] of Object.entries(votesByScrutin)) {
    const resolveDep = (acteurRef, organeRef) => {
      const d = deputeById.get(acteurRef);
      return {
        id: acteurRef,
        slug: d?.slug ?? "",
        nom: d ? `${d.prenom} ${d.nom_de_famille}` : acteurRef,
        groupe: d?.groupe_sigle ?? resolveGroupeSigle(organeRef, organesMap),
      };
    };

    votesIndex[numero] = {
      pours: votes.pours.map((v) => resolveDep(v.acteurRef, v.organeRef)),
      contres: votes.contres.map((v) => resolveDep(v.acteurRef, v.organeRef)),
      abstentions: votes.abstentions.map((v) =>
        resolveDep(v.acteurRef, v.organeRef),
      ),
      nonVotants: votes.nonVotants.map((v) =>
        resolveDep(v.acteurRef, v.organeRef),
      ),
    };
  }

  writeFileSync(
    path.join(PUBLIC, "votes-17.json"),
    JSON.stringify(votesIndex, null, 0),
    "utf-8",
  );
  const votesFileSize =
    Math.round((JSON.stringify(votesIndex).length / 1024 / 1024) * 10) / 10;
  log(`   💾 Sauvegardé : public/votes-17.json (${votesFileSize} MB)`);

  // ── 5. VOTES PAR DÉPUTÉ (index inverse) ──
  log("\n📋 Génération de l'index des votes par député·e...");
  // Un fichier JSON par député : votes-depute/{id_an}.json
  const votesDeputeDir = path.join(PUBLIC, "votes-depute");
  mkdirSync(votesDeputeDir, { recursive: true });

  const scrutinsMap = new Map(scrutins.map((s) => [s.numero, s]));
  let exportedDeputeVotes = 0;

  for (const [acteurRef, votesArr] of Object.entries(votesByActeur)) {
    const entries = votesArr
      .map((v) => {
        const s = scrutinsMap.get(v.numero);
        return {
          numero: v.numero,
          position: v.position,
          date: s?.date ?? "",
          titre: s?.titre ?? "",
          sort: s?.sort ?? "",
          isAdopte: s?.isAdopte ?? false,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    writeFileSync(
      path.join(votesDeputeDir, `${acteurRef}.json`),
      JSON.stringify(entries, null, 0),
      "utf-8",
    );
    exportedDeputeVotes++;
  }
  log(
    `   ✅ ${exportedDeputeVotes} fichiers votes générés dans public/votes-depute/`,
  );

  // ── 6. SITEMAP ──
  log("\n🗺️  Génération du sitemap.xml...");
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/deputes", changefreq: "weekly", priority: "0.9" },
    { loc: "/scrutins", changefreq: "daily", priority: "0.9" },
    { loc: "/recherche", changefreq: "monthly", priority: "0.5" },
  ]
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    )
    .join("\n");

  const deputeUrls = deputes
    .map(
      (d) =>
        `  <url>\n    <loc>${SITE_URL}/depute/${encodeURIComponent(d.slug)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    )
    .join("\n");

  const scrutinUrls = scrutins
    .slice(0, 5000)
    .map(
      (s) =>
        `  <url>\n    <loc>${SITE_URL}/scrutin/${encodeURIComponent(s.numero)}</loc>\n    <lastmod>${s.date || today}</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n  <!-- Pages principales -->\n${staticUrls}\n\n  <!-- Profils député·es -->\n${deputeUrls}\n\n  <!-- Scrutins -->\n${scrutinUrls}\n\n</urlset>`;

  writeFileSync(path.join(PUBLIC, "sitemap.xml"), sitemap, "utf-8");
  const urlCount = (sitemap.match(/<loc>/g) || []).length;
  log(`   ✅ sitemap.xml : ${urlCount} URLs`);

  // ── RÉSUMÉ ──
  log("\n╔══════════════════════════════════════════════════╗");
  log("║  ✅ Pipeline terminé avec succès !               ║");
  log("╠══════════════════════════════════════════════════╣");
  log(
    `║  👤 ${String(deputes.length).padEnd(6)} député·es → deputes-17.json       ║`,
  );
  log(
    `║  🗳️  ${String(scrutins.length).padEnd(6)} scrutins  → scrutins-17.json      ║`,
  );
  log(
    `║  📋 ${String(exportedDeputeVotes).padEnd(6)} fichiers → votes-depute/          ║`,
  );
  log(
    `║  🗺️  ${String(urlCount).padEnd(6)} URLs     → sitemap.xml            ║`,
  );
  log("╚══════════════════════════════════════════════════╝");
  log("\n  ➡️  Prochaine étape : bun dev");
}

function resolveGroupeSigle(organeRef, organesMap) {
  if (!organeRef || !organesMap[organeRef]) return "NI";
  return organesMap[organeRef].sigle || "NI";
}

main().catch((err) => {
  console.error("❌ Erreur fatale :", err);
  process.exit(1);
});
