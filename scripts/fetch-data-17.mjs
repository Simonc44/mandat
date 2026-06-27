#!/usr/bin/env node
import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from "fs";
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
    url: "http://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip",
    outZip: path.join(TMP, "deputes.zip"),
    outDir: path.join(TMP, "deputes"),
    outJson: path.join(PUBLIC, "deputes-17.json"),
  },
  scrutins: {
    url: "http://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip",
    outZip: path.join(TMP, "scrutins.zip"),
    outDir: path.join(TMP, "scrutins"),
    outJson: path.join(PUBLIC, "scrutins-17.json"),
  },
};

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function ensure(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }

async function download(url, dest, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      log(`⬇️ Tentative ${i + 1} : Téléchargement de ${url.split('/').pop()}...`);
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MandatPipeline/1.0", "Connection": "close" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      log("✅ Téléchargement réussi.");
      return;
    } catch (error) {
      log(`⚠️ Erreur : ${error.message}. Nouvelle tentative dans 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      if (i === retries - 1) throw error;
    }
  }
}

async function unzip(zipPath, outDir) {
  const { default: AdmZip } = await import("adm-zip");
  new AdmZip(zipPath).extractAllTo(outDir, true);
}

function _findJsonFilesSync(dir, results = []) {
  readdirSync(dir).forEach(entry => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) _findJsonFilesSync(full, results);
    else if (entry.endsWith(".json")) results.push(full);
  });
  return results;
}

function slugify(p, n) {
  return `${p}-${n}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseDepute(acteur, organesByUid) {
  const ident = acteur?.etatCivil?.ident ?? {};
  const idAn = String(acteur?.uid?.["#text"] ?? acteur?.uid ?? "");
  const photoUrl = `https://www.assemblee-nationale.fr/static/tribun/17/photos/${idAn}.jpg`;
  
  return {
    id: idAn,
    nom: `${ident.prenom || ""} ${ident.nom || ""}`,
    prenom: ident.prenom || "",
    nom_de_famille: ident.nom || "",
    slug: slugify(ident.prenom || "", ident.nom || ""),
    groupe_sigle: organesByUid[acteur?.mandats?.mandat?.find(m => m.typeOrgane?.["#text"] === "GP")?.organes?.organeRef?.["#text"]]?.libelleAbrev ?? "NI",
    photo: photoUrl,
    image: photoUrl,
    url_an: `https://www.assemblee-nationale.fr/dyn/deputes/${idAn}`
  };
}

function parseScrutin(s) {
  const scrutin = s?.scrutin ?? s;
  const sortLabel = String(scrutin?.sort?.libelle ?? scrutin?.sort ?? "Non renseigné");
  const estAdopte = sortLabel.toLowerCase().includes("adopt") && !sortLabel.toLowerCase().includes("pas");

  return {
    numero: String(scrutin?.numero ?? ""),
    date: scrutin?.dateScrutin ?? "",
    sort: sortLabel,
    approuve: estAdopte,
    nombre_pours: String(scrutin?.syntheseVote?.pour ?? 0),
    pours: scrutin?.ventilationVotes?.lesGroupes?.groupe?.map(g => g?.vote?.decompteNominatif?.pours?.votant ?? []).flat() || []
  };
}

async function main() {
  try {
    ensure(TMP); ensure(PUBLIC);
    
    // Députés
    await download(SOURCES.deputes.url, SOURCES.deputes.outZip);
    await unzip(SOURCES.deputes.outZip, SOURCES.deputes.outDir);
    const deputes = _findJsonFilesSync(SOURCES.deputes.outDir)
      .map(f => JSON.parse(readFileSync(f, "utf-8"))?.acteur).filter(Boolean)
      .map(a => parseDepute(a, {}));
    writeFileSync(SOURCES.deputes.outJson, JSON.stringify(deputes, null, 2), "utf8");

    // Scrutins
    await download(SOURCES.scrutins.url, SOURCES.scrutins.outZip);
    await unzip(SOURCES.scrutins.outZip, SOURCES.scrutins.outDir);
    const scrutins = _findJsonFilesSync(SOURCES.scrutins.outDir)
      .map(f => parseScrutin(JSON.parse(readFileSync(f, "utf-8"))));
    writeFileSync(SOURCES.scrutins.outJson, JSON.stringify(scrutins, null, 2), "utf8");

    log("🎉 Pipeline terminé avec succès !");
  } catch (err) {
    console.error("❌ Erreur fatale :", err);
    process.exit(1);
  } finally {
    if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  }
}

main();