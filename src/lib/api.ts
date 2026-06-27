// lib/api.ts
// Client API — 17e législature (2024-2029)
// Données : JSON allégés servis depuis /public (générés par scripts/fetch-data-17.mjs)
// Fallback vers nosdeputes.fr pour les détails de vote par scrutin/député.

import { queryOptions } from "@tanstack/react-query";

export const LEGISLATURE = 17;

// ============================================================
// TYPES
// ============================================================

export type Depute = {
  id: string;
  id_an: string;
  nom: string;
  nom_de_famille: string;
  prenom: string;
  sexe: "H" | "F";
  date_naissance: string;
  lieu_naissance: string;
  num_deptmt: string;
  nom_circo: string;
  num_circo: number;
  mandat_debut: string;
  mandat_fin?: string | null;
  ancien_depute: 0 | 1;
  groupe_sigle: string;
  parti_ratt_financier: string;
  profession: string;
  url_an: string;
  slug: string;
  twitter?: string;
  sites_web?: { site: string }[];
};

export type Scrutin = {
  numero: string;
  date: string;
  type: string;
  sort: string;
  titre: string;
  nombre_votants: string;
  nombre_pours: string;
  nombre_contres: string;
  nombre_abstentions: string;
  url_institution: string;
};

export type VotePosition =
  | "pour"
  | "contre"
  | "abstention"
  | "nonVotant"
  | "nonVotantVolontaire";

export type VoteEntry = {
  scrutin: Scrutin;
  parlementaire_groupe_acronyme: string;
  parlementaire_slug: string;
  position: VotePosition;
  position_groupe: VotePosition;
  par_delegation: string | null;
  mise_au_point_position: VotePosition | null;
};

// ============================================================
// FETCH SÉCURISÉ
// ============================================================

/**
 * Fetch JSON avec timeout et gestion d'erreur explicite.
 * Ne lève jamais d'erreur liée à un parsing JSON malformé sans message clair.
 */
async function fetchJson<T>(url: string, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error(`API ${r.status} ${r.statusText} — ${url}`);
    return (await r.json()) as T;
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Timeout (${timeoutMs}ms) lors du chargement de ${url}`);
    }
    throw e;
  }
}

/**
 * URL canonique pour la photo d'un député (AN, 17e).
 * Fallback vers placeholder si l'image n'existe pas (géré côté composant).
 */
export const photoUrl = (idAn: string): string =>
  `https://www2.assemblee-nationale.fr/static/tribun/17/photos/${idAn}.jpg`;

// ============================================================
// SANITIZE — Protection XSS
// ============================================================

/**
 * Sanitize un texte utilisateur ou issu d'une API externe.
 * Supprime toute balise HTML et entité dangereuse avant affichage.
 * À utiliser systématiquement avant tout rendu de texte externe.
 */
export function sanitizeText(text: unknown): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "") // scripts
    .replace(/<[^>]*>/g, "") // balises HTML
    .replace(/javascript:/gi, "") // protocoles dangereux
    .replace(/on\w+\s*=/gi, "") // gestionnaires d'événements inline
    .replace(/&lt;script/gi, "") // entités encodées
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitize et valide une entrée de recherche utilisateur.
 * - Longueur max : 150 caractères
 * - Caractères autorisés : lettres, chiffres, espaces, tirets, apostrophes
 * - Retourne "" si la valeur est invalide
 */
export function sanitizeSearchInput(input: unknown): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Supprime HTML
    .replace(/[<>'"`;{}()|\\]/g, "") // Supprime caractères dangereux
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150); // Troncature sécurisée
}

// ============================================================
// NORMALISATION (inchangé, utilisé pour la recherche)
// ============================================================

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// QUERIES — Données 17e depuis /public
// ============================================================

export const allDeputesQuery = queryOptions({
  queryKey: ["deputes", "all", 17],
  staleTime: 1000 * 60 * 60 * 6, // 6h — données peu volatiles
  queryFn: async (): Promise<Depute[]> => {
    try {
      // Source principale : JSON local généré par le pipeline
      const data = await fetchJson<Depute[]>("/deputes-17.json");
      if (!Array.isArray(data)) throw new Error("Format inattendu");
      return data.map((d) => ({
        ...d,
        nom: sanitizeText(d.nom),
        nom_de_famille: sanitizeText(d.nom_de_famille),
        prenom: sanitizeText(d.prenom),
        nom_circo: sanitizeText(d.nom_circo),
        profession: sanitizeText(d.profession),
      }));
    } catch {
      // Fallback : nosdeputes.fr (16e pour l'instant, jusqu'à dispo 17e)
      const d = await fetchJson<{ deputes: { depute: Depute }[] }>(
        "https://www.nosdeputes.fr/deputes/json"
      );
      return d.deputes.map((x) => ({
        ...x.depute,
        nom: sanitizeText(x.depute.nom),
        nom_de_famille: sanitizeText(x.depute.nom_de_famille),
        prenom: sanitizeText(x.depute.prenom),
      }));
    }
  },
});

export const scrutinsQuery = queryOptions({
  queryKey: ["scrutins", 17],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<Scrutin[]> => {
    try {
      const data = await fetchJson<Scrutin[]>("/scrutins-17.json");
      if (!Array.isArray(data)) throw new Error("Format inattendu");
      return data.map((s) => ({
        ...s,
        titre: sanitizeText(s.titre),
        sort: sanitizeText(s.sort),
      }));
    } catch {
      // Fallback nosdeputes.fr
      const d = await fetchJson<{ scrutins: { scrutin: Scrutin }[] }>(
        "https://www.nosdeputes.fr/16/scrutins/json"
      );
      return d.scrutins.map((x) => ({
        ...x.scrutin,
        titre: sanitizeText(x.scrutin.titre),
      }));
    }
  },
});

export const scrutinDetailQuery = (numero: string) =>
  queryOptions({
    queryKey: ["scrutin", 17, numero],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<VoteEntry[]> => {
      // Votes nominatifs : nosdeputes.fr (meilleure source pour le détail)
      const d = await fetchJson<{ votes: { vote: VoteEntry }[] }>(
        `https://www.nosdeputes.fr/16/scrutin/${numero}/json`
      );
      return d.votes.map((x) => ({
        ...x.vote,
        parlementaire_slug: sanitizeText(x.vote.parlementaire_slug),
      }));
    },
  });

export const deputeDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["depute", slug],
    staleTime: 1000 * 60 * 60 * 4,
    queryFn: async (): Promise<Depute> => {
      const d = await fetchJson<{ depute: Depute }>(
        `https://www.nosdeputes.fr/${slug}/json`
      );
      return {
        ...d.depute,
        nom: sanitizeText(d.depute.nom),
        nom_de_famille: sanitizeText(d.depute.nom_de_famille),
        prenom: sanitizeText(d.depute.prenom),
        profession: sanitizeText(d.depute.profession ?? ""),
      };
    },
  });

export const deputeVotesQuery = (slug: string) =>
  queryOptions({
    queryKey: ["depute-votes", slug],
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<VoteEntry[]> => {
      const d = await fetchJson<{ votes: { vote: VoteEntry }[] }>(
        `https://www.nosdeputes.fr/${slug}/votes/json`
      );
      return d.votes.map((x) => ({
        ...x.vote,
        scrutin: {
          ...x.vote.scrutin,
          titre: sanitizeText(x.vote.scrutin?.titre ?? ""),
        },
      }));
    },
  });

// ============================================================
// GROUPES POLITIQUES — 17e législature
// ============================================================

export const GROUPES: Record<string, { nom: string; couleur: string }> = {
  // 17e législature (élections 2024)
  RN: { nom: "Rassemblement National", couleur: "oklch(0.45 0.15 250)" },
  NFP: { nom: "Nouveau Front Populaire", couleur: "oklch(0.52 0.20 15)" },
  "LFI-NFP": { nom: "La France insoumise — NFP", couleur: "oklch(0.55 0.22 27)" },
  SOC: { nom: "Socialistes et apparentés", couleur: "oklch(0.55 0.2 0)" },
  ECO: { nom: "Écologistes et Social", couleur: "oklch(0.55 0.18 145)" },
  ECOLO: { nom: "Écologistes", couleur: "oklch(0.55 0.18 145)" },
  GDR: { nom: "Gauche démocrate et républicaine", couleur: "oklch(0.5 0.18 15)" },
  EPR: { nom: "Ensemble pour la République", couleur: "oklch(0.60 0.16 220)" },
  RE: { nom: "Renaissance", couleur: "oklch(0.65 0.18 60)" },
  DEM: { nom: "Démocrate (MoDem)", couleur: "oklch(0.65 0.16 215)" },
  HOR: { nom: "Horizons & indépendants", couleur: "oklch(0.65 0.13 230)" },
  DR: { nom: "Droite Républicaine", couleur: "oklch(0.45 0.18 250)" },
  LR: { nom: "Les Républicains", couleur: "oklch(0.45 0.18 250)" },
  LIOT: { nom: "Libertés, Indépendants, Outre-mer et Territoires", couleur: "oklch(0.6 0.1 80)" },
  UDR: { nom: "Union des Droites pour la République", couleur: "oklch(0.42 0.17 260)" },
  NI: { nom: "Non inscrits", couleur: "oklch(0.55 0.02 285)" },
  // Compatibilité 16e
  REN: { nom: "Renaissance", couleur: "oklch(0.65 0.18 60)" },
  LFI: { nom: "La France insoumise", couleur: "oklch(0.55 0.22 27)" },
  "GDR-NUPES": { nom: "Gauche démocrate et républicaine — NUPES", couleur: "oklch(0.5 0.18 15)" },
};

export function groupeMeta(sigle: string): { nom: string; couleur: string } {
  return GROUPES[sigle] ?? { nom: sigle || "—", couleur: "oklch(0.55 0.02 285)" };
}

// ============================================================
// HELPERS — Position de vote
// ============================================================

export function positionLabel(p: VotePosition): string {
  switch (p) {
    case "pour": return "Pour";
    case "contre": return "Contre";
    case "abstention": return "Abstention";
    case "nonVotant":
    case "nonVotantVolontaire":
      return "Absent";
  }
}

export function positionColor(p: VotePosition): string {
  switch (p) {
    case "pour": return "var(--color-pour)";
    case "contre": return "var(--color-contre)";
    case "abstention": return "var(--color-abstention)";
    default: return "var(--color-absent)";
  }
}
