// routes/groupes.$sigle.tsx — Page dédiée à un groupe politique (SEO)
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { Depute } from "@/lib/api";
import { GROUPES, groupeMeta } from "@/lib/api";
import { getDeputesByGroupe } from "@/lib/data.functions";
import { DeputeCard } from "@/components/DeputeCard";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

export const Route = createFileRoute("/groupes/$sigle")({
  loader: async ({ params }) => {
    const sigle = params.sigle.toUpperCase();
    if (!GROUPES[sigle]) throw notFound();
    const deputes = await getDeputesByGroupe({ data: { sigle } });
    return { sigle, deputes, meta: GROUPES[sigle] };
  },
  head: ({ params, loaderData }) => {
    const sigle = params.sigle.toUpperCase();
    const meta = loaderData?.meta ?? groupeMeta(sigle);
    const count = loaderData?.deputes.length ?? 0;
    const url = `${SITE_URL}/groupes/${encodeURIComponent(sigle)}`;
    return {
      meta: createSeoMeta({
        title: `${meta.nom} (${sigle}) — ${count} député·es à l'Assemblée nationale · Mandat`,
        description: `Découvrez les ${count} député·es du groupe ${meta.nom} (${sigle}) à l'Assemblée nationale : composition, votes et positions durant la 17e législature.`,
        canonical: url,
      }),
      links: createSeoLinks(url),
      scripts: loaderData
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: meta.nom,
                alternateName: sigle,
                url,
                memberOf: {
                  "@type": "GovernmentOrganization",
                  name: "Assemblée nationale (France)",
                },
                numberOfEmployees: count,
              }),
            },
          ]
        : [],
    };
  },
  notFoundComponent: GroupeNotFound,
  component: GroupePage,
});

function GroupeNotFound() {
  return (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-3xl mb-4">Groupe inconnu</h1>
      <p className="text-muted-foreground mb-6">
        Ce sigle de groupe politique n'existe pas dans notre base.
      </p>
      <Link
        to="/groupes"
        className="btn-primary px-6 py-3 rounded-full text-sm"
      >
        Voir tous les groupes
      </Link>
    </div>
  );
}

function GroupePage() {
  const { sigle, deputes, meta } = Route.useLoaderData();

  return (
    <div className="container-app py-12">
      <nav
        aria-label="Fil d'Ariane"
        className="text-xs text-muted-foreground mb-6 flex items-center gap-2"
      >
        <Link to="/" className="hover:text-primary">
          Accueil
        </Link>
        <span aria-hidden>›</span>
        <Link to="/groupes" className="hover:text-primary">
          Groupes
        </Link>
        <span aria-hidden>›</span>
        <span className="text-foreground">{sigle}</span>
      </nav>

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between mb-10">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white font-bold text-lg"
            style={{ backgroundColor: meta.couleur }}
            aria-hidden
          >
            {sigle}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl md:text-4xl truncate">
              {meta.nom}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {deputes.length} député·e{deputes.length > 1 ? "s" : ""} · XVIIe
              législature
            </p>
          </div>
        </div>
      </header>

      <section className="prose prose-invert max-w-none mb-10 text-muted-foreground">
        <p>
          Le groupe <strong>{meta.nom}</strong> ({sigle}) rassemble{" "}
          {deputes.length} député·e{deputes.length > 1 ? "s" : ""} à l'Assemblée
          nationale française durant la 17e législature. Retrouvez ci-dessous la
          composition complète du groupe, avec la liste nominative de ses
          membres, leur circonscription et leur département. Explorez les votes
          de chaque parlementaire pour mieux comprendre les positions
          collectives du groupe sur les grands textes de loi.
        </p>
      </section>

      {deputes.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <p className="text-muted-foreground">
            Aucun·e député·e trouvé·e pour ce groupe.
          </p>
        </div>
      ) : (
        <>
          <h2 className="font-display text-2xl mb-4">
            Composition du groupe {sigle}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deputes.map((d: Depute, i: number) => (
              <DeputeCard key={d.id || d.slug} d={d} index={i} />
            ))}
          </div>
        </>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/groupes"
          className="px-5 py-2.5 rounded-full glass border border-border/50 text-sm hover:border-primary/30"
        >
          ← Tous les groupes
        </Link>
        <Link
          to="/deputes"
          search={{ q: "", groupe: sigle, dept: "", page: 1 }}
          className="px-5 py-2.5 rounded-full btn-primary text-sm"
        >
          Filtrer l'annuaire sur {sigle}
        </Link>
      </div>
    </div>
  );
}
