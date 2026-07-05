// components/Header.tsx — Liquid Glass Apple-style

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Github, Menu, X } from "lucide-react";
import { LastUpdated } from "./LastUpdated";

export const GITHUB_REPO_URL = "https://github.com/Simonc44/mandat";

const NAV_LINKS = [
  { to: "/deputes",  label: "Député·es" },
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

// ── CONSENTEMENT ANALYTICS ────────────────────────────────────────────────────

// Clé de persistance du choix de l'utilisateur
const CONSENT_KEY = "mandat_analytics_consent";

/** Envoie une mise à jour du consentement GA via gtag */
function updateGAConsent(granted: boolean) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (typeof w.gtag !== "function") return;
    w.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  } catch (e) {
    // silencieux si gtag n'est pas disponible
  }
}

// ── COOKIE BANNER ─────────────────────────────────────────────────────────────
export function CookieBanner() {
  // null = pas encore chargé, 'granted' | 'denied' = choix connu
  const [consent, setConsent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === "granted" || saved === "denied") {
        // Choix déjà enregistré : on n'affiche pas la bannière
        setConsent(saved);
        setVisible(false);
      } else {
        // Premier passage : on affiche la bannière
        setVisible(true);
      }
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    try { localStorage.setItem(CONSENT_KEY, "granted"); } catch (e) {}
    setConsent("granted");
    setVisible(false);
    updateGAConsent(true);
  }, []);

  const handleRefuse = useCallback(() => {
    try { localStorage.setItem(CONSENT_KEY, "denied"); } catch (e) {}
    setConsent("denied");
    setVisible(false);
    updateGAConsent(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-modal="true" aria-label="Gestion des cookies analytiques">
      <div className="glass-strong rounded-3xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">📊</span>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Mesure d'audience</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Nous utilisons Google Analytics pour mesurer l'audience du site
              (pages vues, navigation). <strong className="text-foreground">Aucune publicité</strong>,
              aucun profilage. Vous pouvez refuser sans que cela n'affecte votre navigation.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Cookies essentiels (thème, session) — toujours actifs
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
            Analytics anonymisé — uniquement si vous acceptez
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" aria-hidden="true" />
            Aucun cookie publicitaire · Aucun tracker tiers
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefuse}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 btn-primary py-2.5 rounded-2xl text-sm font-medium text-center"
          >
            Accepter
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          <Link to="/confidentialite" className="underline hover:text-primary">Politique de confidentialité</Link>
          {" · "}
          <Link to="/a-propos" className="underline hover:text-primary">À propos du projet</Link>
        </p>
      </div>
    </div>
  );
}

// ── VISIT COUNTER ─────────────────────────────────────────────────────────────
function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/visits", { method: "POST" })
      .then(r => r.json())
      .then((d: { count: number }) => { if (typeof d.count === "number" && d.count > 0) setCount(d.count); })
      .catch(() => {});
  }, []);
  if (count === null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} aria-hidden="true" />
      {count.toLocaleString("fr-FR")} {count > 1 ? "visiteurs" : "visiteur"}
    </span>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50">
      <div className="container-app py-12 space-y-8">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          <div className="space-y-4 max-w-sm">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <img src="/favicon.svg" alt="Logo Mandat" className="w-8 h-8 object-contain" width={32} height={32} />
              <strong className="font-display text-xl text-ink">Mandat</strong>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le moteur de recherche citoyen des votes à l'Assemblée nationale.
              17e législature · Données officielles · Aucune publicité.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <VisitCounter />
              <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                aria-label="Code source du projet sur GitHub">
                <Github className="w-3.5 h-3.5" aria-hidden="true" /> Code source
              </a>
            </div>
            <LastUpdated />
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm self-start" aria-label="Navigation secondaire">
            <Link to="/deputes"     className="text-muted-foreground hover:text-primary transition-colors py-1">Les député·es</Link>
            <Link to="/scrutins"    className="text-muted-foreground hover:text-primary transition-colors py-1">Les scrutins</Link>
            <Link to="/groupes"     className="text-muted-foreground hover:text-primary transition-colors py-1">Groupes politiques</Link>
            <Link to="/recherche"   className="text-muted-foreground hover:text-primary transition-colors py-1">Recherche</Link>
            <Link to="/blog"        className="text-muted-foreground hover:text-primary transition-colors py-1">Blog</Link>
            <Link to="/a-propos"    className="text-muted-foreground hover:text-primary transition-colors py-1">À propos</Link>
            <Link to="/confidentialite" className="text-muted-foreground hover:text-primary transition-colors py-1">Confidentialité</Link>
            <Link to="/statut"      className="text-muted-foreground hover:text-primary transition-colors py-1">Statut du service</Link>
            <a href="https://data.assemblee-nationale.fr" target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-primary transition-colors py-1">Données AN ↗</a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-primary transition-colors py-1 inline-flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" aria-hidden="true" /> GitHub ↗
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4 items-center">
            <span>© {new Date().getFullYear()} Mandat · Simon Chusseau</span>
            <span>·</span>
            <span>
              Sources :{" "}
              <a href="https://clair-production.up.railway.app" target="_blank" rel="noreferrer noopener" className="hover:text-primary underline">CLAIR</a>
              {" · "}
              <a href="https://www.civix.fr" target="_blank" rel="noreferrer noopener" className="hover:text-primary underline">CIVIX</a>
              {" · "}
              <a href="https://data.assemblee-nationale.fr" target="_blank" rel="noreferrer noopener" className="hover:text-primary underline">AN Open Data</a>
            </span>
          </div>
          <span>Projet citoyen indépendant · Aucune affiliation politique</span>
        </div>
      </div>
    </footer>
  );
}
