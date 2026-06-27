import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  scrutinDetailQuery,
  scrutinsQuery,
  allDeputesQuery,
  groupeMeta,
  positionColor,
  positionLabel,
  type VotePosition,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";

export const Route = createFileRoute("/scrutin/$numero")({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(scrutinDetailQuery(params.numero)),
        context.queryClient.ensureQueryData(scrutinsQuery),
        context.queryClient.ensureQueryData(allDeputesQuery),
      ]);
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Scrutin n°${params.numero} — Mandat` },
      { name: "description", content: "Détail d'un scrutin à l'Assemblée nationale : résultat, votes par groupe, position de chaque député·e." },
    ],
  }),
  notFoundComponent: () => (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-4xl mb-3">Scrutin introuvable</h1>
      <Link to="/scrutins" className="text-primary hover:underline">← Tous les scrutins</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-4xl mb-3">Erreur de chargement</h1>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: ScrutinPage,
});

function ScrutinPage() {
  const { numero } = Route.useParams();
  const { data: votes } = useSuspenseQuery(scrutinDetailQuery(numero));
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);

  const meta = scrutins.find((s) => s.numero === numero) ?? votes[0]?.scrutin;
  const deputeBySlug = useMemo(() => new Map(deputes.map((d) => [d.slug, d])), [deputes]);

  const byGroup = useMemo(() => {
    const m = new Map<string, { pour: number; contre: number; abstention: number; absent: number }>();
    for (const v of votes) {
      const g = v.parlementaire_groupe_acronyme || "NI";
      const cur = m.get(g) ?? { pour: 0, contre: 0, abstention: 0, absent: 0 };
      if (v.position === "pour") cur.pour++;
      else if (v.position === "contre") cur.contre++;
      else if (v.position === "abstention") cur.abstention++;
      else cur.absent++;
      m.set(g, cur);
    }
    return Array.from(m.entries()).sort((a, b) => totalCount(b[1]) - totalCount(a[1]));
  }, [votes]);

  const [filter, setFilter] = useState<{ groupe: string; pos: VotePosition | "all" }>({
    groupe: "",
    pos: "all",
  });

  const filteredVotes = useMemo(() => {
    return votes.filter((v) => {
      if (filter.groupe && v.parlementaire_groupe_acronyme !== filter.groupe) return false;
      if (filter.pos !== "all") {
        if (filter.pos === "nonVotant") {
          if (v.position !== "nonVotant" && v.position !== "nonVotantVolontaire") return false;
        } else if (v.position !== filter.pos) return false;
      }
      return true;
    });
  }, [votes, filter]);

  if (!meta) return null;

  const p = +meta.nombre_pours;
  const c = +meta.nombre_contres;
  const a = +meta.nombre_abstentions;
  const total = Math.max(1, p + c + a);
  const isAdopted = /adopt/i.test(meta.sort);

  return (
    <div className="container-app py-12">
      <Link to="/scrutins" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
        ← Tous les scrutins
      </Link>

      {/* Header */}
      <div className="mb-10 max-w-4xl">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          <span>Scrutin n°{meta.numero}</span>
          <span>·</span>
          <time>{new Date(meta.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>
          <span>·</span>
          <span>{meta.type}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl leading-tight mb-4">
          {meta.titre.charAt(0).toUpperCase() + meta.titre.slice(1)}
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            color: isAdopted ? "var(--color-pour)" : "var(--color-contre)",
            backgroundColor: `color-mix(in oklch, ${isAdopted ? "var(--color-pour)" : "var(--color-contre)"} 14%, transparent)`,
          }}
        >
          Texte {meta.sort}
        </div>
      </div>

      {/* Global result */}
      <section className="mb-10 p-6 rounded-2xl bg-card border border-border">
        <h2 className="font-display text-xl mb-4">Résultat global</h2>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-3">
          <div style={{ width: `${(p / total) * 100}%`, backgroundColor: "var(--color-pour)" }} />
          <div style={{ width: `${(c / total) * 100}%`, backgroundColor: "var(--color-contre)" }} />
          <div style={{ width: `${(a / total) * 100}%`, backgroundColor: "var(--color-abstention)" }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <ResultCell label="Pour" value={p} color="var(--color-pour)" />
          <ResultCell label="Contre" value={c} color="var(--color-contre)" />
          <ResultCell label="Abstentions" value={a} color="var(--color-abstention)" />
        </div>
      </section>

      {/* By group */}
      <section className="mb-10">
        <h2 className="font-display text-xl mb-4">Par groupe politique</h2>
        <div className="space-y-2">
          {byGroup.map(([g, counts]) => {
            const totalG = totalCount(counts);
            return (
              <button
                key={g}
                onClick={() => setFilter((f) => ({ ...f, groupe: f.groupe === g ? "" : g }))}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  filter.groupe === g ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <GroupBadge sigle={g} />
                    <span className="text-sm text-muted-foreground">{groupeMeta(g).nom}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{totalG} député·es</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <Seg n={counts.pour} t={totalG} c="var(--color-pour)" />
                  <Seg n={counts.contre} t={totalG} c="var(--color-contre)" />
                  <Seg n={counts.abstention} t={totalG} c="var(--color-abstention)" />
                  <Seg n={counts.absent} t={totalG} c="var(--color-absent)" />
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                  <span><strong className="text-foreground">{counts.pour}</strong> pour</span>
                  <span><strong className="text-foreground">{counts.contre}</strong> contre</span>
                  <span><strong className="text-foreground">{counts.abstention}</strong> abst.</span>
                  <span><strong className="text-foreground">{counts.absent}</strong> absent·es</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Per deputy */}
      <section>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-display text-xl">
            Position des député·es {filter.groupe && <span className="text-base font-sans text-muted-foreground">— filtré sur {filter.groupe}</span>}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {([
              ["all", "Tous"],
              ["pour", "Pour"],
              ["contre", "Contre"],
              ["abstention", "Abstention"],
              ["nonVotant", "Absent"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter((f) => ({ ...f, pos: k as VotePosition | "all" }))}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  filter.pos === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredVotes.slice(0, 300).map((v) => {
            const d = deputeBySlug.get(v.parlementaire_slug);
            const name = d ? `${d.prenom} ${d.nom_de_famille}` : v.parlementaire_slug.replace(/-/g, " ");
            return (
              <Link
                key={v.parlementaire_slug}
                to="/depute/$slug"
                params={{ slug: v.parlementaire_slug }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-primary/40"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: positionColor(v.position) }}
                  title={positionLabel(v.position)}
                />
                <span className="text-sm truncate flex-1">{name}</span>
                <GroupBadge sigle={v.parlementaire_groupe_acronyme} size="sm" />
              </Link>
            );
          })}
        </div>
        {filteredVotes.length > 300 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Affichage de 300 sur {filteredVotes.length}. Filtrez par groupe pour affiner.
          </p>
        )}
      </section>
    </div>
  );
}

function totalCount(c: { pour: number; contre: number; abstention: number; absent: number }) {
  return c.pour + c.contre + c.abstention + c.absent;
}

function ResultCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-surface-muted">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-2xl" style={{ color }}>{value}</div>
    </div>
  );
}

function Seg({ n, t, c }: { n: number; t: number; c: string }) {
  if (n === 0) return null;
  return <div style={{ width: `${(n / Math.max(1, t)) * 100}%`, backgroundColor: c }} />;
}
