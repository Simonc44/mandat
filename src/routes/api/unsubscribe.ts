// /api/unsubscribe — Se désabonner via token (lien email)
// GET /api/unsubscribe?token=<uuid>
// Redirige vers une page de confirmation après désabonnement

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url   = new URL(request.url);
        const token = (url.searchParams.get("token") ?? "").trim();
        const siteUrl = process.env.SITE_URL ?? "https://mandat-fr.vercel.app";

        if (!token) {
          return new Response(null, { status: 302, headers: { Location: `${siteUrl}/?unsub=invalid` } });
        }

        try {
          const { tursoClient } = await import("@/lib/turso.server");
          const db = tursoClient();

          // Trouver la subscription
          const r = await db.execute(
            `SELECT id, depute_nom, email FROM subscriptions WHERE token = '${token.replace(/'/g, "''")}' AND active = 1 LIMIT 1`,
          );

          if (!r.rows.length) {
            return new Response(null, { status: 302, headers: { Location: `${siteUrl}/?unsub=notfound` } });
          }

          const sub = r.rows[0];

          // Désactiver
          await db.execute(
            `UPDATE subscriptions SET active = 0 WHERE token = '${token.replace(/'/g, "''")}' AND active = 1`,
          );

          // Page de confirmation inline
          const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Désabonnement confirmé — Mandat</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#f8f7ff;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:white;border-radius:20px;padding:40px;max-width:480px;width:100%;box-shadow:0 8px 32px rgba(80,40,200,0.10);text-align:center}
    .logo{background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:10px 18px;display:inline-block;color:white;font-weight:700;font-size:16px;margin-bottom:24px}
    h1{color:#1a1035;font-size:22px;margin:0 0 12px}
    p{color:#6b7280;line-height:1.6;margin:0 0 24px}
    a{display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px}
    .icon{font-size:40px;margin-bottom:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Mandat</div>
    <div class="icon">✅</div>
    <h1>Désabonnement confirmé</h1>
    <p>Vous ne recevrez plus d'alertes pour <strong>${String(sub.depute_nom)}</strong>.<br>Votre email a bien été supprimé de notre liste.</p>
    <a href="${siteUrl}">Retour sur Mandat →</a>
  </div>
</body>
</html>`;

          return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        } catch (e) {
          console.error("[unsubscribe] error:", e);
          return new Response(null, { status: 302, headers: { Location: `${siteUrl}/?unsub=error` } });
        }
      },
    },
  },
});
