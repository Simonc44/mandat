// Server function: résumé IA d'un scrutin via Lovable AI Gateway.
// Remplace l'ancien appel direct à api.anthropic.com depuis le navigateur
// (bloqué par CORS + clé absente + modèle inexistant → toujours en erreur).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  titre: z.string().min(1).max(2000),
  sort: z.string().max(200).default(""),
  pour: z.number().int().nonnegative().default(0),
  contre: z.number().int().nonnegative().default(0),
  abstention: z.number().int().nonnegative().default(0),
});

export const summarizeScrutin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<{ summary: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquante");

    const prompt = `Tu es un expert en droit parlementaire français. Explique ce scrutin en 3 à 4 phrases simples, accessibles à un citoyen non-initié.

Titre du texte : ${data.titre}
Résultat : ${data.sort} (${data.pour} pour, ${data.contre} contre, ${data.abstention} abstentions)

Explique : 1) de quoi parle ce texte en une phrase, 2) pourquoi ce vote était important, 3) ce que son adoption ou son rejet change concrètement. Sois factuel, neutre, sans jargon. Réponds en français, en texte brut (pas de markdown).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Trop de requêtes, réessayez dans une minute.");
      if (res.status === 402) throw new Error("Crédits IA épuisés. Contactez l'administrateur.");
      throw new Error(`AI Gateway ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    };
    const summary = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!summary) throw new Error("Réponse IA vide");
    return { summary };
  });
