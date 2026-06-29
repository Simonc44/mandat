#!/usr/bin/env node
import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const TMP = path.join(ROOT, ".tmp-data-17");

// Configuration pour ignorer les erreurs de certificat SSL (nécessaire derrière un proxy)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const SOURCES = {
  deputes: {
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip",
    outZip: path.join(TMP, "deputes.zip"),
    outDir: path.join(TMP, "deputes"),
    outJson: path.join(PUBLIC, "deputes-17.json"),
  },
  scrutins: {
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip",
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
      // Utilisation de fetch avec l'agent HTTPS configuré pour ignorer le certificat
      const res = await fetch(url, { 
        headers: { "User-Agent": "Mozilla/5.0" },
        agent: httpsAgent 
      });
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
  if (!existsSync(dir)) return results;
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

function parseDepute(acteur) {
  const ident = acteur?.etatCivil?.ident ?? {};
  const idAn = String(acteur?.uid?.["#text"] ?? acteur?.uid ?? "");
  const photoUrl = `https://www.assemblee-nationale.fr/static/tribun/17/photos/${idAn}.jpg`;
  return { id: idAn, nom: `${ident.prenom || ""} ${ident.nom || ""}`, slug: slugify(ident.prenom || "", ident.nom || ""), photo: photoUrl, url_an: `https://www.assemblee-nationale.fr/dyn/deputes/${idAn}` };
}

function parseScrutin(s) {
  const scrutin = s?.scrutin ?? s;
  const sortLabel = String(scrutin?.sort?.libelle ?? scrutin?.sort ?? "Non renseigné");
  return { numero: String(scrutin?.numero ?? ""), date: scrutin?.dateScrutin ?? "", sort: sortLabel, approuve: sortLabel.toLowerCase().includes("adopt"), pours: scrutin?.ventilationVotes?.lesGroupes?.groupe?.map(g => g?.vote?.decompteNominatif?.pours?.votant ?? []).flat() || [] };
}

async function main() {
  try {
    ensure(TMP); ensure(PUBLIC);
    
    // Députés
    await download(SOURCES.deputes.url, SOURCES.deputes.outZip);
    await unzip(SOURCES.deputes.outZip, SOURCES.deputes.outDir);
    const deputes = _findJsonFilesSync(SOURCES.deputes.outDir).map(f => { try { return JSON.parse(readFileSync(f, "utf-8"))?.acteur; } catch { return null; } }).filter(Boolean).map(a => parseDepute(a));
    writeFileSync(SOURCES.deputes.outJson, JSON.stringify(deputes, null, 2), "utf8");

    // Scrutins
    await download(SOURCES.scrutins.url, SOURCES.scrutins.outZip);
    await unzip(SOURCES.scrutins.outZip, SOURCES.scrutins.outDir);
    const scrutins = _findJsonFilesSync(SOURCES.scrutins.outDir).map(f => { try { return parseScrutin(JSON.parse(readFileSync(f, "utf-8"))); } catch { return null; } }).filter(Boolean);
    writeFileSync(SOURCES.scrutins.outJson, JSON.stringify(scrutins, null, 2), "utf8");

    log("🎉 Pipeline terminé avec succès !");
  } catch (err) { console.error("❌ Erreur fatale :", err); process.exit(1); } finally { if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true }); }
}

main();