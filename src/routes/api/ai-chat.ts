// /api/ai-chat — Groq + function calling → Turso à la demande
// Zéro contexte injecté d'emblée : Groq appelle les outils dont il a besoin.

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOOL_ROUNDS = 4; // max aller-retours outils

// ─── Définitions des outils exposés à Groq ─────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_scrutins",
      description:
        "Recherche des scrutins (votes) de l'Assemblée nationale. Utilise cet outil quand l'utilisateur pose une question sur des votes, lois, résultats de scrutins ou l'historique législatif.",
      parameters: {
        type: "object",
        properties: {
          legislature: {
            type: "number",
            description: "Numéro de législature : 17 (actuelle, 2024-…) ou 16 (2022-2024). Défaut : 17.",
          },
          query: {
            type: "string",
            description: "Terme de recherche dans le titre du scrutin (optionnel).",
          },
          limit: {
            type: "number",
            description: "Nombre de résultats à retourner. Défaut 10, max 30.",
          },
          sort_result: {
            type: "string",
            enum: ["adopté", "rejeté"],
            description: "Filtrer par résultat : adopté ou rejeté (optionnel).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_deputes",
      description:
        "Recherche des députés par nom, groupe politique, département ou circonscription. Utilise cet outil quand l'utilisateur demande des informations sur un ou plusieurs élus.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Nom, prénom, groupe sigle (ex: RN, LFI, EPR), département ou commune à rechercher.",
          },
          limit: {
            type: "number",
            description: "Nombre de résultats. Défaut 10, max 30.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_scrutin_detail",
      description:
        "Récupère le détail complet d'un scrutin précis par son numéro (titre, date, résultat, décompte des votes).",
      parameters: {
        type: "object",
        properties: {
          numero: {
            type: "string",
            description: "Numéro du scrutin (ex: '4872').",
          },
          legislature: {
            type: "number",
            description: "Législature : 17 ou 16. Défaut : 17.",
          },
        },
        required: ["numero"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_blog_posts",
      description:
        "Liste les articles du blog Mandat. Utilise cet outil si l'utilisateur demande des analyses, décryptages ou articles.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Nombre d'articles à retourner. Défaut 5." },
        },
        required: [],
      },
    },
  },
];

// ─── Exécuteurs des outils (accès Turso) ───────────────────────────────────

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  const { tursoClient } = await import("@/lib/turso.server");
  const db = tursoClient();

  if (name === "search_scrutins") {
    const legislature = (args.legislature as number) ?? 17;
    const limit = Math.min((args.limit as number) ?? 10, 30);
    const query = (args.query as string | undefined)?.trim();
    const sort_result = args.sort_result as string | undefined;

    let sql = `SELECT numero, titre, date, sort, nombre_pours, nombre_contres, nombre_abstentions
               FROM scrutins WHERE legislature = ${legislature}`;
    if (query) sql += ` AND titre LIKE '%${query.replace(/'/g, "''")}%'`;
    if (sort_result) sql += ` AND sort LIKE '%${sort_result === "adopté" ? "adopt" : "rejet"}%'`;
    sql += ` ORDER BY numero DESC LIMIT ${limit}`;

    const r = await db.execute(sql);
    if (!r.rows.length) return "Aucun scrutin trouvé.";
    return r.rows
      .map(
        (row) =>
          `• Scrutin n°${row.numero} (${row.date}) — "${String(row.titre ?? "").slice(0, 100)}" → ${row.sort} | Pour:${row.nombre_pours} Contre:${row.nombre_contres} Abst:${row.nombre_abstentions}`,
      )
      .join("\n");
  }

  if (name === "get_scrutin_detail") {
    const legislature = (args.legislature as number) ?? 17;
    const numero = String(args.numero ?? "").replace(/'/g, "");
    const r = await db.execute(
      `SELECT numero, titre, date, sort, type, nombre_pours, nombre_contres, nombre_abstentions
       FROM scrutins WHERE legislature = ${legislature} AND numero = '${numero}' LIMIT 1`,
    );
    if (!r.rows.length) return `Scrutin n°${numero} introuvable en législature ${legislature}.`;
    const s = r.rows[0];
    return `Scrutin n°${s.numero} — Législature ${legislature}\nTitre : ${s.titre}\nDate : ${s.date}\nType : ${s.type ?? "N/A"}\nRésultat : ${s.sort}\nPour : ${s.nombre_pours} | Contre : ${s.nombre_contres} | Abstentions : ${s.nombre_abstentions}`;
  }

  if (name === "search_deputes") {
    const limit = Math.min((args.limit as number) ?? 10, 30);
    const query = (args.query as string | undefined)?.trim() ?? "";

    let sql = `SELECT prenom, nom_de_famille, groupe_sigle, nom_circo, num_deptmt, profession
               FROM deputes WHERE 1=1`;
    if (query) {
      const q = query.replace(/'/g, "''");
      sql += ` AND (
        nom_de_famille LIKE '%${q}%'
        OR prenom LIKE '%${q}%'
        OR groupe_sigle LIKE '%${q}%'
        OR nom_circo LIKE '%${q}%'
        OR num_deptmt LIKE '%${q}%'
      )`;
    }
    sql += ` ORDER BY nom_de_famille COLLATE NOCASE LIMIT ${limit}`;

    const r = await db.execute(sql);
    if (!r.rows.length) return "Aucun député trouvé.";
    return r.rows
      .map(
        (row) =>
          `• ${row.prenom} ${row.nom_de_famille} [${row.groupe_sigle ?? "NI"}] — ${row.nom_circo} (dép. ${row.num_deptmt})${
            row.profession ? ` — ${String(row.profession).slice(0, 50)}` : ""
          }`,
      )
      .join("\n");
  }

  if (name === "get_blog_posts") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { POSTS } = require("@/lib/blog");
      const limit = Math.min((args.limit as number) ?? 5, 20);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (POSTS as any[])
        .slice(0, limit)
        .map(
          (p: { title: string; date: string; description: string; tags: string[] }) =>
            `• "${p.title}" (${p.date}) [${p.tags.join(", ")}] — ${p.description}`,
        )
        .join("\n");
    } catch {
      return "Articles blog indisponibles.";
    }
  }

  return `Outil "${name}" inconnu.`;
}

// ─── Route ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }: { request: Request }) => {
        // Lire le body
        let body: { message?: string };
        try { body = await request.json(); }
        catch {
          return new Response(JSON.stringify({ error: "JSON invalide" }), {
            status: 400, headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const userMessage = (body.message ?? "").trim().slice(0, 500);
        if (!userMessage) {
          return new Response(JSON.stringify({ error: "Message vide" }), {
            status: 400, headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
          return new Response(JSON.stringify({ error: "GROQ_API_KEY non configurée" }), {
            status: 500, headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        // System prompt minimal — pas de données injectées
        const systemPrompt = `Tu es l'assistant IA de Mandat, outil citoyen de transparence sur les votes de l'Assemblée nationale française.

Tu as accès à des outils pour interroger la base de données en temps réel :
- search_scrutins : chercher des votes/lois par législature, mot-clé ou résultat
- get_scrutin_detail : détail complet d'un scrutin par numéro
- search_deputes : chercher des députés par nom, groupe, département
- get_blog_posts : lister les articles du blog Mandat

Règles :
- Utilise TOUJOURS les outils pour répondre aux questions factuelles — ne suppose jamais les données.
- Réponds en français, de façon factuelle, neutre et structurée (Markdown).
- Ne prends JAMAIS parti politiquement.
- Si une information n'est pas dans les résultats des outils, dis-le clairement.`;

        // Messages conversation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];

        // ── Boucle function calling ─────────────────────────────────────────
        let round = 0;
        while (round < MAX_TOOL_ROUNDS) {
          round++;
          const isLastRound = round >= MAX_TOOL_ROUNDS;

          let groqRes: Response;
          try {
            groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: MODEL,
                messages,
                tools: isLastRound ? undefined : TOOLS,
                tool_choice: isLastRound ? undefined : "auto",
                temperature: 0.4,
                max_tokens: 1024,
                stream: isLastRound, // stream seulement sur la réponse finale
              }),
            });
          } catch (e) {
            console.error("[ai-chat] groq fetch:", e);
            return new Response(JSON.stringify({ error: "Impossible de joindre Groq" }), {
              status: 502, headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          // Quota
          if (groqRes.status === 429) {
            const txt = await groqRes.text().catch(() => "");
            let reason = "Quota de l'API IA atteint. Réessayez dans quelques secondes.";
            try { const p = JSON.parse(txt); if (p?.error?.message) reason = p.error.message; } catch {}
            return new Response(JSON.stringify({ error: reason }), {
              status: 429, headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          if (!groqRes.ok) {
            return new Response(JSON.stringify({ error: `Erreur Groq ${groqRes.status}` }), {
              status: 502, headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          // Réponse finale streamée
          if (isLastRound) {
            return new Response(groqRes.body, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                ...CORS,
              },
            });
          }

          // Lire la réponse non-streamée pour traiter les tool calls
          const data = await groqRes.json();
          const choice = data?.choices?.[0];
          const assistantMsg = choice?.message;

          if (!assistantMsg) break;
          messages.push(assistantMsg);

          // Pas de tool calls → répondre directement en streaming
          if (!assistantMsg.tool_calls?.length || choice.finish_reason === "stop") {
            // Re-appel en streaming sans outils
            const finalRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
              body: JSON.stringify({
                model: MODEL,
                messages,
                temperature: 0.4,
                max_tokens: 1024,
                stream: true,
              }),
            });
            return new Response(finalRes.body, {
              status: 200,
              headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", ...CORS },
            });
          }

          // Exécuter les tool calls en parallèle
          const toolResults = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assistantMsg.tool_calls.map(async (tc: any) => {
              let result: string;
              try {
                const args = JSON.parse(tc.function.arguments ?? "{}");
                result = await runTool(tc.function.name, args);
              } catch (e) {
                result = `Erreur lors de l'exécution de ${tc.function.name}: ${String(e)}`;
              }
              return {
                role: "tool" as const,
                tool_call_id: tc.id,
                content: result,
              };
            }),
          );

          messages.push(...toolResults);
          // Continue la boucle pour que Groq génère la réponse finale
        }

        // Fallback si la boucle se termine sans réponse
        return new Response(JSON.stringify({ error: "Pas de réponse générée." }), {
          status: 502, headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
