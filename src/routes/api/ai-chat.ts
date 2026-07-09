// /api/ai-chat — Groq + function calling → Turso à la demande
import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOOL_ROUNDS = 3;

// ─── Définitions des outils ───────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_scrutins",
      description: "Recherche des scrutins (votes) de l'Assemblée nationale par législature, mot-clé ou résultat.",
      parameters: {
        type: "object",
        properties: {
          legislature: { type: "number", description: "17 (actuelle) ou 16 (2022-2024). Défaut: 17." },
          query: { type: "string", description: "Mot-clé dans le titre du scrutin (optionnel)." },
          limit: { type: "number", description: "Nombre de résultats, max 20. Défaut: 10." },
          sort_result: { type: "string", enum: ["adopté", "rejeté"], description: "Filtrer par résultat (optionnel)." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_scrutin_detail",
      description: "Récupère le détail complet d'un scrutin par son numéro.",
      parameters: {
        type: "object",
        properties: {
          numero: { type: "string", description: "Numéro du scrutin (ex: '4872')." },
          legislature: { type: "number", description: "17 ou 16. Défaut: 17." },
        },
        required: ["numero"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_deputes",
      description: "Recherche des députés par nom, groupe politique, département ou circonscription.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Nom, prénom, sigle groupe (RN, LFI, EPR...), département ou commune." },
          limit: { type: "number", description: "Nombre de résultats, max 20. Défaut: 10." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_blog_posts",
      description: "Liste les articles du blog Mandat.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Nombre d'articles. Défaut: 5." },
        },
        required: [],
      },
    },
  },
];

// ─── Exécuteurs Turso ──────────────────────────────────────────────────────────

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  const { tursoClient } = await import("@/lib/turso.server");
  const db = tursoClient();

  try {
    if (name === "search_scrutins") {
      const legislature = Number(args.legislature ?? 17);
      const limit = Math.min(Number(args.limit ?? 10), 20);
      const query = String(args.query ?? "").trim();
      const sort_result = args.sort_result as string | undefined;

      const conditions: string[] = [`legislature = ${legislature}`];
      if (query) conditions.push(`titre LIKE '%${query.replace(/'/g, "''")}%'`);
      if (sort_result) {
        const keyword = sort_result === "adopté" ? "adopt" : "rejet";
        conditions.push(`sort LIKE '%${keyword}%'`);
      }

      const sql = `SELECT numero, titre, date, sort, nombre_pours, nombre_contres, nombre_abstentions
                   FROM scrutins
                   WHERE ${conditions.join(" AND ")}
                   ORDER BY numero DESC
                   LIMIT ${limit}`;

      const r = await db.execute(sql);
      if (!r.rows.length) return "Aucun scrutin trouvé.";
      return r.rows
        .map((row) => `• Scrutin n°${row.numero} (${row.date}) — "${String(row.titre ?? "").slice(0, 100)}" → ${row.sort} | Pour:${row.nombre_pours} Contre:${row.nombre_contres} Abst:${row.nombre_abstentions}`)
        .join("\n");
    }

    if (name === "get_scrutin_detail") {
      const legislature = Number(args.legislature ?? 17);
      const numero = String(args.numero ?? "").replace(/'/g, "");
      const r = await db.execute(
        `SELECT numero, titre, date, sort, type, nombre_pours, nombre_contres, nombre_abstentions
         FROM scrutins WHERE legislature = ${legislature} AND numero = '${numero}' LIMIT 1`,
      );
      if (!r.rows.length) return `Scrutin n°${numero} introuvable (législature ${legislature}).`;
      const s = r.rows[0];
      return `Scrutin n°${s.numero} | Législature ${legislature}\nTitre : ${s.titre}\nDate : ${s.date}\nType : ${s.type ?? "N/A"}\nRésultat : ${s.sort}\nPour : ${s.nombre_pours} | Contre : ${s.nombre_contres} | Abstentions : ${s.nombre_abstentions}`;
    }

    if (name === "search_deputes") {
      const limit = Math.min(Number(args.limit ?? 10), 20);
      const query = String(args.query ?? "").trim().replace(/'/g, "''");
      const where = query
        ? `WHERE nom_de_famille LIKE '%${query}%' OR prenom LIKE '%${query}%' OR groupe_sigle LIKE '%${query}%' OR nom_circo LIKE '%${query}%' OR num_deptmt LIKE '%${query}%'`
        : "";
      const r = await db.execute(
        `SELECT prenom, nom_de_famille, groupe_sigle, nom_circo, num_deptmt FROM deputes ${where} ORDER BY nom_de_famille COLLATE NOCASE LIMIT ${limit}`,
      );
      if (!r.rows.length) return "Aucun député trouvé.";
      return r.rows
        .map((row) => `• ${row.prenom} ${row.nom_de_famille} [${row.groupe_sigle ?? "NI"}] — ${row.nom_circo} (dép. ${row.num_deptmt})`)
        .join("\n");
    }

    if (name === "get_blog_posts") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { POSTS } = require("@/lib/blog");
      const limit = Math.min(Number(args.limit ?? 5), 20);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (POSTS as any[]).slice(0, limit)
        .map((p: { title: string; date: string; description: string; tags: string[] }) =>
          `• "${p.title}" (${p.date}) — ${p.description}`)
        .join("\n");
    }

    return `Outil "${name}" inconnu.`;
  } catch (e) {
    console.error(`[ai-chat] runTool(${name}) error:`, e);
    return `Erreur lors de l'interrogation de la base de données: ${String(e)}`;
  }
}

// ─── Helper : appel Groq non-streamé ──────────────────────────────────────────

async function groqCall(
  groqKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[],
  withTools: boolean,
): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
      temperature: 0.4,
      max_tokens: 1024,
      stream: false, // toujours non-streamé ici — le stream final est géré séparément
    }),
  });
}

// ─── Helper : appel Groq streamé (réponse finale) ─────────────────────────────

async function groqStream(
  groqKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[],
): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 1024,
      stream: true,
    }),
  });
}

// ─── Route ─────────────────────────────────────────────────────────────────

function sseResponse(body: ReadableStream | null): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...CORS,
    },
  });
}

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }: { request: Request }) => {
        // ─ Lire le body ─
        let body: { message?: string };
        try { body = await request.json(); }
        catch { return jsonError("JSON invalide", 400); }

        const userMessage = (body.message ?? "").trim().slice(0, 500);
        if (!userMessage) return jsonError("Message vide", 400);

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) return jsonError("GROQ_API_KEY non configurée", 500);

        const systemPrompt = `Tu es l'assistant IA de Mandat, outil citoyen de transparence sur l'Assemblée nationale française.
Tu as accès à des outils pour interroger la base de données en temps réel.
Utilise TOUJOURS les outils pour répondre aux questions factuelles — ne suppose jamais les données.
Réponds en français, de façon factuelle, neutre et structurée (Markdown). Ne prends jamais parti politiquement.`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];

        // ─ Boucle function calling (non-streamée) ─
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          let res: Response;
          try { res = await groqCall(groqKey, messages, true); }
          catch (e) {
            console.error("[ai-chat] groqCall error:", e);
            return jsonError("Impossible de joindre Groq", 502);
          }

          // Quota
          if (res.status === 429) {
            const txt = await res.text().catch(() => "");
            let reason = "Quota de l'API IA atteint. Réessayez dans quelques secondes.";
            try { const p = JSON.parse(txt); if (p?.error?.message) reason = p.error.message; } catch {}
            return jsonError(reason, 429);
          }

          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("[ai-chat] groq error:", res.status, txt);
            return jsonError(`Erreur Groq ${res.status}`, 502);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let data: any;
          try { data = await res.json(); }
          catch (e) {
            console.error("[ai-chat] parse error:", e);
            return jsonError("Réponse Groq invalide", 502);
          }

          const choice = data?.choices?.[0];
          const assistantMsg = choice?.message;
          if (!assistantMsg) return jsonError("Aucune réponse de Groq", 502);

          messages.push(assistantMsg);

          const toolCalls = assistantMsg.tool_calls;

          // Pas de tool calls → réponse finale en streaming
          if (!toolCalls?.length || choice.finish_reason === "stop") {
            // Si le message a déjà du contenu, on le stream directement
            if (assistantMsg.content) {
              // On re-stream via un SSE manuel
              const content = String(assistantMsg.content);
              const encoder = new TextEncoder();
              const stream = new ReadableStream({
                start(controller) {
                  // Émettre en un seul chunk SSE
                  const payload = JSON.stringify({
                    choices: [{ delta: { content }, finish_reason: null }],
                  });
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  controller.close();
                },
              });
              return sseResponse(stream);
            }
            // Sinon appel streamé séparé pour générer la réponse
            break;
          }

          // Exécuter les tool calls en parallèle
          const toolResults = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toolCalls.map(async (tc: any) => {
              let result: string;
              try {
                const args = JSON.parse(tc.function?.arguments ?? "{}");
                result = await runTool(tc.function.name, args);
              } catch (e) {
                result = `Erreur outil: ${String(e)}`;
              }
              return { role: "tool" as const, tool_call_id: tc.id, content: result };
            }),
          );

          messages.push(...toolResults);
          // Continuer la boucle : Groq va lire les résultats et générer la réponse
        }

        // ─ Réponse finale en streaming ─
        let streamRes: Response;
        try { streamRes = await groqStream(groqKey, messages); }
        catch (e) {
          console.error("[ai-chat] groqStream error:", e);
          return jsonError("Impossible de générer la réponse finale", 502);
        }

        if (streamRes.status === 429) {
          const txt = await streamRes.text().catch(() => "");
          let reason = "Quota atteint. Réessayez dans quelques secondes.";
          try { const p = JSON.parse(txt); if (p?.error?.message) reason = p.error.message; } catch {}
          return jsonError(reason, 429);
        }

        if (!streamRes.ok) return jsonError(`Erreur Groq stream ${streamRes.status}`, 502);

        return sseResponse(streamRes.body);
      },
    },
  },
});
