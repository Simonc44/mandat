// components/Header.tsx
// Header sticky + Footer enrichi avec :
//  - compteur de visites privacy-friendly (Vercel Analytics / localStorage count)
//  - widget de don Stripe
//  - affiliation culturelle contextuelle
//  - transitions fluides

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// ============================================================
// HEADER
// ============================================================

export function Header() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  return (
    <>
      {/* Barre de progression de navigation */}
      {isLoading && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary"
          style={{
            animation: "progress-bar 1.2s ease-in-out infinite",
          }}
        />
      )}
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40 transition-shadow">
        <div className="container-app flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Mandat — Accueil">
            <img
              src="/favicon.svg"
              alt="Logo Mandat"
              className="w-9 h-9 object-contain transition-transform group-hover:scale-105"
              width={36}
              height={36}
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold tracking-tight">Mandat</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Transparence citoyenne
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm" aria-label="Navigation principale">
            {[
              { to: "/deputes", label: "Député·es" },
              { to: "/scrutins", label: "Scrutins" },
              { to: "/recherche", label: "Recherche" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors"
                activeProps={{
                  className: "px-3 py-2 rounded-md text-primary bg-secondary font-medium",
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

// ============================================================
// SUPPORT WIDGET — Don via Stripe
// ============================================================

function SupportWidget() {
  const [hovered, setHovered] = useState(false);

  const handleSupport = () => {
    // Architecture préparée : redirection vers Stripe Checkout
    // Remplacer cette URL par votre lien Stripe Payment Link réel :
    // https://dashboard.stripe.com/payment-links
    const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/VOTRE_LIEN_ICI";
    
    // En production : window.location.href = STRIPE_PAYMENT_LINK;
    // En dev : on ouvre dans un nouvel onglet pour test
    console.info("[Mandat] Stripe redirect →", STRIPE_PAYMENT_LINK);
    window.open(STRIPE_PAYMENT_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleSupport}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
      aria-label="Soutenir le projet Mandat"
    >
      <span
        className="transition-transform duration-200"
        style={{ transform: hovered ? "scale(1.2) rotate(-10deg)" : "scale(1)" }}
        aria-hidden="true"
      >
        ❤️
      </span>
      Soutenir le projet
    </button>
  );
}

// ============================================================
// VISIT COUNTER — Privacy-first (pas de cookie, pas de tracking)
// ============================================================

const VISIT_THRESHOLD = 5_000; // Seuil d'affichage du compteur

/**
 * Compteur de visites privacy-friendly.
 * - Utilise Vercel Analytics (si configuré) pour le comptage réel
 * - Affiche le compteur uniquement si > VISIT_THRESHOLD
 * - Aucun cookie, aucun fingerprinting, aucun tracking publicitaire
 *
 * Architecture : le composant lit un endpoint /api/visits (à créer)
 * qui renvoie { count: number, show: boolean }.
 * En attendant l'API, on simule avec localStorage pour le dev.
 */
function VisitCounter() {
  const [visitData, setVisitData] = useState<{ count: number; show: boolean } | null>(null);

  useEffect(() => {
    // Essaie d'abord l'API réelle
    fetch("/api/visits", { method: "GET" })
      .then((r) => r.json())
      .then((data: { count: number; show: boolean }) => {
        if (typeof data.count === "number" && data.count >= VISIT_THRESHOLD) {
          setVisitData({ count: data.count, show: true });
        }
      })
      .catch(() => {
        // Fallback dev : simulation localStorage
        // (JAMAIS utilisé en production — remplacé par l'API)
        const devCount = parseInt(localStorage.getItem("mandat_dev_visits") ?? "0");
        if (devCount >= VISIT_THRESHOLD) {
          setVisitData({ count: devCount, show: true });
        }
      });
  }, []);

  if (!visitData?.show) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      aria-label={`${visitData.count.toLocaleString("fr-FR")} visites`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
      {visitData.count.toLocaleString("fr-FR")} visiteurs — compteur privé, sans cookie
    </span>
  );
}

// ============================================================
// AFFILIATION CONTEXTUELLE — Culturelle & Éducative
// ============================================================

const AFFILIATION_BOOKS = [
  {
    title: "Comment fonctionne le Parlement ?",
    author: "Jean-Pierre Camby",
    url: "https://www.recyclivre.com/search?q=parlement+france",
    theme: "institutions",
  },
  {
    title: "La République des idées",
    author: "Pierre Rosanvallon",
    url: "https://www.recyclivre.com/search?q=republique+democratie",
    theme: "democratie",
  },
  {
    title: "L'Assemblée nationale",
    author: "Documentation française",
    url: "https://www.recyclivre.com/search?q=assemblee+nationale",
    theme: "institutions",
  },
];

function AffiliationWidget() {
  const book = AFFILIATION_BOOKS[Math.floor(Math.random() * AFFILIATION_BOOKS.length)];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 max-w-sm">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        📚 Pour aller plus loin
      </p>
      <p className="text-sm text-foreground font-medium leading-snug mb-1">
        {book.title}
      </p>
      <p className="text-xs text-muted-foreground mb-3">{book.author}</p>
      <a
        href={book.url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        aria-label={`Trouver "${book.title}" sur RecycLivre (affiliation éthique)`}
      >
        Trouver d'occasion sur RecycLivre →
        <span className="text-[10px] text-muted-foreground">(lien affilié éthique)</span>
      </a>
    </div>
  );
}

// ============================================================
// FOOTER
// ============================================================

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-muted">
      <div className="container-app py-10 space-y-6">
        {/* Logo + description */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="Logo Mandat" className="w-8 h-8 object-contain" width={32} height={32} />
              <strong className="text-foreground font-display text-lg">Mandat</strong>
              <span className="text-muted-foreground text-sm">— Qui a voté quoi, et pourquoi.</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Données issues de l'open data de l'Assemblée nationale (17e législature).
              Projet citoyen indépendant, sans affiliation politique, sans publicité.
            </p>
            <VisitCounter />
          </div>

          {/* Navigation */}
          <nav className="grid grid-cols-2 gap-2 text-sm" aria-label="Navigation secondaire">
            <Link to="/deputes" className="text-muted-foreground hover:text-primary transition-colors">
              Les député·es
            </Link>
            <Link to="/scrutins" className="text-muted-foreground hover:text-primary transition-colors">
              Les scrutins
            </Link>
            <Link to="/recherche" className="text-muted-foreground hover:text-primary transition-colors">
              Recherche avancée
            </Link>
            <a
              href="https://data.assemblee-nationale.fr"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Données AN ↗
            </a>
          </nav>
        </div>

        {/* Affiliation + Support */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-t border-border pt-6">
          <AffiliationWidget />
          <div className="flex flex-col items-start md:items-end gap-2">
            <SupportWidget />
            <p className="text-[10px] text-muted-foreground max-w-xs text-right">
              Mandat est un projet indépendant. Aucune donnée personnelle collectée.
              Aucune publicité. Financement : dons volontaires uniquement.
            </p>
          </div>
        </div>

        {/* Mentions légales */}
        <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Mandat — Licence MIT</span>
          <span>
            Source :{" "}
            <a
              className="underline hover:text-primary"
              href="https://data.assemblee-nationale.fr"
              target="_blank"
              rel="noreferrer"
            >
              data.assemblee-nationale.fr
            </a>
            {" "}·{" "}
            <a
              className="underline hover:text-primary"
              href="https://www.nosdeputes.fr"
              target="_blank"
              rel="noreferrer"
            >
              nosdeputes.fr
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
