// components/Header.tsx — Navbar qui se transforme en pilule au scroll

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export const GITHUB_REPO_URL = "https://github.com/Simonc44/mandat";

const NAV_LINKS = [
  { to: "/deputes",  label: "Député·es" },
  { to: "/groupes",  label: "Groupes" },
  { to: "/scrutins", label: "Scrutins" },
  { to: "/blog",     label: "Blog" },
  { to: "/recherche",label: "Recherche" },
  { to: "/a-propos", label: "À propos" },
] as const;

export function Header() {
  const isLoading  = useRouterState({ select: s => s.isLoading });
  const location   = useRouterState({ select: s => s.location.pathname });
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {isLoading && <div className="nav-progress" aria-hidden="true" />}

      {/* Pilule flottante (visible dès que scrolled > 60px) */}
      <div
        className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{
          transition: "opacity 0.35s ease, transform 0.35s ease",
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? "translateY(0)" : "translateY(-12px)",
        }}
      >
        <nav
          className="pointer-events-auto hidden md:flex items-center gap-1 px-3 py-2 rounded-full text-sm border border-white/15"
          style={{
            background: "oklch(0.14 0.04 285 / 88%)",
            backdropFilter: "blur(28px) saturate(180%)",
            boxShadow: "0 8px 40px oklch(0.08 0.06 285 / 70%), inset 0 1px 0 oklch(1 0 0 / 8%)",
          }}
          aria-label="Navigation principale"
        >
          <Link to="/" className="flex items-center gap-1.5 mr-1 group" aria-label="Accueil">
            <img src="/favicon.svg" alt="" className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110" width={24} height={24} aria-hidden="true" />
            <span className="font-display text-sm font-semibold text-white/90 tracking-tight">Mandat</span>
          </Link>
          <span className="w-px h-4 bg-white/20 mx-1" aria-hidden="true" />
          {NAV_LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs font-medium"
              activeProps={{ className: "px-3 py-1.5 rounded-full text-primary font-semibold bg-primary/18 text-xs" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Barre classique en haut de page — se cache quand la pilule arrive */}
      <header
        className="sticky top-0 z-40 glass-navbar border-b border-border/30"
        style={{
          transition: "opacity 0.3s ease, transform 0.3s ease",
          opacity: scrolled ? 0 : 1,
          pointerEvents: scrolled ? "none" : "auto",
          transform: scrolled ? "translateY(-4px)" : "translateY(0)",
        }}
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
          </nav>

          <button type="button" onClick={() => setMobileOpen(v => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-foreground/80 hover:bg-white/30 transition-colors shrink-0"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="mobile-nav-panel">
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
            </div>
          </nav>
        )}
      </header>

      {/* Bouton hamburger flottant mobile quand la barre est cachée */}
      {scrolled && (
        <button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          className="md:hidden fixed top-4 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center border border-white/20 transition-all"
          style={{ background: "oklch(0.14 0.04 285 / 88%)", backdropFilter: "blur(16px)", boxShadow: "0 4px 20px oklch(0.08 0.06 285 / 60%)" }}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      )}

      {/* Overlay mobile quand pilule active */}
      {scrolled && mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col pt-20 px-5"
          style={{ background: "oklch(0.10 0.04 285 / 96%)", backdropFilter: "blur(20px)" }}
        >
          <nav className="flex flex-col gap-2" aria-label="Navigation mobile">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className="px-5 py-4 rounded-2xl text-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors font-medium"
                activeProps={{ className: "px-5 py-4 rounded-2xl text-lg text-primary font-semibold bg-primary/15" }}
                onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
