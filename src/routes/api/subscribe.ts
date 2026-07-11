// /api/subscribe — S'abonner aux alertes votes d'un député
// POST { email, depute_slug }
// Crée la subscription dans Turso + envoie un email de confirmation via Resend

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const Route = createFileRoute("/api/subscribe")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }: { request: Request }) => {
        let body: { email?: string; depute_slug?: string };
        try {
          body = await request.json();
        } catch {
          return err("JSON invalide", 400);
        }

        const email       = (body.email ?? "").trim().toLowerCase();
        const depute_slug = (body.depute_slug ?? "").trim();

        if (!depute_slug) return err("depute_slug requis", 400);

        const { validateEmailForSubscription } = await import("@/lib/email-validator");
        const validation = validateEmailForSubscription(email);
        if (!validation.isValid) {
          return err(validation.error || "Email invalide", 400);
        }

        const { tursoClient } = await import("@/lib/turso.server");
        const db = tursoClient();

        // Récupérer le député de manière sécurisée via requête paramétrée
        const deputeRes = await db.execute({
          sql: "SELECT prenom, nom_de_famille, slug FROM deputes WHERE slug = ? LIMIT 1",
          args: [depute_slug],
        });
        if (!deputeRes.rows.length) return err("Député introuvable", 404);
        const depute = deputeRes.rows[0];
        const depute_nom = `${depute.prenom} ${depute.nom_de_famille}`;

        // Vérifier si déjà abonné de manière sécurisée via requête paramétrée
        const existing = await db.execute({
          sql: "SELECT id FROM subscriptions WHERE email = ? AND depute_slug = ? AND active = 1 LIMIT 1",
          args: [email, depute_slug],
        });
        if (existing.rows.length) {
          return ok({ message: "Déjà abonné", already: true });
        }

        // Créer la subscription de manière sécurisée via requête paramétrée
        const id    = generateId();
        const token = generateId();
        const now   = new Date().toISOString();

        await db.execute({
          sql: `INSERT INTO subscriptions (id, email, depute_slug, depute_nom, token, created_at, active)
                VALUES (?, ?, ?, ?, ?, ?, 1)`,
          args: [id, email, depute_slug, depute_nom, token, now],
        });

        // Envoyer email de confirmation via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const siteUrl = process.env.SITE_URL ?? "https://mandat-fr.vercel.app";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from:    "Mandat <alertes@mandat-fr.vercel.app>",
              to:      [email],
              subject: `✅ Vous suivez ${depute_nom} sur Mandat`,
              html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:system-ui,sans-serif;background:#f8f7ff;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(80,40,200,0.08)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px;padding:12px 20px">
        <span style="color:white;font-weight:700;font-size:18px;letter-spacing:-0.5px">Mandat</span>
      </div>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#1a1035;margin:0 0 8px">Abonnement confirmé ✅</h1>
    <p style="color:#6b7280;margin:0 0 20px;line-height:1.6">
      Vous recevrez désormais un récapé chaque jour où <strong style="color:#1a1035">${depute_nom}</strong> vote à l'Assemblée nationale.
    </p>
    <a href="${siteUrl}/depute/${depute_slug}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;margin-bottom:24px">
      Voir la fiche de ${depute_nom} →
    </a>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      Vous avez reçu cet email car vous vous êtes abonné sur Mandat.
      <a href="${siteUrl}/api/unsubscribe?token=${token}" style="color:#7c3aed">Se désabonner</a>
    </p>
  </div>
</body>
</html>`,
            }),
          }).catch((e) => console.error("[subscribe] resend error:", e));
        }

        return new Response(JSON.stringify({ message: "Abonné avec succès", id }), {
          status: 201,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
