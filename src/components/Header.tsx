// components/Header.tsx — Liquid Glass Apple-style
// Header frosted glass + cookie banner RGPD + footer enrichi

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";

const STRIPE_LINK = "https://buy.stripe.com/VOTRE_LIEN_STRIPE"; // ← Remplacez par votre vrai lien
const RECYCLIVRE_LINK =
  "https://www.recyclivre.com/products/1244049-l-assemblee-nationale";

// ═══════════════════════════════════════════════════════════
// HEADER STICKY — Liquid Glass
// ═══════════════════════════════════════════════════════════

export function Header() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Barre de progression de navigation */}
      {isLoading && <div className="nav-progress" aria-hidden="true" />}

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "glass-strong shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container-app flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
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
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Transparence citoyenne
              </span>
            </span>
          </Link>

          {/* Nav */}
          <nav
            className="flex items-center gap-1 text-sm"
            aria-label="Navigation principale"
          >
            {[
              { to: "/deputes", label: "Député·es" },
              { to: "/scrutins", label: "Scrutins" },
              { to: "/recherche", label: "Recherche" },
            ].map((l) => (
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
          </nav>
        </div>
      </header>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// SUPPORT WIDGET — Stripe
// ═══════════════════════════════════════════════════════════

function SupportWidget() {
  return (
    <a
      href={STRIPE_LINK}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Soutenir le projet Mandat"
      className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm transition-all"
    >
      <HeartIcon />
      Soutenir le projet
    </a>
  );
}

function HeartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="animate-float"
      style={{ "--duration": "2s" } as React.CSSProperties}
    >
      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
    </svg>
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
          <span className="text-2xl" aria-hidden="true">🔒</span>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Respect de votre vie privée
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Mandat n'utilise{" "}
              <strong className="text-foreground">aucun cookie publicitaire</strong> ni
              tracker tiers. Seuls des cookies techniques essentiels au fonctionnement
              du site sont utilisés. Aucune donnée personnelle n'est vendue.
            </p>
          </div>
        </div>

        {/* Détails */}
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Cookies essentiels (préférences, session)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
            Aucun cookie publicitaire ou de tracking
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
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
          <a href="#" className="underline hover:text-primary">
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AFFILIATION — Pour aller plus loin
// ═══════════════════════════════════════════════════════════

function AffiliationWidget() {
  return (
    <div className="glass rounded-2xl p-4 max-w-xs">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
        📚 Pour aller plus loin
      </p>
      <p className="text-sm font-semibold text-foreground leading-snug mb-0.5">
        L'Assemblée nationale
      </p>
      <p className="text-xs text-muted-foreground mb-3">Documentation française</p>
      <a
        href={RECYCLIVRE_LINK}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group"
        aria-label="Trouver ce livre d'occasion sur RecycLivre"
      >
        <span>Trouver d'occasion sur RecycLivre</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        >
          <path d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      </a>
      <p className="text-[10px] text-muted-foreground mt-1">
        Lien affilié éthique — achat d'occasion
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VISIT COUNTER — Privacy-first
// ═══════════════════════════════════════════════════════════

const VISIT_THRESHOLD = 5_000;

function VisitCounter() {
  const [data, setData] = useState<{ count: number } | null>(null);

  useEffect(() => {
    fetch("/api/visits")
      .then((r) => r.json())
      .then((d: { count: number }) => {
        if (d.count >= VISIT_THRESHOLD) setData(d);
      })
      .catch(() => {
        /* silencieux en dev */
      });
  }, []);

  if (!data) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="w-1.5 h-1.5 rounded-full bg-green-500"
        style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        aria-hidden="true"
      />
      {data.count.toLocaleString("fr-FR")} visiteurs uniques
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════

// Nécessaire pour le JSX de l'import React dans HeartIcon
import type React from "react";

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
            <VisitCounter />
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
            <a
              href="https://data.assemblee-nationale.fr"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Données AN ↗
            </a>
            <a
              href="https://clair-production.up.railway.app/docs"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              API CLAIR ↗
            </a>
            <a
              href="https://www.civix.fr"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors py-1"
            >
              API CIVIX ↗
            </a>
          </nav>

          {/* Affiliation + Support */}
          <div className="md:ml-auto space-y-4 flex flex-col items-start md:items-end">
            <SupportWidget />
            <AffiliationWidget />
          </div>
        </div>

        {/* Bas de footer */}
        <div className="pt-6 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <span>© {new Date().getFullYear()} Mandat</span>
            <span>·</span>
            <span>
              Sources :{" "}
              <a
                href="https://clair-production.up.railway.app"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary underline"
              >
                CLAIR
              </a>
              {" · "}
              <a
                href="https://www.civix.fr"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary underline"
              >
                CIVIX
              </a>
              {" · "}
              <a
                href="https://data.assemblee-nationale.fr"
                target="_blank"
                rel="noreferrer"
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
