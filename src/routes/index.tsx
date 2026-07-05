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
    <div>
      {/* HERO */}
      <section className="relative z-20">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="hero-orb w-[600px] h-[600px] -top-32 -left-32 opacity-30"
            style={{ background: "radial-gradient(circle, oklch(0.50 0.20 285), transparent 70%)", "--duration": "7s", "--delay": "0s" } as React.CSSProperties} />
          <div className="hero-orb w-[400px] h-[400px] top-1/3 right-0 opacity-20"
            style={{ background: "radial-gradient(circle, oklch(0.55 0.18 215), transparent 70%)", "--duration": "9s", "--delay": "2s" } as React.CSSProperties} />
        </div>

        <div className="container-app pt-6 md:pt-8 pb-12 md:pb-16 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              17e législature · Mis à jour quotidiennement
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] sm:leading-[0.92] mb-6 animate-fade-up tracking-tight" style={{ animationDelay: "80ms" }}>
              Cherchez comment
              <br />
              <span className="text-gradient italic">votre député a voté.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed animate-fade-up" style={{ animationDelay: "160ms" }}>
              Sur n'importe quel texte de loi, en quelques secondes.{" "}
              <strong className="text-foreground">{stats.scrutinsCount.toLocaleString("fr-FR")} scrutins</strong>{" "}
              et{" "}
              <strong className="text-foreground">{stats.deputesCount.toLocaleString("fr-FR")} député·es</strong>{" "}
              de la 17e législature — sans étiquette, sans filtre politique.
            </p>

            {/* SearchBar uniquement — pas de CTA qui masquent les résultats */}
            <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
              <SearchBar />
            </div>

            {/* Raccourcis discrets SOUS la search — petits, ne rivalisent pas avec les résultats */}
            <div className="animate-fade-up flex flex-wrap gap-2 mt-4" style={{ animationDelay: "310ms" }}>
              <Link to="/deputes" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-primary glass border border-border/40 hover:border-primary/30 transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                Député·es
              </Link>
              <Link to="/scrutins" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-primary glass border border-border/40 hover:border-primary/30 transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Scrutins
              </Link>
              <Link to="/groupes" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-primary glass border border-border/40 hover:border-primary/30 transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/></svg>
                Groupes
              </Link>
            </div>

            {/* Trust — encore plus discret, petite taille */}
            <div className="animate-fade-up flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground/70 mt-5" style={{ animationDelay: "380ms" }}>
              <span className="flex items-center gap-1.5"><Unlock className="w-3 h-3" aria-hidden="true" />100% Open Data</span>
              <span className="flex items-center gap-1.5"><Scale className="w-3 h-3" aria-hidden="true" />Sans étiquette</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" aria-hidden="true" />Sans publicité</span>
            </div>
          </div>
        </div>
      </section>

      {/* ACCROCHE ÉDITORIALE */}
      {spotlight && (
        <section className="container-app pb-10 relative z-10">
          <div className="animate-fade-up">
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
        </section>
      )}

      {/* DERNIERS SCRUTINS */}
      <section className="container-app pb-16 pt-4 relative z-10 -mt-4">
        <ScrollScene variant="rise">
          <div className="flex items-end justify-between mb-8 mt-2" data-rise>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-2 font-medium">En direct de l'hémicycle</div>
              <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">Derniers scrutins.</h2>
            </div>
            <Link to="/scrutins" className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group">
              Tout voir
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          </div>
        </ScrollScene>
        <ScrollScene variant="tilt" className="grid md:grid-cols-2 gap-4">
          {latest.slice(1).map((s, i) => (
            <div key={s.numero} data-tilt className="will-change-transform"><ScrutinCard s={s} index={i} /></div>
          ))}
        </ScrollScene>
      </section>

      {/* STATS */}
      <section className="container-app pb-16">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 animate-fade-up">
          <StatPill value={stats.deputesCount.toLocaleString("fr-FR")} label="Député·es" />
          <StatPill value={stats.scrutinsCount.toLocaleString("fr-FR")} label="Scrutins" />
          <StatPill value={stats.groupesCount.toString()} label="Groupes" />
        </div>
      </section>

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
