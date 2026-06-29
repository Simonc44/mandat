// routes/scrutin.$numero.tsx — données locales 17e, votes nominatifs réels

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
  sanitizeNumero,
  sanitizeSlug,
  type VotePosition,
  type ScrutinGroupe,
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
    const numero = sanitizeNumero(params.numero) || params.numero;
    try {
      await context.queryClient.ensureQueryData(scrutinDetailQuery(numero));
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: createSeoMeta({
      title: `Scrutin n°${params.numero} — Analyse complète du vote · Mandat`,
      description: `Résultats détaillés du scrutin n°${params.numero} à l'Assemblée nationale. Découvrez qui a voté pour ou contre, l'analyse par groupe politique et l'issue du vote.`,
      canonical: `${SITE_URL}/scrutin/${params.numero}`,
      ogType: "article",
      keywords: [
        `scrutin ${params.numero}`,
        "vote assemblée nationale",
        "loi",
        "députés",
        "résultat scrutin",
        "transparence",
      ],
    }),
  }),
  notFoundComponent: () => (
    <div className="container-app py-24 text-center animate-fade-up">
      <h1 className="font-display text-4xl mb-3">Scrutin introuvable</h1>
      <p className="text-muted-foreground mb-6">
        Ce scrutin n'existe pas dans notre base.
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

// Map organeRef → sigle depuis les données scrutin
function resolveGroupeSigle(
  organeRef: string,
  groupes?: ScrutinGroupe[],
): string {
  if (!groupes) return "NI";
  const g = groupes.find((g) => g.organeRef === organeRef);
  return g ? organeRef : "NI"; // on retourne l'organeRef pour le badge
}

function ScrutinPage() {
  const { numero: numeroRaw } = Route.useParams();
  const numero = sanitizeNumero(numeroRaw) || numeroRaw;
  const { data } = useSuspenseQuery(scrutinDetailQuery(numero));
  const { meta, votes, votesNominatifs } = data;

  const [filter, setFilter] = useState<{
    groupe: string;
    pos: VotePosition | "all";
  }>({ groupe: "", pos: "all" });

  // ── Calcul des groupes depuis les données locales (meta.groupes) ──
  const byGroup = useMemo(() => {
    // Priorité : groupes depuis meta (données parse-local-data)
    if (meta.groupes && meta.groupes.length > 0) {
      return meta.groupes
        .map((g) => ({
          organeRef: g.organeRef,
          positionMajoritaire: g.positionMajoritaire,
          pour: g.pour,
          contre: g.contre,
          abstentions: g.abstentions,
          nonVotants: g.nonVotants,
          total: g.pour + g.contre + g.abstentions + g.nonVotants,
        }))
        .filter((g) => g.total > 0)
        .sort((a, b) => b.total - a.total);
    }

    // Fallback : calculer depuis les votes nominatifs
    const m = new Map<
      string,
      { pour: number; contre: number; abstentions: number; nonVotants: number }
    >();
    for (const v of votes) {
      const g = sanitizeText(v.parlementaire_groupe_acronyme, 20) || "NI";
      const cur = m.get(g) ?? {
        pour: 0,
        contre: 0,
        abstentions: 0,
        nonVotants: 0,
      };
      if (v.position === "pour") cur.pour++;
      else if (v.position === "contre") cur.contre++;
      else if (v.position === "abstention") cur.abstentions++;
      else cur.nonVotants++;
      m.set(g, cur);
    }
    return Array.from(m.entries())
      .map(([g, c]) => ({
        organeRef: g,
        positionMajoritaire: "",
        ...c,
        total: c.pour + c.contre + c.abstentions + c.nonVotants,
      }))
      .sort((a, b) => b.total - a.total);
  }, [meta.groupes, votes]);

  // Filtrage des votes nominatifs
  const filteredVotes = useMemo(() => {
    return votes.filter((v) => {
      if (
        filter.groupe &&
        (v.parlementaire_groupe_acronyme || "NI") !== filter.groupe
      )
        return false;
      if (filter.pos !== "all") {
        if (filter.pos === "nonVotant")
          return (
            v.position === "nonVotant" || v.position === "nonVotantVolontaire"
          );
        return v.position === filter.pos;
      }
      return true;
    });
  }, [votes, filter]);

  // Chiffres réels — depuis meta si disponible, sinon calculés
  const pFinal = Math.max(
    0,
    parseInt(meta.nombre_pours) ||
      votes.filter((v) => v.position === "pour").length,
  );
  const cFinal = Math.max(
    0,
    parseInt(meta.nombre_contres) ||
      votes.filter((v) => v.position === "contre").length,
  );
  const aFinal = Math.max(
    0,
    parseInt(meta.nombre_abstentions) ||
      votes.filter((v) => v.position === "abstention").length,
  );
  const titre = sanitizeText(meta.titre) || `Scrutin n°${numero}`;
  const sort = sanitizeText(meta.sort) || "—";
  const isAdopte = meta.isAdopte ?? (/adopt/i.test(sort) && !/non/i.test(sort));

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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="m15 18-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Tous les scrutins
          </Link>
        </nav>

        {/* ── HEADER ── */}
        <div className="mb-10 max-w-4xl animate-fade-up">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3 uppercase tracking-wider">
            <span className="font-mono text-foreground/50">
              n°{meta.numero}
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

          {/* Dossier législatif */}
          {meta.dossier && (
            <p className="text-sm text-muted-foreground mb-3">
              Dossier : <strong>{sanitizeText(meta.dossier)}</strong>
            </p>
          )}
          {meta.demandeur && (
            <p className="text-sm text-muted-foreground mb-3">
              Demandeur : {sanitizeText(meta.demandeur)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Badge résultat */}
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold glass"
              style={{
                color: isAdopte ? "var(--color-pour)" : "var(--color-contre)",
                borderColor: isAdopte
                  ? "color-mix(in oklch, var(--color-pour) 30%, transparent)"
                  : "color-mix(in oklch, var(--color-contre) 30%, transparent)",
                backgroundColor: isAdopte
                  ? "color-mix(in oklch, var(--color-pour) 8%, transparent)"
                  : "color-mix(in oklch, var(--color-contre) 8%, transparent)",
              }}
              role="status"
            >
              <span aria-hidden="true">{isAdopte ? "✓" : "✗"}</span>
              Texte {isAdopte ? "adopté" : "rejeté"}
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
              ({(pFinal + cFinal + aFinal).toLocaleString("fr-FR")} votants
              exprimés)
            </span>
          </h2>
          <AnimatedResultBar
            pour={pFinal}
            contre={cFinal}
            abstention={aFinal}
          />
          <div className="grid grid-cols-3 gap-3 mt-5">
            <ResultCell
              label="Pour"
              value={pFinal}
              pct={Math.round(
                (pFinal / Math.max(1, pFinal + cFinal + aFinal)) * 100,
              )}
              color="var(--color-pour)"
            />
            <ResultCell
              label="Contre"
              value={cFinal}
              pct={Math.round(
                (cFinal / Math.max(1, pFinal + cFinal + aFinal)) * 100,
              )}
              color="var(--color-contre)"
            />
            <ResultCell
              label="Abstentions"
              value={aFinal}
              pct={Math.round(
                (aFinal / Math.max(1, pFinal + cFinal + aFinal)) * 100,
              )}
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
              Cliquez sur un groupe pour filtrer la liste.
            </p>
            <div className="space-y-2">
              {byGroup.map((g, i) => {
                const total = Math.max(1, g.total);
                const isActive = filter.groupe === g.organeRef;
                return (
                  <button
                    key={g.organeRef}
                    onClick={() =>
                      setFilter((f) => ({
                        ...f,
                        groupe: f.groupe === g.organeRef ? "" : g.organeRef,
                      }))
                    }
                    aria-pressed={isActive}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 animate-fade-up ${isActive ? "card-glass border-primary/40 shadow-md" : "glass border-border/50 hover:border-primary/25"}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GroupBadge sigle={g.organeRef} />
                        <span className="text-sm text-muted-foreground">
                          {groupeMeta(g.organeRef).nom}
                        </span>
                        {g.positionMajoritaire && (
                          <span
                            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              color:
                                g.positionMajoritaire === "pour"
                                  ? "var(--color-pour)"
                                  : g.positionMajoritaire === "contre"
                                    ? "var(--color-contre)"
                                    : "var(--color-abstention)",
                              backgroundColor: `color-mix(in oklch, ${g.positionMajoritaire === "pour" ? "var(--color-pour)" : g.positionMajoritaire === "contre" ? "var(--color-contre)" : "var(--color-abstention)"} 10%, transparent)`,
                            }}
                          >
                            majoritairement {g.positionMajoritaire}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {g.total} député·es
                      </span>
                    </div>
                    {/* Barre groupe */}
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/50">
                      {g.pour > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(g.pour / total) * 100}%`,
                            backgroundColor: "var(--color-pour)",
                          }}
                        />
                      )}
                      {g.contre > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(g.contre / total) * 100}%`,
                            backgroundColor: "var(--color-contre)",
                          }}
                        />
                      )}
                      {g.abstentions > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(g.abstentions / total) * 100}%`,
                            backgroundColor: "var(--color-abstention)",
                          }}
                        />
                      )}
                      {g.nonVotants > 0 && (
                        <div
                          className="result-bar-segment"
                          style={{
                            width: `${(g.nonVotants / total) * 100}%`,
                            backgroundColor: "var(--color-absent)",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      <span>
                        <strong className="text-foreground">{g.pour}</strong>{" "}
                        pour
                      </span>
                      <span>
                        <strong className="text-foreground">{g.contre}</strong>{" "}
                        contre
                      </span>
                      <span>
                        <strong className="text-foreground">
                          {g.abstentions}
                        </strong>{" "}
                        abst.
                      </span>
                      <span>
                        <strong className="text-foreground">
                          {g.nonVotants}
                        </strong>{" "}
                        absent·es
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
                Position des député·es{" "}
                {filter.groupe && (
                  <span className="text-base font-sans text-muted-foreground">
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter.pos === k ? "btn-primary border-transparent" : "glass border-border/50 text-foreground/70 hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 animate-stagger">
              {filteredVotes.slice(0, 300).map((v, i) => {
                const nom =
                  v.parlementaire_prenom && v.parlementaire_nom
                    ? `${v.parlementaire_prenom} ${v.parlementaire_nom}`
                    : sanitizeText(
                        v.parlementaire_slug?.replace(/-/g, " ") ?? "",
                      );
                const slug = sanitizeSlug(v.parlementaire_slug);
                // On essaie de retrouver l'id_an depuis le slug (format prenom-nom → on utilise l'id du vote)
                const idAn = v.parlementaire_slug?.startsWith("PA")
                  ? v.parlementaire_slug
                  : undefined;

                return (
                  <Link
                    key={`${v.parlementaire_slug}-${i}`}
                    to="/depute/$slug"
                    params={{ slug }}
                    className="flex items-center gap-3 p-3 rounded-2xl card-glass group animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 15, 300)}ms` }}
                    aria-label={`${nom} — ${positionLabel(v.position)}`}
                  >
                    <DeputeAvatar nom={nom} idAn={idAn} position={v.position} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                        {nom || slug}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
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
              <div className="py-12 text-center glass rounded-3xl border border-border/50">
                <p className="text-muted-foreground">
                  Aucun vote dans cette catégorie.
                </p>
              </div>
            )}
          </section>
        )}

        {votes.length === 0 && (
          <div className="py-10 text-center glass rounded-3xl border border-border/50">
            <p className="text-muted-foreground mb-3">
              Les votes nominatifs ne sont pas encore disponibles pour ce
              scrutin.
            </p>
            {meta.url_institution && (
              <a
                href={meta.url_institution}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-primary hover:underline"
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
        style={{
          width: mounted ? `${(pour / total) * 100}%` : "0%",
          backgroundColor: "var(--color-pour)",
          transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
      <div
        style={{
          width: mounted ? `${(contre / total) * 100}%` : "0%",
          backgroundColor: "var(--color-contre)",
          transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
        }}
      />
      <div
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
      <div className="font-display text-3xl md:text-4xl mb-1" style={{ color }}>
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
  nom,
  idAn,
  position,
}: {
  nom: string;
  idAn?: string;
  position: VotePosition;
}) {
  const [err17, setErr17] = useState(false);
  const [err16, setErr16] = useState(false);
  const src17 = idAn ? photoUrl(idAn, 17) : "";
  const src16 = idAn ? photoUrl(idAn, 16) : "";
  const color = positionColor(position);
  const initials = nom
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  if ((!src17 || err17) && (!src16 || err16)) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2"
        style={{
          backgroundColor: `color-mix(in oklch, ${color} 15%, var(--color-muted))`,
          borderColor: color,
          color,
        }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="relative w-8 h-8 shrink-0">
      {!err17 && src17 ? (
        <img
          src={src17}
          alt=""
          aria-hidden="true"
          className="w-8 h-8 rounded-full object-cover"
          loading="lazy"
          onError={() => setErr17(true)}
        />
      ) : (
        <img
          src={src16}
          alt=""
          aria-hidden="true"
          className="w-8 h-8 rounded-full object-cover"
          loading="lazy"
          onError={() => setErr16(true)}
        />
      )}
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-card"
        style={{ backgroundColor: color }}
        title={positionLabel(position)}
        aria-hidden="true"
      />
    </div>
  );
}
