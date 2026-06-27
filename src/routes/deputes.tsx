import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { allDeputesQuery, normalize, GROUPES } from "@/lib/api";
import { DeputeCard } from "@/components/DeputeCard";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  groupe: fallback(z.string(), "").default(""),
  dept: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/deputes")({
  head: () => ({
    meta: [
      { title: "Les 577 député·es — Mandat" },
      { name: "description", content: "Cherchez et filtrez les député·es à l'Assemblée nationale par groupe, département ou nom." },
      { property: "og:title", content: "Les député·es — Mandat" },
      { property: "og:description", content: "Cherchez et filtrez les député·es par groupe, département ou nom." },
    ],
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
    const set = new Map<string, number>();
    deputes.forEach((d) => set.set(d.groupe_sigle, (set.get(d.groupe_sigle) ?? 0) + 1));
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
  }, [deputes]);

  const departments = useMemo(() => {
    const set = new Map<string, string>();
    deputes.forEach((d) => set.set(d.num_deptmt, d.nom_circo));
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [deputes]);

  const filtered = useMemo(() => {
    const n = normalize(q);
    return deputes.filter((d) => {
      if (groupe && d.groupe_sigle !== groupe) return false;
      if (dept && d.num_deptmt !== dept) return false;
      if (n && !normalize(`${d.prenom} ${d.nom_de_famille} ${d.nom_circo}`).includes(n)) return false;
      return true;
    });
  }, [deputes, q, groupe, dept]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setFilter = (patch: Partial<{ q: string; groupe: string; dept: string; page: number }>) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  return (
    <div className="container-app py-12">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">Député·es</h1>
          <p className="text-muted-foreground">
            {filtered.length.toLocaleString("fr-FR")} résultats sur {deputes.length} député·es de la XVIe législature.
          </p>
        </div>
      </header>

      {/* Search + filters */}
      <div className="space-y-4 mb-8">
        <form
          onSubmit={(e) => { e.preventDefault(); setFilter({ q: search }); }}
          className="flex gap-2"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, prénom, circonscription, code postal de la ville…"
            className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:outline-none"
          />
          <button className="px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            Chercher
          </button>
          {(q || groupe || dept) && (
            <button
              type="button"
              onClick={() => { setSearch(""); navigate({ search: { q: "", groupe: "", dept: "", page: 1 } }); }}
              className="px-4 py-3 rounded-lg border border-border text-sm hover:bg-secondary"
            >
              Réinitialiser
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter({ groupe: "" })}
            className={chipClass(!groupe)}
          >
            Tous les groupes
          </button>
          {groupes.slice(0, 10).map(([sig, count]) => (
            <button
              key={sig}
              onClick={() => setFilter({ groupe: sig })}
              className={chipClass(groupe === sig)}
              title={GROUPES[sig]?.nom ?? sig}
            >
              {sig || "NI"} <span className="opacity-60">· {count}</span>
            </button>
          ))}
        </div>

        <div>
          <select
            value={dept}
            onChange={(e) => setFilter({ dept: e.target.value })}
            className="px-3 py-2 rounded-lg bg-surface border border-border text-sm"
          >
            <option value="">Tous les départements</option>
            {departments.map(([num, nom]) => (
              <option key={num} value={num}>{num} — {nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {slice.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">Aucun député·e ne correspond à ces critères.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {slice.map((d) => <DeputeCard key={d.id} d={d} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => setFilter({ page: Math.max(1, safePage - 1) })}
            disabled={safePage <= 1}
            className="px-3 py-2 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-secondary"
          >
            ← Préc.
          </button>
          <span className="text-sm text-muted-foreground px-3">
            Page <strong className="text-foreground">{safePage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setFilter({ page: Math.min(totalPages, safePage + 1) })}
            disabled={safePage >= totalPages}
            className="px-3 py-2 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-secondary"
          >
            Suiv. →
          </button>
        </nav>
      )}
    </div>
  );
}

function chipClass(active: boolean) {
  return `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-surface border-border text-foreground/80 hover:border-primary/40"
  }`;
}
