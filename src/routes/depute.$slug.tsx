// routes/depute.$slug.tsx
// Profil député avec SEO dynamique, animations, taux de présence,
// explications de vote, protection XSS.

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  deputeDetailQuery,
  deputeVotesQuery,
  photoUrl,
  positionColor,
  positionLabel,
  sanitizeText,
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
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(deputeDetailQuery(params.slug)),
        context.queryClient.ensureQueryData(deputeVotesQuery(params.slug)),
      ]);
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => {
    // SEO de base avant chargement des données (enrichi après hydratation côté client)
    const name = decodeURIComponent(params.slug)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: createSeoMeta({
        title: `${name} — Votes et positions · Mandat`,
        description: `Consultez l'historique complet des votes de ${name} à l'Assemblée nationale (17e législature). Positions, taux de présence, scrutins.`,
        canonical: `${SITE_URL}/depute/${params.slug}`,
        ogType: "profile",
      }),
    };
  },
  notFoundComponent: () => (
    <div className="container-app py-24 text-center animate-fade-up">
      <h1 className="font-display text-4xl mb-3">Député·e introuvable</h1>
      <p className="text-muted-foreground mb-6">
        Ce profil n'existe pas ou a été déplacé.
      </p>
      <Link to="/deputes" className="text-primary hover:underline">
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
  const { data: d } = useSuspenseQuery(deputeDetailQuery(slug));
  const { data: votes } = useSuspenseQuery(deputeVotesQuery(slug));
  const [posFilter, setPosFilter] = useState<VotePosition | "all">("all");
  const [imgError, setImgError] = useState(false);

  const stats = useMemo(() => {
    const total = votes.length;
    const c = { pour: 0, contre: 0, abstention: 0, absent: 0 };
    for (const v of votes) {
      if (v.position === "pour") c.pour++;
      else if (v.position === "contre") c.contre++;
      else if (v.position === "abstention") c.abstention++;
      else c.absent++;
    }
    const exprimes = c.pour + c.contre + c.abstention;
    const presence = total ? Math.round((exprimes / total) * 100) : 0;
    return { total, ...c, presence };
  }, [votes]);

  const filteredVotes = useMemo(() => {
    if (posFilter === "all") return votes;
    if (posFilter === "nonVotant")
      return votes.filter(
        (v) => v.position === "nonVotant" || v.position === "nonVotantVolontaire"
      );
    return votes.filter((v) => v.position === posFilter);
  }, [votes, posFilter]);

  // JSON-LD structuré dynamique
  const personJsonLd = useMemo(
    () =>
      createPersonSchema({
        name: sanitizeText(d.nom),
        firstName: sanitizeText(d.prenom),
        lastName: sanitizeText(d.nom_de_famille),
        imageUrl: photoUrl(d.id_an),
        party: sanitizeText(d.groupe_sigle),
        region: sanitizeText(d.nom_circo),
        slug,
      }),
    [d, slug]
  );

  const breadcrumbJsonLd = useMemo(
    () =>
      createBreadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Député·es", url: `${SITE_URL}/deputes` },
        { name: sanitizeText(d.nom), url: `${SITE_URL}/depute/${slug}` },
      ]),
    [d, slug]
  );

  return (
    <>
      {/* JSON-LD dynamique */}
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
        <nav aria-label="Fil d'Ariane" className="mb-6">
          <Link
            to="/deputes"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tous les député·es
          </Link>
        </nav>

        {/* Header du profil */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10 animate-fade-up">
          {/* Photo */}
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-sm">
            {!imgError ? (
              <img
                src={photoUrl(d.id_an)}
                alt={`Portrait de ${sanitizeText(d.prenom)} ${sanitizeText(d.nom_de_famille)}`}
                className="w-full h-full object-cover"
                width={176}
                height={176}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-display text-4xl font-medium"
                style={{
                  backgroundColor:
                    "color-mix(in oklch, var(--color-primary) 10%, var(--color-muted))",
                  color: "var(--color-primary)",
                }}
                aria-hidden="true"
              >
                {d.prenom?.[0]}
                {d.nom_de_famille?.[0]}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <GroupBadge sigle={d.groupe_sigle} />
              {d.parti_ratt_financier && d.parti_ratt_financier !== d.groupe_sigle && (
                <span className="text-xs text-muted-foreground">
                  {sanitizeText(d.parti_ratt_financier)}
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl mb-2">
              {sanitizeText(d.prenom)} {sanitizeText(d.nom_de_famille)}
            </h1>
            <p className="text-muted-foreground">
              Député·e de{" "}
              <strong className="text-foreground">{sanitizeText(d.nom_circo)}</strong>
              {d.num_deptmt && ` (${sanitizeText(String(d.num_deptmt))})`}
              {d.num_circo ? ` — circo. ${d.num_circo}` : ""}
            </p>
            {d.profession && (
              <p className="text-sm text-muted-foreground mt-1">
                Profession : {sanitizeText(d.profession)}
              </p>
            )}
            {d.mandat_debut && (
              <p className="text-sm text-muted-foreground mt-1">
                Élu·e depuis le{" "}
                {new Date(d.mandat_debut).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {d.twitter && (
              <a
                href={`https://twitter.com/${sanitizeText(d.twitter)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                aria-label={`Profil Twitter de ${sanitizeText(d.prenom)} ${sanitizeText(d.nom_de_famille)}`}
              >
                @{sanitizeText(d.twitter)}
              </a>
            )}
            <div className="mt-3">
              <a
                href={d.url_an}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 rounded-lg px-3 py-1.5 transition-colors"
              >
                Fiche officielle AN ↗
              </a>
            </div>
          </div>
        </div>

        {/* Stats de présence */}
        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <StatBox label="Scrutins" value={stats.total} color="var(--color-primary)" />
          <StatBox label="Pour" value={stats.pour} color="var(--color-pour)" />
          <StatBox label="Contre" value={stats.contre} color="var(--color-contre)" />
          <StatBox label="Abstention" value={stats.abstention} color="var(--color-abstention)" />
          <StatBox label="Présence" value={`${stats.presence}%`} color="var(--color-primary)" />
        </div>

        {/* Barre de présence visuelle */}
        <div className="mb-10 p-5 rounded-xl bg-card border border-border animate-fade-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Taux de participation</span>
            <span className="font-display text-2xl" style={{ color: "var(--color-primary)" }}>
              {stats.presence}%
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            <div
              className="result-bar-segment rounded-full"
              style={{
                width: `${stats.presence}%`,
                background: `linear-gradient(90deg, var(--color-pour), var(--color-primary))`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.pour + stats.contre + stats.abstention} votes exprimés sur {stats.total} scrutins.
          </p>
        </div>

        {/* Filtres */}
        <div
          className="flex flex-wrap gap-2 mb-4 animate-fade-in"
          style={{ animationDelay: "200ms" }}
          role="group"
          aria-label="Filtrer les votes par position"
        >
          {(
            [
              ["all", "Tous"],
              ["pour", "Pour"],
              ["contre", "Contre"],
              ["abstention", "Abstention"],
              ["nonVotant", "Absent / non-votant"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPosFilter(k as VotePosition | "all")}
              aria-pressed={posFilter === k}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                posFilter === k
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border hover:border-primary/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Liste des votes */}
        <h2
          className="font-display text-2xl mb-4 animate-fade-in"
          style={{ animationDelay: "250ms" }}
        >
          Votes ({filteredVotes.length})
        </h2>

        {filteredVotes.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Aucun vote enregistré dans cette catégorie.
          </p>
        ) : (
          <ul className="space-y-2 animate-stagger" aria-label="Historique des votes">
            {filteredVotes.slice(0, 100).map((v) => (
              <li key={v.scrutin.numero} className="animate-fade-up">
                <Link
                  to="/scrutin/$numero"
                  params={{ numero: v.scrutin.numero }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors group"
                >
                  <span
                    className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: positionColor(v.position),
                      backgroundColor: `color-mix(in oklch, ${positionColor(v.position)} 14%, transparent)`,
                    }}
                  >
                    {positionLabel(v.position)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {sanitizeText(v.scrutin.titre).charAt(0).toUpperCase() +
                        sanitizeText(v.scrutin.titre).slice(1)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {v.scrutin.date
                        ? new Date(v.scrutin.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : ""}
                      {v.scrutin.sort && ` · ${sanitizeText(v.scrutin.sort)}`}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {filteredVotes.length > 100 && (
          <p className="text-xs text-muted-foreground text-center mt-6 py-4 border-t border-border">
            Affichage des 100 premiers votes sur{" "}
            {filteredVotes.length}. Filtrez par position pour affiner.
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
    <div className="stat-box p-4 rounded-xl bg-card border border-border">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
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
