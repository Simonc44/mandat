// routes/index.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  normalize,
  sanitizeSearchInput,
  type Depute,
  type Scrutin,
  photoUrl,
} from "@/lib/api";
import {
  getHomeStats,
  getLatestScrutins,
  searchHome,
  type HomeStats,
} from "@/lib/data.functions";
import { GroupBadge } from "@/components/GroupBadge";
import { ScrollScene } from "@/components/ScrollScene";
import { StoryReveal } from "@/components/StoryReveal";
import { Unlock, Scale, ShieldCheck } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: createSeoMeta({
      title: "Mandat — Cherchez comment votre député a voté à l'Assemblée",
      description: "Trouvez en quelques secondes le vote de n'importe quel député sur n'importe quel texte. 577 élus, toutes les lois de la 17e législature, sans étiquette politique.",
      canonical: SITE_URL,
      ogType: "website",
    }),
  }),
  loader: async () => {
    const [stats, latest] = await Promise.all([getHomeStats(), getLatestScrutins()]);
    return { stats, latest };
  },
  component: Home,
});

function Home() {
  const { stats, latest } = Route.useLoaderData() as { stats: HomeStats; latest: Scrutin[] };
  const spotlight = latest?.[0] ?? null;

  return (
    <div className="page-enter">
      <section className="hero-attach relative">
        <div className="hero-orb-slow w-[520px] h-[520px] -top-24 -left-32 opacity-60"
          style={{ background: "radial-gradient(circle, oklch(0.70 0.18 285 / 55%), transparent 70%)" }} aria-hidden="true" />
        <div className="hero-orb-slow w-[420px] h-[420px] -top-10 right-[-8rem] opacity-50"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.14 305 / 45%), transparent 70%)", animationDelay: "-5s" }} aria-hidden="true" />

        <div className="container-app relative z-10 pt-14 sm:pt-20 md:pt-24 pb-56 sm:pb-72 md:pb-80 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            17e législature · Mis à jour quotidiennement
          </div>

          <h1 className="font-display mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.02] mb-6 animate-fade-up tracking-tight"
              style={{ animationDelay: "80ms" }}>
            Cherchez comment
            <br />
            <span className="text-gradient italic">votre député a voté.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed animate-fade-up px-2"
             style={{ animationDelay: "160ms" }}>
            Sur n'importe quel texte de loi, en quelques secondes.{" "}
            <strong className="text-foreground">{stats.scrutinsCount.toLocaleString("fr-FR")} scrutins</strong>{" "}
            et{" "}
            <strong className="text-foreground">{stats.deputesCount.toLocaleString("fr-FR")} député·es</strong>{" "}
            — sans étiquette politique.
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

        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1600 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wave1" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="oklch(0.72 0.16 285 / 65%)" />
                <stop offset="50%"  stopColor="oklch(0.60 0.22 275 / 70%)" />
                <stop offset="100%" stopColor="oklch(0.68 0.16 305 / 60%)" />
              </linearGradient>
              <linearGradient id="wave2" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="oklch(0.78 0.12 290 / 50%)" />
                <stop offset="100%" stopColor="oklch(0.66 0.18 265 / 60%)" />
              </linearGradient>
              <linearGradient id="wave3" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="oklch(0.86 0.08 295 / 45%)" />
                <stop offset="100%" stopColor="oklch(0.72 0.14 285 / 50%)" />
              </linearGradient>
            </defs>
            <path className="hero-wave-path p3" fill="url(#wave3)"
              d="M-80,260 C240,340 560,180 880,220 C1200,260 1440,360 1680,290 L1680,400 L-80,400 Z" />
            <path className="hero-wave-path p2" fill="url(#wave2)"
              d="M-80,300 C240,220 560,340 880,280 C1200,220 1440,300 1680,260 L1680,400 L-80,400 Z" />
            <path className="hero-wave-path" fill="url(#wave1)"
              d="M-80,340 C240,280 560,380 880,320 C1200,260 1440,340 1680,320 L1680,400 L-80,400 Z" />
          </svg>
        </div>

        <div className="hero-fade-out" aria-hidden="true" />
      </section>

      <div className="h-16 sm:h-24" aria-hidden="true" />

      {spotlight && (
        <StoryReveal as="section" className="container-app pb-10 relative z-10">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">À la une</div>
            <Link to="/scrutin/$numero" params={{ numero: spotlight.numero }}
              className="scrutin-card card-glass group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[2rem] border border-primary/20 hover:border-primary/40 transition-colors">
              <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: /adopt/i.test(spotlight.sort) ? "color-mix(in oklch, var(--color-pour) 14%, transparent)" : "color-mix(in oklch, var(--color-contre) 14%, transparent)" }}
                aria-hidden="true">
                {/adopt/i.test(spotlight.sort) ? "✓" : "✗"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                  {spotlight.date && <time dateTime={spotlight.date}>{new Date(spotlight.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: /adopt/i.test(spotlight.sort) ? "var(--color-pour)" : "var(--color-contre)", backgroundColor: /adopt/i.test(spotlight.sort) ? "color-mix(in oklch, var(--color-pour) 12%, transparent)" : "color-mix(in oklch, var(--color-contre) 12%, transparent)" }}>
                    {/adopt/i.test(spotlight.sort) ? "Adopté" : "Rejeté"}
                  </span>
                </div>
                <p className="text-foreground font-medium leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
                  {spotlight.titre ? spotlight.titre.charAt(0).toUpperCase() + spotlight.titre.slice(1) : `Scrutin n°${spotlight.numero}`}
                </p>
                {(() => { const p=parseInt(spotlight.nombre_pours)||0, c=parseInt(spotlight.nombre_contres)||0, a=parseInt(spotlight.nombre_abstentions)||0; if(!p&&!c&&!a) return null; return <p className="text-xs text-muted-foreground mt-1">{p} pour · {c} contre · {a} abstentions</p>; })()}
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

      <StoryReveal as="section" className="container-app pb-16">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <StatPill value={stats.deputesCount.toLocaleString("fr-FR")} label="Député·es" />
          <StatPill value={stats.scrutinsCount.toLocaleString("fr-FR")} label="Scrutins" />
          <StatPill value={stats.groupesCount.toString()} label="Groupes" />
        </div>
      </StoryReveal>

      <TrustSection />
    </div>
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

// Icone Turso (T stylisé)
function TursoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4F46E5"/>
      <path d="M8 10h16M14 10v12M18 10v12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// Icone Stripe (S stylisé violet)
function StripeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#635BFF"/>
      <path d="M20.5 12.5c0-1.5-1.2-2.5-3.5-2.5-2.8 0-4 1.4-4 2.8 0 1.9 1.8 2.7 3.5 3.2 1.4.4 2.5.9 2.5 2 0 1.2-1.1 1.8-2.8 1.8-1.8 0-2.9-.7-3.2-1.8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Icone GitHub (octocat simplifié)
function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

// Icone Assemblée nationale (colonnes)
function ANIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#003189"/>
      <rect x="7" y="22" width="18" height="2" rx="1" fill="white"/>
      <rect x="7" y="9" width="18" height="2" rx="1" fill="white"/>
      <rect x="9" y="11" width="2" height="11" rx="1" fill="white"/>
      <rect x="13.5" y="11" width="2" height="11" rx="1" fill="white"/>
      <rect x="18" y="11" width="2" height="11" rx="1" fill="white"/>
      <rect x="22" y="11" width="0" height="11" rx="1" fill="white"/>
    </svg>
  );
}

// Icone Civix
function CivixIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M20 11a7 7 0 1 0 0 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Icone Clair
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
    {
      name: "Turso",
      href: "https://turso.tech",
      icon: <TursoIcon />,
    },
    {
      name: "Stripe",
      href: "https://stripe.com",
      icon: <StripeIcon />,
    },
    {
      name: "GitHub",
      href: "https://github.com/Simonc44/mandat",
      icon: <GitHubIcon />,
    },
    {
      name: "Assemblée nationale",
      href: "https://www.assemblee-nationale.fr",
      icon: <ANIcon />,
    },
    {
      name: "Civix",
      href: "https://civix.fr",
      icon: <CivixIcon />,
    },
    {
      name: "Clair",
      href: "https://clair-production.up.railway.app",
      icon: <ClairIcon />,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:gap-x-10">
      {logos.map(l => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          title={l.name}
          className="trust-logo group inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{l.icon}</span>
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
    <Link to="/scrutin/$numero" params={{ numero: s.numero }}
      className="scrutin-card card-glass group block p-5 rounded-[2rem] animate-fade-up" style={{ animationDelay: `${index*70}ms` }}
      aria-label={`Scrutin n°${s.numero} : ${s.titre}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
        {s.date && <time dateTime={s.date}>{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>}
        {s.sort && (<><span aria-hidden="true">·</span><SortBadge sort={s.sort} /></>)}
      </div>
      <p className="text-foreground text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors duration-200 mb-3 font-medium">
        {s.titre ? s.titre.charAt(0).toUpperCase()+s.titre.slice(1) : `Scrutin n°${s.numero}`}
      </p>
      <ResultMiniBar s={s} />
    </Link>
  );
}

function ResultMiniBar({ s }: { s: Scrutin }) {
  const p=Math.max(0,parseInt(s.nombre_pours)||0), c=Math.max(0,parseInt(s.nombre_contres)||0), a=Math.max(0,parseInt(s.nombre_abstentions)||0);
  const total=Math.max(1,p+c+a);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),200); return ()=>clearTimeout(t); },[]);
  if(!p&&!c&&!a) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/60">
        <div style={{width:mounted?`${(p/total)*100}%`:"0%",backgroundColor:"var(--color-pour)",transition:"width 700ms cubic-bezier(0.34,1.56,0.64,1)"}} />
        <div style={{width:mounted?`${(c/total)*100}%`:"0%",backgroundColor:"var(--color-contre)",transition:"width 700ms cubic-bezier(0.34,1.56,0.64,1) 80ms"}} />
        <div style={{width:mounted?`${(a/total)*100}%`:"0%",backgroundColor:"var(--color-abstention)",transition:"width 700ms cubic-bezier(0.34,1.56,0.64,1) 160ms"}} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{p}</strong> pour</span>
        <span><strong className="text-foreground">{c}</strong> contre</span>
        <span><strong className="text-foreground">{a}</strong> abst.</span>
      </div>
    </div>
  );
}

function TrustSection() {
  const points = [
    { Icon: Unlock, title: "100 % opendata", desc: "Sources officielles AN, API CLAIR et CIVIX. Aucune donnée inventée, aucune interprétation politique." },
    { Icon: Scale,  title: "Zéro biais politique", desc: "Pas de score idéologique, pas de classement partisan. Les faits bruts, tels que votés dans l'hémicycle." },
    { Icon: ShieldCheck, title: "Vie privée respectée", desc: "Aucun cookie publicitaire. Aucun tracker tiers. Projet indépendant, sans financeur politique." },
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
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{ deputes: Depute[]; scrutins: Scrutin[] } | null>(null);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const safeQ = sanitizeSearchInput(q);

  useEffect(() => {
    const n = normalize(safeQ);
    if (n.length < 2) { setResults(null); return; }
    const t = setTimeout(() => searchHome({ data: { q: safeQ } }).then(r => setResults(r)).catch(() => setResults(null)), 200);
    return () => clearTimeout(t);
  }, [safeQ]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const hasResults = results && (results.deputes.length > 0 || results.scrutins.length > 0);

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      <form onSubmit={e => { e.preventDefault(); const s=sanitizeSearchInput(q.trim()); if(s){setOpen(false);nav({to:"/recherche",search:{q:s}});} }} role="search" aria-label="Rechercher">
        <div className="search-ring flex items-center gap-1 sm:gap-2 glass-strong rounded-full border border-white/30 shadow-lg px-1.5 sm:px-2"
          role="combobox" aria-expanded={open&&hasResults?"true":"false"} aria-haspopup="listbox" aria-controls="search-results">
          <svg className="ml-3 sm:ml-4 w-5 h-5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <input
            autoFocus value={q}
            onChange={e=>{setQ(e.target.value);setOpen(true);}}
            onFocus={()=>setOpen(true)}
            placeholder="Député·e, scrutin, texte de loi…"
            className="flex-1 min-w-0 py-3.5 sm:py-4 px-2 bg-transparent outline-none text-sm sm:text-base placeholder:text-muted-foreground"
            aria-label="Terme de recherche" maxLength={150} autoComplete="off" spellCheck="false" />
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
              {results!.deputes.map(d => (
                <Link key={d.slug} to="/depute/$slug" params={{ slug: d.slug }} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-muted/40 transition-colors" onClick={()=>setOpen(false)}>
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
              {results!.scrutins.map(s => (
                <Link key={s.numero} to="/scrutin/$numero" params={{ numero: s.numero }} className="block px-4 py-2.5 rounded-2xl hover:bg-muted/40 transition-colors" onClick={()=>setOpen(false)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: /adopt/i.test(s.sort)?"var(--color-pour)":"var(--color-contre)" }} aria-hidden="true" />
                    <span className="text-sm line-clamp-1 font-medium">{s.titre ? s.titre.charAt(0).toUpperCase()+s.titre.slice(1) : `Scrutin n°${s.numero}`}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-4">{s.date?new Date(s.date).toLocaleDateString("fr-FR"):""}{s.sort?` · ${s.sort}`:""}</div>
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
  const [err,setErr]=useState(false);
  const src=d.id_an?photoUrl(d.id_an,17):"";
  if(!src||err) return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{background:"linear-gradient(135deg, oklch(0.50 0.20 285 / 15%), oklch(0.42 0.22 215 / 20%))",color:"oklch(0.50 0.20 285)"}} aria-hidden="true">
      {`${d.prenom?.[0]??""}${d.nom_de_famille?.[0]??""}`.toUpperCase()}
    </div>
  );
  return <img src={src} alt={`${d.prenom} ${d.nom_de_famille}`} className="w-7 h-7 rounded-full object-cover shrink-0" onError={()=>setErr(true)} />;
}

import type React from "react";
