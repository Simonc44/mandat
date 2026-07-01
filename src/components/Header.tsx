// components/Header.tsx — Liquid Glass Apple-style
// Header frosted glass + cookie banner RGPD + footer enrichi

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Github, Menu, X } from "lucide-react";

// ═══════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════

export const GITHUB_REPO_URL = "https://github.com/Simonc44/mandat";

// ═══════════════════════════════════════════════════════════
// HEADER STICKY — Liquid Glass
// ═══════════════════════════════════════════════════════════

const NAV_LINKS = [
  { to: "/deputes", label: "Député·es" },
  { to: "/scrutins", label: "Scrutins" },
  { to: "/blog", label: "Blog" },
  { to: "/recherche", label: "Recherche" },
] as const;


export function Header() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const location = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Bloque le scroll du body quand le panneau mobile est ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Barre de progression de navigation */}
      {isLoading && <div className="nav-progress" aria-hidden="true" />}

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-navbar shadow-sm"
            : "glass-navbar border-b border-border/30"
        }`}
      >
        <div className="container-app flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="Mandat — Accueil"
          >
            <div className="relative">
              <img
                src="/favicon.svg"
                alt=""
                aria-hidden="true"
                className="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                width={36}
                height={36}
              />
            </div>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                Mandat
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Transparence citoyenne
              </span>
            </span>
          </Link>

          {/* Nav desktop — cachée sous md */}
          <nav
            className="hidden md:flex items-center gap-1 text-sm"
            aria-label="Navigation principale"
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="relative px-3 py-2 rounded-xl text-foreground/70 hover:text-foreground transition-colors duration-200 hover:bg-white/30"
                activeProps={{
                  className:
                    "relative px-3 py-2 rounded-xl text-primary font-medium bg-primary/8 glass",
                }}
              >
                {l.label}
              </Link>
            ))}

            {/* Bouton 16e législature → page interne (nosdeputes proxifié) */}
            <Link
              to="/legislature-16"
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium glass border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              activeProps={{
                className:
                  "ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium btn-primary",
              }}
              title="Voir les députés de la 16e législature (2022-2024)"
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                aria-hidden="true"
              />
              16<sup>e</sup> législature
            </Link>
          </nav>

          {/* Bouton burger — visible seulement sous md */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-foreground/80 hover:bg-white/30 transition-colors shrink-0"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Panneau nav mobile */}
        {mobileOpen && (
          <nav
            id="mobile-nav-panel"
            className="md:hidden glass-navbar border-t border-border/30 animate-slide-down"
            aria-label="Navigation principale mobile"
          >
            <div className="container-app py-3 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-4 py-3 rounded-xl text-base text-foreground/80 hover:text-foreground hover:bg-white/30 transition-colors"
                  activeProps={{
                    className:
                      "px-4 py-3 rounded-xl text-base text-primary font-medium bg-primary/8 glass",
                  }}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/legislature-16"
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium glass border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                activeProps={{
                  className:
                    "mt-1 inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium btn-primary",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                  aria-hidden="true"
                />
                16<sup>e</sup> législature
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// COOKIE BANNER RGPD — Liquid Glass
// ═══════════════════════════════════════════════════════════

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Affiche la bannière si pas encore de consentement
    const stored = localStorage.getItem("mandat_cookie_consent");
    if (!stored) setVisible(true);
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem("mandat_cookie_consent", "essential_only");
    setVisible(false);
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem("mandat_cookie_consent", "refused");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="true"
      aria-label="Consentement aux cookies"
    >
      <div className="glass-strong rounded-3xl p-5 space-y-4">
        {/* Icon + Titre */}
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">
            🔒
          </span>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Respect de votre vie privée
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Mandat n'utilise{" "}
              <strong className="text-foreground">
                aucun cookie publicitaire
              </strong>{" "}
              ni tracker tiers. Seuls des cookies techniques essentiels au
              fonctionnement du site sont utilisés. Aucune donnée personnelle
              n'est vendue.
            </p>
          </div>
        </div>

        {/* Détails */}
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              aria-hidden="true"
            />
            Cookies essentiels (préférences, session)
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
              aria-hidden="true"
            />
            Aucun cookie publicitaire ou de tracking
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
              aria-hidden="true"
            />
            Analytics anonymes uniquement (si activé)
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="btn-primary flex-1 py-2.5 rounded-2xl text-sm font-medium text-center"
          >
            Accepter l'essentiel
          </button>
          <button
            onClick={decline}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-center glass border border-border/60 text-foreground/80 hover:text-foreground transition-colors"
          >
            Refuser tout
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Conformément au RGPD ·{" "}
          <Link to="/confidentialite" className="underline hover:text-primary">
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VISIT COUNTER — Persistant via Turso, incrément 1×/visiteur
// ═══════════════════════════════════════════════════════════

function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // POST incrémente côté serveur (cookie httpOnly garantit 1×/visiteur)
    fetch("/api/visits", { method: "POST" })
      .then((r) => r.json())
      .then((d: { count: number }) => {
        if (typeof d.count === "number" && d.count > 0) setCount(d.count);
      })
      .catch(() => {
        /* silencieux */
      });
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="w-1.5 h-1.5 rounded-full bg-green-500"
        style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        aria-hidden="true"
      />
      {count.toLocaleString("fr-FR")} {count > 1 ? "visiteurs" : "visiteur"}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50">
      <div className="container-app py-12 space-y-8">
        {/* Ligne principale */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* Brand */}
          <div className="space-y-4 max-w-sm">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <img
                src="/favicon.svg"
                alt="Logo Mandat"
                className="w-8 h-8 object-contain"
                width={32}
                height={32}
              />
              <strong className="font-display text-xl text-ink">Mandat</strong>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le moteur de recherche citoyen des votes à l'Assemblée nationale.
              17e législature · Données officielles · Aucune publicité.
            </p>
            <div className="flex items-center gap-4">
              <VisitCounter />
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                aria-label="Code source du projet sur GitHub"
              >
                <Github className="w-3.5 h-3.5" aria-hidden="true" />
                Code source
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm self-start"
            aria-label="Navigation secondaire"
          >
            <Link
              to="/deputes"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Les député·es
            </Link>
            <Link
              to="/scrutins"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Les scrutins
            </Link>
            <Link
              to="/recherche"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Recherche
            </Link>
            <Link
              to="/blog"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Blog
            </Link>
            <Link
              to="/confidentialite"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Confidentialité
            </Link>
            <a
              href="https://data.assemblee-nationale.fr"
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Données AN ↗
            </a>
            <a
              href="https://clair-production.up.railway.app/docs"
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              API CLAIR ↗
            </a>
            <a
              href="https://www.civix.fr"
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              API CIVIX ↗
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground hover:text-primary transition-colors py-1 inline-flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              GitHub ↗
            </a>
          </nav>
        </div>

        {/* Bas de footer */}
        <div className="pt-6 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4 items-center">
            <span>© {new Date().getFullYear()} Mandat</span>
            <span>·</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              Simonc44/mandat
            </a>
            <span>·</span>
            <span>
              Sources :{" "}
              <a
                href="https://clair-production.up.railway.app"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary underline"
              >
                CLAIR
              </a>
              {" · "}
              <a
                href="https://www.civix.fr"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary underline"
              >
                CIVIX
              </a>
              {" · "}
              <a
                href="https://data.assemblee-nationale.fr"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary underline"
              >
                AN Open Data
              </a>
            </span>
          </div>
          <span>Projet citoyen indépendant · Aucune affiliation politique</span>
        </div>
      </div>
    </footer>
  );
}
