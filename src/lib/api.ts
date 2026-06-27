// Client API for nosdeputes.fr (Régards Citoyens) — CORS-friendly mirror of
// l'Assemblée Nationale open data. Data shown: XVIe législature (2022-2024),
// le jeu de données le plus complet actuellement disponible côté nosdeputes.

import { queryOptions } from "@tanstack/react-query";

export const LEGISLATURE = 16;
const BASE = "https://www.nosdeputes.fr";

export type Depute = {
  id: number;
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
  mandat_fin: string | null;
  ancien_depute: 0 | 1;
  groupe_sigle: string;
  parti_ratt_financier: string;
  profession: string;
  place_en_hemicycle: string;
  url_an: string;
  id_an: string;
  slug: string;
  twitter?: string;
  sites_web?: { site: string }[];
  emails?: { email: string }[];
  adresses?: { adresse: string }[];
  responsabilites?: { responsabilite: { fonction: string; organisme: string } }[];
  groupes_parlementaires?: unknown[];
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
  demandeurs?: { demandeur: string }[];
  url_institution: string;
};

export type VotePosition = "pour" | "contre" | "abstention" | "nonVotant" | "nonVotantVolontaire";

export type VoteEntry = {
  scrutin: Scrutin;
  parlementaire_groupe_acronyme: string;
  parlementaire_slug: string;
  position: VotePosition;
  position_groupe: VotePosition;
  par_delegation: string | null;
  mise_au_point_position: VotePosition | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`API ${r.status} ${url}`);
  return (await r.json()) as T;
}

export const photoUrl = (idAn: string) =>
  `https://www2.assemblee-nationale.fr/static/tribun/16/photos/${idAn}.jpg`;

// --- Queries -------------------------------------------------------------

export const allDeputesQuery = queryOptions({
  queryKey: ["deputes", "all"],
  staleTime: 1000 * 60 * 60,
  queryFn: async () => {
    const d = await fetchJson<{ deputes: { depute: Depute }[] }>(`${BASE}/deputes/json`);
    return d.deputes.map((x) => x.depute);
  },
});

export const scrutinsQuery = queryOptions({
  queryKey: ["scrutins", LEGISLATURE],
  staleTime: 1000 * 60 * 30,
  queryFn: async () => {
    const d = await fetchJson<{ scrutins: { scrutin: Scrutin }[] }>(
      `${BASE}/${LEGISLATURE}/scrutins/json`,
    );
    return d.scrutins.map((x) => x.scrutin);
  },
});

export const scrutinDetailQuery = (numero: string) =>
  queryOptions({
    queryKey: ["scrutin", LEGISLATURE, numero],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const d = await fetchJson<{ votes: { vote: VoteEntry }[] }>(
        `${BASE}/${LEGISLATURE}/scrutin/${numero}/json`,
      );
      return d.votes.map((x) => x.vote);
    },
  });

export const deputeDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["depute", slug],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const d = await fetchJson<{ depute: Depute }>(`${BASE}/${slug}/json`);
      return d.depute;
    },
  });

export const deputeVotesQuery = (slug: string) =>
  queryOptions({
    queryKey: ["depute-votes", slug],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const d = await fetchJson<{ votes: { vote: VoteEntry }[] }>(`${BASE}/${slug}/votes/json`);
      return d.votes.map((x) => x.vote);
    },
  });

// --- Groupes politiques (XVIe législature) -------------------------------

export const GROUPES: Record<string, { nom: string; couleur: string }> = {
  RE: { nom: "Renaissance", couleur: "oklch(0.65 0.18 60)" },
  REN: { nom: "Renaissance", couleur: "oklch(0.65 0.18 60)" },
  RN: { nom: "Rassemblement National", couleur: "oklch(0.45 0.15 250)" },
  LFI: { nom: "La France insoumise — NFP", couleur: "oklch(0.55 0.22 27)" },
  "LFI-NFP": { nom: "La France insoumise — NFP", couleur: "oklch(0.55 0.22 27)" },
  LR: { nom: "Les Républicains", couleur: "oklch(0.45 0.18 250)" },
  DR: { nom: "Droite Républicaine", couleur: "oklch(0.45 0.18 250)" },
  SOC: { nom: "Socialistes", couleur: "oklch(0.55 0.2 0)" },
  ECO: { nom: "Écologistes", couleur: "oklch(0.55 0.18 145)" },
  ECOLO: { nom: "Écologistes", couleur: "oklch(0.55 0.18 145)" },
  DEM: { nom: "Démocrate (MoDem)", couleur: "oklch(0.65 0.16 215)" },
  HOR: { nom: "Horizons", couleur: "oklch(0.65 0.13 230)" },
  LIOT: { nom: "Libertés, Indépendants, Outre-mer et Territoires", couleur: "oklch(0.6 0.1 80)" },
  GDR: { nom: "Gauche démocrate et républicaine", couleur: "oklch(0.5 0.18 15)" },
  "GDR-NUPES": { nom: "Gauche démocrate et républicaine — NUPES", couleur: "oklch(0.5 0.18 15)" },
  NI: { nom: "Non inscrits", couleur: "oklch(0.55 0.02 285)" },
};

export function groupeMeta(sigle: string) {
  return GROUPES[sigle] ?? { nom: sigle || "—", couleur: "oklch(0.55 0.02 285)" };
}

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

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
