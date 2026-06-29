#!/usr/bin/env node
/**
 * generate-sitemap.mjs — Mandat
 * Génère public/sitemap.xml depuis les données locales (après fetch-data-17.mjs)
 * Usage : node scripts/generate-sitemap.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const SITE_URL = "https://mandat-fr.vercel.app";
const today = new Date().toISOString().split("T")[0];

console.log("🗺️  Génération du sitemap.xml...");

// ── Pages statiques ──────────────────────────────────────────
const staticPages = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/deputes", changefreq: "weekly", priority: "0.9" },
  { loc: "/scrutins", changefreq: "daily", priority: "0.9" },
  { loc: "/recherche", changefreq: "monthly", priority: "0.5" },
];

// ── Député·es ────────────────────────────────────────────────
let deputeUrls = "";
const deputesPath = path.join(PUBLIC, "deputes-17.json");
if (existsSync(deputesPath)) {
  const deputes = JSON.parse(readFileSync(deputesPath, "utf-8"));
  console.log(`   📋 ${deputes.length} député·es`);
  deputeUrls = deputes
    .filter((d) => d.slug)
    .map(
      (d) => `  <url>
    <loc>${SITE_URL}/depute/${encodeURIComponent(d.slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("\n");
} else {
  console.warn(
    "   ⚠️  deputes-17.json absent — lancez fetch-data-17.mjs d'abord",
  );
}

// ── Scrutins ─────────────────────────────────────────────────
let scrutinUrls = "";
const scrutinsPath = path.join(PUBLIC, "scrutins-17.json");
if (existsSync(scrutinsPath)) {
  const scrutins = JSON.parse(readFileSync(scrutinsPath, "utf-8"));
  console.log(`   📋 ${scrutins.length} scrutins`);
  scrutinUrls = scrutins
    .filter((s) => s.numero)
    .slice(0, 5000) // limite SEO raisonnable
    .map(
      (s) => `  <url>
    <loc>${SITE_URL}/scrutin/${encodeURIComponent(s.numero)}</loc>
    <lastmod>${s.date || today}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("\n");
} else {
  console.warn(
    "   ⚠️  scrutins-17.json absent — lancez fetch-data-17.mjs d'abord",
  );
}

// ── Assemblage ───────────────────────────────────────────────
const staticUrls = staticPages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Pages statiques -->
${staticUrls}

  <!-- Profils des député·es -->
${deputeUrls}

  <!-- Scrutins -->
${scrutinUrls}

</urlset>`;

const sitemapPath = path.join(PUBLIC, "sitemap.xml");
writeFileSync(sitemapPath, sitemap, "utf-8");

const lines = sitemap.split("\n").filter((l) => l.includes("<loc>")).length;
console.log(`✅ sitemap.xml généré : ${lines} URLs → ${sitemapPath}`);
