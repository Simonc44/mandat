#!/usr/bin/env node
// scripts/send-alerts.mjs
// Script d'envoi des alertes quotidiennes aux abonnés
// Déclenché par GitHub Actions après la mise à jour des données
// Usage : node scripts/send-alerts.mjs

import { createClient } from "@libsql/client";

const SITE_URL = process.env.SITE_URL ?? "https://mandat-fr.vercel.app";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN   = process.env.TURSO_AUTH_TOKEN;

if (!RESEND_API_KEY)       { console.warn("[alerts] RESEND_API_KEY manquant — emails non envoyés"); process.exit(0); }
if (!TURSO_DATABASE_URL)   { console.error("[alerts] TURSO_DATABASE_URL manquant"); process.exit(1); }

const db = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

// ─── 1. Récupérer les scrutins d'aujourd'hui ──────────────────────────────

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

console.log(`[alerts] Recherche des scrutins du ${today}…`);

const scrutinsRes = await db.execute(
  `SELECT numero, titre, date, sort, nombre_pours, nombre_contres, nombre_abstentions
   FROM scrutins_17
   WHERE date = '${today}'
   ORDER BY numero DESC`,
);

if (!scrutinsRes.rows.length) {
  console.log(`[alerts] Aucun scrutin aujourd'hui (${today}). Aucun email envoyé.`);
  process.exit(0);
}

console.log(`[alerts] ${scrutinsRes.rows.length} scrutin(s) aujourd'hui.`);

// ─── 2. Récupérer toutes les subscriptions actives ────────────────────────

const subsRes = await db.execute(
  `SELECT id, email, depute_slug, depute_nom, token FROM subscriptions WHERE active = 1`,
);

if (!subsRes.rows.length) {
  console.log("[alerts] Aucun abonné actif.");
  process.exit(0);
}

console.log(`[alerts] ${subsRes.rows.length} abonné(s) actif(s).`);

// ─── 3. Pour chaque député suivi, vérifier s'il a voté aujourd'hui ────────
// On récupère les votes par depute_slug (via table votes_deputes si elle existe,
// sinon on envoie un récap des scrutins du jour à tous les abonnés)

// Regrouper les abonnés par email pour éviter les doublons
const byEmail = new Map();
for (const sub of subsRes.rows) {
  if (!byEmail.has(sub.email)) byEmail.set(sub.email, []);
  byEmail.get(sub.email).push(sub);
}

// ─── 4. Formater et envoyer les emails ────────────────────────────────

function formatSort(sort) {
  return /adopt/i.test(sort ?? "")
    ? '<span style="color:#059669;font-weight:700">✅ Adopté</span>'
    : '<span style="color:#dc2626;font-weight:700">❌ Rejeté</span>';
}

function buildScrutinsHtml(scrutins) {
  return scrutins.map(s => {
    const p = Number(s.nombre_pours ?? 0);
    const c = Number(s.nombre_contres ?? 0);
    const a = Number(s.nombre_abstentions ?? 0);
    const titre = s.titre ? String(s.titre).charAt(0).toUpperCase() + String(s.titre).slice(1) : `Scrutin n°${s.numero}`;
    return `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px">
        <div style="margin-bottom:8px">${formatSort(s.sort)} &nbsp;·&nbsp; <span style="color:#6b7280;font-size:13px">${s.date}</span></div>
        <p style="margin:0 0 10px;font-weight:600;color:#1a1035;font-size:14px;line-height:1.5">${titre.slice(0, 160)}${titre.length > 160 ? '…' : ''}</p>
        <div style="font-size:12px;color:#6b7280">
          <strong style="color:#059669">${p}</strong> pour ·
          <strong style="color:#dc2626">${c}</strong> contre ·
          <strong style="color:#f59e0b">${a}</strong> abstentions
        </div>
        <a href="${SITE_URL}/scrutin/${s.numero}" style="display:inline-block;margin-top:10px;font-size:12px;color:#7c3aed;text-decoration:none;font-weight:600">Voir le détail →</a>
      </div>`;
  }).join("");
}

let sent = 0;
let errors = 0;

for (const [email, subs] of byEmail) {
  const deputesList = subs.map(s => s.depute_nom).join(", ");
  const scrutinsHtml = buildScrutinsHtml(scrutinsRes.rows);
  const firstToken = subs[0].token; // lien désabonnement (premier député)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:system-ui,sans-serif;background:#f8f7ff;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:20px;padding:32px;box-shadow:0 4px 24px rgba(80,40,200,0.08)">

    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:12px 20px">
        <span style="color:white;font-weight:700;font-size:18px">Mandat</span>
      </div>
    </div>

    <h1 style="font-size:20px;font-weight:700;color:#1a1035;margin:0 0 6px">
      🗳️ Récap des votes du ${today}
    </h1>
    <p style="color:#6b7280;margin:0 0 20px;font-size:14px">
      ${scrutinsRes.rows.length} scrutin(s) ont eu lieu aujourd'hui à l'Assemblée nationale.
      Vous suivez : <strong style="color:#1a1035">${deputesList}</strong>.
    </p>

    ${scrutinsHtml}

    <div style="text-align:center;margin-top:24px">
      <a href="${SITE_URL}/scrutins" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
        Voir tous les scrutins →
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
    <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center">
      Mandat · Transparence citoyenne · Données officielles de l'Assemblée nationale<br>
      <a href="${SITE_URL}/api/unsubscribe?token=${firstToken}" style="color:#7c3aed">Se désabonner</a>
      &nbsp;·&nbsp;
      <a href="${SITE_URL}/confidentialite" style="color:#7c3aed">Politique de confidentialité</a>
    </p>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    "Mandat <alertes@mandat-fr.vercel.app>",
        to:      [email],
        subject: `🗳️ ${scrutinsRes.rows.length} vote(s) à l'Assemblée aujourd'hui — ${today}`,
        html,
      }),
    });

    if (res.ok) {
      sent++;
      console.log(`[alerts] ✅ Email envoyé à ${email}`);
    } else {
      const txt = await res.text();
      console.error(`[alerts] ❌ Resend error pour ${email}:`, res.status, txt);
      errors++;
    }

    // Throttle : 2 emails/s pour éviter les limites Resend
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.error(`[alerts] ❌ Fetch error pour ${email}:`, e);
    errors++;
  }
}

console.log(`[alerts] Terminé. Envoyés: ${sent} | Erreurs: ${errors}`);
process.exit(errors > 0 && sent === 0 ? 1 : 0);
