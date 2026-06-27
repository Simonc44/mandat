import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { allDeputesQuery, scrutinsQuery, normalize } from "@/lib/api";
import { DeputeCard } from "@/components/DeputeCard";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche — Mandat" },
      { name: "description", content: "Cherchez un·e député·e ou un texte de loi à l'Assemblée nationale." },
    ],
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
    if (!n) return null;
    const ds = deputes.filter((d) =>
      normalize(`${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.num_deptmt} ${d.groupe_sigle}`).includes(n),
    );
    const ss = scrutins.filter((s) => normalize(s.titre).includes(n))
      .sort((a, b) => b.date.localeCompare(a.date));
    return { ds, ss };
  }, [q, deputes, scrutins]);

  return (
    <div className="container-app py-12">
      <h1 className="font-display text-4xl md:text-5xl mb-6">Recherche</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: input.trim() } }); }}
        className="flex gap-2 mb-10 max-w-3xl"
      >
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nom d'un·e député·e, mot-clé d'un texte de loi…"
          className="flex-1 px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary focus:outline-none"
        />
        <button className="px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          Rechercher
        </button>
      </form>

      {!results && (
        <p className="text-muted-foreground">Entrez une recherche pour voir des résultats.</p>
      )}

      {results && (
        <div className="space-y-12">
          <section>
            <h2 className="font-display text-2xl mb-4">
              Député·es <span className="text-base font-sans text-muted-foreground">({results.ds.length})</span>
            </h2>
            {results.ds.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun·e député·e correspondant.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.ds.slice(0, 18).map((d) => <DeputeCard key={d.id} d={d} />)}
              </div>
            )}
            {results.ds.length > 18 && (
              <Link to="/deputes" search={{ q, groupe: "", dept: "", page: 1 }} className="inline-block mt-4 text-sm text-primary hover:underline">
                Voir tous les {results.ds.length} résultats →
              </Link>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl mb-4">
              Scrutins <span className="text-base font-sans text-muted-foreground">({results.ss.length})</span>
            </h2>
            {results.ss.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun scrutin correspondant.</p>
            ) : (
              <ul className="space-y-2">
                {results.ss.slice(0, 20).map((s) => (
                  <li key={s.numero}>
                    <Link
                      to="/scrutin/$numero"
                      params={{ numero: s.numero }}
                      className="block p-4 rounded-lg bg-card border border-border hover:border-primary/40"
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(s.date).toLocaleDateString("fr-FR")} · {s.sort}
                      </div>
                      <div className="text-sm line-clamp-2">
                        {s.titre.charAt(0).toUpperCase() + s.titre.slice(1)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
