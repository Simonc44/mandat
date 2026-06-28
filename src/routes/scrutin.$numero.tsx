// routes/scrutin.$numero.tsx — CORRIGÉ
// - Utilise scrutinDetailQuery qui retourne { meta, votes }
// - Affiche correctement pour/contre/abstention
// - Photos des députés
// - Animations Liquid Glass

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  scrutinDetailQuery,
  groupeMeta,
  positionColor,
  positionLabel,
  photoUrl,
  sanitizeText,
  type VotePosition,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";
import {
  createSeoMeta,
  createBreadcrumbSchema,
  createVoteEventSchema,
  SITE_URL,
} from "./__root";

export const Route = createFileRoute("/scrutin/$numero")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        scrutinDetailQuery(params.numero)
      );
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: createSeoMeta({
      title: `Scrutin n°${params.numero} — Résultat et votes · Mandat`,
      description: `Détail du scrutin n°${params.numero} à l'Assemblée nationale : résultat global, votes par groupe, position de chaque député·e.`,
      canonical: `${SITE_URL}/scrutin/${params.numero}`,
      ogType: "article",
    }),
  }),
  notFoundComponent: () => (
    <div className="container-app py-24 text-center animate-fade-up">
      <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
      <h1 className="font-display text-4xl mb-3">Scrutin introuvable</h1>
      <p className="text-muted-foreground mb-6">
        Ce scrutin n'existe pas dans notre base ou n'est pas encore indexé.
      </p>
      <Link
        to="/scrutins"
        className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm"
      >
        ← Tous les scrutins
      </Link>
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

function ScrutinPage() {
  const { numero } = Route.useParams();
  const { data } = useSuspenseQuery(scrutinDetailQuery(numero));
  const { meta, votes } = data;

  const byGroup = useMemo(() => {
    const m = new Map<
      string,
      { pour: number; contre: number; abstention: number; absent: number }
    >();
    for (const v of votes) {
      const g = sanitizeText(v.parlementaire_groupe_acronyme) || "NI";
      const cur = m.get(g) ?? { pour: 0, contre: 0, abstention: 0, absent: 0 };
      if (v.position === "pour") cur.pour++;
      else if (v.position === "contre") cur.contre++;
      else if (v.position === "abstention") cur.abstention++;
      else cur.absent++;
      m.set(g, cur);
    }
    return Array.from(m.entries()).sort(
      (a, b) => totalCount(b[1]) - totalCount(a[1])
    );
  }, [votes]);

  const [filter, setFilter] = useState<{
    groupe: string;
    pos: VotePosition | "all";
  }>({ groupe: "", pos: "all" });

  const filteredVotes = useMemo(() => {
    return votes.filter((v) => {
      if (filter.groupe && v.parlementaire_groupe_acronyme !== filter.groupe)
        return false;
      if (filter.pos !== "all") {
        if (filter.pos === "nonVotant") {
          if (v.position !== "nonVotant" && v.position !== "nonVotantVolontaire")
            return false;
        } else if (v.position !== filter.pos) return false;
      }
      return true;
    });
  }, [votes, filter]);

  const titre = sanitizeText(meta.titre) || `Scrutin n°${numero}`;
  const sort = sanitizeText(meta.sort) || "—";
  const p = Math.max(0, parseInt(meta.nombre_pours) || 0);
  const c = Math.max(0, parseInt(meta.nombre_contres) || 0);
  const a = Math.max(0, parseInt(meta.nombre_abstentions) || 0);

  // Si les chiffres de meta sont tous à 0 mais qu'on a les votes nominatifs,
  // on les recalcule depuis les votes
  const pFinal =
    p > 0 ? p : votes.filter((v) => v.position === "pour").length;
  const cFinal =
    c > 0 ? c : votes.filter((v) => v.position === "contre").length;
  const aFinal =
    a > 0 ? a : votes.filter((v) => v.position === "abstention").length;

  const total = Math.max(1, pFinal + cFinal + aFinal);
  const isAdopted = /adopt/i.test(sort);

  const voteJsonLd = createVoteEventSchema({
    title: titre,
    summary: `Scrutin n°${numero} — ${sort}`,
    date: meta.date,
    id: numero,
  });
  const breadcrumbJsonLd = createBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Scrutins", url: `${SITE_URL}/scrutins` },
    { name: `Scrutin n°${numero}`, url: `${SITE_URL}/scrutin/${numero}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: voteJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />

      <div className="container-app py-12">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-6 animate-fade-in">
          <Link
            to="/scrutins"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tous les scrutins
          </Link>
        </nav>

        {/* ── HEADER ── */}
        <div
          className="mb-10 max-w-4xl animate-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3 uppercase tracking-wider">
            <span className="font-medium text-foreground/60">
              Scrutin n°{meta.numero}
            </span>
            {meta.date && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={meta.date}>
                  {new Date(meta.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
            {meta.type && (
              <>
                <span aria-hidden="true">·</span>
                <span>{sanitizeText(meta.type)}</span>
              </>
            )}
            {meta.legislature && (
              <>
                <span aria-hidden="true">·</span>
                <span>{meta.legislature}e législature</span>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-4xl leading-tight mb-5">
            {titre.charAt(0).toUpperCase() + titre.slice(1)}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Badge résultat */}
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold glass"
              style={{
                color: isAdopted ? "var(--color-pour)" : "var(--color-contre)",
                borderColor: isAdopted
                  ? "color-mix(in oklch, var(--color-pour) 30%, transparent)"
                  : "color-mix(in oklch, var(--color-contre) 30%, transparent)",
                backgroundColor: isAdopted
                  ? "color-mix(in oklch, var(--color-pour) 8%, transparent)"
                  : "color-mix(in oklch, var(--color-contre) 8%, transparent)",
              }}
              role="status"
            >
              <span aria-hidden="true">{isAdopted ? "✓" : "✗"}</span>
              Texte {sort}
            </span>

            {/* Tags */}
            {meta.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs glass text-muted-foreground"
              >
                {sanitizeText(tag)}
              </span>
            ))}

            {/* Lien officiel */}
            {meta.url_institution && (
              <a
                href={meta.url_institution}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary glass px-3 py-2 rounded-xl border border-border/60 transition-colors"
              >
                Dossier AN ↗
              </a>
            )}
          </div>

          {/* Description si disponible */}
          {meta.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {sanitizeText(meta.description)}
            </p>
          )}
        </div>

        {/* ── RÉSULTAT GLOBAL ── */}
        <section
          className="mb-10 p-6 rounded-3xl card-glass animate-fade-up"
          style={{ animationDelay: "80ms" }}
          aria-labelledby="result-heading"
        >
          <h2
            id="result-heading"
            className="font-display text-xl mb-5 flex items-center gap-2"
          >
            Résultat global
            <span className="text-sm font-sans font-normal text-muted-foreground">
              ({pFinal + cFinal + aFinal} votants)
            </span>
          </h2>

          {/* Barre visuelle */}
          <AnimatedResultBar pour={pFinal} contre={cFinal} abstention={aFinal} />

          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <ResultCell
              label="Pour"
              value={pFinal}
              pct={Math.round((pFinal / total) * 100)}
              color="var(--color-pour)"
            />
            <ResultCell
              label="Contre"
              value={cFinal}
              pct={Math.round((cFinal / total) * 100)}
              color="var(--color-contre)"
            />
            <ResultCell
              label="Abstentions"
              value={aFinal}
              pct={Math.round((aFinal / total) * 100)}
              color="var(--color-abstention)"
            />
          </div>
        </section>

        {/* ── PAR GROUPE ── */}
        {byGroup.length > 0 && (
          <section
            className="mb-10 animate-fade-up"
            style={{ animationDelay: "160ms" }}
            aria-labelledby="groups-heading"
          >
            <h2 id="groups-heading" className="font-display text-xl mb-2">
              Par groupe politique
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Cliquez sur un groupe pour filtrer la liste des député·es.
            </p>

            <div className="space-y-2">
              {byGroup.map(([g, counts], i) => {
                const totalG = totalCount(counts);
                const isActive = filter.groupe === g;
                return (
                  <button
                    key={g}
                    onClick={() =>
                      setFilter((f) => ({
                        ...f,
                        groupe: f.groupe === g ? "" : g,
                      }))
                    }
                    aria-pressed={isActive}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 animate-fade-up ${
                      isActive
                        ? "card-glass border-primary/40 shadow-md"
                        : "glass border-border/50 hover:border-primary/25"
                    }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GroupBadge sigle={g} />
                        <span className="text-sm text-muted-foreground">
                          {groupeMeta(g).nom}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {totalG} député·es
                      </span>
                    </div>

                    {/* Barre groupe */}
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/50">
                      {counts.pour > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(counts.pour / totalG) * 100}%`,
                            backgroundColor: "var(--color-pour)",
                          }}
                        />
                      )}
                      {counts.contre > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(counts.contre / totalG) * 100}%`,
                            backgroundColor: "var(--color-contre)",
                          }}
                        />
                      )}
                      {counts.abstention > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(counts.abstention / totalG) * 100}%`,
                            backgroundColor: "var(--color-abstention)",
                          }}
                        />
                      )}
                      {counts.absent > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(counts.absent / totalG) * 100}%`,
                            backgroundColor: "var(--color-absent)",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      <span>
                        <strong className="text-foreground">{counts.pour}</strong> pour
                      </span>
                      <span>
                        <strong className="text-foreground">{counts.contre}</strong> contre
                      </span>
                      <span>
                        <strong className="text-foreground">{counts.abstention}</strong> abst.
                      </span>
                      <span>
                        <strong className="text-foreground">{counts.absent}</strong> absent·es
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── PAR DÉPUTÉ ── */}
        {votes.length > 0 && (
          <section aria-labelledby="deputies-heading">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
              <h2 id="deputies-heading" className="font-display text-xl">
                Position des député·es
                {filter.groupe && (
                  <span className="text-base font-sans text-muted-foreground ml-2">
                    — {filter.groupe}
                  </span>
                )}
                <span className="text-base font-sans text-muted-foreground ml-2">
                  ({filteredVotes.length})
                </span>
              </h2>

              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Filtrer par position"
              >
                {(
                  [
                    ["all", "Tous"],
                    ["pour", "Pour"],
                    ["contre", "Contre"],
                    ["abstention", "Abstention"],
                    ["nonVotant", "Absent"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() =>
                      setFilter((f) => ({
                        ...f,
                        pos: k as VotePosition | "all",
                      }))
                    }
                    aria-pressed={filter.pos === k}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      filter.pos === k
                        ? "btn-primary border-transparent"
                        : "glass border-border/50 text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille avec photos */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 animate-stagger">
              {filteredVotes.slice(0, 300).map((v, i) => {
                const name =
                  v.parlementaire_prenom && v.parlementaire_nom
                    ? `${v.parlementaire_prenom} ${v.parlementaire_nom}`
                    : sanitizeText(
                        v.parlementaire_slug?.replace(/-/g, " ") ?? ""
                      );

                const idForPhoto = v.parlementaire_slug
                  ?.split("-")
                  .slice(-1)[0] ?? "";

                return (
                  <Link
                    key={v.parlementaire_slug || i}
                    to="/depute/$slug"
                    params={{ slug: v.parlementaire_slug ?? "" }}
                    className="flex items-center gap-3 p-3 rounded-2xl card-glass group animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 15, 300)}ms` }}
                    aria-label={`${name} — ${positionLabel(v.position)}`}
                  >
                    {/* Mini photo */}
                    <DeputeAvatar
                      slug={v.parlementaire_slug}
                      nom={name}
                      photoOverride={v.parlementaire_photo}
                      position={v.position}
                    />

                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                        {name || v.parlementaire_slug}
                      </span>
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider"
                        style={{ color: positionColor(v.position) }}
                      >
                        {positionLabel(v.position)}
                      </span>
                    </div>

                    <GroupBadge
                      sigle={v.parlementaire_groupe_acronyme}
                      size="sm"
                    />
                  </Link>
                );
              })}
            </div>

            {filteredVotes.length > 300 && (
              <p className="text-xs text-muted-foreground text-center mt-6 py-4 border-t border-border/40">
                Affichage de 300 sur {filteredVotes.length}. Filtrez par groupe
                ou position pour affiner.
              </p>
            )}

            {filteredVotes.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <span className="text-3xl block mb-3" aria-hidden="true">
                  📭
                </span>
                Aucun vote dans cette catégorie.
              </div>
            )}
          </section>
        )}

        {/* Message si aucun vote nominatif disponible */}
        {votes.length === 0 && (
          <div className="py-10 text-center glass rounded-3xl border border-border/50">
            <span className="text-3xl block mb-3" aria-hidden="true">📊</span>
            <p className="text-muted-foreground">
              Les votes nominatifs pour ce scrutin ne sont pas encore disponibles
              dans notre base de données.
            </p>
            {meta.url_institution && (
              <a
                href={meta.url_institution}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline"
              >
                Voir le dossier officiel sur assemblee-nationale.fr ↗
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── SOUS-COMPOSANTS ─────────────────────────────────────────────────────────

function AnimatedResultBar({
  pour,
  contre,
  abstention,
}: {
  pour: number;
  contre: number;
  abstention: number;
}) {
  const [mounted, setMounted] = useState(false);
  const total = Math.max(1, pour + contre + abstention);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex h-5 rounded-full overflow-hidden bg-muted/50"
      role="img"
      aria-label={`${pour} pour, ${contre} contre, ${abstention} abstentions`}
    >
      <div
        className="result-bar-segment"
        style={{
          width: mounted ? `${(pour / total) * 100}%` : "0%",
          backgroundColor: "var(--color-pour)",
          transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
      <div
        className="result-bar-segment"
        style={{
          width: mounted ? `${(contre / total) * 100}%` : "0%",
          backgroundColor: "var(--color-contre)",
          transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
        }}
      />
      <div
        className="result-bar-segment"
        style={{
          width: mounted ? `${(abstention / total) * 100}%` : "0%",
          backgroundColor: "var(--color-abstention)",
          transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms",
        }}
      />
    </div>
  );
}

function ResultCell({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div
      className="p-4 rounded-2xl glass border border-border/40 text-center"
      style={{
        borderColor: `color-mix(in oklch, ${color} 20%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 5%, transparent)`,
      }}
    >
      <div
        className="font-display text-3xl md:text-4xl mb-1"
        style={{ color }}
      >
        {value.toLocaleString("fr-FR")}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{pct}%</div>
    </div>
  );
}

function DeputeAvatar({
  slug,
  nom,
  photoOverride,
  position,
}: {
  slug?: string;
  nom: string;
  photoOverride?: string;
  position: VotePosition;
}) {
  const [error, setError] = useState(false);
  const idAn = slug?.split("-").pop() ?? "";
  const src = photoOverride ?? (idAn ? photoUrl(idAn) : "");

  if (!src || error) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2"
        style={{
          backgroundColor: `color-mix(in oklch, ${positionColor(position)} 15%, var(--color-muted))`,
          borderColor: positionColor(position),
          color: positionColor(position),
        }}
        aria-hidden="true"
      >
        {nom
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0] ?? "")
          .join("")
          .toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative w-8 h-8 shrink-0">
      <img
        src={src}
        alt={`Photo de ${nom}`}
        className="w-8 h-8 rounded-full object-cover"
        loading="lazy"
        onError={() => setError(true)}
      />
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-card"
        style={{ backgroundColor: positionColor(position) }}
        title={positionLabel(position)}
        aria-hidden="true"
      />
    </div>
  );
}

function totalCount(c: {
  pour: number;
  contre: number;
  abstention: number;
  absent: number;
}) {
  return c.pour + c.contre + c.abstention + c.absent;
}
