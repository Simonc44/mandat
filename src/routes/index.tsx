import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  allDeputesQuery,
  scrutinsQuery,
  normalize,
  type Depute,
  type Scrutin,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mandat — Qui a voté quoi, et pourquoi" },
      {
        name: "description",
        content:
          "Cherchez un député, un texte de loi, un scrutin. Les votes de l'Assemblée nationale, enfin lisibles.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(allDeputesQuery),
      context.queryClient.ensureQueryData(scrutinsQuery),
    ]),
  component: Home,
});

function Home() {
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);

  const latest = useMemo(
    () => [...scrutins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [scrutins],
  );

  const stats = useMemo(() => {
    const groupes = new Set(deputes.map((d) => d.groupe_sigle).filter(Boolean));
    return {
      deputes: deputes.length,
      scrutins: scrutins.length,
      groupes: groupes.size,
    };
  }, [deputes, scrutins]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, var(--color-primary) 0%, transparent 45%), radial-gradient(circle at 80% 70%, var(--color-primary) 0%, transparent 40%)",
          }}
        />
        <div className="container-app pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Transparence citoyenne
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-5">
              Qui a voté quoi —<br />
              <span className="text-primary italic">et pourquoi.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              Mandat rend lisibles les {stats.scrutins.toLocaleString("fr-FR")} scrutins
              de la XVIe législature. Cherchez un·e député·e, un texte de loi, un groupe.
              Sans étiquette, sans score idéologique.
            </p>
            <SearchBar deputes={deputes} scrutins={scrutins} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mt-12 md:mt-16 max-w-2xl">
            <Stat value={stats.deputes.toLocaleString("fr-FR")} label="Député·es" />
            <Stat value={stats.scrutins.toLocaleString("fr-FR")} label="Scrutins publics" />
            <Stat value={stats.groupes.toString()} label="Groupes politiques" />
          </div>
        </div>
      </section>

      {/* Latest votes */}
      <section className="container-app pb-20">
        <div className="flex items-end justify-between mb-6 mt-4">
          <h2 className="font-display text-3xl">Derniers scrutins</h2>
          <Link to="/scrutins" className="text-sm text-primary hover:underline">
            Tout voir →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {latest.map((s) => (
            <Link
              key={s.numero}
              to="/scrutin/$numero"
              params={{ numero: s.numero }}
              className="group block p-5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <time>{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>
                <span>·</span>
                <span className="capitalize">{s.type}</span>
                <span>·</span>
                <SortBadge sort={s.sort} />
              </div>
              <p className="text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors mb-3">
                {decap(s.titre)}
              </p>
              <ResultBar s={s} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-primary pl-4">
      <div className="font-display text-3xl md:text-4xl">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function SortBadge({ sort }: { sort: string }) {
  const isAdopted = /adopt/i.test(sort);
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
      style={{
        color: isAdopted ? "var(--color-pour)" : "var(--color-contre)",
        backgroundColor: isAdopted ? "color-mix(in oklch, var(--color-pour) 12%, transparent)" : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
      }}
    >
      {sort}
    </span>
  );
}

function ResultBar({ s }: { s: Scrutin }) {
  const p = +s.nombre_pours;
  const c = +s.nombre_contres;
  const a = +s.nombre_abstentions;
  const total = Math.max(1, p + c + a);
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div style={{ width: `${(p / total) * 100}%`, backgroundColor: "var(--color-pour)" }} />
        <div style={{ width: `${(c / total) * 100}%`, backgroundColor: "var(--color-contre)" }} />
        <div style={{ width: `${(a / total) * 100}%`, backgroundColor: "var(--color-abstention)" }} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{p}</strong> pour</span>
        <span><strong className="text-foreground">{c}</strong> contre</span>
        <span><strong className="text-foreground">{a}</strong> abst.</span>
      </div>
    </div>
  );
}

function decap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SearchBar({ deputes, scrutins }: { deputes: Depute[]; scrutins: Scrutin[] }) {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const results = useMemo(() => {
    const n = normalize(q);
    if (n.length < 2) return null;
    const ds = deputes
      .filter((d) => normalize(`${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.groupe_sigle}`).includes(n))
      .slice(0, 5);
    const ss = scrutins.filter((s) => normalize(s.titre).includes(n)).slice(0, 5);
    return { ds, ss };
  }, [q, deputes, scrutins]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) nav({ to: "/recherche", search: { q: q.trim() } });
      }}
      className="relative"
    >
      <div className="flex items-center gap-2 bg-surface border-2 border-border focus-within:border-primary rounded-2xl shadow-sm transition-colors">
        <svg className="ml-4 w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cherchez un·e député·e, un texte de loi…"
          className="flex-1 py-4 px-2 bg-transparent outline-none text-base placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="m-1.5 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Rechercher
        </button>
      </div>

      {results && (results.ds.length > 0 || results.ss.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-30 max-h-[60vh] overflow-y-auto">
          {results.ds.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Député·es</div>
              {results.ds.map((d) => (
                <Link
                  key={d.slug}
                  to="/depute/$slug"
                  params={{ slug: d.slug }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary"
                >
                  <span className="font-medium">{d.prenom} {d.nom_de_famille}</span>
                  <GroupBadge sigle={d.groupe_sigle} size="sm" />
                  <span className="text-xs text-muted-foreground ml-auto">{d.nom_circo}</span>
                </Link>
              ))}
            </div>
          )}
          {results.ss.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Scrutins</div>
              {results.ss.map((s) => (
                <Link
                  key={s.numero}
                  to="/scrutin/$numero"
                  params={{ numero: s.numero }}
                  className="block px-3 py-2 rounded-lg hover:bg-secondary"
                >
                  <div className="text-sm line-clamp-2">{decap(s.titre)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(s.date).toLocaleDateString("fr-FR")} · {s.sort}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
