// components/Header.tsx — Navbar → pilule premium au scroll

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Menu, X } from "lucide-react";

export const GITHUB_REPO_URL = "https://github.com/Simonc44/mandat";

// ── "France" = groupe avec sous-items ──────────────────────────────────────
const NAV_LINKS = [
  { to: "/deputes",   label: "Député·es" },
  { to: "/groupes",   label: "Groupes" },
  { to: "/scrutins",  label: "Scrutins" },
  { to: "/blog",      label: "Blog" },
  { to: "/recherche", label: "Recherche" },
  { to: "/a-propos",  label: "À propos" },
] as const;

const FRANCE_LINKS = [
  { to: "/scrutins-semaine",  label: "📅 Scrutins de la semaine", desc: "Les votes importants chaque semaine" },
  { to: "/problemes-france",  label: "🇫🇷 Problèmes de la France", desc: "État des lieux + score par dimension" },
  { to: "/defis-france",      label: "🎯 Défis à relever",          desc: "Objectifs & indicateurs de progrès" },
] as const;

export function Header() {
  const isLoading  = useRouterState({ select: s => s.isLoading });
  const location   = useRouterState({ select: s => s.location.pathname });
  const [scrolled, setScrolled]       = useState(false);
  const [scrollPct, setScrollPct]     = useState(0);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [franceOpen, setFranceOpen]   = useState(false);
  const franceRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 70);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (y / docH) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close France dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (franceRef.current && !franceRef.current.contains(e.target as Node)) {
        setFranceOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setFranceOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isFranceActive = FRANCE_LINKS.some(l => location.startsWith(l.to));

  return (
    <>
      {isLoading && <div className="nav-progress" aria-hidden="true" />}

      {/* ══ PILULE FLOTTANTE ══════════════════════════════ */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        style={{
          paddingTop: scrolled ? "12px" : "0px",
          transition: "padding-top 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          ref={pillRef}
          className="pointer-events-auto hidden md:flex items-center relative overflow-hidden"
          style={{
            borderRadius: scrolled ? "9999px" : "0px",
            width: scrolled ? "auto" : "100vw",
            maxWidth: scrolled ? "880px" : "100vw",
            padding: scrolled ? "5px 6px" : "0px",
            gap: scrolled ? "2px" : "0px",
            background: scrolled ? "oklch(0.13 0.05 285 / 90%)" : "transparent",
            backdropFilter: scrolled ? "blur(32px) saturate(200%)" : "none",
            border: scrolled ? "1px solid oklch(0.35 0.08 285 / 40%)" : "none",
            boxShadow: scrolled ? "0 4px 24px oklch(0.08 0.06 285 / 55%), 0 1px 0 oklch(1 0 0 / 7%) inset" : "none",
            transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
          }}
          aria-label="Navigation principale"
        >
          {/* Logo compact */}
          <div style={{ maxWidth: scrolled ? "120px" : "0px", opacity: scrolled ? 1 : 0, overflow: "hidden", transition: "max-width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease", marginRight: scrolled ? "2px" : "0px", flexShrink: 0 }}>
            <Link to="/" className="flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-full hover:bg-white/8 transition-colors group" aria-label="Accueil Mandat">
              <img src="/favicon.svg" alt="" width={20} height={20} className="w-5 h-5 object-contain group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-white/90 tracking-tight whitespace-nowrap font-display">Mandat</span>
            </Link>
          </div>
          {scrolled && (<span className="w-px h-4 shrink-0 mx-1" style={{ background: "oklch(0.45 0.08 285 / 60%)" }} aria-hidden="true" />)}

          {/* Liens standard */}
          {NAV_LINKS.map((l) => {
            const active = location === l.to || (l.to !== "/" && location.startsWith(l.to));
            return (
              <Link key={l.to} to={l.to}
                className="relative flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap"
                style={{ color: active ? "white" : "oklch(0.70 0.05 285)", background: active ? "oklch(0.50 0.20 285 / 35%)" : "transparent" }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "oklch(0.30 0.06 285 / 40%)"; (e.currentTarget as HTMLElement).style.color = "white"; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "oklch(0.70 0.05 285)"; } }}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
                {active && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "oklch(0.72 0.16 285)" }} aria-hidden="true" />}
              </Link>
            );
          })}

          {/* Dropdown France */}
          <div ref={franceRef} className="relative">
            <button
              onClick={() => setFranceOpen(v => !v)}
              className="relative flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap"
              style={{ color: isFranceActive ? "white" : "oklch(0.70 0.05 285)", background: isFranceActive ? "oklch(0.50 0.20 285 / 35%)" : "transparent" }}
              aria-expanded={franceOpen}
              aria-haspopup="menu"
            >
              🇫🇷 France
              <svg className={`w-3 h-3 transition-transform ${franceOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {franceOpen && (
              <div
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 rounded-2xl border border-border/40 overflow-hidden shadow-2xl"
                style={{ background: "oklch(0.13 0.05 285 / 96%)", backdropFilter: "blur(24px)" }}
                role="menu"
              >
                {FRANCE_LINKS.map(fl => {
                  const active = location.startsWith(fl.to);
                  return (
                    <Link key={fl.to} to={fl.to} role="menuitem"
                      className="flex flex-col px-4 py-3 hover:bg-white/8 transition-colors"
                      style={{ borderLeft: active ? "2px solid oklch(0.72 0.16 285)" : "2px solid transparent" }}
                    >
                      <span className="text-sm font-semibold text-white/90">{fl.label}</span>
                      <span className="text-xs text-white/50 mt-0.5">{fl.desc}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Barre progression */}
          {scrolled && (
            <div className="absolute bottom-0 left-0 h-[2px] rounded-full pointer-events-none" style={{ width: `${scrollPct}%`, background: "linear-gradient(90deg, oklch(0.50 0.20 285), oklch(0.72 0.16 285))", transition: "width 0.1s linear" }} aria-hidden="true" />
          )}
        </div>
      </div>

      {/* ══ BARRE CLASSIQUE (haut de page) ═══════════════════════════════ */}
      <header
        className="sticky top-0 z-40 glass-navbar border-b border-border/30"
        style={{ transition: "opacity 0.35s ease, transform 0.35s ease", opacity: scrolled ? 0 : 1, pointerEvents: scrolled ? "none" : "auto", transform: scrolled ? "translateY(-6px)" : "translateY(0)" }}
        aria-hidden={scrolled}
      >
        <div className="container-app flex items-center justify-between h-16 gap-3">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Mandat — Accueil">
            <img src="/favicon.svg" alt="Logo Mandat" className="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" width={36} height={36} />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold tracking-tight text-ink">Mandat</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Transparence citoyenne</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Navigation principale">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className="relative px-3 py-2 rounded-xl text-foreground/70 hover:text-foreground transition-colors duration-200 hover:bg-white/30"
                activeProps={{ className: "relative px-3 py-2 rounded-xl text-primary font-medium bg-primary/8 glass" }}>
                {l.label}
              </Link>
            ))}
            {/* Dropdown France barre classique */}
            <div className="relative" ref={franceRef}>
              <button
                onClick={() => setFranceOpen(v => !v)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-colors duration-200 ${
                  isFranceActive ? "text-primary font-medium bg-primary/8 glass" : "text-foreground/70 hover:text-foreground hover:bg-white/30"
                }`}
                aria-expanded={franceOpen}
                aria-haspopup="menu"
              >
                🇫🇷 France
                <svg className={`w-3.5 h-3.5 transition-transform ${franceOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {franceOpen && (
                <div className="absolute top-full mt-1 left-0 w-64 rounded-2xl border border-border/50 shadow-xl z-50 overflow-hidden" style={{ background: "var(--background)", backdropFilter: "blur(16px)" }} role="menu">
                  {FRANCE_LINKS.map(fl => {
                    const active = location.startsWith(fl.to);
                    return (
                      <Link key={fl.to} to={fl.to} role="menuitem"
                        className="flex flex-col px-4 py-3 hover:bg-primary/5 transition-colors"
                        style={{ borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent" }}
                      >
                        <span className="text-sm font-semibold">{fl.label}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{fl.desc}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <button type="button" onClick={() => setMobileOpen(v => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-foreground/80 hover:bg-white/30 transition-colors shrink-0"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        {mobileOpen && (
          <nav id="mobile-nav-panel" className="md:hidden glass-navbar border-t border-border/30 animate-slide-down" aria-label="Navigation principale mobile">
            <div className="container-app py-3 flex flex-col gap-1">
              {NAV_LINKS.map(l => (
                <Link key={l.to} to={l.to}
                  className="px-4 py-3 rounded-xl text-base text-foreground/80 hover:text-foreground hover:bg-white/30 transition-colors"
                  activeProps={{ className: "px-4 py-3 rounded-xl text-base text-primary font-medium bg-primary/8 glass" }}>
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-border/30 mt-2 pt-2">
                <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">🇫🇷 France</p>
                {FRANCE_LINKS.map(fl => (
                  <Link key={fl.to} to={fl.to}
                    className="px-4 py-3 rounded-xl text-base text-foreground/80 hover:text-foreground hover:bg-white/30 transition-colors block"
                    activeProps={{ className: "px-4 py-3 rounded-xl text-base text-primary font-medium bg-primary/8 glass block" }}
                  >
                    {fl.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* ══ HAMBURGER FLOTTANT MOBILE ══════════════════════════════════════ */}
      {scrolled && (
        <button type="button" onClick={() => setMobileOpen(v => !v)}
          className="md:hidden fixed top-3 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border transition-all"
          style={{ background: "oklch(0.13 0.05 285 / 90%)", backdropFilter: "blur(20px)", borderColor: "oklch(0.35 0.08 285 / 40%)", boxShadow: "0 4px 16px oklch(0.08 0.06 285 / 50%)" }}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="w-4.5 h-4.5 text-white" /> : <Menu className="w-4.5 h-4.5 text-white" />}
        </button>
      )}

      {/* ══ OVERLAY MOBILE (pilule active) ══════════════════════════════ */}
      {scrolled && mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col pt-20 px-5" style={{ background: "oklch(0.10 0.04 285 / 97%)", backdropFilter: "blur(24px)" }}>
          <nav className="flex flex-col gap-2" aria-label="Navigation mobile">
            {NAV_LINKS.map(l => {
              const active = location === l.to || (l.to !== "/" && location.startsWith(l.to));
              return (
                <Link key={l.to} to={l.to}
                  className="flex items-center px-5 py-4 rounded-2xl text-lg font-medium transition-all"
                  style={{ color: active ? "white" : "oklch(0.65 0.08 285)", background: active ? "oklch(0.50 0.20 285 / 25%)" : "transparent" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="border-t border-white/10 mt-2 pt-3">
              <p className="px-5 pb-2 text-xs font-semibold text-white/40 uppercase tracking-widest">🇫🇷 France</p>
              {FRANCE_LINKS.map(fl => {
                const active = location.startsWith(fl.to);
                return (
                  <Link key={fl.to} to={fl.to}
                    className="flex flex-col px-5 py-3 rounded-2xl transition-all"
                    style={{ color: active ? "white" : "oklch(0.65 0.08 285)", background: active ? "oklch(0.50 0.20 285 / 25%)" : "transparent" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-base font-medium">{fl.label}</span>
                    <span className="text-xs opacity-50 mt-0.5">{fl.desc}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
