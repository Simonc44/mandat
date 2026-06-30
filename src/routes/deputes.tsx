// routes/deputes.tsx — Liquid Glass + filtres + pagination

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  allDeputesQuery,
  normalize,
  sanitizeSearchInput,
  GROUPES,
} from "@/lib/api";
import { DeputeCard, DeputeCardSkeletonGrid } from "@/components/DeputeCard";
import { SearchX } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  groupe: fallback(z.string(), "").default(""),
  dept: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/deputes")({
  head: () => ({
    meta: createSeoMeta({
      title: "Les 577 député·es — Mandat",
      description:
        "Cherchez et filtrez les député·es à l'Assemblée nationale par groupe politique, département ou nom. 17e législature.",
      canonical: `${SITE_URL}/deputes`,
    }),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(allDeputesQuery),
  component: DeputesPage,
});

const PAGE_SIZE = 30;

function DeputesPage() {
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);
  const { q, groupe, dept, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  const groupes = useMemo(() => {
    const map = new Map<string, number>();
    deputes.forEach((d) => {
      if (d.groupe_sigle)
        map.set(d.groupe_sigle, (map.get(d.groupe_sigle) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [deputes]);

  const departments = useMemo(() => {
    const map = new Map<string, string>();
    deputes.forEach((d) => {
      if (d.num_deptmt) map.set(d.num_deptmt, d.nom_circo);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [deputes]);

  const filtered = useMemo(() => {
    const n = normalize(q);
    return deputes.filter((d) => {
      if (groupe && d.groupe_sigle !== groupe) return false;
      if (dept && d.num_deptmt !== dept) return false;
      if (
        n &&
        !normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.num_deptmt}`,
        ).includes(n)
      )
        return false;
      return true;
    });
  }, [deputes, q, groupe, dept]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const setFilter = (
    patch: Partial<{ q: string; groupe: string; dept: string; page: number }>,
  ) =>
    navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({
        ...prev,
        ...patch,
        page: patch.page ?? 1,
      }),
    });

  const hasFilters = !!(q || groupe || dept);

  return (
    <div className="container-app py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl mb-2">Député·es</h1>
        <p className="text-muted-foreground">
          {filtered.length.toLocaleString("fr-FR")} résultat
          {filtered.length > 1 ? "s" : ""} sur {deputes.length} député·es ·
          XVIIe législature
        </p>
      </div>

      {/* Recherche */}
      <div
        className="space-y-4 mb-8 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ q: sanitizeSearchInput(search) });
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
              placeholder="Nom, prénom, circonscription…"
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
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                navigate({
                  search: { q: "", groupe: "", dept: "", page: 1 },
                });
              }}
              className="px-4 py-3 rounded-2xl glass border border-border/50 text-sm hover:border-primary/30 transition-colors"
            >
              ✕ Réinit.
            </button>
          )}
        </form>

        {/* Filtres groupes */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par groupe"
        >
          <button
            onClick={() => setFilter({ groupe: "" })}
            aria-pressed={!groupe}
            className={chipCls(!groupe)}
          >
            Tous
          </button>
          {groupes.map(([sig, count]) => (
            <button
              key={sig}
              onClick={() => setFilter({ groupe: sig })}
              aria-pressed={groupe === sig}
              className={chipCls(groupe === sig)}
              title={GROUPES[sig]?.nom ?? sig}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    GROUPES[sig]?.couleur ?? "oklch(0.55 0.02 285)",
                }}
                aria-hidden="true"
              />
              {sig || "NI"}
              <span className="opacity-50 text-[10px]">· {count}</span>
            </button>
          ))}
        </div>

        {/* Filtre département */}
        <div>
          <label htmlFor="dept-select" className="sr-only">
            Filtrer par département
          </label>
          <select
            id="dept-select"
            value={dept}
            onChange={(e) => setFilter({ dept: e.target.value })}
            className="px-3 py-2.5 rounded-xl glass border border-border/50 text-sm bg-transparent focus:outline-none focus:border-primary/50"
          >
            <option value="">Tous les départements</option>
            {departments.map(([num, nom]) => (
              <option key={num} value={num}>
                {num} — {nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Carte département (quand un département est sélectionné) */}
      {dept && (
        <DepartementCard
          numero={dept}
          deputes={filtered}
          nomDepartement={departments.find(([n]) => n === dept)?.[1] ?? ""}
        />
      )}

      {/* Résultats */}

      {slice.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <SearchX
            className="w-10 h-10 mx-auto mb-3 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            Aucun·e député·e ne correspond à ces critères.
          </p>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                navigate({ search: { q: "", groupe: "", dept: "", page: 1 } });
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger">
          {slice.map((d, i) => (
            <DeputeCard key={d.id || d.slug} d={d} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-2"
          aria-label="Pagination"
        >
          <button
            onClick={() => setFilter({ page: Math.max(1, safePage - 1) })}
            disabled={safePage <= 1}
            className="px-4 py-2 rounded-xl glass border border-border/50 text-sm disabled:opacity-40 hover:border-primary/30 transition-colors"
          >
            ← Préc.
          </button>

          {/* Pages numérotées */}
          <div className="flex items-center gap-1">
            {buildPageRange(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-muted-foreground text-sm"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setFilter({ page: p as number })}
                  aria-current={safePage === p ? "page" : undefined}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    safePage === p
                      ? "btn-primary"
                      : "glass border border-border/40 hover:border-primary/30"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() =>
              setFilter({ page: Math.min(totalPages, safePage + 1) })
            }
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

function chipCls(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
    active
      ? "btn-primary border-transparent"
      : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
  }`;
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  )
    pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
