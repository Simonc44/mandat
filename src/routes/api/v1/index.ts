// /api/v1 — Documentation de l'API publique Mandat
// GET /api/v1 → retourne la doc JSON (OpenAPI-like)

import { createFileRoute } from "@tanstack/react-router";
import { optionsResponse } from "@/lib/api-auth.server";

const DOC = {
  name: "Mandat API",
  version: "1.0.0",
  description:
    "API publique pour accéder aux données de l'Assemblée nationale française : députés, scrutins, groupes politiques. Données officielles, mises à jour quotidiennement.",
  base_url: "https://mandat-fr.is-a.dev/api/v1",
  authentication: {
    type: "API Key",
    methods: [
      { header: "X-Api-Key: <votre_clé>" },
      { header: "Authorization: Bearer <votre_clé>" },
      { query_param: "?api_key=<votre_clé>" },
    ],
    obtain: "Contactez @Simonc44 sur GitHub pour obtenir une clé.",
    test_key: "mk_test_demo — utilisable en développement (rate limit strict)",
  },
  rate_limiting: {
    limit: 60,
    window: "1 minute",
    headers: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset (timestamp UNIX)",
    ],
  },
  endpoints: [
    {
      method: "GET",
      path: "/api/v1/deputes",
      description: "Liste des 577 député·es de la 17e législature.",
      params: [
        { name: "q",           type: "string",  description: "Recherche nom, prénom, circonscription" },
        { name: "groupe",      type: "string",  description: "Sigle du groupe (ex: RN, LFI, EPR, SOC)" },
        { name: "departement", type: "string",  description: "Numéro ou nom de département (ex: 75, Paris)" },
        { name: "page",        type: "integer", description: "Page (défaut: 1)" },
        { name: "limit",       type: "integer", description: "Résultats par page (défaut: 20, max: 100)" },
      ],
      example: "/api/v1/deputes?groupe=RN&limit=10",
    },
    {
      method: "GET",
      path: "/api/v1/scrutins",
      description: "Liste des scrutins (votes) de l'Assemblée nationale.",
      params: [
        { name: "legislature", type: "integer", description: "17 (actuelle, défaut) ou 16 (2022-2024)" },
        { name: "q",           type: "string",  description: "Recherche dans le titre du scrutin" },
        { name: "sort",        type: "string",  description: "Résultat : adopté | rejeté" },
        { name: "from",        type: "date",    description: "Date de début (YYYY-MM-DD)" },
        { name: "to",          type: "date",    description: "Date de fin (YYYY-MM-DD)" },
        { name: "page",        type: "integer", description: "Page (défaut: 1)" },
        { name: "limit",       type: "integer", description: "Résultats par page (défaut: 20, max: 100)" },
      ],
      example: "/api/v1/scrutins?legislature=17&sort=rejeté&limit=5",
    },
    {
      method: "GET",
      path: "/api/v1/scrutins/:numero",
      description: "Détail complet d'un scrutin par son numéro.",
      params: [
        { name: "numero",      type: "string",  description: "Numéro du scrutin (ex: 4872)" },
        { name: "legislature", type: "integer", description: "17 (défaut) ou 16" },
      ],
      example: "/api/v1/scrutins/4872",
    },
    {
      method: "GET",
      path: "/api/v1/groupes",
      description: "Liste des groupes politiques avec le nombre de députés.",
      params: [],
      example: "/api/v1/groupes",
    },
  ],
  response_format: {
    success: {
      data: "Tableau ou objet de résultats",
      meta: "Pagination : { total, page, pages, limit }",
    },
    error: {
      error: {
        message: "Description de l'erreur",
        code:    "UNAUTHORIZED | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
        status:  "Code HTTP",
      },
    },
  },
  data_sources: [
    "Assemblée nationale Open Data (data.assemblee-nationale.fr)",
    "API CLAIR (clair-production.up.railway.app)",
    "API CIVIX (civix.fr)",
  ],
  github: "https://github.com/Simonc44/mandat",
  license: "Usage non commercial uniquement. Données : Licence Ouverte v2.0 (Etalab).",
};

export const Route = createFileRoute("/api/v1")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      GET: async () =>
        new Response(JSON.stringify(DOC, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        }),
    },
  },
});
