// /api/ai-chat — Chat IA avec Groq
// Contexte complet : députés 17e, scrutins 17e + 16e, articles blog
// Quota : géré uniquement par Groq (429 natif) — pas de limite arbitraire

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── Helpers contexte ─────────────────────────────────────────────────────

async function getScrutins17Context(): Promise<string> {
  try {
    const { tursoClient } = await import("@/lib/turso.server");
    const c = tursoClient();
    const r = await c.execute(
      `SELECT numero, titre, date, sort,
              nombre_pours, nombre_contres, nombre_abstentions, type
       FROM scrutins_17
       ORDER BY numero DESC
       LIMIT 50`,
    );
    if (!r.rows.length) return "Aucun scrutin 17e législature disponible.";
    return r.rows
      .map(
        (row) =>
          `Scrutin n°${row.numero} (${row.date}) [${row.type ?? "public"}] — "${String(row.titre ?? "Sans titre").slice(0, 120)}" → ${row.sort} | Pour:${row.nombre_pours} Contre:${row.nombre_contres} Abst:${row.nombre_abstentions}`,
      )
      .join("\n");
  } catch (e) {
    console.error("[ai-chat] scrutins17:", e);
    return "Scrutins 17e : données temporairement indisponibles.";
  }
}

async function getDeputesContext(): Promise<string> {
  try {
    const { tursoClient } = await import("@/lib/turso.server");
    const c = tursoClient();
    const r = await c.execute(
      `SELECT prenom, nom_de_famille, groupe_sigle,
              nom_circo, num_deptmt, profession, sexe
       FROM deputes
       ORDER BY nom_de_famille COLLATE NOCASE
       LIMIT 577`,
    );
    if (!r.rows.length) return "Aucune donnée de député disponible.";
    return r.rows
      .map(
        (row) =>
          `${row.prenom} ${row.nom_de_famille} [${row.groupe_sigle ?? "NI"}] — ${row.nom_circo} (${row.num_deptmt})${
            row.profession ? ` — ${String(row.profession).slice(0, 60)}` : ""
          }`,
      )
      .join("\n");
  } catch (e) {
    console.error("[ai-chat] deputes:", e);
    return "Députés : données temporairement indisponibles.";
  }
}

async function getScrutins16Context(): Promise<string> {
  try {
    // Les scrutins 16 sont en table scrutins avec legislature=16 OU via l'archive
    const { tursoClient } = await import("@/lib/turso.server");
    const c = tursoClient();
    // Essai depuis la table scrutins (qui stocke les deux législatures)
    const r = await c.execute(
      `SELECT numero, titre, date, sort,
              nombre_pours, nombre_contres, nombre_abstentions
       FROM scrutins
       WHERE legislature = 16 OR CAST(numero AS INTEGER) < 10000
       ORDER BY date DESC
       LIMIT 30`,
    );
    if (r.rows.length > 0) {
      return r.rows
        .map(
          (row) =>
            `Scrutin 16e n°${row.numero} (${row.date}) — "${String(row.titre ?? "Sans titre").slice(0, 100)}" → ${row.sort} | Pour:${row.nombre_pours} Contre:${row.nombre_contres} Abst:${row.nombre_abstentions}`,
        )
        .join("\n");
    }
    // Fallback : API nosdeputes.fr
    const res = await fetch("https://www.nosdeputes.fr/16/scrutins/json", {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return "Scrutins 16e : API nosdeputes.fr indisponible.";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: any[] = (data?.scrutins ?? []).slice(0, 30);
    return list
      .map((x) => {
        const s = x?.scrutin ?? x;
        const p = parseInt(s.nombre_pours ?? "0", 10) || 0;
        const cn = parseInt(s.nombre_contres ?? "0", 10) || 0;
        return `Scrutin 16e n°${s.numero} (${s.date}) — "${String(s.titre ?? "").slice(0, 100)}" → ${p > cn ? "adopté" : "rejeté"} | Pour:${p} Contre:${cn}`;
      })
      .join("\n");
  } catch (e) {
    console.error("[ai-chat] scrutins16:", e);
    return "Scrutins 16e : données temporairement indisponibles.";
  }
}

function getBlogContext(): string {
  // Import statique — pas d'I/O, toujours disponible
  try {
    // On utilise require dynamique pour éviter un import top-level dans une route API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { POSTS } = require("@/lib/blog");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (POSTS as any[])
      .map(
        (p: {
          title: string;
          date: string;
          tags: string[];
          description: string;
        }) =>
          `Article : "${p.title}" (${p.date}) [${p.tags.join(", ")}] — ${p.description}`,
      )
      .join("\n");
  } catch {
    return "Articles blog : non disponibles.";
  }
}

// ─── Route ─────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        // ── Lire le message ──────────────────────────────────────────────
        let body: { message?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "JSON invalide" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const userMessage = (body.message ?? "").trim().slice(0, 600);
        if (!userMessage) {
          return new Response(JSON.stringify({ error: "Message vide" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
          return new Response(
            JSON.stringify({
              error: "Clé API Groq non configurée (GROQ_API_KEY)",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        // ── Construire le contexte en parallèle ───────────────────────────────
        const [scrutins17, deputes, scrutins16] = await Promise.all([
          getScrutins17Context(),
          getDeputesContext(),
          getScrutins16Context(),
        ]);
        const blog = getBlogContext();

        const systemPrompt = `Tu es l'assistant IA de Mandat, un outil citoyen de transparence sur les votes de l'Assemblée nationale française (17e législature, 2024-…).

Règles :
- Réponds en français, de manière factuelle, neutre et synthétique.
- Ne prends JAMAIS parti politiquement. Si on te demande ton opinion politique, décline poliment.
- Cite tes sources parmi les données ci-dessous quand c'est pertinent.
- Si une information ne figure pas dans le contexte, dis-le clairement plutôt qu'inventer.
- Reste focus sur le contenu parlementaire ; pour toute autre demande, redirige poliment.

${"=".repeat(60)}
DÉPUTÉS 17e LÉGISLATURE (${new Date().getFullYear()}) — 577 élus
${"=".repeat(60)}
${deputes}

${"=".repeat(60)}
SCRUTINS 17e LÉGISLATURE — 50 derniers
${"=".repeat(60)}
${scrutins17}

${"=".repeat(60)}
SCRUTINS 16e LÉGISLATURE (2022–2024) — 30 derniers
${"=".repeat(60)}
${scrutins16}

${"=".repeat(60)}
ARTICLES DU BLOG MANDAT
${"=".repeat(60)}
${blog}
`;

        // ── Appel AI streaming ──────────────────────────────────────────────
        let aiResponse: Response;
        try {
          aiResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userMessage },
                ],
                temperature: 1,
                max_completion_tokens: 8192,
                top_p: 1,
                reasoning_effort: "medium",
                stop: null,
                stream: true,
              }),
            },
          );
        } catch (e) {
          console.error("[ai-chat] AI fetch error:", e);
          return new Response(
            JSON.stringify({ error: "Impossible de joindre l'API Groq" }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        // Quota AI dépassé (429) — on passe le message d'erreur au client
        if (aiResponse.status === 429) {
          const errBody = await aiResponse.text();
          let reason =
            "Le quota de l'API IA a été atteint. Cela peut prendre quelques secondes à quelques minutes. Merci de réessayer dans un instant.";
          try {
            const parsed = JSON.parse(errBody);
            if (parsed?.error?.message) reason = parsed.error.message;
          } catch {
            /* ignore */
          }
          return new Response(JSON.stringify({ error: reason }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("[ai-chat] AI error:", aiResponse.status, errText);
          return new Response(
            JSON.stringify({ error: `Erreur Groq ${aiResponse.status}` }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

        // ── Stream vers le client ──────────────────────────────────────────────
        const upstream = aiResponse.body!;
        const stream = new ReadableStream({
          async start(controller) {
            const reader = upstream.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
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
            ...CORS,
          },
        });
      },
    },
  },
});
