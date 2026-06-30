// routes/legislature-16.tsx — Archive 16e législature (2022-2024)
// Données nosdeputes.fr via server function (CORS contourné).

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getDeputes16, type Depute16 } from "@/lib/legislature16.functions";
import { groupeMeta, normalize, sanitizeSearchInput } from "@/lib/api";
import { Archive, ExternalLink } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

const deputes16Query = queryOptions({
  queryKey: ["deputes", 16],
  staleTime: 1000 * 60 * 60,
  queryFn: () => getDeputes16(),
});

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  groupe: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/legislature-16")({
  head: () => ({
    meta: createSeoMeta({
      title: "16ᵉ législature (2022-2024) — Archive · Mandat",
      description:
        "Archive complète des 577 député·es de la 16e législature de l'Assemblée nationale (2022-2024). Données ouvertes nosdeputes.fr.",
      canonical: `${SITE_URL}/legislature-16`,
    }),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(deputes16Query),
  component: Legislature16Page,
});

function Legislature16Page() {
  const { data: deputes } = useSuspenseQuery(deputes16Query);
  const { q, groupe } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  const groupes = useMemo(() => {
    const map = new Map<string, number>();
    deputes.forEach((d) =>
      map.set(d.groupe_sigle, (map.get(d.groupe_sigle) ?? 0) + 1),
    );
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [deputes]);

  const filtered = useMemo(() => {
    const n = normalize(q);
    return deputes.filter((d) => {
      if (groupe && d.groupe_sigle !== groupe) return false;
      if (
        n &&
        !normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.num_deptmt}`,
        ).includes(n)
      )
        return false;
      return true;
    });
  }, [deputes, q, groupe]);

  return (
    <div className="container-app py-12">
      <div className="mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs font-medium text-primary mb-4">
          <Archive className="w-3.5 h-3.5" />
          Archive · 2022 — 2024
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-2 tracking-tight">
          16<sup>e</sup> législature
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Les {deputes.length} député·es de la précédente législature. Données
          fournies par{" "}
          <a
            href="https://2022-2024.nosdeputes.fr"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            nosdeputes.fr (Regards Citoyens)
            <ExternalLink className="w-3 h-3" />
          </a>
          .
        </p>
      </div>

      {/* Recherche */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({
            search: (p) => ({ ...p, q: sanitizeSearchInput(search) }),
          });
        }}
        className="flex gap-2 mb-4"
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
            placeholder="Nom, prénom, circonscription…"
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

      {/* Filtres groupes — noms complets */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() =>
            navigate({ search: (p) => ({ ...p, groupe: "" }) })
          }
          aria-pressed={!groupe}
          className={chip(!groupe)}
        >
          Tous les groupes
        </button>
        {groupes.map(([sig, n]) => {
          const g = groupeMeta(sig);
          return (
            <button
              key={sig}
              onClick={() =>
                navigate({ search: (p) => ({ ...p, groupe: sig }) })
              }
              aria-pressed={groupe === sig}
              className={chip(groupe === sig)}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: g.couleur }}
                aria-hidden="true"
              />
              {g.nom}
              <span className="opacity-50">· {n}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length.toLocaleString("fr-FR")} résultat
        {filtered.length > 1 ? "s" : ""}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 120).map((d) => (
          <Depute16Card key={d.slug} d={d} />
        ))}
      </div>
      {filtered.length > 120 && (
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Affichage limité aux 120 premiers résultats — affinez votre recherche.
        </p>
      )}
    </div>
  );
}

function chip(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
    active
      ? "btn-primary border-transparent"
      : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
  }`;
}

function Depute16Card({ d }: { d: Depute16 }) {
  const g = groupeMeta(d.groupe_sigle);
  const [err, setErr] = useState(false);
  return (
    <a
      href={d.url_an || `https://2022-2024.nosdeputes.fr/${d.slug}`}
      target="_blank"
      rel="noreferrer noopener"
      className="card-glass group p-4 rounded-2xl flex items-center gap-3 hover:border-primary/40 transition-all"
    >
      {err ? (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: `color-mix(in oklch, ${g.couleur} 18%, white)`,
            color: g.couleur,
          }}
        >
          {`${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`}
        </div>
      ) : (
        <img
          src={d.photo}
          alt=""
          aria-hidden="true"
          className="w-12 h-12 rounded-full object-cover shrink-0"
          onError={() => setErr(true)}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
          {d.prenom} {d.nom_de_famille}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: g.couleur }}
            aria-hidden="true"
          />
          <span className="truncate">{g.nom}</span>
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {d.num_deptmt} · {d.nom_circo}
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
    </a>
  );
}
