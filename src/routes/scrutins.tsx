// routes/scrutins.tsx — Liquid Glass + sort badge + barre animée

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  scrutinsQuery,
  normalize,
  sanitizeSearchInput,
  type Scrutin,
} from "@/lib/api";
import { createSeoMeta, SITE_URL } from "./__root";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["all", "adopte", "rejete"]), "all").default("all"),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/scrutins")({
  head: () => ({
    meta: createSeoMeta({
      title: "Tous les scrutins — Mandat",
      description:
        "Liste complète des scrutins publics à l'Assemblée nationale (17e législature). Résultats, votes, textes de loi.",
      canonical: `${SITE_URL}/scrutins`,
    }),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(scrutinsQuery),
  component: ScrutinsPage,
});

const PAGE_SIZE = 20;

function ScrutinsPage() {
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);
  const { q, sort, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  const filtered = useMemo(() => {
    const n = normalize(q);
    const sorted = [...scrutins].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.filter((s) => {
      if (sort === "adopte" && !/adopt/i.test(s.sort)) return false;
      if (sort === "rejete" && /adopt/i.test(s.sort)) return false;
      if (n && !normalize(s.titre || "").includes(n)) return false;
      return true;
    });
  }, [scrutins, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page > totalPages ? totalPages : page, totalPages);
  const slice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const setF = (
    patch: Partial<{
      q: string;
      sort: "all" | "adopte" | "rejete";
      page: number;
    }>,
  ) =>
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        page: patch.page ?? 1,
      }),
    });

  return (
    <div className="container-app py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl mb-2">Scrutins</h1>
        <p className="text-muted-foreground">
          {filtered.length.toLocaleString("fr-FR")} scrutin
          {filtered.length > 1 ? "s" : ""} · XVIIe législature
        </p>
      </div>

      {/* Filtres */}
      <div
        className="sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 bg-background/95 backdrop-blur-md border-b border-border/20 space-y-4 mb-8 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setF({ q: sanitizeSearchInput(search) });
          }}
          className="flex gap-2"
          role="search"
        >
          <div className="search-ring flex-1 flex items-center glass-strong rounded-2xl border border-white/30 px-4">
            <svg
              className="w-4 h-4 text-muted-foreground shrink-0 mr-2"
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mot-clé dans l'intitulé du texte…"
              className="flex-1 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-5 py-3 rounded-2xl text-sm font-medium"
          >
            Chercher
          </button>
        </form>

        <div
          className="flex gap-2"
          role="group"
          aria-label="Filtrer par résultat"
        >
          {(
            [
              ["all", "Tous"],
              ["adopte", "✓ Adoptés"],
              ["rejete", "✗ Rejetés"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setF({ sort: k })}
              aria-pressed={sort === k}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                sort === k
                  ? "btn-primary border-transparent"
                  : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {slice.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <span className="text-4xl block mb-3" aria-hidden="true">
            📋
          </span>
          <p className="text-muted-foreground">
            Aucun scrutin ne correspond à ces critères.
          </p>
        </div>
      ) : (
        <ul
          className="space-y-3 animate-stagger"
          aria-label="Liste des scrutins"
        >
          {slice.map((s, i) => (
            <ScrutinRow key={s.numero} s={s} index={i} />
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-2"
          aria-label="Pagination"
        >
          <button
            onClick={() => setF({ page: Math.max(1, safePage - 1) })}
            disabled={safePage <= 1}
            className="px-4 py-2 rounded-xl glass border border-border/50 text-sm disabled:opacity-40 hover:border-primary/30 transition-colors"
          >
            ← Préc.
          </button>
          <span className="text-sm text-muted-foreground px-2">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setF({ page: Math.min(totalPages, safePage + 1) })}
            disabled={safePage >= totalPages}
            className="px-4 py-2 rounded-xl glass border border-border/50 text-sm disabled:opacity-40 hover:border-primary/30 transition-colors"
          >
            Suiv. →
          </button>
        </nav>
      )}
    </div>
  );
}

function ScrutinRow({ s, index }: { s: Scrutin; index: number }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0);
  const c = Math.max(0, parseInt(s.nombre_contres) || 0);
  const a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  const [mounted, setMounted] = useState(false);
  const isAdopted = /adopt/i.test(s.sort);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100 + index * 30);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <li
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <Link
        to="/scrutin/$numero"
        params={{ numero: s.numero }}
        className="scrutin-card card-glass group block p-5 rounded-2xl border border-border/40"
        aria-label={`Scrutin n°${s.numero} : ${s.titre || "Sans titre"}`}
      >
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-mono text-foreground/50">n°{s.numero}</span>
          {s.date && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={s.date}>
                {new Date(s.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </>
          )}
          {s.sort && (
            <>
              <span aria-hidden="true">·</span>
              <span
                className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px]"
                style={{
                  color: isAdopted
                    ? "var(--color-pour)"
                    : "var(--color-contre)",
                  backgroundColor: isAdopted
                    ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
                    : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
                }}
              >
                {isAdopted ? "✓ Adopté" : "✗ Rejeté"}
              </span>
            </>
          )}
          {s.legislature && (
            <>
              <span aria-hidden="true">·</span>
              <span>{s.legislature}e législature</span>
            </>
          )}
        </div>

        {/* Titre */}
        <p className="text-foreground font-medium leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors duration-200">
          {s.titre
            ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
            : `Scrutin n°${s.numero}`}
        </p>

        {/* Tags */}
        {s.tags && s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {s.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10px] rounded-full glass border border-border/40 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Barre + compteurs */}
        {(p > 0 || c > 0 || a > 0) && (
          <div className="space-y-1.5">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted/60">
              <div
                style={{
                  width: mounted ? `${(p / total) * 100}%` : "0%",
                  backgroundColor: "var(--color-pour)",
                  transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
              <div
                style={{
                  width: mounted ? `${(c / total) * 100}%` : "0%",
                  backgroundColor: "var(--color-contre)",
                  transition:
                    "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms",
                }}
              />
              <div
                style={{
                  width: mounted ? `${(a / total) * 100}%` : "0%",
                  backgroundColor: "var(--color-abstention)",
                  transition:
                    "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
                }}
              />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{p}</strong> pour
              </span>
              <span>
                <strong className="text-foreground">{c}</strong> contre
              </span>
              <span>
                <strong className="text-foreground">{a}</strong> abst.
              </span>
            </div>
          </div>
        )}
      </Link>
    </li>
  );
}
