import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── Context Helpers ───────────────────────────────────────────────────────

async function getScrutins17Context(): Promise<string> {
  try {
    const { tursoClient } = await import("@/lib/turso.server");
    const c = tursoClient();
    const r = await c.execute(
      `SELECT numero, titre, date, sort, type,
              nombre_pours, nombre_contres, nombre_abstentions
       FROM scrutins
       WHERE legislature = 17
       ORDER BY numero DESC
       LIMIT 8`,
    );
    if (!r.rows.length) return "Aucun scrutin 17e législature disponible.";
    return r.rows
      .map(
        (row) =>
          `Scrutin n°${row.numero} (${row.date}) — "${String(row.titre ?? "Sans titre").slice(0, 60)}" → ${row.sort} | Pour:${row.nombre_pours} Contre:${row.nombre_contres} Abst:${row.nombre_abstentions}`,
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
              nom_circo, num_deptmt
       FROM deputes
       ORDER BY nom_de_famille COLLATE NOCASE
       LIMIT 15`,
    );
    if (!r.rows.length) return "Aucune donnée de député disponible.";
    return r.rows
      .map(
        (row) =>
          `${row.prenom} ${row.nom_de_famille} [${row.groupe_sigle ?? "NI"}] — ${row.nom_circo} (${row.num_deptmt})`,
      )
      .join("\n");
  } catch (e) {
    console.error("[ai-chat] deputes:", e);
    return "Députés : données temporairement indisponibles.";
  }
}

async function getScrutins16Context(): Promise<string> {
  try {
    const { tursoClient } = await import("@/lib/turso.server");
    const c = tursoClient();
    const r = await c.execute(
      `SELECT numero, titre, date, sort,
              nombre_pours, nombre_contres, nombre_abstentions
       FROM scrutins
       WHERE legislature = 16 OR CAST(numero AS INTEGER) < 10000
       ORDER BY date DESC
       LIMIT 3`,
    );
    if (r.rows.length > 0) {
      return r.rows
        .map(
          (row) =>
            `Scrutin 16e n°${row.numero} (${row.date}) — "${String(row.titre ?? "Sans titre").slice(0, 60)}" → ${row.sort} | Pour:${row.nombre_pours} Contre:${row.nombre_contres} Abst:${row.nombre_abstentions}`,
        )
        .join("\n");
    }
    return "Scrutins 16e : non disponibles.";
  } catch (e) {
    console.error("[ai-chat] scrutins16:", e);
    return "Scrutins 16e : données temporairement indisponibles.";
  }
}

function getBlogContext(): string {
  try {
    const { POSTS } = require("@/lib/blog");
    return (POSTS as any[])
      .slice(0, 2)
      .map(
        (p: {
          title: string;
          date: string;
          tags: string[];
          description: string;
        }) =>
          `Article : "${p.title}" (${p.date}) — ${p.description}`,
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

      POST: async ({ request }: { request: Request }) => {
        let body: { message?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "JSON invalide" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const userMessage = (body.message ?? "").trim().slice(0, 400);
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

        const [scrutins17, deputes, scrutins16] = await Promise.all([
          getScrutins17Context(),
          getDeputesContext(),
          getScrutins16Context(),
        ]);
        const blog = getBlogContext();

        const systemPrompt = `Tu es l'assistant IA de Mandat, un outil de transparence sur l'Assemblée nationale.
Réponds de manière factuelle, neutre et synthétique en français.
Utilise le format Markdown pour structurer tes réponses (gras, listes, etc.).

DÉPUTÉS (échantillon):
${deputes}

SCRUTINS 17e (récents):
${scrutins17}

SCRUTINS 16e:
${scrutins16}

BLOG:
${blog}
`;

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
                temperature: 0.7,
                max_completion_tokens: 1024,
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

        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Quota atteint, réessayez plus tard." }), {
            status: 429,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        if (!aiResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Erreur IA" }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...CORS },
            },
          );
        }

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
