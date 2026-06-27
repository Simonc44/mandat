import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { scrutinsQuery, normalize } from "@/lib/api";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["all", "adopte", "rejete"]), "all").default("all"),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/scrutins")({
  head: () => ({
    meta: [
      { title: "Tous les scrutins — Mandat" },
      { name: "description", content: "Liste complète des scrutins publics à l'Assemblée nationale, avec résultat et lien vers le détail." },
    ],
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
      if (n && !normalize(s.titre).includes(n)) return false;
      return true;
    });
  }, [scrutins, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setF = (patch: Partial<{ q: string; sort: "all" | "adopte" | "rejete"; page: number }>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  return (
    <div className="container-app py-12">
      <h1 className="font-display text-4xl md:text-5xl mb-2">Scrutins</h1>
      <p className="text-muted-foreground mb-8">
        {filtered.length.toLocaleString("fr-FR")} scrutins · XVIe législature (2022-2024)
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); setF({ q: search }); }}
        className="flex gap-2 mb-4"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cherchez par mot-clé dans l'intitulé du texte…"
          className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:outline-none"
        />
        <button className="px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          Chercher
        </button>
      </form>

      <div className="flex gap-2 mb-6">
        {([["all","Tous"],["adopte","Adoptés"],["rejete","Rejetés"]] as const).map(([k,l]) => (
          <button
            key={k}
            onClick={() => setF({ sort: k })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              sort === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {slice.map((s) => {
          const p = +s.nombre_pours, c = +s.nombre_contres, a = +s.nombre_abstentions;
          const total = Math.max(1, p + c + a);
          return (
            <li key={s.numero}>
              <Link
                to="/scrutin/$numero"
                params={{ numero: s.numero }}
                className="block p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>n°{s.numero}</span>
                    <span>·</span>
                    <time>{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>
                    <span>·</span>
                    <span className="capitalize">{s.type}</span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      color: /adopt/i.test(s.sort) ? "var(--color-pour)" : "var(--color-contre)",
                      backgroundColor: `color-mix(in oklch, ${/adopt/i.test(s.sort) ? "var(--color-pour)" : "var(--color-contre)"} 14%, transparent)`,
                    }}
                  >
                    {s.sort}
                  </span>
                </div>
                <p className="text-foreground leading-snug line-clamp-2 mb-3">
                  {s.titre.charAt(0).toUpperCase() + s.titre.slice(1)}
                </p>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted mb-1.5">
                  <div style={{ width: `${(p/total)*100}%`, backgroundColor: "var(--color-pour)" }} />
                  <div style={{ width: `${(c/total)*100}%`, backgroundColor: "var(--color-contre)" }} />
                  <div style={{ width: `${(a/total)*100}%`, backgroundColor: "var(--color-abstention)" }} />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{p}</strong> pour</span>
                  <span><strong className="text-foreground">{c}</strong> contre</span>
                  <span><strong className="text-foreground">{a}</strong> abst.</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setF({ page: Math.max(1, safePage - 1) })}
            disabled={safePage <= 1}
            className="px-3 py-2 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-secondary"
          >← Préc.</button>
          <span className="text-sm text-muted-foreground px-3">
            Page <strong className="text-foreground">{safePage}</strong> / {totalPages}
          </span>
          <button
            onClick={() => setF({ page: Math.min(totalPages, safePage + 1) })}
            disabled={safePage >= totalPages}
            className="px-3 py-2 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-secondary"
          >Suiv. →</button>
        </nav>
      )}
    </div>
  );
}
