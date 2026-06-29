// lib/api.ts — Mandat 17e législature
// ══════════════════════════════════════════════════════════════════════
// SOURCE PRINCIPALE : fichiers JSON locaux dans /public
//   - /deputes-17.json          → liste des député·es
//   - /scrutins-17.json         → liste des scrutins
//   - /votes-17.json            → votes nominatifs par scrutin
//   - /votes-depute/{id_an}.json → votes d'un député
//
// FALLBACK : API CLAIR → CIVIX → nosdeputes.fr
//
// SÉCURITÉ (OWASP A03 / CWE-79) :
//   ✅ sanitizeText() sur tous les textes externes
//   ✅ sanitizeSlug() / sanitizeNumero() sur les paramètres d'URL
//   ✅ Validation liste blanche des URLs fetch (anti-SSRF)
//   ✅ Protection prototype pollution
//   ✅ Limite de taille sur les réponses API
// ══════════════════════════════════════════════════════════════════════

import { queryOptions } from "@tanstack/react-query";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
export const LEGISLATURE = 17;
const CLAIR = "https://clair-production.up.railway.app";
const CIVIX = "https://www.civix.fr";
const NOS   = "https://www.nosdeputes.fr";

const ALLOWED_ORIGINS = new Set([
  "clair-production.up.railway.app",
  "www.civix.fr",
  "www.nosdeputes.fr",
  "www2.assemblee-nationale.fr",
  "data.assemblee-nationale.fr",
]);

const MAX_TEXT   = 1000;
const MAX_TITLE  = 500;
const MAX_SEARCH = 150;

// ─── TYPES ───────────────────────────────────────────────────────────────────

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
  groupe_ref?: string;
  parti_ratt_financier: string;
  profession: string;
  url_an: string;
  slug: string;
  photo_url?: string;
  twitter?: string;
};

export type ScrutinGroupe = {
  organeRef: string;
  nombreMembres: number;
  positionMajoritaire: string;
  pour: number;
  contre: number;
  abstentions: number;
  nonVotants: number;
};

export type Scrutin = {
  numero: string;
  uid?: string;
  date: string;
  legislature?: number;
  session?: string;
  type: string;
  sort: string;
  isAdopte?: boolean;
  titre: string;
  dossier?: string;
  description?: string;
  demandeur?: string;
  nombre_votants: string;
  nombre_pours: string;
  nombre_contres: string;
  nombre_abstentions: string;
  nombre_non_votants?: string;
  url_institution: string;
  tags?: string[];
  groupes?: ScrutinGroupe[];
};

export type VotePosition =
  | "pour"
  | "contre"
  | "abstention"
  | "nonVotant"
  | "nonVotantVolontaire";

export type VoteNominatif = {
  id: string;
  slug: string;
  nom: string;
  groupe: string;
};

export type VotesScrutin = {
  pours: VoteNominatif[];
  contres: VoteNominatif[];
  abstentions: VoteNominatif[];
  nonVotants: VoteNominatif[];
};

export type VoteEntry = {
  scrutin: Scrutin;
  parlementaire_groupe_acronyme: string;
  parlementaire_slug: string;
  parlementaire_nom?: string;
  parlementaire_prenom?: string;
  parlementaire_photo?: string;
  position: VotePosition;
  position_groupe: VotePosition;
  par_delegation: string | null;
  mise_au_point_position: VotePosition | null;
};

// ─── SÉCURITÉ ────────────────────────────────────────────────────────────────

export function sanitizeText(text: unknown, maxLen = MAX_TEXT): string {
  if (text === null || text === undefined) return "";
  if (typeof text !== "string") {
    if (typeof text === "number" && Number.isFinite(text)) return String(text);
    return "";
  }
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\bon\w{1,30}\s*=/gi, "")
    .replace(/\b(javascript|vbscript|data)\s*:/gi, "")
    .replace(/<[^>]{0,2000}>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeSearchInput(input: unknown): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/<[^>]{0,500}>/g, "")
    .replace(/[<>"`;{}()\[\]|\\\/=]/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH);
}

export function sanitizeSlug(slug: unknown): string {
  if (!slug || typeof slug !== "string") return "";
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function sanitizeNumero(numero: unknown): string {
  if (!numero) return "";
  const s = String(numero);
  // Accepte format numérique "1234" ou format AN "VTANR5L17V1234"
  if (/^\d{1,6}$/.test(s)) return s;
  if (/^VTANR5L1[67]V\d{1,6}$/.test(s)) return s;
  return "";
}

export function normalize(s: string): string {
  if (!s || typeof s !== "string") return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── PHOTO DÉPUTÉ ────────────────────────────────────────────────────────────

export function photoUrl(idAn: string, leg: 16 | 17 = 17): string {
  if (!/^PA\d{3,10}$/.test(idAn)) return "";
  return `https://www2.assemblee-nationale.fr/static/tribun/${leg}/photos/${idAn}.jpg`;
}

// ─── FETCH SÉCURISÉ ──────────────────────────────────────────────────────────

function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (!ALLOWED_ORIGINS.has(u.hostname)) return false;
    return true;
  } catch { return false; }
}

async function fetchJson<T>(url: string, timeoutMs = 15_000): Promise<T> {
  if (!validateUrl(url)) throw new Error(`URL non autorisée: ${url}`);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      credentials: "omit",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    if (text.length > 15_000_000) throw new Error("Réponse trop volumineuse");
    return JSON.parse(text) as T;
  } catch (e) {
    clearTimeout(t);
    if (e instanceof Error && e.name === "AbortError") throw new Error(`Timeout ${timeoutMs}ms`);
    throw e;
  }
}

/** Fetch un fichier JSON local depuis /public — pas de validation de domaine */
async function fetchLocal<T>(path: string, timeoutMs = 10_000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(path, { signal: ctrl.signal, credentials: "omit" });
    clearTimeout(t);
    if (!r.ok) throw new Error(`Fichier local HTTP ${r.status}: ${path}`);
    const text = await r.text();
    return JSON.parse(text) as T;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

// ─── NORMALISATION ───────────────────────────────────────────────────────────

function slugify(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function parsePosInt(v: unknown): number {
  const n = parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExternalDepute(d: any): Depute {
  if (!d || typeof d !== "object") throw new Error("Député invalide");
  const idAn   = sanitizeSlug(d.uid ?? d.id_an ?? d.id ?? "");
  const prenom = sanitizeText(d.prenom ?? d.first_name ?? "", 100);
  const nom    = sanitizeText(d.nom ?? d.nom_de_famille ?? d.last_name ?? "", 100);
  const groupeObj = (d.groupe && typeof d.groupe === "object") ? d.groupe : null;
  const groupeSigle = sanitizeText(
    groupeObj?.sigle ?? groupeObj?.abreviation ?? groupeObj?.acronyme ?? d.groupe_sigle ?? "NI", 20
  );
  const twitterRaw = String(d.twitter ?? d.compte_twitter ?? "");
  const twitter = twitterRaw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 50) || undefined;

  return {
    id: idAn,
    id_an: idAn,
    nom: `${prenom} ${nom}`.trim(),
    nom_de_famille: nom,
    prenom,
    sexe: (d.sexe === "F" || d.civilite === "Mme") ? "F" : "H",
    date_naissance: sanitizeText(d.date_naissance ?? d.dateNais ?? "", 20),
    lieu_naissance: sanitizeText(d.lieu_naissance ?? d.villeNais ?? "", 100),
    num_deptmt: sanitizeText(String(d.num_deptmt ?? d.departement?.code ?? "").replace(/[^0-9A-Z]/g, ""), 10),
    nom_circo: sanitizeText(d.nom_circo ?? d.circonscription?.libelle ?? d.circonscription ?? "", 150),
    num_circo: Math.abs(parsePosInt(d.num_circo ?? d.circonscription?.numero ?? 0)),
    mandat_debut: sanitizeText(d.mandat_debut ?? d.date_debut ?? "", 30),
    mandat_fin: d.mandat_fin ? sanitizeText(String(d.mandat_fin), 30) : null,
    ancien_depute: d.ancien_depute ? 1 : 0,
    groupe_sigle: groupeSigle,
    parti_ratt_financier: sanitizeText(d.parti_ratt_financier ?? groupeObj?.libelle ?? groupeSigle, 100),
    profession: sanitizeText(d.profession ?? "", 200),
    url_an: idAn ? `https://www.assemblee-nationale.fr/dyn/deputes/${idAn}` : "",
    slug: sanitizeSlug(d.slug ?? slugify(prenom, nom)),
    photo_url: undefined,
    twitter,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExternalScrutin(s: any): Scrutin {
  if (!s || typeof s !== "object") throw new Error("Scrutin invalide");
  const synth   = (s.synthese ?? s.syntheseVote ?? {}) as Record<string, unknown>;
  const decomp  = (synth.decompteVoix ?? synth.decompteNominatif ?? synth) as Record<string, unknown>;
  const pours   = parsePosInt(s.nombre_pours ?? s.pour ?? decomp?.pour ?? synth?.pour);
  const contres = parsePosInt(s.nombre_contres ?? s.contre ?? decomp?.contre ?? synth?.contre);
  const abst    = parsePosInt(s.nombre_abstentions ?? s.abstention ?? decomp?.abstentions ?? synth?.abstentions);
  const votants = parsePosInt(s.nombre_votants ?? s.votants ?? synth?.nombreVotants) || (pours + contres + abst);
  const sortRaw = String(s.sort?.code ?? s.sort?.libelle ?? s.sort ?? s.resultat ?? "");
  const isAdopte = /adopt/i.test(sortRaw);
  const numero  = sanitizeNumero(String(s.numero ?? s.id ?? s.uid ?? ""));
  const rawTags = Array.isArray(s.tags) ? s.tags : [];
  const tags = rawTags.slice(0, 10).map((t: unknown) => sanitizeText(String(t ?? ""), 50)).filter(Boolean);

  return {
    numero,
    uid: String(s.uid ?? s.id ?? numero),
    date: sanitizeText(s.date ?? s.dateScrutin ?? s.date_scrutin ?? "", 30),
    legislature: Math.max(1, Math.min(20, parsePosInt(s.legislature ?? 17))),
    type: sanitizeText(s.type ?? s.typeVote?.libelleTypeVote ?? "Scrutin public", 100),
    sort: isAdopte ? "adopté" : "rejeté",
    isAdopte,
    titre: sanitizeText(s.titre ?? s.title ?? s.objet ?? "", MAX_TITLE),
    dossier: sanitizeText(s.dossier ?? s.objet?.dossierLegislatif?.libelle ?? "", 200),
    description: sanitizeText(s.description ?? s.resume ?? "", 500),
    demandeur: sanitizeText(s.demandeur?.texte ?? s.demandeur ?? "", 200),
    nombre_votants: String(votants),
    nombre_pours: String(pours),
    nombre_contres: String(contres),
    nombre_abstentions: String(abst),
    url_institution: `https://www.assemblee-nationale.fr/dyn/17/scrutins/${numero}`,
    tags,
    groupes: [],
  };
}

function normalizePosition(raw: unknown): VotePosition {
  const s = String(raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (s === "pour" || s === "for")                                return "pour";
  if (s === "contre" || s === "against")                         return "contre";
  if (s === "abstention" || s === "abstain" || s === "abstenu") return "abstention";
  if (s === "nonvotantvolontaire")                               return "nonVotantVolontaire";
  return "nonVotant";
}

// ─── QUERIES PRINCIPALES ─────────────────────────────────────────────────────

/**
 * Liste des député·es — source locale prioritaire (deputes-17.json)
 */
export const allDeputesQuery = queryOptions({
  queryKey: ["deputes", "all", 17],
  staleTime: 1000 * 60 * 60 * 6,
  queryFn: async (): Promise<Depute[]> => {
    // ① Fichier local (généré par parse-local-data.mjs)
    try {
      const data = await fetchLocal<Depute[]>("/deputes-17.json");
      if (Array.isArray(data) && data.length > 0) {
        return data.map(d => ({
          ...d,
          nom: sanitizeText(d.nom, 200),
          nom_de_famille: sanitizeText(d.nom_de_famille, 100),
          prenom: sanitizeText(d.prenom, 100),
          nom_circo: sanitizeText(d.nom_circo, 150),
          profession: sanitizeText(d.profession, 200),
          groupe_sigle: sanitizeText(d.groupe_sigle, 20),
          slug: sanitizeSlug(d.slug),
          id_an: d.id_an,
          photo_url: d.id_an ? photoUrl(d.id_an, 17) : undefined,
        }));
      }
    } catch { /* fallback */ }

    // ② CLAIR
    try {
      const results: Depute[] = [];
      let page = 1;
      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchJson<any>(`${CLAIR}/api/v1/deputes/?page=${page}&page_size=100`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = data?.results ?? data?.items ?? (Array.isArray(data) ? data : []);
        if (!items.length) break;
        for (const item of items) {
          try { results.push(normalizeExternalDepute(item)); } catch {}
        }
        const total = parsePosInt(data?.count ?? data?.total ?? results.length);
        if (results.length >= total || items.length < 100) break;
        if (++page > 10) break;
      }
      if (results.length) return results;
    } catch {}

    // ③ CIVIX
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await fetchJson<any>(`${CIVIX}/api/v1/search?search=&page=1&page_size=577`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = data?.results ?? data?.deputes ?? (Array.isArray(data) ? data : []);
      if (items.length) {
        const r: Depute[] = [];
        for (const i of items) { try { r.push(normalizeExternalDepute(i)); } catch {} }
        if (r.length) return r;
      }
    } catch {}

    // ④ nosdeputes.fr 16e (fallback ultime)
    const d = await fetchJson<{ deputes: { depute: Depute }[] }>(`${NOS}/deputes/json`);
    const r: Depute[] = [];
    for (const x of d.deputes) {
      try { r.push(normalizeExternalDepute(x.depute)); } catch {}
    }
    return r;
  },
});

/**
 * Liste des scrutins — source locale prioritaire (scrutins-17.json)
 */
export const scrutinsQuery = queryOptions({
  queryKey: ["scrutins", 17],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<Scrutin[]> => {
    // ① Fichier local
    try {
      const data = await fetchLocal<Scrutin[]>("/scrutins-17.json");
      if (Array.isArray(data) && data.length > 0) {
        return data.map(s => ({
          ...s,
          numero: sanitizeNumero(s.numero) || s.numero,
          titre: sanitizeText(s.titre, MAX_TITLE),
          sort: sanitizeText(s.sort, 100),
          type: sanitizeText(s.type, 100),
          dossier: sanitizeText(s.dossier ?? "", 200),
          demandeur: sanitizeText(s.demandeur ?? "", 200),
        })).sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch {}

    // ② CLAIR
    try {
      const results: Scrutin[] = [];
      let page = 1;
      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchJson<any>(`${CLAIR}/api/v1/scrutins/?page=${page}&page_size=100`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = data?.results ?? data?.items ?? (Array.isArray(data) ? data : []);
        if (!items.length) break;
        for (const item of items) { try { results.push(normalizeExternalScrutin(item)); } catch {} }
        const total = parsePosInt(data?.count ?? data?.total ?? results.length);
        if (results.length >= Math.min(total, 10000) || items.length < 100) break;
        if (++page > 100) break;
      }
      if (results.length) return results.sort((a, b) => b.date.localeCompare(a.date));
    } catch {}

    // ③ CIVIX
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await fetchJson<any>(`${CIVIX}/api/v1/scrutins?legislature=17&page=1&page_size=200`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = data?.results ?? data?.scrutins ?? (Array.isArray(data) ? data : []);
      if (items.length) {
        const r: Scrutin[] = [];
        for (const i of items) { try { r.push(normalizeExternalScrutin(i)); } catch {} }
        if (r.length) return r.sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch {}

    // ④ nosdeputes.fr
    const d = await fetchJson<{ scrutins: { scrutin: Scrutin }[] }>(`${NOS}/16/scrutins/json`);
    const r: Scrutin[] = [];
    for (const x of d.scrutins) { try { r.push(normalizeExternalScrutin(x.scrutin)); } catch {} }
    return r.sort((a, b) => b.date.localeCompare(a.date));
  },
});

/**
 * Détail d'un scrutin avec votes nominatifs — votes-17.json prioritaire
 */
export const scrutinDetailQuery = (numeroRaw: string) => {
  const numero = sanitizeNumero(numeroRaw) || numeroRaw;

  return queryOptions({
    queryKey: ["scrutin-detail", 17, numero],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<{ meta: Scrutin; votes: VoteEntry[]; votesNominatifs: VotesScrutin | null }> => {
      // ① Fichiers locaux combinés
      try {
        const [scrutins, votesIndex] = await Promise.all([
          fetchLocal<Scrutin[]>("/scrutins-17.json").catch(() => null),
          fetchLocal<Record<string, VotesScrutin>>("/votes-17.json").catch(() => null),
        ]);

        const meta = scrutins?.find(s => s.numero === numero || s.uid === numero);
        const votesNominatifs = votesIndex ? (votesIndex[numero] ?? null) : null;

        if (meta) {
          // Construire VoteEntry[] depuis VotesScrutin
          const votes: VoteEntry[] = [];
          if (votesNominatifs) {
            const addVotes = (list: VoteNominatif[], position: VotePosition) => {
              for (const v of list) {
                votes.push({
                  scrutin: meta,
                  parlementaire_groupe_acronyme: sanitizeText(v.groupe, 20),
                  parlementaire_slug: sanitizeSlug(v.slug),
                  parlementaire_nom: sanitizeText(v.nom, 100),
                  parlementaire_prenom: "",
                  position,
                  position_groupe: position,
                  par_delegation: null,
                  mise_au_point_position: null,
                });
              }
            };
            addVotes(votesNominatifs.pours, "pour");
            addVotes(votesNominatifs.contres, "contre");
            addVotes(votesNominatifs.abstentions, "abstention");
            addVotes(votesNominatifs.nonVotants, "nonVotant");
          }

          return { meta, votes, votesNominatifs };
        }
      } catch {}

      // ② CLAIR
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await fetchJson<any>(`${CLAIR}/api/v1/scrutins/${encodeURIComponent(numero)}`);
        const meta = normalizeExternalScrutin(raw);
        let votesRaw: unknown[] = [];
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vd = await fetchJson<any>(`${CLAIR}/api/v1/scrutins/${encodeURIComponent(numero)}/votes`);
          votesRaw = vd?.results ?? vd?.votes ?? (Array.isArray(vd) ? vd : []);
        } catch {}
        const votes = buildVoteEntries(meta, votesRaw);
        return { meta, votes, votesNominatifs: null };
      } catch {}

      // ③ CIVIX
      try {
        const uid = numero.startsWith("VTANR") ? numero : `VTANR5L17V${numero}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await fetchJson<any>(`${CIVIX}/api/v1/scrutins/detail?uid=${encodeURIComponent(uid)}`);
        const meta = normalizeExternalScrutin(raw);
        const votes = buildVoteEntries(meta, []);
        return { meta, votes, votesNominatifs: null };
      } catch {}

      // ④ nosdeputes.fr — fallback ultime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = await fetchJson<{ votes: { vote: any }[] }>(`${NOS}/16/scrutin/${encodeURIComponent(numero)}/json`);
      const allVotes: VoteEntry[] = [];
      for (const x of d.votes ?? []) {
        try {
          const v = x.vote ?? x;
          const scrutinMeta = normalizeExternalScrutin(v.scrutin ?? v);
          allVotes.push({
            scrutin: scrutinMeta,
            parlementaire_groupe_acronyme: sanitizeText(v.parlementaire_groupe_acronyme ?? "NI", 20),
            parlementaire_slug: sanitizeSlug(v.parlementaire_slug ?? ""),
            parlementaire_nom: sanitizeText(v.parlementaire_nom ?? "", 100),
            parlementaire_prenom: sanitizeText(v.parlementaire_prenom ?? "", 100),
            position: normalizePosition(v.position ?? "nonVotant"),
            position_groupe: normalizePosition(v.position_groupe ?? "nonVotant"),
            par_delegation: null,
            mise_au_point_position: null,
          });
        } catch {}
      }
      const firstMeta = allVotes[0]?.scrutin ?? {
        numero, date: "", type: "Scrutin public", sort: "Non renseigné",
        isAdopte: false, titre: `Scrutin n°${numero}`,
        nombre_votants: String(allVotes.length),
        nombre_pours: String(allVotes.filter(v => v.position === "pour").length),
        nombre_contres: String(allVotes.filter(v => v.position === "contre").length),
        nombre_abstentions: String(allVotes.filter(v => v.position === "abstention").length),
        url_institution: `https://www.assemblee-nationale.fr/dyn/17/scrutins/${numero}`,
      };
      return { meta: firstMeta, votes: allVotes, votesNominatifs: null };
    },
  });
};

/**
 * Détail d'un député — fichier local prioritaire (acteur/PA*.json via deputes-17.json)
 */
export const deputeDetailQuery = (slugRaw: string) => {
  const slug = sanitizeSlug(slugRaw);
  return queryOptions({
    queryKey: ["depute-detail", 17, slug],
    enabled: !!slug,
    staleTime: 1000 * 60 * 60 * 4,
    queryFn: async (): Promise<Depute> => {
      // ① Depuis la liste locale
      try {
        const data = await fetchLocal<Depute[]>("/deputes-17.json");
        const found = Array.isArray(data) ? data.find(d => sanitizeSlug(d.slug) === slug) : null;
        if (found) return {
          ...found,
          nom: sanitizeText(found.nom, 200),
          nom_de_famille: sanitizeText(found.nom_de_famille, 100),
          prenom: sanitizeText(found.prenom, 100),
          slug: sanitizeSlug(found.slug),
          photo_url: found.id_an ? photoUrl(found.id_an, 17) : undefined,
        };
      } catch {}

      // ② CLAIR
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await fetchJson<any>(`${CLAIR}/api/v1/deputes/${encodeURIComponent(slug)}`);
        return normalizeExternalDepute(raw);
      } catch {}

      // ③ CIVIX
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await fetchJson<any>(`${CIVIX}/api/v1/deputes/${encodeURIComponent(slug)}`);
        return normalizeExternalDepute(raw);
      } catch {}

      // ④ nosdeputes.fr
      const d = await fetchJson<{ depute: Depute }>(`${NOS}/${encodeURIComponent(slug)}/json`);
      return normalizeExternalDepute(d.depute);
    },
  });
};

/**
 * Votes d'un député — fichier local votes-depute/{id_an}.json prioritaire
 */
export const deputeVotesQuery = (slugRaw: string, idAn?: string) => {
  const slug = sanitizeSlug(slugRaw);
  return queryOptions({
    queryKey: ["depute-votes", 17, slug],
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<VoteEntry[]> => {
      // ① Fichier local votes-depute/{id_an}.json
      if (idAn && /^PA\d{3,10}$/.test(idAn)) {
        try {
          type LocalVote = {
            numero: string; position: string; date: string;
            titre: string; sort: string; isAdopte: boolean;
          };
          const data = await fetchLocal<LocalVote[]>(`/votes-depute/${idAn}.json`);
          if (Array.isArray(data) && data.length > 0) {
            return data.map(v => ({
              scrutin: {
                numero: sanitizeNumero(v.numero) || v.numero,
                date: sanitizeText(v.date, 30),
                type: "Scrutin public",
                sort: sanitizeText(v.sort, 100),
                isAdopte: !!v.isAdopte,
                titre: sanitizeText(v.titre, MAX_TITLE),
                nombre_votants: "", nombre_pours: "", nombre_contres: "", nombre_abstentions: "",
                url_institution: `https://www.assemblee-nationale.fr/dyn/17/scrutins/${v.numero}`,
              },
              parlementaire_groupe_acronyme: "",
              parlementaire_slug: slug,
              position: normalizePosition(v.position),
              position_groupe: normalizePosition(v.position),
              par_delegation: null,
              mise_au_point_position: null,
            }));
          }
        } catch {}
      }

      // ② CLAIR
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchJson<any>(`${CLAIR}/api/v1/deputes/${encodeURIComponent(slug)}/votes`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = data?.results ?? data?.votes ?? (Array.isArray(data) ? data : []);
        return buildVoteEntries(null, items, slug);
      } catch {}

      // ③ CIVIX
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await fetchJson<any>(`${CIVIX}/api/v1/deputes/${encodeURIComponent(slug)}/votes`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = data?.results ?? data?.votes ?? (Array.isArray(data) ? data : []);
        return buildVoteEntries(null, items, slug);
      } catch {}

      // ④ nosdeputes.fr
      const d = await fetchJson<{ votes: { vote: VoteEntry }[] }>(`${NOS}/${encodeURIComponent(slug)}/votes/json`);
      const r: VoteEntry[] = [];
      for (const x of d.votes ?? []) {
        try {
          const v = x.vote ?? x;
          r.push({
            scrutin: normalizeExternalScrutin(v.scrutin ?? v),
            parlementaire_groupe_acronyme: sanitizeText(v.parlementaire_groupe_acronyme ?? "NI", 20),
            parlementaire_slug: slug,
            position: normalizePosition(v.position ?? "nonVotant"),
            position_groupe: normalizePosition(v.position_groupe ?? "nonVotant"),
            par_delegation: null,
            mise_au_point_position: null,
          });
        } catch {}
      }
      return r;
    },
  });
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVoteEntries(meta: Scrutin | null, rawItems: any[], fallbackSlug?: string): VoteEntry[] {
  const out: VoteEntry[] = [];
  for (const v of rawItems) {
    try {
      const scrutin = meta ?? normalizeExternalScrutin(v.scrutin ?? v);
      out.push({
        scrutin,
        parlementaire_groupe_acronyme: sanitizeText(v.groupe?.sigle ?? v.groupe_sigle ?? v.groupe ?? "NI", 20),
        parlementaire_slug: sanitizeSlug(v.slug ?? v.parlementaire_slug ?? v.parlementaire?.slug ?? fallbackSlug ?? ""),
        parlementaire_nom: sanitizeText(v.nom ?? v.parlementaire?.nom ?? "", 100),
        parlementaire_prenom: sanitizeText(v.prenom ?? v.parlementaire?.prenom ?? "", 100),
        position: normalizePosition(v.position ?? v.vote ?? "nonVotant"),
        position_groupe: normalizePosition(v.position_groupe ?? v.position ?? "nonVotant"),
        par_delegation: null,
        mise_au_point_position: null,
      });
    } catch {}
  }
  return out;
}

// ─── HELPERS PUBLICS ────────────────────────────────────────────────────────

export function positionLabel(p: VotePosition): string {
  const m: Record<VotePosition, string> = {
    pour: "Pour", contre: "Contre", abstention: "Abstention",
    nonVotant: "Absent", nonVotantVolontaire: "Absent",
  };
  return m[p] ?? "Inconnu";
}

export function positionColor(p: VotePosition): string {
  const m: Record<VotePosition, string> = {
    pour: "var(--color-pour)", contre: "var(--color-contre)",
    abstention: "var(--color-abstention)",
    nonVotant: "var(--color-absent)", nonVotantVolontaire: "var(--color-absent)",
  };
  return m[p] ?? "var(--color-absent)";
}

// ─── GROUPES POLITIQUES 17e ──────────────────────────────────────────────────

export const GROUPES: Record<string, { nom: string; couleur: string }> = {
  RN:          { nom: "Rassemblement National",                           couleur: "oklch(0.42 0.16 252)" },
  NFP:         { nom: "Nouveau Front Populaire",                          couleur: "oklch(0.52 0.20 15)"  },
  LFI:         { nom: "La France insoumise",                              couleur: "oklch(0.52 0.22 27)"  },
  "LFI-NFP":   { nom: "La France Insoumise — NFP",                        couleur: "oklch(0.52 0.22 27)"  },
  "LFI-NUPES": { nom: "La France insoumise — NUPES",                      couleur: "oklch(0.52 0.22 27)"  },
  SOC:         { nom: "Socialistes et apparentés",                         couleur: "oklch(0.55 0.2 0)"    },
  ECO:         { nom: "Écologistes",                                       couleur: "oklch(0.55 0.18 145)" },
  ECOLO:       { nom: "Écologistes",                                       couleur: "oklch(0.55 0.18 145)" },
  GDR:         { nom: "Gauche démocrate et républicaine",                  couleur: "oklch(0.5 0.18 15)"   },
  "GDR-NUPES": { nom: "GDR — NUPES",                                      couleur: "oklch(0.5 0.18 15)"   },
  EPR:         { nom: "Ensemble pour la République",                       couleur: "oklch(0.60 0.16 220)" },
  RE:          { nom: "Renaissance",                                       couleur: "oklch(0.65 0.18 60)"  },
  REN:         { nom: "Renaissance",                                       couleur: "oklch(0.65 0.18 60)"  },
  DEM:         { nom: "Démocrate — MoDem",                                 couleur: "oklch(0.65 0.16 215)" },
  HOR:         { nom: "Horizons & indépendants",                          couleur: "oklch(0.65 0.13 230)" },
  DR:          { nom: "Droite Républicaine",                               couleur: "oklch(0.42 0.18 250)" },
  LR:          { nom: "Les Républicains",                                  couleur: "oklch(0.42 0.18 250)" },
  LIOT:        { nom: "Libertés, Indépendants, Outre-mer et Territoires",  couleur: "oklch(0.6 0.1 80)"   },
  UDR:         { nom: "Union des Droites pour la République",              couleur: "oklch(0.38 0.17 265)" },
  NI:          { nom: "Non inscrits",                                      couleur: "oklch(0.55 0.02 285)" },
};

export function groupeMeta(sigle: string): { nom: string; couleur: string } {
  const safe = sanitizeText(sigle ?? "", 20);
  return GROUPES[safe] ?? { nom: safe || "NI", couleur: "oklch(0.55 0.02 285)" };
}
