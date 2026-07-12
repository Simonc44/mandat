// routes/index.tsx
// Section ApiSection ajoutée après SimulatorCTASection

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import {
  normalize,
  sanitizeSearchInput,
  type Depute,
  type Scrutin,
  photoUrl,
} from "@/lib/api";

import React from "react";

class WebGLErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("WebGL or Three.js component crashed. Gracefully falling back:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.72_0.16_285_/_18%)] to-[oklch(0.985_0.01_285)] opacity-50 pointer-events-none" />;
    }
    return this.props.children;
  }
}

// Client-only component wrapper for ShaderGradient
const ShaderGradientBackground = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
      {/* Instant, stunning CSS fallback gradient that renders during SSR & initial mount */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-20 dark:opacity-10"
        style={{
          background: "radial-gradient(circle at 20% 30%, #5606ff 0%, transparent 60%), radial-gradient(circle at 80% 70%, #fe8989 0%, transparent 60%)",
        }}
      />
      {mounted && (
        <div className="absolute inset-0 w-full h-full animate-fade-in">
          <WebGLErrorBoundary>
            <Suspense fallback={null}>
              <LazyShaderGradient />
            </Suspense>
          </WebGLErrorBoundary>
        </div>
      )}
    </div>
  );
};

const LazyShaderGradient = lazy(async () => {
  const { ShaderGradientCanvas, ShaderGradient } = await import("@shadergradient/react");
  const ShaderGradientAny = ShaderGradient as any;
  return {
    default: () => (
      <ShaderGradientCanvas
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        pixelDensity={1}
        fov={45}
      >
        <ShaderGradientAny
          animate="on"
          axesHelper="on"
          brightness={1.1}
          cAzimuthAngle={180}
          cDistance={3.9}
          cPolarAngle={115}
          cameraZoom={1}
          color1="#5606ff"
          color2="#fe8989"
          color3="#000000"
          destination="onCanvas"
          embedMode="off"
          envPreset="city"
          format="gif"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="off"
          lightType="3d"
          pixelDensity={1}
          positionX={-0.5}
          positionY={0.1}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={0}
          rotationZ={235}
          shader="defaults"
          type="waterPlane"
          uAmplitude={0}
          uDensity={1.1}
          uFrequency={5.5}
          uSpeed={0.1}
          uStrength={2.4}
          uTime={0.2}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    )
  };
});
import {
  getHomeStats,
  getLatestScrutins,
  searchHome,
  type HomeStats,
} from "@/lib/data.functions";
import { GroupBadge } from "@/components/GroupBadge";
import { ScrollScene } from "@/components/ScrollScene";
import { StoryReveal } from "@/components/StoryReveal";
import { getAllPosts, type BlogPost } from "@/lib/blog";
import { Unlock, Scale, ShieldCheck, Code, Zap, Database, Key, Bell } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: createSeoMeta({
      title: "Mandat — Cherchez comment votre député a voté à l'Assemblée",
      description:
        "Trouvez le vote de chaque député sur n'importe quel texte. Les 577 élus et les lois de la 17e législature, accessibles sans étiquette politique.",
      canonical: SITE_URL,
      ogType: "website",
    }),
  }),
  loader: async () => {
    let stats = { deputesCount: 577, scrutinsCount: 124, groupesCount: 11 };
    let latest: any[] = [];
    try {
      const [dbStats, dbLatest] = await Promise.all([
        getHomeStats().catch(() => ({ deputesCount: 577, scrutinsCount: 124, groupesCount: 11 })),
        getLatestScrutins().catch(() => []),
      ]);
      stats = dbStats;
      latest = dbLatest;
    } catch (e) {
      console.warn("Database stats load failed:", e);
    }
    const posts = getAllPosts();
    return { stats, latest, latestPost: posts[0] || null };
  },
  component: Home,
});

function Home() {
  const { stats, latest, latestPost } = Route.useLoaderData() as {
    stats: HomeStats;
    latest: Scrutin[];
    latestPost: BlogPost | null;
  };
  const spotlight = latest?.[0] ?? null;

  return (
    <div className="page-enter">
      <section className="hero-attach relative">
        <div
          className="hero-orb-slow w-[520px] h-[520px] -top-24 -left-32 opacity-60"
          style={{ background: "radial-gradient(circle, oklch(0.70 0.18 285 / 55%), transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="hero-orb-slow w-[420px] h-[420px] -top-10 right-[-8rem] opacity-50"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.14 305 / 45%), transparent 70%)", animationDelay: "-5s" }}
          aria-hidden="true"
        />

        <div className="container-app relative z-10 pt-14 sm:pt-20 md:pt-24 pb-56 sm:pb-72 md:pb-80 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            17e législature · Mis à jour quotidiennement
          </div>

          <h1
            className="font-display mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.02] mb-6 animate-fade-up tracking-tight"
            style={{ animationDelay: "80ms" }}
          >
            Cherchez comment
            <br />
            <span className="text-gradient italic">votre député a voté.</span>
          </h1>

          <p
            className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed animate-fade-up px-2"
            style={{ animationDelay: "160ms" }}
          >
            Sur n'importe quel texte de loi, en quelques secondes. Sans étiquette politique.
          </p>

          <div className="mx-auto max-w-2xl animate-fade-up" style={{ animationDelay: "240ms" }}>
            <SearchBar />
          </div>

          <div className="mt-16 sm:mt-20 animate-fade-up" style={{ animationDelay: "360ms" }}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80 mb-6">
              Données & technologies de confiance
            </p>
            <TrustLogos />
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
          <ShaderGradientBackground />
        </div>
        <div className="hero-fade-out" aria-hidden="true" />
      </section>

      <div className="h-16 sm:h-24" aria-hidden="true" />

      {spotlight && (
        <StoryReveal as="section" className="container-app pb-10 relative z-10">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">À la une</div>
            <Link
              to="/scrutin/$numero"
              params={{ numero: spotlight.numero }}
              className="scrutin-card card-glass group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[2rem] border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div
                className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: /adopt/i.test(spotlight.sort) ? "color-mix(in oklch, var(--color-pour) 14%, transparent)" : "color-mix(in oklch, var(--color-contre) 14%, transparent)" }}
                aria-hidden="true"
              >
                {/adopt/i.test(spotlight.sort) ? "✓" : "✗"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                  {spotlight.date && (
                    <time dateTime={spotlight.date}>
                      {new Date(spotlight.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: /adopt/i.test(spotlight.sort) ? "var(--color-pour)" : "var(--color-contre)",
                      backgroundColor: /adopt/i.test(spotlight.sort) ? "color-mix(in oklch, var(--color-pour) 12%, transparent)" : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
                    }}
                  >
                    {/adopt/i.test(spotlight.sort) ? "Adopté" : "Rejeté"}
                  </span>
                </div>
                <p className="text-foreground font-medium leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
                  {spotlight.titre ? spotlight.titre.charAt(0).toUpperCase() + spotlight.titre.slice(1) : `Scrutin n°${spotlight.numero}`}
                </p>
                {(() => {
                  const p = parseInt(spotlight.nombre_pours) || 0, c = parseInt(spotlight.nombre_contres) || 0, a = parseInt(spotlight.nombre_abstentions) || 0;
                  if (!p && !c && !a) return null;
                  return <p className="text-xs text-muted-foreground mt-1">{p} pour · {c} contre · {a} abstentions</p>;
                })()}
              </div>
              <div className="text-primary text-sm font-medium shrink-0 group-hover:translate-x-1 transition-transform">Voir le détail →</div>
            </Link>
          </div>
        </StoryReveal>
      )}

      <StoryReveal as="section" className="container-app pb-16 pt-4 relative z-10 -mt-4">
        <div className="flex items-end justify-between mb-8 mt-2">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-2 font-medium">En direct de l'hémicycle</div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">Derniers scrutins.</h2>
          </div>
          <Link to="/scrutins" className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group">
            Tout voir
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {latest.slice(1).map((s, i) => (
            <StoryReveal key={s.numero} delay={i * 80}>
              <ScrutinCard s={s} index={i} />
            </StoryReveal>
          ))}
        </div>
      </StoryReveal>

      <StatsSection stats={stats} />
      <LatestBlogSection post={latestPost} />
      <SimulatorCTASection />
      <AbonnementsSection />
      <ApiSection />
      <HowItWorksSection />
      <TrustSection />
    </div>
  );
}

// ─── AbonnementsSection ────────────────────────────────────────────────────────────

function AbonnementsSection() {
  return (
    <section className="py-24 border-t border-border/40 bg-muted/10 relative overflow-hidden">
      <div className="container-app">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-3">
            <Bell className="w-3.5 h-3.5" /> Alertes e-mails gratuites
          </div>
          <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">
            Gérez vos abonnements
            <br />
            <span className="text-gradient italic">aux alertes de vote.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Vous suivez des députés et souhaitez modifier vos abonnements ou vous désabonner ? Accédez à tout moment à votre espace de gestion sécurisé.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/desabonnement"
              className="btn-primary px-8 py-4 rounded-2xl font-semibold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Bell className="w-4 h-4" /> Gérer mes abonnements / Désabonnement
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ApiSection ────────────────────────────────────────────────────────────

function ApiSection() {
  const features = [
    {
      icon: Database,
      title: "Données en temps réel",
      desc: "Accès direct à Turso via function calling. Scrutins, députés et groupes politiques mis à jour chaque nuit.",
    },
    {
      icon: Zap,
      title: "60 req/min gratuites",
      desc: "Rate limiting géré par Unkey. Clé API générée instantanément, valide 1 an, aucune carte bancaire requise.",
    },
    {
      icon: Code,
      title: "REST JSON standard",
      desc: "Réponses paginées, filtres puissants, CORS activé. Compatible avec n'importe quel langage ou framework.",
    },
  ];

  return (
    <section className="py-24 border-t border-border/40">
      <div className="container-app">
        <ScrollScene variant="rise">
          <div className="text-center mb-14" data-rise>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-5">
              <Code className="w-3.5 h-3.5" /> API publique · v1.0 · Gratuite
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight mb-4">
              Intégrez les données
              <br />
              <span className="text-gradient italic">dans vos projets.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Une API REST ouverte pour accéder aux votes de l'Assemblée nationale.
              Journalistes, chercheurs, développeurs — les données sont pour tout le monde.
            </p>
          </div>
        </ScrollScene>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-glass rounded-[2rem] p-7">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, oklch(0.50 0.20 285 / 14%), oklch(0.42 0.22 260 / 22%))", color: "oklch(0.50 0.20 285)" }}
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Aperçu de code */}
        <div
          className="rounded-3xl overflow-hidden mb-10"
          style={{ background: "oklch(0.14 0.04 285)", border: "1px solid oklch(0.25 0.06 285 / 60%)" }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "oklch(0.25 0.06 285 / 60%)", background: "oklch(0.18 0.04 285)" }}>
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: "oklch(0.55 0.08 285)" }}>exemple · javascript</span>
          </div>
          <pre className="px-6 py-5 text-xs leading-relaxed font-mono overflow-x-auto" style={{ color: "oklch(0.85 0.06 285)" }}>
            <code>{
`// Récupérer les 5 derniers scrutins adoptés
const res = await fetch(
  "https://mandat-fr.vercel.app/api/v1/scrutins?sort=adopté&limit=5",
  { headers: { "X-Api-Key": "mk_live_votre_cle" } }
);
const { data } = await res.json();

data.forEach(s => {
  console.log(s.numero, s.titre, s.votes.pour + " pour");
});`
            }</code>
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/developers"
            className="btn-primary px-8 py-4 rounded-2xl font-semibold text-sm inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Key className="w-4 h-4" /> Obtenir une clé API gratuite
          </Link>
          <Link
            to="/developers"
            className="glass px-8 py-4 rounded-2xl font-medium text-sm border border-border/50 hover:border-primary/40 transition-colors inline-flex items-center gap-2"
          >
            Voir la documentation →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Reste de la page (inchangé) ───────────────────────────────────────────

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    (async () => {
      const gsapMod = await import("gsap");
      const stMod   = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%",
        onEnter: () => {
          gsap.to(obj, { val: value, duration: 2, ease: "power2.out", onUpdate: () => setDisplayValue(Math.floor(obj.val)) });
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
        <ScrollScene variant="tilt" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div data-tilt className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground"><Counter value={stats.deputesCount} /></div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Député·es</div>
          </div>
          <div data-tilt className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground"><Counter value={stats.scrutinsCount} /></div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Scrutins</div>
          </div>
          <div data-tilt className="stat-box card-glass rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[220px]">
            <div className="stat-value font-display text-6xl md:text-7xl mb-3 tracking-tighter text-foreground"><Counter value={stats.groupesCount} /></div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Groupes</div>
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
            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">Dernier blog posté</div>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">
              Nos décryptages <span className="text-gradient italic">politiques</span>
            </h2>
          </div>
          <Link to="/blog" className="text-sm font-medium text-primary hover:underline pb-1">Voir tous les articles →</Link>
        </div>
        <Link to="/blog/$slug" params={{ slug: post.slug }}
          className="group block card-glass rounded-[2.5rem] p-8 md:p-12 hover:border-primary/40 transition-colors">
          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>
                <span>·</span>
                <span>{post.readingMinutes} min de lecture</span>
              </div>
              <h3 className="font-display text-2xl md:text-4xl mb-4 group-hover:text-primary transition-colors">{post.title}</h3>
              <p className="text-muted-foreground line-clamp-2 text-lg md:text-xl leading-relaxed">{post.description}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 70%)", filter: "blur(120px)" }} />
      <div className="container-app relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl mb-8 leading-[1.1] tracking-tight">
            Visualisez les <span className="text-gradient italic">coalitions</span> possibles
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            Utilisez notre outil de Simulateur de coalition pour mieux comprendre où sont vos députés et comment se structure l'Assemblée.
          </p>
          <Link to="/groupes" className="btn-primary px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
            Lancer le simulateur
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
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
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function SortBadge({ sort }: { sort: string }) {
  const ok = /adopt/i.test(sort);
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: ok ? "var(--color-pour)" : "var(--color-contre)", backgroundColor: ok ? "color-mix(in oklch, var(--color-pour) 12%, transparent)" : "color-mix(in oklch, var(--color-contre) 12%, transparent)" }}>
      {ok ? "✓ Adopté" : "✗ Rejeté"}
    </span>
  );
}

function TursoIcon() {
  return (
    <svg className="h-6 fill-current" viewBox="0 0 201 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M200.035 48.61C195.365 20.67 170.875 0 170.875 0V30.78L156.335 34.53L147.225 23.56L142.415 33.02C132.495 30.32 118.835 28.58 100.045 28.58C81.2549 28.58 67.5949 30.33 57.6749 33.02L52.8649 23.56L43.7549 34.53L29.2149 30.78V0C29.2149 0 4.72493 20.67 0.0549316 48.61L32.1949 59.73C33.2449 79.16 41.9849 131.61 44.4849 136.37C47.1449 141.44 61.2649 155.93 72.3149 161.5C72.3149 161.5 76.3149 157.27 78.7549 153.54C81.8549 157.19 97.8649 169.99 100.055 169.99C102.245 169.99 118.255 157.2 121.355 153.54C123.795 157.27 127.795 161.5 127.795 161.5C138.845 155.93 152.965 141.44 155.625 136.37C158.125 131.61 166.865 79.16 167.915 59.73L200.055 48.61H200.035ZM153.845 93.35L132.095 95.29L134.005 121.96C134.005 121.96 120.775 132.91 100.045 132.91C79.3149 132.91 66.0849 121.96 66.0849 121.96L67.9949 95.29L46.2449 93.35L42.5249 63.31L78.5749 75.79L75.7749 113.18C82.4749 114.88 89.5249 116.57 100.055 116.57C110.585 116.57 117.625 114.88 124.325 113.18L121.525 75.79L157.575 63.31L153.855 93.35H153.845Z" />
    </svg>
  );
}

function StripeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#635BFF"/>
      <path d="M20.5 12.5c0-1.5-1.2-2.5-3.5-2.5-2.8 0-4 1.4-4 2.8 0 1.9 1.8 2.7 3.5 3.2 1.4.4 2.5.9 2.5 2 0 1.2-1.1 1.8-2.8 1.8-1.8 0-2.9-.7-3.2-1.8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function ANIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#003189"/>
      <rect x="7" y="22" width="18" height="2" rx="1" fill="white"/>
      <rect x="7" y="9"  width="18" height="2" rx="1" fill="white"/>
      <rect x="9"    y="11" width="2" height="11" rx="1" fill="white"/>
      <rect x="13.5" y="11" width="2" height="11" rx="1" fill="white"/>
      <rect x="18"   y="11" width="2" height="11" rx="1" fill="white"/>
      <rect x="22"   y="11" width="2" height="11" rx="1" fill="white"/>
    </svg>
  );
}

function CivixIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 11a7 7 0 1 0 0 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function ClairIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#059669"/>
      <circle cx="16" cy="13" r="4" stroke="white" strokeWidth="2.5" fill="none"/>
      <path d="M10 23c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function TrustLogos() {
  const logos: { name: string; href: string; icon: React.ReactNode }[] = [
    { name: "Turso",               href: "https://turso.tech",                         icon: <TursoIcon /> },
    { name: "Stripe",              href: "https://stripe.com",                         icon: <StripeIcon /> },
    { name: "GitHub",              href: "https://github.com/Simonc44/mandat",         icon: <GitHubIcon /> },
    { name: "Assemblée nationale", href: "https://www.assemblee-nationale.fr",         icon: <ANIcon /> },
    { name: "Civix",               href: "https://civix.fr",                            icon: <CivixIcon /> },
    { name: "Clair",               href: "https://clair-production.up.railway.app",    icon: <ClairIcon /> },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-10">
      {logos.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
          aria-label={l.name} title={l.name}
          className="trust-logo group inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-200">
          <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{l.icon}</span>
          <span className="text-sm font-semibold tracking-tight text-foreground/70 group-hover:text-foreground transition-colors duration-200" style={{ fontFamily: "system-ui, sans-serif" }}>
            {l.name}
          </span>
        </a>
      ))}
    </div>
  );
}

function ScrutinCard({ s, index = 0 }: { s: Scrutin; index?: number }) {
  return (
    <Link to="/scrutin/$numero" params={{ numero: s.numero }}
      className="scrutin-card card-glass group block p-5 rounded-[2rem] animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}
      aria-label={`Scrutin n°${s.numero} : ${s.titre}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
        {s.date && <time dateTime={s.date}>{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>}
        {s.sort && (<><span aria-hidden="true">·</span><SortBadge sort={s.sort} /></>)}
      </div>
      <p className="text-foreground text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors duration-200 mb-3 font-medium">
        {s.titre ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1) : `Scrutin n°${s.numero}`}
      </p>
      <ResultMiniBar s={s} />
    </Link>
  );
}

function ResultMiniBar({ s }: { s: Scrutin }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0), c = Math.max(0, parseInt(s.nombre_contres) || 0), a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);
  if (!p && !c && !a) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/60">
        <div style={{ width: mounted ? `${(p / total) * 100}%` : "0%", backgroundColor: "var(--color-pour)",        transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1)" }} />
        <div style={{ width: mounted ? `${(c / total) * 100}%` : "0%", backgroundColor: "var(--color-contre)",      transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1) 80ms" }} />
        <div style={{ width: mounted ? `${(a / total) * 100}%` : "0%", backgroundColor: "var(--color-abstention)", transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1) 160ms" }} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{p}</strong> pour</span>
        <span><strong className="text-foreground">{c}</strong> contre</span>
        <span><strong className="text-foreground">{a}</strong> abst.</span>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className="bg-muted/30 py-20 border-t border-border/40">
      <div className="container-app">
        <ScrollScene variant="rise">
          <h2 className="font-display text-3xl md:text-5xl mb-12 text-center leading-[1.05]" data-rise>
            Comment suivre les <span className="text-gradient italic">votes et lois</span> de l'Assemblée ?
          </h2>
        </ScrollScene>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>Chaque jour, l'<strong>Assemblée nationale</strong> examine des textes de loi, des amendements et des motions. En tant que citoyen, il est souvent difficile de suivre précisément la position de vos <strong>députés</strong> au milieu du tumulte politique. <strong>Mandat</strong> simplifie cet accès à l'information démocratique.</p>
            <p>Notre plateforme regroupe l'intégralité des <strong>scrutins publics</strong> de la 17e législature. Vous pouvez rechercher un élu par son nom, sa circonscription ou son groupe politique pour voir l'historique complet de ses votes : pour, contre, ou abstention.</p>
            <p>Nous utilisons les données officielles en temps réel pour vous garantir une transparence totale. Que ce soit pour un projet de loi sur la justice, l'économie ou l'environnement, vous disposez enfin d'un outil clair pour comprendre qui vote quoi, et pourquoi.</p>
          </div>
          <div className="card-glass rounded-[2rem] p-8 border border-white/20 shadow-2xl">
            <h3 className="font-display text-2xl text-foreground mb-4">Les étapes pour s'informer :</h3>
            <ul className="space-y-4">
              {[
                { n: 1, title: "Recherchez", desc: "Utilisez la barre de recherche pour trouver un député ou un texte de loi spécifique." },
                { n: 2, title: "Analysez",   desc: "Consultez le détail des votes par groupe politique et les résultats globaux du scrutin." },
                { n: 3, title: "Partagez",   desc: "Chaque page est conçue pour être partagée facilement afin d'alimenter le débat citoyen." },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{n}</span>
                  <p><strong className="text-foreground">{title} :</strong> {desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const points = [
    { Icon: Unlock,      title: "100 % opendata",         desc: "Sources officielles AN, API CLAIR et CIVIX. Aucune donnée inventée, aucune interprétation politique." },
    { Icon: Scale,       title: "Zéro biais politique",   desc: "Pas de score idéologique, pas de classement partisan. Les faits bruts, tels que votés dans l'hémicycle." },
    { Icon: ShieldCheck, title: "Vie privée respectée",   desc: "Aucun cookie publicitaire. Aucun tracker tiers. Projet indépendant, sans financeur politique." },
  ];
  return (
    <section className="border-t border-border/40">
      <div className="container-app py-20">
        <ScrollScene variant="rise">
          <h2 className="font-display text-3xl md:text-5xl mb-12 text-center leading-[1.05]" data-rise>
            Pourquoi faire confiance<br /><span className="text-gradient italic">à Mandat ?</span>
          </h2>
        </ScrollScene>
        <ScrollScene variant="tilt" className="grid md:grid-cols-3 gap-5">
          {points.map(({ Icon, title, desc }, i) => (
            <div key={i} data-tilt className="card-glass rounded-[2rem] p-7 will-change-transform">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, oklch(0.50 0.20 285 / 14%), oklch(0.42 0.22 260 / 22%))", color: "oklch(0.50 0.20 285)" }} aria-hidden="true">
                <Icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </ScrollScene>
        <div className="text-center mt-10">
          <Link to="/a-propos" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">Découvrir l'équipe et les sources →</Link>
        </div>
      </div>
    </section>
  );
}

function SearchBar() {
  const [q, setQ]         = useState("");
  const [open, setOpen]   = useState(false);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<{ deputes: Depute[]; scrutins: Scrutin[] } | null>(null);
  const nav   = useNavigate();
  const ref   = useRef<HTMLDivElement>(null);
  const safeQ = sanitizeSearchInput(q);

  useEffect(() => {
    const n = normalize(safeQ);
    if (n.length < 2) { setResults(null); return; }
    const t = setTimeout(() => searchHome({ data: { q: safeQ } }).then((r) => setResults(r)).catch(() => setResults(null)), 200);
    return () => clearTimeout(t);
  }, [safeQ]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setFocused(false); }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const hasResults = results && (results.deputes.length > 0 || results.scrutins.length > 0);

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      <form onSubmit={(e) => { e.preventDefault(); const s = sanitizeSearchInput(q.trim()); if (s) { setOpen(false); setFocused(false); nav({ to: "/recherche", search: { q: s } }); } }} role="search" aria-label="Rechercher">
        <div
          className={["search-ring flex items-center gap-1 sm:gap-2 glass-strong rounded-full shadow-lg px-1.5 sm:px-2 border transition-all duration-200", focused ? "border-primary ring-2 ring-primary/40" : "border-white/30"].join(" ")}
          role="combobox" aria-expanded={open && hasResults ? "true" : "false"} aria-haspopup="listbox" aria-controls="search-results"
        >
          <svg className="ml-3 sm:ml-4 w-5 h-5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <input
            autoFocus value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); setFocused(true); }}
            onBlur={() => { setTimeout(() => setFocused(false), 150); }}
            placeholder="Député·e, scrutin, texte de loi…"
            className="flex-1 min-w-0 py-3.5 sm:py-4 px-2 bg-transparent outline-none ring-0 focus:ring-0 focus:outline-none text-sm sm:text-base placeholder:text-muted-foreground"
            aria-label="Terme de recherche" maxLength={150} autoComplete="off" spellCheck="false"
          />
          <button type="submit" className="btn-primary m-1 sm:m-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium shrink-0">
            <span className="hidden sm:inline">Rechercher</span>
            <svg className="sm:hidden w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      </form>
      {open && hasResults && (
        <div id="search-results" className="animate-slide-down absolute left-0 right-0 top-full mt-2 rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[50vh] sm:max-h-[65vh] overflow-y-auto border border-border/60 bg-background" style={{ zIndex: 9999 }} role="listbox" aria-label="Suggestions">
          {results!.deputes.length > 0 && (
            <div className="p-2">
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Député·es</div>
              {results!.deputes.map((d) => (
                <Link key={d.slug} to="/depute/$slug" params={{ slug: d.slug }} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-muted/40 transition-colors" onClick={() => { setOpen(false); setFocused(false); }}>
                  <DeputeAvatarSmall d={d} />
                  <span className="font-medium text-sm">{d.prenom} {d.nom_de_famille}</span>
                  <GroupBadge sigle={d.groupe_sigle} size="sm" />
                  <span className="text-xs text-muted-foreground ml-auto truncate hidden sm:block">{d.nom_circo}</span>
                </Link>
              ))}
            </div>
          )}
          {results!.scrutins.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Scrutins</div>
              {results!.scrutins.map((s) => (
                <Link key={s.numero} to="/scrutin/$numero" params={{ numero: s.numero }} className="block px-4 py-2.5 rounded-2xl hover:bg-muted/40 transition-colors" onClick={() => { setOpen(false); setFocused(false); }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: /adopt/i.test(s.sort) ? "var(--color-pour)" : "var(--color-contre)" }} aria-hidden="true" />
                    <span className="text-sm line-clamp-1 font-medium">{s.titre ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1) : `Scrutin n°${s.numero}`}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-4">{s.date ? new Date(s.date).toLocaleDateString("fr-FR") : ""}{s.sort ? ` · ${s.sort}` : ""}</div>
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
  const src = d.id_an ? photoUrl(d.id_an, 17) : "";
  if (!src || err)
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: "linear-gradient(135deg, oklch(0.50 0.20 285 / 15%), oklch(0.42 0.22 215 / 20%))", color: "oklch(0.50 0.20 285)" }} aria-hidden="true">
        {`${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`.toUpperCase()}
      </div>
    );
  return <img src={src} alt={`${d.prenom} ${d.nom_de_famille}`} className="w-7 h-7 rounded-full object-cover shrink-0" onError={() => setErr(true)} />;
}

