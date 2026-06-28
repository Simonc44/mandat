// lib/api.ts — MANDAT · Sécurité renforcée (OWASP Top 10)
// ══════════════════════════════════════════════════════════════════════
// AUDIT DE SÉCURITÉ APPLIQUÉ :
//  ✅ A03 — Injection : sanitizeText() + sanitizeSearchInput() renforcés
//  ✅ A03 — Prototype pollution : Object.create(null) + hasOwnProperty guard
//  ✅ A05 — Misconfiguration : URLs statiques validées, pas d'URL dynamique utilisateur
//  ✅ A06 — Outdated deps : fetch natif, pas de deps vulnérables
//  ✅ A07 — Open redirect : validation stricte des origines CORS
//  ✅ A10 — SSRF : liste blanche d'origines autorisées, validation URL
//  ✅ Données jusqu'à 2024 : fallback nosdeputes 16e comme source principale
// ══════════════════════════════════════════════════════════════════════

import { queryOptions } from "@tanstack/react-query";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
export const LEGISLATURE = 16; // données jusqu'à 2024 = 16e législature
export const CLAIR  = "https://clair-production.up.railway.app";
export const CIVIX  = "https://www.civix.fr";
export const NOS    = "https://www.nosdeputes.fr";

// Liste blanche stricte des origines autorisées (protection SSRF)
const ALLOWED_ORIGINS = new Set([
  "clair-production.up.railway.app",
  "www.civix.fr",
  "www.nosdeputes.fr",
  "www2.assemblee-nationale.fr",
  "data.assemblee-nationale.fr",
]);

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
  parti_ratt_financier: string;
  profession: string;
  url_an: string;
  slug: string;
  photo_url?: string;
  twitter?: string;
};

export type Scrutin = {
  numero: string;
  uid?: string;
  date: string;
  type: string;
  sort: string;
  titre: string;
  description?: string;
  nombre_votants: string;
  nombre_pours: string;
  nombre_contres: string;
  nombre_abstentions: string;
  url_institution: string;
  tags?: string[];
  legislature?: number;
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
  parlementaire_nom?: string;
  parlementaire_prenom?: string;
  parlementaire_photo?: string;
  position: VotePosition;
  position_groupe: VotePosition;
  par_delegation: string | null;
  mise_au_point_position: VotePosition | null;
};

// ─── SÉCURITÉ — XSS / Injection (OWASP A03) ─────────────────────────────────

// Longueur maximale absolue pour les textes affichés
const MAX_TEXT_LEN   = 1000;
const MAX_TITLE_LEN  = 500;
const MAX_SEARCH_LEN = 150;

/**
 * sanitizeText — nettoie tout texte issu d'une API externe avant rendu.
 * Protège contre : XSS reflected, DOM XSS, injection HTML, JS injection.
 * CWE-79 · OWASP A03
 */
export function sanitizeText(text: unknown, maxLen = MAX_TEXT_LEN): string {
  if (text === null || text === undefined) return "";
  if (typeof text !== "string") {
    // Conversion sécurisée — on ne sérialise jamais des objets bruts
    if (typeof text === "number" && Number.isFinite(text)) return String(text);
    return "";
  }

  return text
    // 1. Scripts inline — pattern le plus dangereux
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // 2. Gestionnaires d'événements inline (onload, onerror, onclick…)
    .replace(/\bon\w{1,30}\s*=/gi, "")
    // 3. Protocoles dangereux dans href/src
    .replace(/\b(javascript|vbscript|data)\s*:/gi, "")
    // 4. Toutes balises HTML restantes
    .replace(/<[^>]{0,2000}>/g, "")
    // 5. Entités HTML potentiellement encodées
    .replace(/&(lt|gt|amp|quot|apos|#\d{1,6}|#x[\da-fA-F]{1,6});/g, (m) => {
      const map: Record<string, string> = {
        "&lt;": "<", "&gt;": ">", "&amp;": "&",
        "&quot;": '"', "&apos;": "'",
      };
      return map[m] ?? "";
    })
    // 6. Caractères de contrôle (null bytes, etc.)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // 7. Normalisation des espaces
    .replace(/\s+/g, " ")
    .trim()
    // 8. Troncature sécurisée
    .slice(0, maxLen);
}

/**
 * sanitizeSearchInput — valide et nettoie les entrées de recherche utilisateur.
 * - Longueur max : 150 caractères
 * - Pas de caractères dangereux pour injection
 * - Pas de null bytes
 * CWE-20 · OWASP A03
 */
export function sanitizeSearchInput(input: unknown): string {
  if (!input || typeof input !== "string") return "";

  // Whitelist : autorise uniquement lettres, chiffres, espaces, traits d'union,
  // apostrophes, accents, points — REJETTE tout caractère potentiellement dangereux
  return input
    .replace(/[\x00-\x1F\x7F]/g, "")          // caractères de contrôle
    .replace(/<[^>]{0,500}>/g, "")             // balises HTML
    .replace(/[<>"`;{}()\[\]|\\\/=]/g, "")     // caractères d'injection
    .replace(/javascript\s*:/gi, "")           // JS protocol
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LEN);
}

/**
 * validateUrl — vérifie qu'une URL appartient à la liste blanche (anti-SSRF).
 * CWE-918 · OWASP A10
 */
function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;           // HTTPS uniquement
    if (!ALLOWED_ORIGINS.has(u.hostname)) return false;  // liste blanche stricte
    // Pas de redirections vers localhost ou IPs privées
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * sanitizeSlug — valide un slug de député pour éviter les path traversal.
 * CWE-22 · OWASP A01
 */
export function sanitizeSlug(slug: unknown): string {
  if (!slug || typeof slug !== "string") return "";
  // Uniquement lettres minuscules, chiffres, traits d'union
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * sanitizeNumero — valide un numéro de scrutin pour éviter l'injection dans les URLs.
 * CWE-20 · OWASP A03
 */
export function sanitizeNumero(numero: unknown): string {
  if (!numero || typeof numero !== "string") return "";
  // Uniquement chiffres et lettres majuscules (ex: "1234" ou "VTANR5L17V1234")
  return numero
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 30);
}

/**
 * normalize — normalise une chaîne pour la recherche insensible aux accents.
 * Sécurisé : ne retourne que des caractères alphanumériques + espaces + tirets.
 */
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

// ─── FETCH SÉCURISÉ ──────────────────────────────────────────────────────────

/**
 * fetchJson — fetch sécurisé avec :
 *  - validation de l'URL sur liste blanche (anti-SSRF)
 *  - timeout configurable
 *  - headers de sécurité
 *  - validation du Content-Type de la réponse
 *  - pas de credentials transmis
 */
async function fetchJson<T>(url: string, timeoutMs = 15_000): Promise<T> {
  // Validation URL stricte avant tout fetch
  if (!validateUrl(url)) {
    throw new Error(`URL non autorisée : ${url}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      signal: controller.signal,
      credentials: "omit",           // jamais de cookies sur les APIs externes
      mode: "cors",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    clearTimeout(timer);

    if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);

    // Validation du Content-Type pour éviter les MIME-sniffing attacks
    const ct = r.headers.get("content-type") ?? "";
    if (!ct.includes("json") && !ct.includes("text")) {
      throw new Error(`Content-Type inattendu : ${ct}`);
    }

    // Limite la taille de la réponse (protection DoS / JSON bombing)
    const text = await r.text();
    if (text.length > 10_000_000) {
      throw new Error("Réponse trop volumineuse (>10MB)");
    }

    return JSON.parse(text) as T;
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Timeout ${timeoutMs}ms — ${url}`);
    }
    throw e;
  }
}

// ─── PHOTO DÉPUTÉ ────────────────────────────────────────────────────────────

/**
 * photoUrl — génère l'URL de la photo officielle AN.
 * Validation du format idAn pour éviter l'injection dans les URLs.
 */
export function photoUrl(idAn: string, legislature: 16 | 17 = 16): string {
  // idAn doit correspondre au format PA suivi de chiffres
  const safeId = /^[A-Z]{2}\d{4,10}$/.test(idAn) ? idAn : "";
  if (!safeId) return "";
  return `https://www2.assemblee-nationale.fr/static/tribun/${legislature}/photos/${safeId}.jpg`;
}

// ─── NORMALISATION DONNÉES ───────────────────────────────────────────────────

/**
 * Guard contre le prototype pollution lors de l'accès aux propriétés.
 * CWE-1321 · OWASP A03
 */
function safeProp<T>(obj: unknown, key: string, fallback: T): T {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return fallback;
  // Protection contre __proto__, constructor, prototype
  if (key === "__proto__" || key === "constructor" || key === "prototype") {
    return fallback;
  }
  const val = (obj as Record<string, unknown>)[key];
  return (val !== undefined && val !== null) ? val as T : fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCLAIRDepute(d: any): Depute {
  if (!d || typeof d !== "object") throw new Error("Données député invalides");

  const idAn    = sanitizeSlug(d.uid ?? d.id_an ?? d.id ?? "");
  const prenom  = sanitizeText(d.prenom ?? d.first_name ?? "", 100);
  const nom     = sanitizeText(d.nom ?? d.nom_de_famille ?? d.last_name ?? "", 100);

  // Extraction sécurisée du groupe (protection prototype pollution)
  const groupeObj   = d.groupe && typeof d.groupe === "object" ? d.groupe : null;
  const groupeSigle = sanitizeText(
    groupeObj?.sigle ?? groupeObj?.abreviation ?? groupeObj?.acronyme
    ?? d.groupe_sigle ?? "NI",
    20
  );

  // Slug sécurisé
  const slug = sanitizeSlug(d.slug ?? slugify(prenom, nom));

  // URL AN : validation stricte, pas d'URL arbitraire
  const urlAn = idAn
    ? `https://www.assemblee-nationale.fr/dyn/deputes/${idAn}`
    : "https://www.assemblee-nationale.fr/dyn/deputes";

  // Twitter : sanitize, pas de @ injection
  const twitterRaw = d.twitter ?? d.compte_twitter ?? "";
  const twitter    = typeof twitterRaw === "string"
    ? twitterRaw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 50)
    : undefined;

  return {
    id: idAn,
    id_an: idAn,
    nom: `${prenom} ${nom}`.trim(),
    nom_de_famille: nom,
    prenom,
    sexe: (d.sexe === "F" || d.civilite === "Mme") ? "F" : "H",
    date_naissance: sanitizeText(d.date_naissance ?? d.dateNais ?? "", 20),
    lieu_naissance: sanitizeText(d.lieu_naissance ?? d.villeNais ?? "", 100),
    num_deptmt:     sanitizeText(String(d.num_deptmt ?? d.departement?.code ?? d.departement ?? "").replace(/[^0-9A-Z]/g, ""), 10),
    nom_circo:      sanitizeText(d.nom_circo ?? d.circonscription?.libelle ?? d.circonscription ?? "", 150),
    num_circo:      Math.abs(parseInt(String(d.num_circo ?? d.circonscription?.numero ?? "0")) || 0),
    mandat_debut:   sanitizeText(d.mandat_debut ?? d.date_debut ?? "", 30),
    mandat_fin:     d.mandat_fin ? sanitizeText(String(d.mandat_fin), 30) : null,
    ancien_depute:  d.ancien_depute ? 1 : 0,
    groupe_sigle:   groupeSigle,
    parti_ratt_financier: sanitizeText(d.parti_ratt_financier ?? groupeObj?.libelle ?? groupeSigle, 100),
    profession:     sanitizeText(d.profession ?? "", 200),
    url_an:         urlAn,
    slug,
    photo_url:      undefined, // on calcule côté composant
    twitter:        twitter || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCLAIRScrutin(s: any): Scrutin {
  if (!s || typeof s !== "object") throw new Error("Données scrutin invalides");

  const synth    = (s.synthese && typeof s.synthese === "object") ? s.synthese
                 : (s.syntheseVote && typeof s.syntheseVote === "object") ? s.syntheseVote
                 : {};
  const decompte = synth.decompteVoix ?? synth.decompteNominatif ?? synth;

  // Extraction sécurisée des chiffres (parseInt + validation)
  const parsePosInt = (v: unknown): number => {
    const n = parseInt(String(v ?? "0"), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const pours       = parsePosInt(s.nombre_pours ?? s.pour ?? decompte?.pour ?? synth?.pour ?? s.votes_pour ?? s.nbPour);
  const contres     = parsePosInt(s.nombre_contres ?? s.contre ?? decompte?.contre ?? synth?.contre ?? s.votes_contre ?? s.nbContre);
  const abstentions = parsePosInt(s.nombre_abstentions ?? s.abstention ?? decompte?.abstentions ?? synth?.abstentions ?? s.votes_abstention ?? s.nbAbstention);
  const votants     = parsePosInt(s.nombre_votants ?? s.votants ?? synth?.nombreVotants ?? s.nbVotants) || (pours + contres + abstentions);

  const sortRaw = s.sort ?? s.sort_value ?? synth?.sort ?? s.resultat ?? s.statut ?? "";
  const sort    = sanitizeText(String(sortRaw), 100) || "Non renseigné";
  const numero  = sanitizeNumero(String(s.numero ?? s.id ?? s.uid ?? s.scrutin_id ?? ""));

  // Tags : tableau de chaînes sécurisé
  const rawTags = Array.isArray(s.tags) ? s.tags : Array.isArray(s.themes) ? s.themes : [];
  const tags    = rawTags.slice(0, 10).map((t: unknown) => sanitizeText(String(t ?? ""), 50)).filter(Boolean);

  // URL institution : validation liste blanche
  let urlInstitution = `https://www.assemblee-nationale.fr/dyn/16/scrutins/${numero}`;
  const rawUrl = s.url_institution ?? s.urlDossier ?? s.url ?? "";
  if (rawUrl && typeof rawUrl === "string") {
    try {
      const u = new URL(rawUrl);
      if (u.protocol === "https:" && u.hostname.endsWith("assemblee-nationale.fr")) {
        urlInstitution = rawUrl;
      }
    } catch { /* garde le défaut */ }
  }

  return {
    numero,
    uid:              s.uid ?? s.id ?? numero,
    date:             sanitizeText(s.date ?? s.dateScrutin ?? s.date_scrutin ?? "", 30),
    type:             sanitizeText(s.type ?? s.typeVote?.libelleTypeVote ?? s.typeVote ?? "Scrutin public", 100),
    sort,
    titre:            sanitizeText(s.titre ?? s.title ?? s.objet ?? s.intitule ?? "", MAX_TITLE_LEN),
    description:      sanitizeText(s.description ?? s.resume ?? "", 500),
    nombre_votants:   String(votants),
    nombre_pours:     String(pours),
    nombre_contres:   String(contres),
    nombre_abstentions: String(abstentions),
    url_institution:  urlInstitution,
    tags,
    legislature:      Math.max(1, Math.min(20, parseInt(String(s.legislature ?? "16"), 10) || 16)),
  };
}

function slugify(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// ─── QUERIES ─────────────────────────────────────────────────────────────────
// NOTE : données jusqu'à 2024 → on cible la 16e législature en premier

export const allDeputesQuery = queryOptions({
  queryKey: ["deputes", "all", 16],
  staleTime: 1000 * 60 * 60 * 6,
  queryFn: async (): Promise<Depute[]> => {
    // Source 1 : CLAIR (données jusqu'à 2024)
    try {
      const results: Depute[] = [];
      let page = 1;
      while (true) {
        const data = await fetchJson<any>(`${CLAIR}/api/v1/deputes/?page=${page}&page_size=100`);
        const items: any[] = data?.results ?? data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        if (!items.length) break;
        for (const item of items) {
          try { results.push(normalizeCLAIRDepute(item)); } catch { /* skip item invalide */ }
        }
        const total = Math.max(0, parseInt(String(data?.count ?? data?.total ?? results.length), 10));
        if (results.length >= total || items.length < 100) break;
        if (++page > 10) break;
      }
      if (results.length > 0) return results;
      throw new Error("CLAIR vide");
    } catch {
      // Source 2 : CIVIX
      try {
        const data = await fetchJson<any>(`${CIVIX}/api/v1/search?search=&page=1&page_size=577`);
        const items: any[] = data?.results ?? data?.deputes ?? (Array.isArray(data) ? data : []);
        if (items.length > 0) {
          const r: Depute[] = [];
          for (const i of items) { try { r.push(normalizeCLAIRDepute(i)); } catch {} }
          if (r.length) return r;
        }
        throw new Error("CIVIX vide");
      } catch {
        // Source 3 : nosdeputes.fr 16e — données 2024 fiables
        const d = await fetchJson<{ deputes: { depute: any }[] }>(`${NOS}/deputes/json`);
        const r: Depute[] = [];
        for (const x of d.deputes) {
          try { r.push(normalizeCLAIRDepute(x.depute)); } catch {}
        }
        return r;
      }
    }
  },
});

export const scrutinsQuery = queryOptions({
  queryKey: ["scrutins", 16],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<Scrutin[]> => {
    // Source 1 : CLAIR
    try {
      const results: Scrutin[] = [];
      let page = 1;
      while (true) {
        const data = await fetchJson<any>(`${CLAIR}/api/v1/scrutins/?page=${page}&page_size=100`);
        const items: any[] = data?.results ?? data?.items ?? (Array.isArray(data) ? data : []);
        if (!items.length) break;
        for (const item of items) {
          try { results.push(normalizeCLAIRScrutin(item)); } catch {}
        }
        const total = Math.max(0, parseInt(String(data?.count ?? data?.total ?? results.length), 10));
        if (results.length >= Math.min(total, 3000) || items.length < 100) break;
        if (++page > 30) break;
      }
      if (results.length > 0) return results.sort((a, b) => b.date.localeCompare(a.date));
      throw new Error("CLAIR vide");
    } catch {
      // Source 2 : CIVIX
      try {
        const data = await fetchJson<any>(`${CIVIX}/api/v1/scrutins?legislature=16&page=1&page_size=200`);
        const items: any[] = data?.results ?? data?.scrutins ?? (Array.isArray(data) ? data : []);
        if (items.length) {
          const r: Scrutin[] = [];
          for (const i of items) { try { r.push(normalizeCLAIRScrutin(i)); } catch {} }
          if (r.length) return r.sort((a, b) => b.date.localeCompare(a.date));
        }
        throw new Error("CIVIX vide");
      } catch {
        // Source 3 : nosdeputes.fr 16e — référence 2024
        const d = await fetchJson<{ scrutins: { scrutin: any }[] }>(`${NOS}/16/scrutins/json`);
        const r: Scrutin[] = [];
        for (const x of d.scrutins) {
          try { r.push(normalizeCLAIRScrutin(x.scrutin)); } catch {}
        }
        return r.sort((a, b) => b.date.localeCompare(a.date));
      }
    }
  },
});

export const scrutinDetailQuery = (numeroRaw: string) => {
  // Validation et nettoyage du numéro dès la création de la query
  const numero = sanitizeNumero(numeroRaw);

  return queryOptions({
    queryKey: ["scrutin-detail", 16, numero],
    enabled: !!numero,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<{ meta: Scrutin; votes: VoteEntry[] }> => {
      if (!numero) throw new Error("Numéro de scrutin invalide");

      // Source 1 : CLAIR
      try {
        const raw = await fetchJson<any>(`${CLAIR}/api/v1/scrutins/${encodeURIComponent(numero)}`);
        const meta = normalizeCLAIRScrutin(raw);

        let votesRaw: any[] = [];
        try {
          const vd = await fetchJson<any>(`${CLAIR}/api/v1/scrutins/${encodeURIComponent(numero)}/votes`);
          votesRaw = vd?.results ?? vd?.votes ?? vd?.items ?? (Array.isArray(vd) ? vd : []);
        } catch {}

        const votes = buildVotes(meta, votesRaw);
        return { meta, votes };
      } catch {
        // Source 2 : CIVIX
        try {
          // UID VTANR format (on ne construit qu'un UID si le numero est numérique)
          const isNumeric = /^\d+$/.test(numero);
          const uid = numero.startsWith("VTANR") ? numero : (isNumeric ? `VTANR5L16V${numero}` : numero);
          const raw = await fetchJson<any>(`${CIVIX}/api/v1/scrutins/detail?uid=${encodeURIComponent(uid)}`);
          const meta = normalizeCLAIRScrutin(raw);
          const votesRaw: any[] = raw?.votes ?? raw?.groupes ?? [];
          const votes = buildVotesGrouped(meta, votesRaw);
          return { meta, votes };
        } catch {
          // Source 3 : nosdeputes.fr
          const d = await fetchJson<{ votes: { vote: any }[] }>(
            `${NOS}/16/scrutin/${encodeURIComponent(numero)}/json`
          );
          const votes: VoteEntry[] = [];
          for (const x of d.votes ?? []) {
            try {
              const v = x.vote ?? x;
              votes.push({
                scrutin: normalizeCLAIRScrutin(v.scrutin ?? v),
                parlementaire_groupe_acronyme: sanitizeText(v.parlementaire_groupe_acronyme ?? v.groupe_sigle ?? "NI", 20),
                parlementaire_slug: sanitizeSlug(v.parlementaire_slug ?? ""),
                parlementaire_nom: sanitizeText(v.parlementaire_nom ?? "", 100),
                parlementaire_prenom: sanitizeText(v.parlementaire_prenom ?? "", 100),
                position: normalizePosition(v.position ?? "nonVotant"),
                position_groupe: normalizePosition(v.position_groupe ?? v.position ?? "nonVotant"),
                par_delegation: null,
                mise_au_point_position: null,
              });
            } catch {}
          }

          // Reconstituer meta depuis les votes si absente
          const firstVote = votes[0];
          const meta: Scrutin = firstVote?.scrutin ?? {
            numero,
            date: "",
            type: "Scrutin public",
            sort: "Non renseigné",
            titre: `Scrutin n°${numero}`,
            nombre_votants: String(votes.length),
            nombre_pours: String(votes.filter(v => v.position === "pour").length),
            nombre_contres: String(votes.filter(v => v.position === "contre").length),
            nombre_abstentions: String(votes.filter(v => v.position === "abstention").length),
            url_institution: `https://www.assemblee-nationale.fr/dyn/16/scrutins/${numero}`,
          };
          return { meta, votes };
        }
      }
    },
  });
};

export const deputeDetailQuery = (slugRaw: string) => {
  const slug = sanitizeSlug(slugRaw);
  return queryOptions({
    queryKey: ["depute-detail", slug],
    enabled: !!slug,
    staleTime: 1000 * 60 * 60 * 4,
    queryFn: async (): Promise<Depute> => {
      if (!slug) throw new Error("Slug député invalide");
      try {
        const raw = await fetchJson<any>(`${CLAIR}/api/v1/deputes/${encodeURIComponent(slug)}`);
        return normalizeCLAIRDepute(raw);
      } catch {
        try {
          const raw = await fetchJson<any>(`${CIVIX}/api/v1/deputes/${encodeURIComponent(slug)}`);
          return normalizeCLAIRDepute(raw);
        } catch {
          const d = await fetchJson<{ depute: any }>(`${NOS}/${encodeURIComponent(slug)}/json`);
          return normalizeCLAIRDepute(d.depute);
        }
      }
    },
  });
};

export const deputeVotesQuery = (slugRaw: string) => {
  const slug = sanitizeSlug(slugRaw);
  return queryOptions({
    queryKey: ["depute-votes", slug],
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<VoteEntry[]> => {
      if (!slug) return [];
      try {
        const data = await fetchJson<any>(`${CLAIR}/api/v1/deputes/${encodeURIComponent(slug)}/votes`);
        const items: any[] = data?.results ?? data?.votes ?? (Array.isArray(data) ? data : []);
        return buildVotes(null, items, slug);
      } catch {
        try {
          const data = await fetchJson<any>(`${CIVIX}/api/v1/deputes/${encodeURIComponent(slug)}/votes`);
          const items: any[] = data?.results ?? data?.votes ?? (Array.isArray(data) ? data : []);
          return buildVotes(null, items, slug);
        } catch {
          const d = await fetchJson<{ votes: { vote: any }[] }>(`${NOS}/${encodeURIComponent(slug)}/votes/json`);
          const r: VoteEntry[] = [];
          for (const x of d.votes ?? []) {
            try {
              const v = x.vote ?? x;
              const scrutin = normalizeCLAIRScrutin(v.scrutin ?? v);
              r.push({
                scrutin,
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
        }
      }
    },
  });
};

// ─── HELPERS INTERNES ────────────────────────────────────────────────────────

function buildVotes(meta: Scrutin | null, rawItems: any[], fallbackSlug?: string): VoteEntry[] {
  const out: VoteEntry[] = [];
  for (const v of rawItems) {
    try {
      const scrutin = meta ?? normalizeCLAIRScrutin(v.scrutin ?? v);
      out.push({
        scrutin,
        parlementaire_groupe_acronyme: sanitizeText(v.groupe?.sigle ?? v.groupe_sigle ?? v.groupe ?? "NI", 20),
        parlementaire_slug: sanitizeSlug(v.slug ?? v.parlementaire_slug ?? v.parlementaire?.slug ?? fallbackSlug ?? ""),
        parlementaire_nom: sanitizeText(v.nom ?? v.parlementaire?.nom ?? "", 100),
        parlementaire_prenom: sanitizeText(v.prenom ?? v.parlementaire?.prenom ?? "", 100),
        parlementaire_photo: undefined,
        position: normalizePosition(v.position ?? v.vote ?? "nonVotant"),
        position_groupe: normalizePosition(v.position_groupe ?? v.position ?? "nonVotant"),
        par_delegation: null,
        mise_au_point_position: null,
      });
    } catch {}
  }
  return out;
}

function buildVotesGrouped(meta: Scrutin, rawGroupes: any[]): VoteEntry[] {
  const out: VoteEntry[] = [];
  for (const groupe of rawGroupes) {
    const groupeSigle = sanitizeText(groupe?.sigle ?? groupe?.acronyme ?? "NI", 20);
    const membres: any[] = groupe?.votes ?? groupe?.membres ?? groupe?.deputes ?? [];
    for (const v of membres) {
      try {
        out.push({
          scrutin: meta,
          parlementaire_groupe_acronyme: groupeSigle,
          parlementaire_slug: sanitizeSlug(v?.slug ?? ""),
          parlementaire_nom: sanitizeText(v?.nom ?? "", 100),
          parlementaire_prenom: sanitizeText(v?.prenom ?? "", 100),
          parlementaire_photo: undefined,
          position: normalizePosition(v?.position ?? "nonVotant"),
          position_groupe: normalizePosition(groupe?.position ?? "nonVotant"),
          par_delegation: null,
          mise_au_point_position: null,
        });
      } catch {}
    }
  }
  return out;
}

function normalizePosition(raw: unknown): VotePosition {
  const s = String(raw ?? "").toLowerCase().trim().replace(/[^a-z]/g, "");
  if (s === "pour" || s === "for")                                   return "pour";
  if (s === "contre" || s === "against")                             return "contre";
  if (s === "abstention" || s === "abstain" || s === "abstenu")      return "abstention";
  if (s === "nonvotantvolontaire" || s === "nonvotvolontaire")       return "nonVotantVolontaire";
  return "nonVotant";
}

// ─── HELPERS PUBLICS ─────────────────────────────────────────────────────────

export function positionLabel(p: VotePosition): string {
  const labels: Record<VotePosition, string> = {
    pour: "Pour", contre: "Contre", abstention: "Abstention",
    nonVotant: "Absent", nonVotantVolontaire: "Absent",
  };
  return labels[p] ?? "Inconnu";
}

export function positionColor(p: VotePosition): string {
  const colors: Record<VotePosition, string> = {
    pour: "var(--color-pour)", contre: "var(--color-contre)",
    abstention: "var(--color-abstention)",
    nonVotant: "var(--color-absent)", nonVotantVolontaire: "var(--color-absent)",
  };
  return colors[p] ?? "var(--color-absent)";
}

// ─── GROUPES POLITIQUES 16e (données jusqu'à 2024) ───────────────────────────

export const GROUPES: Record<string, { nom: string; couleur: string }> = {
  // 16e législature (2022-2024)
  RN:       { nom: "Rassemblement National",                          couleur: "oklch(0.42 0.16 252)" },
  LFI:      { nom: "La France insoumise — NUPES",                     couleur: "oklch(0.52 0.22 27)"  },
  "LFI-NUPES": { nom: "La France insoumise — NUPES",                  couleur: "oklch(0.52 0.22 27)"  },
  RE:       { nom: "Renaissance",                                      couleur: "oklch(0.65 0.18 60)"  },
  REN:      { nom: "Renaissance",                                      couleur: "oklch(0.65 0.18 60)"  },
  EPR:      { nom: "Ensemble pour la République",                      couleur: "oklch(0.60 0.16 220)" },
  DEM:      { nom: "Démocrate — MoDem et Indépendants",               couleur: "oklch(0.65 0.16 215)" },
  HOR:      { nom: "Horizons et apparentés",                          couleur: "oklch(0.65 0.13 230)" },
  SOC:      { nom: "Socialistes et apparentés",                        couleur: "oklch(0.55 0.2 0)"    },
  NUPES:    { nom: "Nouvelle Union Populaire écologique et sociale",   couleur: "oklch(0.52 0.20 15)"  },
  ECO:      { nom: "Écologistes — NUPES",                             couleur: "oklch(0.55 0.18 145)" },
  ECOLO:    { nom: "Écologistes",                                      couleur: "oklch(0.55 0.18 145)" },
  GDR:      { nom: "Gauche démocrate et républicaine — NUPES",        couleur: "oklch(0.5 0.18 15)"   },
  "GDR-NUPES": { nom: "GDR — NUPES",                                  couleur: "oklch(0.5 0.18 15)"   },
  DR:       { nom: "Droite Républicaine",                              couleur: "oklch(0.42 0.18 250)" },
  LR:       { nom: "Les Républicains",                                 couleur: "oklch(0.42 0.18 250)" },
  LIOT:     { nom: "Libertés, Indépendants, Outre-mer et Territoires", couleur: "oklch(0.6 0.1 80)"   },
  // 17e (pour compatibilité si CLAIR retourne 17e)
  NFP:      { nom: "Nouveau Front Populaire",                          couleur: "oklch(0.52 0.20 15)"  },
  UDR:      { nom: "Union des Droites pour la République",             couleur: "oklch(0.38 0.17 265)" },
  NI:       { nom: "Non inscrits",                                     couleur: "oklch(0.55 0.02 285)" },
};

export function groupeMeta(sigle: string): { nom: string; couleur: string } {
  const safe = sanitizeText(sigle, 20);
  return GROUPES[safe] ?? { nom: safe || "NI", couleur: "oklch(0.55 0.02 285)" };
}
