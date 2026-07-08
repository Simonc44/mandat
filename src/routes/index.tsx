import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { GroupBadge } from "@/components/GroupBadge";
import { ScrollScene } from "@/components/ScrollScene";
import { StoryReveal } from "@/components/StoryReveal";
import { getAllPosts, type BlogPost } from "@/lib/blog";
import { Unlock, Scale, ShieldCheck } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";
import {
  getHomeStats,
  getLatestScrutins,
  type HomeStats,
} from "@/lib/data.functions";
import type { Scrutin, Depute } from "@/lib/api";

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
      {/* Hero Section with Vagues */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="container-app relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <StoryReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  17e Législature en direct
                </span>
              </div>
            </StoryReveal>

            <StoryReveal delay={100}>
              <h1 className="font-display text-5xl md:text-8xl mb-8 leading-[1.05] tracking-tight text-ink">
                Le vote de vos <br />
                <span className="text-gradient italic">députés</span>, décrypté.
              </h1>
            </StoryReveal>

            <StoryReveal delay={200}>
              <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Suivez l'activité parlementaire en temps réel. <br />
                Sur n'importe quel texte de loi, en quelques secondes. Sans
                langue de bois.
              </p>
            </StoryReveal>

            <StoryReveal delay={300}>
              <SearchBar />
            </StoryReveal>

            <StoryReveal delay={400}>
              <div className="mt-16 flex flex-wrap justify-center gap-4 md:gap-8 text-muted-foreground">
                <StatPill value="577" label="Députés" />
                <StatPill value="100%" label="Open Data" />
                <StatPill value="Direct" label="Source AN" />
              </div>
            </StoryReveal>
          </div>
        </div>
      </section>

      {/* Latest Scrutins Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container-app">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <StoryReveal>
              <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">
                Activité récente
              </div>
              <h2 className="font-display text-4xl md:text-5xl leading-[1.05]">
                Les derniers <span className="text-gradient italic">scrutins</span> publics
              </h2>
            </StoryReveal>
            <Link
              to="/scrutins"
              className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
            >
              Tout voir
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {latest.length > 0 && (
              <StoryReveal className="lg:row-span-2">
                <Link
                  to="/scrutin/$numero"
                  params={{ numero: latest[0].numero }}
                  className="group block relative h-full card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-6">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      Dernier scrutin
                    </span>
                    {latest[0].date && (
                      <time dateTime={latest[0].date}>
                        {new Date(latest[0].date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    )}
                    <span>·</span>
                    <SortBadge sort={latest[0].sort} />
                  </div>

                  <h3 className="font-display text-3xl md:text-5xl mb-8 group-hover:text-primary transition-colors leading-tight line-clamp-4">
                    {latest[0].titre}
                  </h3>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-3xl font-display text-ink">
                            {latest[0].nombre_pours}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Pour
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-3xl font-display text-ink">
                            {latest[0].nombre_contres}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Contre
                          </span>
                        </div>
                      </div>
                    </div>
                    <ResultMiniBar s={latest[0]} />
                  </div>
                </Link>
              </StoryReveal>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {latest.slice(1).map((s, i) => (
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
      <SimulatorCTASection />
      <HowItWorksSection />
      <TrustSection />
    </div>
  );
}

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => {
          gsap.to(obj, {
            val: value,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => setDisplayValue(Math.floor(obj.val)),
          });
        },
        once: true,
      });
    })();
  }, [value]);

  return <span ref={ref}>{displayValue.toLocaleString("fr-FR")}</span>;
}

function StatsSection({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative z-10 my-20 px-4">
      <div className="container-app">
        <ScrollScene
          variant="tilt"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div
            data-tilt
            className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
              <Counter value={stats.deputesCount} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Député·es
            </div>
          </div>
          <div
            data-tilt
            className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
              <Counter value={stats.scrutinsCount} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Scrutins
            </div>
          </div>
          <div
            data-tilt
            className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground">
              <Counter value={stats.groupesCount} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Groupes
            </div>
          </div>
        </ScrollScene>
      </div>
    </section>
  );
}

function LatestBlogSection({ post }: { post: BlogPost | null }) {
  if (!post) return null;
  return (
    <section className="py-20 border-t border-border/40">
      <div className="container-app">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">
              Dernier blog posté
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">
              Nos décryptages{" "}
              <span className="text-gradient italic">politiques</span>
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-sm font-medium text-primary hover:underline pb-1"
          >
            Voir tous les articles →
          </Link>
        </div>

        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="group block card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors"
        >
          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{post.readingMinutes} min de lecture</span>
              </div>
              <h3 className="font-display text-2xl md:text-4xl mb-4 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground line-clamp-2 text-lg md:text-xl leading-relaxed">
                {post.description}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

function SimulatorCTASection() {
  return (
    <section className="py-24 bg-primary/5 border-y border-primary/10 overflow-hidden relative">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--color-primary), transparent 70%)",
          filter: "blur(120px)",
        }}
      />

      <div className="container-app relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-8 leading-[1.1] tracking-tight">
            Visualisez les{" "}
            <span className="text-gradient italic">coalitions</span> possibles
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            Utilisez notre outil de Simulateur de coalition pour mieux
            comprendre où sont vos députés et comment se structure l'Assemblée.
          </p>
          <Link
            to="/groupes"
            className="btn-primary px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            Lancer le simulateur
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-box glass rounded-full px-5 py-2.5 border border-border/40 inline-flex items-center gap-2">
      <span className="stat-value font-display text-lg text-ink">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function SortBadge({ sort }: { sort: string }) {
  const ok = /adopt/i.test(sort);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: ok ? "var(--color-pour)" : "var(--color-contre)",
        backgroundColor: ok
          ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
          : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
      }}
    >
      {ok ? "✓ Adopté" : "✗ Rejeté"}
    </span>
  );
}

function TursoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 201 170"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M200.035 48.61C195.365 20.67 170.875 0 170.875 0V30.78L156.335 34.53L147.225 23.56L142.415 33.02C132.495 30.32 118.835 28.58 100.045 28.58C81.2549 28.58 67.5949 30.33 57.6749 33.02L52.8649 23.56L43.7549 34.53L29.2149 30.78V0C29.2149 0 4.72493 20.67 0.0549316 48.61L32.1949 59.73C33.2449 79.16 41.9849 131.61 44.4849 136.37C47.1449 141.44 61.2649 155.93 72.3149 161.5C72.3149 161.5 76.3149 157.27 78.7549 153.54C81.8549 157.19 97.8649 169.99 100.055 169.99C102.245 169.99 118.255 157.2 121.355 153.54C123.795 157.27 127.795 161.5 127.795 161.5C138.845 155.93 152.965 141.44 155.625 136.37C158.125 131.61 166.865 79.16 167.915 59.73L200.055 48.61H200.035ZM153.845 93.35L132.095 95.29L134.005 121.96C134.005 121.96 120.775 132.91 100.045 132.91C79.3149 132.91 66.0849 121.96 66.0849 121.96L67.9949 95.29L46.2449 93.35L42.5249 63.31L78.5749 75.79L75.7749 113.18C82.4749 114.88 89.5249 116.57 100.055 116.57C110.585 116.57 117.625 114.88 124.325 113.18L121.525 75.79L157.575 63.31L153.855 93.35H153.845Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function ANIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M3 7v1a3 3 0 0 0 6 0V7" />
      <path d="M9 7v1a3 3 0 0 0 6 0V7" />
      <path d="M15 7v1a3 3 0 0 0 6 0V7" />
      <path d="M19 21V11" />
      <path d="M5 21V11" />
      <path d="M9 21V11" />
      <path d="M15 21V11" />
      <path d="M2 3h20" />
      <path d="M21 3v4" />
      <path d="M3 3v4" />
    </svg>
  );
}

function CivixIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 6V12L16 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClairIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 3V5M12 19V21M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M3 12H5M19 12H21M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TrustLogos() {
  const logos: { name: string; href: string; icon: React.ReactNode }[] = [
    { name: "Turso", href: "https://turso.tech", icon: <TursoIcon /> },
    {
      name: "Assemblee Nationale",
      href: "https://data.assemblee-nationale.fr",
      icon: <ANIcon />,
    },
    { name: "GitHub", href: "https://github.com", icon: <GitHubIcon /> },
    { name: "Civix", href: "https://civix.fr", icon: <CivixIcon /> },
    { name: "Clair", href: "https://clair.com", icon: <ClairIcon /> },
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
      {logos.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          title={l.name}
          className="trust-logo group inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
            {l.icon}
          </span>
          <span
            className="text-sm font-semibold tracking-tight text-foreground/70 group-hover:text-foreground transition-colors duration-200"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {l.name}
          </span>
        </a>
      ))}
    </div>
  );
}

function ScrutinCard({ s, index = 0 }: { s: Scrutin; index?: number }) {
  return (
    <Link
      to="/scrutin/$numero"
      params={{ numero: s.numero }}
      className="scrutin-card card-glass group block p-5 rounded-[2rem] animate-fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
      aria-label={`Scrutin n°${s.numero} : ${s.titre}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
        {s.date && (
          <time dateTime={s.date}>
            {new Date(s.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        )}
        {s.sort && (
          <>
            <span aria-hidden="true">·</span>
            <SortBadge sort={s.sort} />
          </>
        )}
      </div>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);
  if (!p && !c && !a) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/60">
        <div
          style={{
            width: mounted ? `${(p / total) * 100}%` : "0%",
            backgroundColor: "var(--color-pour)",
            transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
        <div
          style={{
            width: mounted ? `${(c / total) * 100}%` : "0%",
            backgroundColor: "var(--color-contre)",
            transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1) 80ms",
          }}
        />
        <div
          style={{
            width: mounted ? `${(a / total) * 100}%` : "0%",
            backgroundColor: "var(--color-abstention)",
            transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1) 160ms",
          }}
        />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{p}</strong> pour
        </span>
        <span>
          <strong className="text-foreground">{c}</strong> contre
        </span>
        <span>
          <strong className="text-foreground">{a}</strong> abst.
        </span>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className="bg-muted/30 py-20 border-t border-border/40">
      <div className="container-app">
        <ScrollScene variant="rise">
          <h2
            className="font-display text-3xl md:text-5xl mb-12 text-center leading-[1.05]"
            data-rise
          >
            Comment suivre les{" "}
            <span className="text-gradient italic">votes et lois</span> de
            l'Assemblée ?
          </h2>
        </ScrollScene>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Chaque jour, l'<strong>Assemblée nationale</strong> examine des
              textes de loi, des amendements et des motions. En tant que
              citoyen, il est souvent difficile de suivre précisément la
              position de vos <strong>députés</strong> au milieu du tumulte
              politique. <strong>Mandat</strong> simplifie cet accès à
              l'information démocratique.
            </p>
            <p>
              Nous collectons les données officielles en open data, les trions
              par <strong>législature</strong> (actuellement la 17e) et les
              présentons de manière neutre. Vous pouvez ainsi voir qui a voté
              quoi, groupe par groupe, et scrutin par scrutin.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-glass p-6 rounded-3xl space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl">Transparence totale</h3>
              <p className="text-sm text-muted-foreground">
                Accédez à l'intégralité des votes nominatifs sans filtre
                partisan.
              </p>
            </div>
            <div className="card-glass p-6 rounded-3xl space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl">Neutralité absolue</h3>
              <p className="text-sm text-muted-foreground">
                Les faits, rien que les faits, sourcés directement depuis
                l'Assemblée.
              </p>
            </div>
            <div className="card-glass p-6 rounded-3xl space-y-4 sm:col-span-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl">Données Citoyennes</h3>
              <p className="text-sm text-muted-foreground">
                Un outil pour tous les citoyens qui souhaitent comprendre le
                travail législatif en France.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="container-app text-center">
        <ScrollScene variant="rise">
          <div data-rise>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-12 font-bold">
              Propulsé par des sources de confiance
            </h2>
            <TrustLogos />
          </div>
        </ScrollScene>
      </div>
    </section>
  );
}

function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    deputes: Depute[];
    scrutins: Scrutin[];
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      const { searchHome } = await import("@/lib/data.functions");
      const res = await searchHome({ data: { q: query } });
      setResults(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          className="w-full bg-muted/30 border border-border/50 rounded-[2rem] py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-lg"
          placeholder="Rechercher un député, une ville, une loi..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              setOpen(false);
              navigate({ to: "/recherche", search: { q: query.trim() } });
            }
          }}
        />
      </div>

      {open && results && (
        <div
          className="absolute mt-3 w-full bg-background/95 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
          style={{ zIndex: 9999 }}
          role="listbox"
          aria-label="Suggestions"
        >
          {results.deputes.length > 0 && (
            <div className="p-2">
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Député·es
              </div>
              {results.deputes.map((d) => (
                <Link
                  key={d.slug}
                  to="/depute/$slug"
                  params={{ slug: d.slug }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-muted/40 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <DeputeAvatarSmall d={d} />
                  <span className="font-medium text-sm">
                    {d.prenom} {d.nom_de_famille}
                  </span>
                  <GroupBadge sigle={d.groupe_sigle} size="sm" />
                  <span className="text-xs text-muted-foreground ml-auto truncate hidden sm:block">
                    {d.nom_circo}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {results.scrutins.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Scrutins
              </div>
              {results.scrutins.map((s) => (
                <Link
                  key={s.numero}
                  to="/scrutin/$numero"
                  params={{ numero: s.numero }}
                  className="block px-4 py-2.5 rounded-2xl hover:bg-muted/40 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: /adopt/i.test(s.sort)
                          ? "var(--color-pour)"
                          : "var(--color-contre)",
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-sm line-clamp-1 font-medium">
                      {s.titre
                        ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
                        : `Scrutin n°${s.numero}`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-4">
                    {s.date ? new Date(s.date).toLocaleDateString("fr-FR") : ""}
                    {s.sort ? ` · ${s.sort}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeputeAvatarSmall({ d }: { d: Depute }) {
  const [err, setErr] = useState(false);
  const src = d.id_an
    ? `https://www2.assemblee-nationale.fr/static/tribun/17/photos/${d.id_an.replace("PA", "")}.jpg`
    : "";
  if (!src || err)
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.50 0.20 285 / 15%), oklch(0.42 0.22 215 / 20%))",
          color: "oklch(0.50 0.20 285)",
        }}
        aria-hidden="true"
      >
        {`${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`.toUpperCase()}
      </div>
    );
  return (
    <img
      src={src}
      alt={`${d.prenom} ${d.nom_de_famille}`}
      className="w-7 h-7 rounded-full object-cover shrink-0"
      onError={() => setErr(true)}
    />
  );
}

import type React from "react";
