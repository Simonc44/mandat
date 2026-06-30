// routes/recherche.tsx — Recherche globale Liquid Glass

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  allDeputesQuery,
  scrutinsQuery,
  normalize,
  sanitizeSearchInput,
} from "@/lib/api";
import { DeputeCard } from "@/components/DeputeCard";
import { createSeoMeta, SITE_URL } from "./__root";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/recherche")({
  head: () => ({
    meta: createSeoMeta({
      title: "Recherche — Mandat",
      description:
        "Cherchez un·e député·e ou un texte de loi à l'Assemblée nationale. Résultats instantanés.",
      canonical: `${SITE_URL}/recherche`,
    }),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(allDeputesQuery),
      context.queryClient.ensureQueryData(scrutinsQuery),
    ]),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);
  const [input, setInput] = useState(q);

  const results = useMemo(() => {
    const n = normalize(q);
    if (!n || n.length < 2) return null;
    const ds = deputes
      .filter((d) =>
        normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.num_deptmt} ${d.groupe_sigle}`,
        ).includes(n),
      )
      .slice(0, 24);
    const ss = scrutins
      .filter((s) => normalize(s.titre || "").includes(n))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
    return { ds, ss };
  }, [q, deputes, scrutins]);

  const total = results ? results.ds.length + results.ss.length : 0;

  return (
    <div className="container-app py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl mb-2">Recherche</h1>
        {q && results && (
          <p className="text-muted-foreground">
            {total.toLocaleString("fr-FR")} résultat{total > 1 ? "s" : ""} pour{" "}
            <strong className="text-foreground">« {q} »</strong>
          </p>
        )}
      </div>

      {/* Barre */}
      <div
        className="sticky-toolbar sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 mb-10 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { q: sanitizeSearchInput(input.trim()) } });
          }}
          className="flex flex-col sm:flex-row gap-2 max-w-3xl"
          role="search"
        >
          <div className="search-ring flex-1 flex items-center glass-strong rounded-full border border-white/30 px-5">
            <svg
              className="w-5 h-5 text-muted-foreground shrink-0 mr-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nom d'un·e député·e, mot-clé d'un texte de loi…"
              className="flex-1 py-4 bg-transparent outline-none placeholder:text-muted-foreground"
              maxLength={150}
              autoComplete="off"
              spellCheck="false"
            />
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  navigate({ search: { q: "" } });
                }}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                aria-label="Effacer la recherche"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary px-8 py-3 rounded-full text-sm font-medium"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* État vide */}
      {!q && (
        <div className="py-16 text-center animate-scale-in">
          <div className="text-5xl mb-4" aria-hidden="true">
            🔍
          </div>
          <p className="text-muted-foreground text-lg mb-2">
            Que cherchez-vous ?
          </p>
          <p className="text-sm text-muted-foreground">
            Un nom de député·e, un groupe, une thématique de loi…
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["Budget", "Immigration", "Éducation", "Santé", "Énergie"].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => {
                    setInput(term);
                    navigate({ search: { q: term } });
                  }}
                  className="px-4 py-2 rounded-full glass border border-border/50 text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {term}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* Aucun résultat */}
      {q && results && total === 0 && (
        <div className="py-16 text-center animate-scale-in">
          <div className="text-5xl mb-4" aria-hidden="true">
            📭
          </div>
          <p className="text-muted-foreground text-lg">
            Aucun résultat pour «{" "}
            <strong className="text-foreground">{q}</strong> »
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Essayez avec un nom simplifié ou un autre mot-clé.
          </p>
        </div>
      )}

      {/* Résultats */}
      {results && total > 0 && (
        <div className="space-y-12">
          {/* Député·es */}
          {results.ds.length > 0 && (
            <section
              aria-labelledby="deputes-heading"
              className="animate-fade-up"
            >
              <div className="flex items-end justify-between mb-4">
                <h2 id="deputes-heading" className="font-display text-2xl">
                  Député·es{" "}
                  <span className="text-base font-sans text-muted-foreground">
                    ({results.ds.length})
                  </span>
                </h2>
                {results.ds.length >= 24 && (
                  <Link
                    to="/deputes"
                    search={{ q, groupe: "", dept: "", page: 1 }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
                  >
                    Tous les résultats
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger">
                {results.ds.map((d, i) => (
                  <DeputeCard key={d.id || d.slug} d={d} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Scrutins */}
          {results.ss.length > 0 && (
            <section
              aria-labelledby="scrutins-heading"
              className="animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-end justify-between mb-4">
                <h2 id="scrutins-heading" className="font-display text-2xl">
                  Scrutins{" "}
                  <span className="text-base font-sans text-muted-foreground">
                    ({results.ss.length})
                  </span>
                </h2>
                {results.ss.length >= 30 && (
                  <Link
                    to="/scrutins"
                    search={{ q, sort: "all", page: 1 }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
                  >
                    Tous les résultats
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                )}
              </div>

              <ul
                className="space-y-2 animate-stagger"
                aria-label="Scrutins correspondants"
              >
                {results.ss.map((s, i) => {
                  const isAdopted = /adopt/i.test(s.sort);
                  return (
                    <li
                      key={s.numero}
                      className="animate-fade-up"
                      style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                    >
                      <Link
                        to="/scrutin/$numero"
                        params={{ numero: s.numero }}
                        className="scrutin-card card-glass group block p-4 rounded-[2rem] border border-border/40"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1.5">
                          {s.date && (
                            <time dateTime={s.date}>
                              {new Date(s.date).toLocaleDateString("fr-FR")}
                            </time>
                          )}
                          {s.sort && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className="font-semibold"
                                style={{
                                  color: isAdopted
                                    ? "var(--color-pour)"
                                    : "var(--color-contre)",
                                }}
                              >
                                {isAdopted ? "✓ Adopté" : "✗ Rejeté"}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 font-medium">
                          {s.titre
                            ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
                            : `Scrutin n°${s.numero}`}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
