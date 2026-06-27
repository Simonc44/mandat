import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  deputeDetailQuery,
  deputeVotesQuery,
  photoUrl,
  positionColor,
  positionLabel,
  type VotePosition,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";

export const Route = createFileRoute("/depute/$slug")({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(deputeDetailQuery(params.slug)),
        context.queryClient.ensureQueryData(deputeVotesQuery(params.slug)),
      ]);
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.slug).replace(/-/g, " ")} — Mandat` },
      { name: "description", content: `Historique des votes du·de la député·e à l'Assemblée nationale.` },
    ],
  }),
  notFoundComponent: () => (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-4xl mb-3">Député·e introuvable</h1>
      <Link to="/deputes" className="text-primary hover:underline">← Tous les député·es</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-4xl mb-3">Erreur de chargement</h1>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: DeputePage,
});

function DeputePage() {
  const { slug } = Route.useParams();
  const { data: d } = useSuspenseQuery(deputeDetailQuery(slug));
  const { data: votes } = useSuspenseQuery(deputeVotesQuery(slug));
  const [posFilter, setPosFilter] = useState<VotePosition | "all">("all");

  const stats = useMemo(() => {
    const total = votes.length;
    const c = { pour: 0, contre: 0, abstention: 0, absent: 0 };
    for (const v of votes) {
      if (v.position === "pour") c.pour++;
      else if (v.position === "contre") c.contre++;
      else if (v.position === "abstention") c.abstention++;
      else c.absent++;
    }
    const exprimes = c.pour + c.contre + c.abstention;
    const presence = total ? Math.round((exprimes / total) * 100) : 0;
    return { total, ...c, presence };
  }, [votes]);

  const filteredVotes = useMemo(() => {
    if (posFilter === "all") return votes;
    if (posFilter === "nonVotant")
      return votes.filter((v) => v.position === "nonVotant" || v.position === "nonVotantVolontaire");
    return votes.filter((v) => v.position === posFilter);
  }, [votes, posFilter]);

  return (
    <div className="container-app py-12">
      {/* Header */}
      <Link to="/deputes" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
        ← Tous les député·es
      </Link>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10">
        <img
          src={photoUrl(d.id_an)}
          alt={d.nom}
          className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover bg-muted shrink-0"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <GroupBadge sigle={d.groupe_sigle} />
            <span className="text-xs text-muted-foreground">{d.parti_ratt_financier}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">
            {d.prenom} {d.nom_de_famille}
          </h1>
          <p className="text-muted-foreground">
            Député·e de la <strong className="text-foreground">{d.nom_circo}</strong> ({d.num_deptmt}e dépt.) — circo. {d.num_circo}
          </p>
          {d.profession && (
            <p className="text-sm text-muted-foreground mt-1">Profession : {d.profession}</p>
          )}
          {d.twitter && (
            <a
              href={`https://twitter.com/${d.twitter}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              @{d.twitter}
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        <StatBox label="Scrutins" value={stats.total} color="var(--color-primary)" />
        <StatBox label="Pour" value={stats.pour} color="var(--color-pour)" />
        <StatBox label="Contre" value={stats.contre} color="var(--color-contre)" />
        <StatBox label="Abstention" value={stats.abstention} color="var(--color-abstention)" />
        <StatBox label="Présence" value={`${stats.presence}%`} color="var(--color-primary)" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ["all", "Tous"],
          ["pour", "Pour"],
          ["contre", "Contre"],
          ["abstention", "Abstention"],
          ["nonVotant", "Absent / non-votant"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setPosFilter(k as VotePosition | "all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              posFilter === k
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-border hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Votes */}
      <h2 className="font-display text-2xl mb-4">Votes ({filteredVotes.length})</h2>
      {filteredVotes.length === 0 ? (
        <p className="text-muted-foreground">Aucun vote enregistré dans cette catégorie.</p>
      ) : (
        <ul className="space-y-2">
          {filteredVotes.slice(0, 100).map((v) => (
            <li key={v.scrutin.numero}>
              <Link
                to="/scrutin/$numero"
                params={{ numero: v.scrutin.numero }}
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <span
                  className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: positionColor(v.position),
                    backgroundColor: `color-mix(in oklch, ${positionColor(v.position)} 14%, transparent)`,
                  }}
                >
                  {positionLabel(v.position)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground line-clamp-2">
                    {v.scrutin.titre.charAt(0).toUpperCase() + v.scrutin.titre.slice(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(v.scrutin.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{v.scrutin.sort}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {filteredVotes.length > 100 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Affichage des 100 premiers votes sur {filteredVotes.length}.
        </p>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-2xl md:text-3xl" style={{ color }}>{value}</div>
    </div>
  );
}
