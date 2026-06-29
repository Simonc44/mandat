// routes/depute.$slug.tsx — utilise id_an pour charger les votes locaux

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import {
  deputeDetailQuery,
  deputeVotesQuery,
  photoUrl,
  positionColor,
  positionLabel,
  sanitizeText,
  sanitizeSlug,
  type VotePosition,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";
import {
  createSeoMeta,
  createPersonSchema,
  createBreadcrumbSchema,
  SITE_URL,
} from "./__root";

export const Route = createFileRoute("/depute/$slug")({
  loader: async ({ context, params }) => {
    const slug = sanitizeSlug(params.slug);
    try {
      await context.queryClient.ensureQueryData(deputeDetailQuery(slug));
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => {
    const name = decodeURIComponent(params.slug)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: createSeoMeta({
        title: `${name} — Votes, positions et présence à l'Assemblée · Mandat`,
        description: `Découvrez comment vote ${name} à l'Assemblée nationale. Analyse de ses positions, taux de présence et historique de vote durant la 17e législature.`,
        canonical: `${SITE_URL}/depute/${params.slug}`,
        ogType: "profile",
        keywords: [
          name,
          "député",
          "votes",
          "mandat",
          "assemblée nationale",
          "circonscription",
          "transparence",
        ],
      }),
    };
  },
  notFoundComponent: () => (
    <div className="container-app py-24 text-center animate-fade-up">
      <div className="text-5xl mb-4" style={{ fontSize: "3rem" }}>
        🏛
      </div>
      <h1 className="font-display text-4xl mb-3">Député·e introuvable</h1>
      <p className="text-muted-foreground mb-6">
        Ce profil n'existe pas ou n'est pas encore indexé.
      </p>
      <Link
        to="/deputes"
        className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm"
      >
        ← Tous les député·es
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-app py-24 text-center animate-fade-up">
      <h1 className="font-display text-4xl mb-3">Erreur de chargement</h1>
      <p className="text-muted-foreground">{sanitizeText(error.message)}</p>
    </div>
  ),
  component: DeputePage,
});

function DeputePage() {
  const { slug } = Route.useParams();
  const safeSlug = sanitizeSlug(slug);

  // 1. Charger le profil
  const { data: d } = useSuspenseQuery(deputeDetailQuery(safeSlug));

  // 2. Charger les votes en passant l'id_an (pour le fichier local)
  const votesQuery = useSuspenseQuery(deputeVotesQuery(safeSlug, d.id_an));
  const votes = votesQuery.data;

  const [posFilter, setPosFilter] = useState<VotePosition | "all">("all");
  const [imgError17, setImgError17] = useState(false);
  const [imgError16, setImgError16] = useState(false);
  const [presenceMounted, setPresenceMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPresenceMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const total = votes.length;
    let pour = 0,
      contre = 0,
      abstention = 0,
      absent = 0;
    for (const v of votes) {
      if (v.position === "pour") pour++;
      else if (v.position === "contre") contre++;
      else if (v.position === "abstention") abstention++;
      else absent++;
    }
    const exprimes = pour + contre + abstention;
    const presence = total ? Math.round((exprimes / total) * 100) : 0;
    return { total, pour, contre, abstention, absent, presence };
  }, [votes]);

  const filteredVotes = useMemo(() => {
    if (posFilter === "all") return votes;
    if (posFilter === "nonVotant")
      return votes.filter(
        (v) =>
          v.position === "nonVotant" || v.position === "nonVotantVolontaire",
      );
    return votes.filter((v) => v.position === posFilter);
  }, [votes, posFilter]);

  const personJsonLd = useMemo(
    () =>
      createPersonSchema({
        name: sanitizeText(d.nom),
        firstName: sanitizeText(d.prenom),
        lastName: sanitizeText(d.nom_de_famille),
        imageUrl: d.id_an ? photoUrl(d.id_an, 17) : "",
        party: sanitizeText(d.groupe_sigle),
        region: sanitizeText(d.nom_circo),
        slug: safeSlug,
      }),
    [d, safeSlug],
  );

  const breadcrumbJsonLd = useMemo(
    () =>
      createBreadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Député·es", url: `${SITE_URL}/deputes` },
        { name: sanitizeText(d.nom), url: `${SITE_URL}/depute/${safeSlug}` },
      ]),
    [d, safeSlug],
  );

  const photo17 = d.id_an ? photoUrl(d.id_an, 17) : "";
  const photo16 = d.id_an ? photoUrl(d.id_an, 16) : "";
  const initials =
    `${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`.toUpperCase();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />

      <div className="container-app py-12">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-6 animate-fade-in">
          <Link
            to="/deputes"
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
            Tous les député·es
          </Link>
        </nav>

        {/* ── HEADER PROFIL ── */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-10 animate-fade-up">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="w-36 h-36 md:w-52 md:h-52 rounded-3xl overflow-hidden bg-muted shadow-xl ring-1 ring-border/50">
              {!imgError17 && photo17 ? (
                <img
                  src={photo17}
                  alt={`Portrait de ${sanitizeText(d.prenom)} ${sanitizeText(d.nom_de_famille)}`}
                  className="w-full h-full object-cover"
                  width={208}
                  height={208}
                  onError={() => setImgError17(true)}
                />
              ) : !imgError16 && photo16 ? (
                <img
                  src={photo16}
                  alt={`Portrait de ${sanitizeText(d.prenom)} ${sanitizeText(d.nom_de_famille)}`}
                  className="w-full h-full object-cover"
                  width={208}
                  height={208}
                  onError={() => setImgError16(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-display text-5xl font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.50 0.20 285 / 15%), oklch(0.42 0.22 215 / 25%))",
                    color: "oklch(0.50 0.20 285)",
                  }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2">
              <GroupBadge sigle={d.groupe_sigle} size="lg" />
            </div>
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="font-display text-4xl md:text-5xl mb-2 leading-tight">
              {sanitizeText(d.prenom)}{" "}
              <span className="font-bold">
                {sanitizeText(d.nom_de_famille)}
              </span>
            </h1>
            <p className="text-base text-muted-foreground mb-1">
              Député·e de{" "}
              <strong className="text-foreground">
                {sanitizeText(d.nom_circo)}
              </strong>
              {d.num_deptmt ? ` (${d.num_deptmt})` : ""}
              {d.num_circo ? ` · circ. ${d.num_circo}` : ""}
            </p>
            {d.profession && (
              <p className="text-sm text-muted-foreground mb-1">
                {sanitizeText(d.profession)}
              </p>
            )}
            {d.mandat_debut && (
              <p className="text-sm text-muted-foreground mb-3">
                Élu·e depuis le{" "}
                <time dateTime={d.mandat_debut}>
                  {new Date(d.mandat_debut).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {d.url_an && (
                <a
                  href={d.url_an}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-xs glass border border-border/50 text-muted-foreground hover:text-primary rounded-xl px-3 py-2 transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Fiche officielle AN
                </a>
              )}
              {d.twitter && (
                <a
                  href={`https://twitter.com/${d.twitter}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-xs glass border border-border/50 text-muted-foreground hover:text-primary rounded-xl px-3 py-2 transition-colors"
                >
                  𝕏 @{d.twitter}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <StatBox
            label="Scrutins"
            value={stats.total}
            color="oklch(0.50 0.20 285)"
          />
          <StatBox label="Pour" value={stats.pour} color="var(--color-pour)" />
          <StatBox
            label="Contre"
            value={stats.contre}
            color="var(--color-contre)"
          />
          <StatBox
            label="Abstention"
            value={stats.abstention}
            color="var(--color-abstention)"
          />
          <StatBox
            label="Présence"
            value={`${stats.presence}%`}
            color="oklch(0.50 0.20 285)"
          />
        </div>

        {/* ── BARRE PRÉSENCE ── */}
        {stats.total > 0 && (
          <div
            className="card-glass rounded-2xl p-5 mb-8 animate-fade-up"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Taux de participation</span>
              <span
                className="font-display text-2xl"
                style={{ color: "oklch(0.50 0.20 285)" }}
              >
                {stats.presence}%
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-muted/60">
              <div
                className="h-full rounded-full"
                style={{
                  width: presenceMounted ? `${stats.presence}%` : "0%",
                  background:
                    "linear-gradient(90deg, var(--color-pour), oklch(0.50 0.20 285))",
                  transition: "width 900ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pour + stats.contre + stats.abstention} votes exprimés ·{" "}
              {stats.absent} absences · {stats.total} scrutins
            </p>
          </div>
        )}

        {/* ── FILTRES ── */}
        <div
          className="flex flex-wrap gap-2 mb-4 animate-fade-in"
          style={{ animationDelay: "200ms" }}
          role="group"
          aria-label="Filtrer les votes par position"
        >
          {(
            [
              ["all", "Tous les votes"],
              ["pour", `Pour (${stats.pour})`],
              ["contre", `Contre (${stats.contre})`],
              ["abstention", `Abstention (${stats.abstention})`],
              ["nonVotant", `Absent (${stats.absent})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPosFilter(k as VotePosition | "all")}
              aria-pressed={posFilter === k}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                posFilter === k
                  ? "btn-primary border-transparent"
                  : "glass border-border/50 text-foreground/70 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── LISTE VOTES ── */}
        <h2 className="font-display text-2xl mb-4">
          Votes{" "}
          <span className="text-base font-sans text-muted-foreground">
            ({filteredVotes.length})
          </span>
        </h2>

        {filteredVotes.length === 0 ? (
          <div className="py-12 text-center glass rounded-3xl border border-border/50">
            <p className="text-muted-foreground">
              Aucun vote dans cette catégorie.
            </p>
          </div>
        ) : (
          <ul
            className="space-y-2 animate-stagger"
            aria-label="Historique des votes"
          >
            {filteredVotes.slice(0, 150).map((v, i) => (
              <li
                key={`${v.scrutin.numero}-${i}`}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}
              >
                <Link
                  to="/scrutin/$numero"
                  params={{ numero: v.scrutin.numero }}
                  className="flex items-start gap-3 p-4 rounded-2xl card-glass group border border-border/40"
                >
                  <span
                    className="shrink-0 mt-0.5 px-2.5 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: positionColor(v.position),
                      backgroundColor: `color-mix(in oklch, ${positionColor(v.position)} 12%, transparent)`,
                    }}
                  >
                    {positionLabel(v.position)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {v.scrutin.titre
                        ? sanitizeText(v.scrutin.titre)
                            .charAt(0)
                            .toUpperCase() +
                          sanitizeText(v.scrutin.titre).slice(1)
                        : `Scrutin n°${v.scrutin.numero}`}
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                      {v.scrutin.date && (
                        <time dateTime={v.scrutin.date}>
                          {new Date(v.scrutin.date).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </time>
                      )}
                      {v.scrutin.sort && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            style={{
                              color: v.scrutin.isAdopte
                                ? "var(--color-pour)"
                                : "var(--color-contre)",
                            }}
                          >
                            {v.scrutin.isAdopte ? "Adopté" : "Rejeté"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg
                    className="self-center shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {filteredVotes.length > 150 && (
          <p className="text-xs text-muted-foreground text-center mt-6 py-4 border-t border-border/40">
            Affichage des 150 premiers sur {filteredVotes.length}. Utilisez les
            filtres pour affiner.
          </p>
        )}
      </div>
    </>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="stat-box card-glass p-4 rounded-2xl"
      style={{ borderColor: `color-mix(in oklch, ${color} 20%, transparent)` }}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className="stat-value font-display text-2xl md:text-3xl"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
