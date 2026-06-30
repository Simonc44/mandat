// routes/scrutins-16.tsx — Archive des scrutins de la 16e législature

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getScrutins16, type Scrutin16 } from "@/lib/legislature16.functions";
import { normalize, sanitizeSearchInput } from "@/lib/api";
import { Archive, Search } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

const scrutins16Query = queryOptions({
  queryKey: ["scrutins", 16],
  staleTime: 1000 * 60 * 60,
  queryFn: () => getScrutins16(),
});

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/scrutins-16")({
  head: () => ({
    meta: createSeoMeta({
      title: "Scrutins 16ᵉ législature (2022-2024) — Archive · Mandat",
      description:
        "Archive complète des votes de la 16e législature de l'Assemblée nationale (2022-2024). Données nosdeputes.fr.",
      canonical: `${SITE_URL}/scrutins-16`,
    }),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(scrutins16Query),
  component: Scrutins16Page,
});

function Scrutins16Page() {
  const { data: scrutins } = useSuspenseQuery(scrutins16Query);
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  const filtered = useMemo(() => {
    const n = normalize(q);
    if (!n) return scrutins;
    return scrutins.filter((s) => normalize(s.titre).includes(n));
  }, [scrutins, q]);

  return (
    <div className="container-app py-12">
      <div className="mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs font-medium text-primary mb-4">
          <Archive className="w-3.5 h-3.5" />
          Archive · 2022 — 2024
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-2 tracking-tight">
          Scrutins 16<sup>e</sup> législature
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Retrouvez les votes de la précédente législature. Les détails nominatifs
          ne sont pas disponibles pour cette archive.
        </p>
      </div>

      {/* Recherche */}
      <div className="sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 bg-background/95 backdrop-blur-md border-b border-border/20 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({
              search: (p) => ({
                ...p,
                q: sanitizeSearchInput(search),
              }),
            });
          }}
          className="flex gap-2"
          role="search"
        >
          <div className="search-ring flex-1 flex items-center glass-strong rounded-2xl border border-white/30 px-4">
            <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher un scrutin..."
              className="flex-1 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              maxLength={150}
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-5 py-3 rounded-2xl text-sm font-medium"
          >
            Chercher
          </button>
        </form>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length.toLocaleString("fr-FR")} résultat
        {filtered.length > 1 ? "s" : ""}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.slice(0, 100).map((s) => (
          <Scrutin16Card key={s.numero} s={s} />
        ))}
      </div>

      {filtered.length > 100 && (
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Affichage limité aux 100 premiers résultats — affinez votre recherche.
        </p>
      )}
    </div>
  );
}

function Scrutin16Card({ s }: { s: Scrutin16 }) {
  return (
    <div className="card-glass p-5 rounded-2xl animate-fade-up">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
        {s.date && (
          <time dateTime={s.date}>
            {new Date(s.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        )}
        <span aria-hidden="true">·</span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: s.isAdopte ? "var(--color-pour)" : "var(--color-contre)",
            backgroundColor: s.isAdopte
              ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
              : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
          }}
        >
          {s.isAdopte ? "✓ Adopté" : "✗ Rejeté"}
        </span>
      </div>

      <p className="text-foreground text-sm leading-snug mb-3 font-medium line-clamp-3">
        {s.titre}
      </p>

      <ResultMiniBar16 s={s} />
    </div>
  );
}

function ResultMiniBar16({ s }: { s: Scrutin16 }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0);
  const c = Math.max(0, parseInt(s.nombre_contres) || 0);
  const a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/60">
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
            transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms",
          }}
        />
        <div
          style={{
            width: mounted ? `${(a / total) * 100}%` : "0%",
            backgroundColor: "var(--color-abstention)",
            transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
          }}
        />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
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
  );
}
