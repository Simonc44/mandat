// routes/scrutin.$numero.tsx

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  scrutinMetaQuery,
  scrutinVotesQuery,
  groupeMeta,
  positionColor,
  positionLabel,
  photoUrl,
  sanitizeText,
  sanitizeNumero,
  sanitizeSlug,
  type VotePosition,
  type ScrutinGroupe,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";
import { createSeoMeta, createSeoLinks, createBreadcrumbSchema, createVoteEventSchema, SITE_URL } from "./__root";

export const Route = createFileRoute("/scrutin/$numero")({
  loader: async ({ context, params }) => {
    const numero = sanitizeNumero(params.numero) || params.numero;
    try {
      const meta = await context.queryClient.ensureQueryData(scrutinMetaQuery(numero));
      return {
        titre: sanitizeText(meta?.titre) || `Scrutin n°${numero}`,
        sort: sanitizeText(meta?.sort) || "",
        date: meta?.date || "",
      };
    } catch { throw notFound(); }
  },
  head: ({ params, loaderData }) => {
    const titreRaw = loaderData?.titre || `Scrutin n°${params.numero}`;
    const titre = titreRaw.length > 90 ? titreRaw.slice(0, 87) + "…" : titreRaw;
    const sort = loaderData?.sort ? ` — ${loaderData.sort}` : "";
    const canonical = `${SITE_URL}/scrutin/${params.numero}`;
    return {
      meta: createSeoMeta({
        title: `Scrutin n°${params.numero} : ${titre}${sort} · Mandat`,
        description: `Résultats du scrutin n°${params.numero} à l'Assemblée nationale : « ${titre} ». Qui a voté pour, contre, s'est abstenu, par groupe politique.`,
        canonical,
        ogType: "article",
      }),
      links: createSeoLinks(canonical),
    };
  },
  notFoundComponent: () => (
    <div className="container-app py-24 text-center animate-fade-up">
      <h1 className="font-display text-4xl mb-3">Scrutin introuvable</h1>
      <p className="text-muted-foreground mb-6">Ce scrutin n'existe pas dans notre base.</p>
      <Link to="/scrutins" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm">← Tous les scrutins</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-app py-24 text-center animate-fade-up">
      <h1 className="font-display text-4xl mb-3">Erreur de chargement</h1>
      <p className="text-muted-foreground">{sanitizeText(error.message)}</p>
    </div>
  ),
  component: ScrutinPage,
});

// ── THÉMATIQUES ────────────────────────────────────────────────────────────────
const THEMES = [
  { key: "budget",    label: "💰 Budget",    terms: ["budget","fiscal","finances","crédit","dépense","loi de finances"] },
  { key: "social",   label: "👥 Social",    terms: ["social","travail","retraite","emploi","cmu","sécurité sociale","plfss"] },
  { key: "ecologie", label: "🌿 Écologie",  terms: ["climat","environnement","écologie","énergie","carbone","transition"] },
  { key: "education",label: "🏫 Éducation", terms: ["education","enseignement","école","université","recherche"] },
  { key: "sante",    label: "🏥 Santé",     terms: ["santé","médecin","hôpital","pharmacie","médicament"] },
] as const;

function detectTheme(titre: string, tags?: string[]): string | null {
  const hay = (titre + " " + (tags ?? []).join(" ")).toLowerCase();
  for (const t of THEMES) {
    if (t.terms.some(term => hay.includes(term))) return t.key;
  }
  return null;
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
function ScrutinPage() {
  const { numero: numeroRaw } = Route.useParams();
  const numero = sanitizeNumero(numeroRaw) || numeroRaw;
  const { data: meta } = useSuspenseQuery(scrutinMetaQuery(numero));
  const { data: votesData } = useQuery(scrutinVotesQuery(numero));
  const votes = votesData?.votes ?? [];

  const [filter, setFilter] = useState<{ groupe: string; pos: VotePosition | "all" }>({ groupe: "", pos: "all" });

  // Calcul par groupe — noms lisibles prioritaires
  const byGroup = useMemo(() => {
    if (meta.groupes && meta.groupes.length > 0) {
      return meta.groupes.map(g => ({
        organeRef: g.organeRef,
        nom: groupeMeta(g.organeRef).nom,          // nom complet lisible
        couleur: groupeMeta(g.organeRef).couleur,
        positionMajoritaire: g.positionMajoritaire, // on GARDE pour les barres, on SUPPRIME le badge texte
        pour: g.pour, contre: g.contre, abstentions: g.abstentions, nonVotants: g.nonVotants,
        total: g.pour + g.contre + g.abstentions + g.nonVotants,
      })).filter(g => g.total > 0).sort((a, b) => b.total - a.total);
    }
    const m = new Map<string, { pour: number; contre: number; abstentions: number; nonVotants: number }>();
    for (const v of votes) {
      const g = sanitizeText(v.parlementaire_groupe_acronyme, 20) || "NI";
      const cur = m.get(g) ?? { pour: 0, contre: 0, abstentions: 0, nonVotants: 0 };
      if (v.position === "pour") cur.pour++;
      else if (v.position === "contre") cur.contre++;
      else if (v.position === "abstention") cur.abstentions++;
      else cur.nonVotants++;
      m.set(g, cur);
    }
    return Array.from(m.entries()).map(([g, c]) => ({
      organeRef: g, nom: groupeMeta(g).nom, couleur: groupeMeta(g).couleur,
      positionMajoritaire: "", ...c,
      total: c.pour + c.contre + c.abstentions + c.nonVotants,
    })).sort((a, b) => b.total - a.total);
  }, [meta.groupes, votes]);

  // Votes filtrés pour la liste des député·es
  const filteredVotes = useMemo(() => votes.filter(v => {
    if (filter.groupe && (v.parlementaire_groupe_acronyme || "NI") !== filter.groupe) return false;
    if (filter.pos !== "all") {
      if (filter.pos === "nonVotant") return v.position === "nonVotant" || v.position === "nonVotantVolontaire";
      return v.position === filter.pos;
    }
    return true;
  }), [votes, filter]);

  // Groupes par position pour la liste complète en bas
  const votesByPosition = useMemo(() => {
    const pour: typeof votes = [];
    const contre: typeof votes = [];
    const abstention: typeof votes = [];
    const absent: typeof votes = [];
    for (const v of votes) {
      if (v.position === "pour") pour.push(v);
      else if (v.position === "contre") contre.push(v);
      else if (v.position === "abstention") abstention.push(v);
      else absent.push(v);
    }
    return { pour, contre, abstention, absent };
  }, [votes]);

  const pFinal = Math.max(0, parseInt(meta.nombre_pours) || votes.filter(v => v.position === "pour").length);
  const cFinal = Math.max(0, parseInt(meta.nombre_contres) || votes.filter(v => v.position === "contre").length);
  const aFinal = Math.max(0, parseInt(meta.nombre_abstentions) || votes.filter(v => v.position === "abstention").length);
  const titre = sanitizeText(meta.titre) || `Scrutin n°${numero}`;
  const sort = sanitizeText(meta.sort) || "—";
  const isAdopte = meta.isAdopte ?? (/adopt/i.test(sort) && !/non/i.test(sort));
  const theme = detectTheme(titre, meta.tags);
  const themeObj = theme ? THEMES.find(t => t.key === theme) : null;

  const voteJsonLd = createVoteEventSchema({ title: titre, summary: `Scrutin n°${numero} — ${sort}`, date: meta.date, id: numero });
  const breadcrumbJsonLd = createBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Scrutins", url: `${SITE_URL}/scrutins` },
    { name: `Scrutin n°${numero}`, url: `${SITE_URL}/scrutin/${numero}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: voteJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />

      <div className="container-app py-12">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-6 animate-fade-in">
          <Link to="/scrutins" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Tous les scrutins
          </Link>
        </nav>

        {/* HEADER */}
        <div className="mb-8 max-w-4xl animate-fade-up">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3 uppercase tracking-wider">
            <span className="font-mono text-foreground/50">n°{meta.numero}</span>
            {meta.date && (<><span aria-hidden="true">·</span><time dateTime={meta.date}>{new Date(meta.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time></>)}
            {meta.type && (<><span aria-hidden="true">·</span><span>{sanitizeText(meta.type)}</span></>)}
            {themeObj && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full glass border border-border/40 text-muted-foreground" style={{ fontSize: 10 }}>
                {themeObj.label}
              </span>
            )}
            {/* PAS de badge sécurité — retiré */}
          </div>
          <h1 className="font-display text-3xl md:text-4xl leading-tight mb-5">
            {titre.charAt(0).toUpperCase() + titre.slice(1)}
          </h1>
          {meta.dossier && <p className="text-sm text-muted-foreground mb-3">Dossier : <strong>{sanitizeText(meta.dossier)}</strong></p>}
          {meta.demandeur && <p className="text-sm text-muted-foreground mb-3">Demandeur : {sanitizeText(meta.demandeur)}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold glass shadow-sm"
              style={{ color: isAdopte ? "var(--color-pour)" : "var(--color-contre)", borderColor: isAdopte ? "color-mix(in oklch, var(--color-pour) 30%, transparent)" : "color-mix(in oklch, var(--color-contre) 30%, transparent)", backgroundColor: isAdopte ? "color-mix(in oklch, var(--color-pour) 8%, transparent)" : "color-mix(in oklch, var(--color-contre) 8%, transparent)" }}
              role="status">
              <span aria-hidden="true">{isAdopte ? "✓" : "✗"}</span>Texte {isAdopte ? "adopté" : "rejeté"}
            </span>
            {meta.tags?.map(tag => <span key={tag} className="px-4 py-2 rounded-full text-xs glass text-muted-foreground">{sanitizeText(tag)}</span>)}
            {meta.url_institution && (
              <a href={meta.url_institution} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary glass px-4 py-2 rounded-full border border-border/60 transition-colors shadow-sm">Dossier AN ↗</a>
            )}
          </div>
        </div>

        {/* RÉSULTAT GLOBAL */}
        <section className="mb-10 p-8 rounded-[2rem] card-glass animate-fade-up shadow-md" style={{ animationDelay: "80ms" }} aria-labelledby="result-heading">
          <h2 id="result-heading" className="font-display text-xl mb-6 flex items-center gap-2">
            Résultat global
            <span className="text-sm font-sans font-normal text-muted-foreground">({(pFinal+cFinal+aFinal).toLocaleString("fr-FR")} votants exprimés)</span>
          </h2>
          <AnimatedResultBar pour={pFinal} contre={cFinal} abstention={aFinal} />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <ResultCell label="Pour" value={pFinal} pct={Math.round((pFinal/Math.max(1,pFinal+cFinal+aFinal))*100)} color="var(--color-pour)" />
            <ResultCell label="Contre" value={cFinal} pct={Math.round((cFinal/Math.max(1,pFinal+cFinal+aFinal))*100)} color="var(--color-contre)" />
            <ResultCell label="Abstentions" value={aFinal} pct={Math.round((aFinal/Math.max(1,pFinal+cFinal+aFinal))*100)} color="var(--color-abstention)" />
          </div>
        </section>

        {/* PAR GROUPE — noms complets, pas de badge "majoritairement PO845407" */}
        {byGroup.length > 0 && (
          <section className="mb-10 animate-fade-up" style={{ animationDelay: "160ms" }} aria-labelledby="groups-heading">
            <h2 id="groups-heading" className="font-display text-xl mb-3">Position par groupe</h2>
            <p className="text-xs text-muted-foreground mb-5">Cliquez sur un groupe pour filtrer la liste des député·es.</p>
            <div className="space-y-3">
              {byGroup.map((g, i) => {
                const total = Math.max(1, g.total);
                const isActive = filter.groupe === g.organeRef;
                // Position majoritaire : on la déduit des chiffres, pas de l'ID interne
                const posMaj = g.pour >= g.contre && g.pour >= g.abstentions
                  ? "pour"
                  : g.contre >= g.pour && g.contre >= g.abstentions
                  ? "contre"
                  : "abstention";
                const posMajLabel = posMaj === "pour" ? "Majoritairement pour" : posMaj === "contre" ? "Majoritairement contre" : "Majoritairement abstention";
                const posMajColor = posMaj === "pour" ? "var(--color-pour)" : posMaj === "contre" ? "var(--color-contre)" : "var(--color-abstention)";
                return (
                  <button key={g.organeRef}
                    onClick={() => setFilter(f => ({ ...f, groupe: f.groupe === g.organeRef ? "" : g.organeRef }))}
                    aria-pressed={isActive}
                    className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 animate-fade-up ${isActive ? "card-glass border-blue-500/50 shadow-lg ring-1 ring-blue-500/20" : "glass border-border/50 hover:border-blue-500/30 hover:shadow-md"}`}
                    style={{ animationDelay: `${i*30}ms` }}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Couleur du groupe */}
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.couleur }} aria-hidden="true" />
                        {/* Nom complet lisible, pas le sigle cryptique */}
                        <span className="text-sm font-semibold text-foreground">{g.nom}</span>
                        <span className="text-xs text-muted-foreground">({g.organeRef})</span>
                        {/* Badge position lisible — couleur uniquement */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ color: posMajColor, backgroundColor: `color-mix(in oklch, ${posMajColor} 12%, transparent)` }}>
                          {posMajLabel}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 font-medium">{g.total} député·es</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted/50 shadow-inner">
                      {g.pour > 0 && <div className="result-bar-segment" style={{ width: `${(g.pour/total)*100}%`, backgroundColor: "var(--color-pour)" }} />}
                      {g.contre > 0 && <div className="result-bar-segment" style={{ width: `${(g.contre/total)*100}%`, backgroundColor: "var(--color-contre)" }} />}
                      {g.abstentions > 0 && <div className="result-bar-segment" style={{ width: `${(g.abstentions/total)*100}%`, backgroundColor: "var(--color-abstention)" }} />}
                      {g.nonVotants > 0 && <div className="result-bar-segment" style={{ width: `${(g.nonVotants/total)*100}%`, backgroundColor: "var(--color-absent)" }} />}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3 font-medium">
                      <span><strong className="text-foreground">{g.pour}</strong> pour</span>
                      <span><strong className="text-foreground">{g.contre}</strong> contre</span>
                      <span><strong className="text-foreground">{g.abstentions}</strong> abstentions</span>
                      <span><strong className="text-foreground">{g.nonVotants}</strong> absent·es</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* LISTE COMPLÈTE DÉPUTÉ·ES PAR POSITION */}
        {votes.length > 0 && (
          <section aria-labelledby="deputies-heading">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
              <h2 id="deputies-heading" className="font-display text-xl">
                Tous les votes nominatifs
                {filter.groupe && <span className="text-base font-sans text-muted-foreground"> — {groupeMeta(filter.groupe).nom}</span>}
                <span className="text-base font-sans text-muted-foreground ml-2">({filteredVotes.length})</span>
              </h2>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par position">
                {(["all","pour","contre","abstention","nonVotant"] as const).map(k => (
                  <button key={k}
                    onClick={() => setFilter(f => ({ ...f, pos: k as VotePosition|"all" }))}
                    aria-pressed={filter.pos===k}
                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 ${filter.pos===k ? "btn-primary border-transparent shadow-sm" : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-blue-500/30"}`}>
                    {k==="all" ? `Tous (${votes.length})` : k==="pour" ? `Pour (${votesByPosition.pour.length})` : k==="contre" ? `Contre (${votesByPosition.contre.length})` : k==="abstention" ? `Abstention (${votesByPosition.abstention.length})` : `Absent (${votesByPosition.absent.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Vue groupée par position quand filtre = all */}
            {filter.pos === "all" && filter.groupe === "" ? (
              <div className="space-y-8">
                {([
                  { label: "✓ Pour", color: "var(--color-pour)", list: votesByPosition.pour },
                  { label: "✗ Contre", color: "var(--color-contre)", list: votesByPosition.contre },
                  { label: "Abstention", color: "var(--color-abstention)", list: votesByPosition.abstention },
                  { label: "Absent·es", color: "var(--color-absent, oklch(0.7 0 0))", list: votesByPosition.absent },
                ] as const).filter(g => g.list.length > 0).map(({ label, color, list }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                      <h3 className="font-semibold text-sm" style={{ color }}>{label}</h3>
                      <span className="text-xs text-muted-foreground">— {list.length} député·es</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {list.map((v, i) => {
                        const nom = v.parlementaire_prenom && v.parlementaire_nom
                          ? `${v.parlementaire_prenom} ${v.parlementaire_nom}`
                          : sanitizeText(v.parlementaire_slug?.replace(/-/g," ")??"");
                        const slug = sanitizeSlug(v.parlementaire_slug);
                        const idAn = v.parlementaire_slug?.startsWith("PA") ? v.parlementaire_slug : undefined;
                        return (
                          <Link key={`${v.parlementaire_slug}-${i}`} to="/depute/$slug" params={{ slug }}
                            className="flex items-center gap-2.5 p-2.5 rounded-2xl card-glass group hover:border-blue-500/30 border border-border/30 transition-colors"
                            aria-label={`${nom}`}>
                            <DeputeAvatar nom={nom} idAn={idAn} position={v.position} />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold truncate block group-hover:text-primary transition-colors">{nom||slug}</span>
                              <span className="text-[10px] text-muted-foreground truncate block">{groupeMeta(v.parlementaire_groupe_acronyme||"NI").nom}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vue filtrée */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger">
                {filteredVotes.slice(0,300).map((v, i) => {
                  const nom = v.parlementaire_prenom && v.parlementaire_nom
                    ? `${v.parlementaire_prenom} ${v.parlementaire_nom}`
                    : sanitizeText(v.parlementaire_slug?.replace(/-/g," ")??"");
                  const slug = sanitizeSlug(v.parlementaire_slug);
                  const idAn = v.parlementaire_slug?.startsWith("PA") ? v.parlementaire_slug : undefined;
                  return (
                    <Link key={`${v.parlementaire_slug}-${i}`} to="/depute/$slug" params={{ slug }}
                      className="flex items-center gap-3 p-3 rounded-[2rem] card-glass group animate-fade-up shadow-sm"
                      style={{ animationDelay: `${Math.min(i*15,300)}ms` }}
                      aria-label={`${nom} — ${positionLabel(v.position)}`}>
                      <DeputeAvatar nom={nom} idAn={idAn} position={v.position} />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold truncate block group-hover:text-primary transition-colors">{nom||slug}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: positionColor(v.position) }}>{positionLabel(v.position)}</span>
                      </div>
                      <GroupBadge sigle={v.parlementaire_groupe_acronyme} size="sm" />
                    </Link>
                  );
                })}
                {filteredVotes.length > 300 && <p className="text-xs text-muted-foreground text-center mt-8 py-6 border-t border-border/30 col-span-full">Affichage de 300 sur {filteredVotes.length}. Filtrez par groupe ou position.</p>}
                {filteredVotes.length === 0 && <div className="py-16 text-center glass rounded-[2rem] border border-border/50 col-span-full"><p className="text-muted-foreground">Aucun vote dans cette catégorie.</p></div>}
              </div>
            )}
          </section>
        )}

        {votes.length === 0 && (
          <div className="py-12 text-center glass rounded-[2rem] border border-border/50">
            <p className="text-muted-foreground mb-4 font-medium">Les votes nominatifs ne sont pas encore disponibles pour ce scrutin.</p>
            {meta.url_institution && <a href={meta.url_institution} target="_blank" rel="noreferrer noopener" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs">Voir le dossier officiel sur assemblee-nationale.fr ↗</a>}
          </div>
        )}
      </div>
    </>
  );
}

function AnimatedResultBar({ pour, contre, abstention }: { pour: number; contre: number; abstention: number }) {
  const [mounted, setMounted] = useState(false);
  const total = Math.max(1, pour+contre+abstention);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 150); return () => clearTimeout(t); }, []);
  return (
    <div className="flex h-6 rounded-full overflow-hidden bg-muted/50 shadow-inner" role="img" aria-label={`${pour} pour, ${contre} contre, ${abstention} abstentions`}>
      <div style={{ width: mounted ? `${(pour/total)*100}%` : "0%", backgroundColor: "var(--color-pour)", transition: "width 800ms cubic-bezier(0.34,1.56,0.64,1)" }} />
      <div style={{ width: mounted ? `${(contre/total)*100}%` : "0%", backgroundColor: "var(--color-contre)", transition: "width 800ms cubic-bezier(0.34,1.56,0.64,1) 100ms" }} />
      <div style={{ width: mounted ? `${(abstention/total)*100}%` : "0%", backgroundColor: "var(--color-abstention)", transition: "width 800ms cubic-bezier(0.34,1.56,0.64,1) 200ms" }} />
    </div>
  );
}

function ResultCell({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="p-5 rounded-[2rem] glass border border-border/40 text-center transition-transform hover:scale-[1.02]"
      style={{ borderColor: `color-mix(in oklch, ${color} 25%, transparent)`, backgroundColor: `color-mix(in oklch, ${color} 6%, transparent)` }}>
      <div className="font-display text-3xl md:text-4xl mb-2 font-bold" style={{ color }}>{value.toLocaleString("fr-FR")}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{label}</div>
      <div className="text-xs font-medium text-muted-foreground mt-1">{pct}%</div>
    </div>
  );
}

function DeputeAvatar({ nom, idAn, position }: { nom: string; idAn?: string; position: VotePosition }) {
  const [err17, setErr17] = useState(false);
  const [err16, setErr16] = useState(false);
  const src17 = idAn ? photoUrl(idAn, 17) : "";
  const src16 = idAn ? photoUrl(idAn, 16) : "";
  const color = positionColor(position);
  const initials = nom.split(" ").slice(0,2).map(n => n[0]??"").join("").toUpperCase();
  if ((!src17||err17) && (!src16||err16)) {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border-2"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, var(--color-muted))`, borderColor: color, color }} aria-hidden="true">{initials}</div>
    );
  }
  return (
    <div className="relative w-9 h-9 shrink-0">
      <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-black/5 bg-muted">
        {!err17&&src17
          ? <img src={src17} alt={nom} className="w-full h-full object-cover" loading="lazy" onError={() => setErr17(true)} />
          : <img src={src16} alt={nom} className="w-full h-full object-cover" loading="lazy" onError={() => setErr16(true)} />}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} aria-hidden="true" />
    </div>
  );
}
