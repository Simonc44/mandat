// components/Header.tsx — Liquid Glass Apple-style

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
    const h = () => setScrolled(window.scrollY > 12);
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
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "glass-navbar shadow-sm" : "glass-navbar border-b border-border/30"}`}>
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
    </>
  );
}
