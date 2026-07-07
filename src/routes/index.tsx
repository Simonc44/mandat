import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GroupBadge } from "@/components/GroupBadge";
import { ScrollScene } from "@/components/ScrollScene";
import { StoryReveal } from "@/components/StoryReveal";
import { getAllPosts, type BlogPost } from "@/lib/blog";
import { createSeoMeta, SITE_URL } from "./__root";
import {
  getHomeStats,
  getLatestScrutins,
  type HomeStats,
} from "@/lib/data.functions";
import type { Scrutin } from "@/lib/api";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [stats, latest, posts] = await Promise.all([
      getHomeStats(),
      getLatestScrutins(),
      getAllPosts(),
    ]);
    return {
      stats,
      latest,
      latestPost: posts[0] || null,
    };
  },
  head: () => ({
    meta: createSeoMeta({
      title: "Mandat — L'Assemblée Nationale en toute transparence",
      description:
        "Trouvez le vote de chaque député sur n'importe quel texte. Les 577 élus et les lois de la 17e législature, accessibles sans étiquette politique.",
    }),
  }),
  component: Home,
});

function Home() {
  const { stats, latest, latestPost } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container-app relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <StoryReveal>
              <h1 className="font-display text-5xl md:text-8xl mb-8 leading-[1.05] tracking-tight text-ink">
                Le vote de vos <br />
                <span className="text-gradient italic">députés</span>, décrypté.
              </h1>
            </StoryReveal>
            <StoryReveal delay={200}>
              <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Suivez l'activité parlementaire en temps réel.
              </p>
            </StoryReveal>
            <StoryReveal delay={300}>
              <SearchBar />
            </StoryReveal>
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="container-app">
          <div className="grid lg:grid-cols-2 gap-10">
            {latest.length > 0 && (
              <StoryReveal className="lg:row-span-2">
                <Link
                  to="/scrutin/$numero"
                  params={{ numero: latest[0].numero }}
                  className="group block relative h-full card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors"
                >
                  <h3 className="font-display text-3xl md:text-5xl mb-8 group-hover:text-primary transition-colors leading-tight line-clamp-4">
                    {latest[0].titre}
                  </h3>
                  <ResultMiniBar s={latest[0]} />
                </Link>
              </StoryReveal>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {latest.slice(1, 5).map((s, i) => (
                <StoryReveal key={s.numero} delay={i * 80}>
                  <ScrutinCard s={s} index={i} />
                </StoryReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StatsSection stats={stats} />
      <LatestBlogSection post={latestPost} />
    </div>
  );
}

function Counter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  return <span>{displayValue.toLocaleString("fr-FR")}</span>;
}

function StatsSection({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative z-10 my-20 px-4">
      <div className="container-app grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
            <Counter value={stats.deputesCount} />
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Député·es
          </div>
        </div>
        <div className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
            <Counter value={stats.scrutinsCount} />
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Scrutins
          </div>
        </div>
        <div className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
            <Counter value={stats.groupesCount} />
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Groupes
          </div>
        </div>
      </div>
    </section>
  );
}

function LatestBlogSection({ post }: { post: BlogPost | null }) {
  if (!post) return null;
  return (
    <section className="py-20 border-t border-border/40">
      <div className="container-app">
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="group block card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors"
        >
          <h3 className="font-display text-2xl md:text-4xl mb-4 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-lg md:text-xl leading-relaxed">
            {post.description}
          </p>
        </Link>
      </div>
    </section>
  );
}

function ScrutinCard({ s, index = 0 }: { s: Scrutin; index?: number }) {
  return (
    <Link
      to="/scrutin/$numero"
      params={{ numero: s.numero }}
      className="scrutin-card card-glass group block p-5 rounded-[2rem] animate-fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <p className="text-foreground text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors duration-200 mb-3 font-medium">
        {s.titre || `Scrutin n°${s.numero}`}
      </p>
      <ResultMiniBar s={s} />
    </Link>
  );
}

function ResultMiniBar({ s }: { s: Scrutin }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0),
    c = Math.max(0, parseInt(s.nombre_contres) || 0),
    a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/60">
        <div
          style={{
            width: `${(p / total) * 100}%`,
            backgroundColor: "var(--color-pour)",
          }}
        />
        <div
          style={{
            width: `${(c / total) * 100}%`,
            backgroundColor: "var(--color-contre)",
          }}
        />
        <div
          style={{
            width: `${(a / total) * 100}%`,
            backgroundColor: "var(--color-abstention)",
          }}
        />
      </div>
    </div>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        className="w-full bg-muted/30 border border-border/50 rounded-[2rem] py-4 px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-lg"
        placeholder="Rechercher..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            navigate({ to: "/recherche", search: { q: query.trim() } });
          }
        }}
      />
    </div>
  );
}

import type React from "react";
