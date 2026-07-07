// /api/ai-chat — Chat IA avec Groq (openai/gpt-oss-120b)
// POST { message: string } → Server-Sent Events (streaming)
// Limite : 2 requêtes par jour par visiteur (cookie httpOnly)
// Le contexte injecté automatiquement : 20 derniers scrutins depuis Turso

import { createFileRoute } from "@tanstack/react-router";
import { getCookie, setCookie } from "@tanstack/react-start/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const QUOTA_PER_DAY = 2;

// Récupère le quota restant depuis le cookie (format "DATE:COUNT")
function getQuota(raw: string | undefined): { date: string; count: number } {
  const today = new Date().toISOString().slice(0, 10);
  if (!raw) return { date: today, count: 0 };
  const [d, c] = raw.split(":");
  if (d !== today) return { date: today, count: 0 };
  return { date: today, count: parseInt(c ?? "0", 10) };
}

async function getScrutinsContext(): Promise<string> {
  try {
    const { tursoClient } = await import("@/lib/turso.server");
    const c = tursoClient();
    const r = await c.execute(
      `SELECT numero, titre, date, sort,
              nombre_pours, nombre_contres, nombre_abstentions
       FROM scrutins_17
       ORDER BY numero DESC
       LIMIT 20`,
    );
    if (!r.rows.length) return "Aucun scrutin disponible.";
    const lines = r.rows.map((row) => {
      const n = row.numero;
      const titre = row.titre ?? "Sans titre";
      const date = row.date ?? "date inconnue";
      const sort = row.sort ?? "?";
      const pour = row.nombre_pours ?? 0;
      const contre = row.nombre_contres ?? 0;
      const abst = row.nombre_abstentions ?? 0;
      return `- Scrutin n°${n} (${date}) — "${titre}" → ${sort} | Pour: ${pour} | Contre: ${contre} | Abstentions: ${abst}`;
    });
    return lines.join("\n");
  } catch (e) {
    console.error("[ai-chat] getScrutinsContext error:", e);
    return "Données indisponibles temporairement.";
  }
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        // ── Quota ────────────────────────────────────────────────────────
        const quotaCookie = getCookie("mandat_ai_quota");
        const quota = getQuota(quotaCookie);

        if (quota.count >= QUOTA_PER_DAY) {
          return new Response(
            JSON.stringify({
              error: `Quota atteint — vous avez utilisé vos ${QUOTA_PER_DAY} questions du jour. Revenez demain !`,
              remaining: 0,
            }),
            {
              status: 429,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        // ── Body ─────────────────────────────────────────────────────────
        let body: { message?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "JSON invalide" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const userMessage = (body.message ?? "").trim().slice(0, 500);
        if (!userMessage) {
          return new Response(JSON.stringify({ error: "Message vide" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        // ── Incrémenter quota AVANT l'appel ──────────────────────────────
        const newCount = quota.count + 1;
        const newQuotaVal = `${quota.date}:${newCount}`;
        setCookie("mandat_ai_quota", newQuotaVal, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 60 * 60 * 24 * 2, // 2 jours
          path: "/",
        });

        // ── Contexte scrutins ─────────────────────────────────────────────
        const scrutinsContext = await getScrutinsContext();

        const systemPrompt = `Tu es l'assistant IA de Mandat, un outil citoyen de transparence sur les votes de l'Assemblée nationale française.
Tu as accès aux 20 derniers scrutins de la 17e législature.
Réponds en français, de manière factuelle, neutre et synthétique.
Ne prends jamais parti politiquement. Si on te demande ton opinion politique, décline poliment.
Si une question n'est pas liée aux votes parlementaires, redirige vers le sujet.

Voici les 20 derniers scrutins enregistrés :
${scrutinsContext}

Remaining questions today for this user: ${QUOTA_PER_DAY - newCount}`;

        // ── Appel Groq streaming ──────────────────────────────────────────
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
          return new Response(
            JSON.stringify({ error: "Clé API Groq non configurée" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        let groqResponse: Response;
        try {
          groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 1024,
                stream: true,
              }),
            },
          );
        } catch (e) {
          console.error("[ai-chat] Groq fetch error:", e);
          return new Response(
            JSON.stringify({ error: "Impossible de joindre Groq" }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        if (!groqResponse.ok) {
          const errText = await groqResponse.text();
          console.error("[ai-chat] Groq error:", groqResponse.status, errText);
          return new Response(
            JSON.stringify({ error: `Erreur Groq: ${groqResponse.status}` }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        // ── Passer le stream Groq (SSE) au client ────────────────────────
        // On ajoute le header remaining dans les 2 premiers bytes du stream
        // via un SSE spécial "meta" au début.
        const upstream = groqResponse.body!;
        const remaining = QUOTA_PER_DAY - newCount;

        const stream = new ReadableStream({
          async start(controller) {
            // Premier événement : metadata (quota restant)
            const metaEvent = `data: ${JSON.stringify({ type: "meta", remaining })}\n\n`;
            controller.enqueue(new TextEncoder().encode(metaEvent));

            const reader = upstream.getReader();
            const decoder = new TextDecoder();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
                // Flush sur chaque chunk pour le streaming temps-réel
                const text = decoder.decode(value, { stream: true });
                if (text.includes("[DONE]")) break;
              }
            } finally {
              reader.releaseLock();
              controller.close();
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Quota-Remaining": String(remaining),
            ...CORS,
          },
        });
      },
    },
  },
});
