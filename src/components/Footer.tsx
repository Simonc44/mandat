// components/Footer.tsx
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Github } from "lucide-react";
import { LastUpdated } from "./LastUpdated";

const GITHUB_REPO_URL = "https://github.com/Simonc44/mandat";

function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visits", { method: "POST" })
      .then((r) => r.json())
      .then((d: { count: number }) => {
        if (typeof d.count === "number" && d.count > 0) setCount(d.count);
      })
      .catch(() => {});
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

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/50">
      <div className="container-app py-12 space-y-8">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          <div className="space-y-4 max-w-sm">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <img src="/favicon.svg" alt="Logo Mandat — Accueil" className="w-8 h-8 object-contain" width={32} height={32} />
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
            <Link to="/deputes"       className="text-muted-foreground hover:text-primary transition-colors py-1">Les député·es</Link>
            <Link to="/groupes"       className="text-muted-foreground hover:text-primary transition-colors py-1">Les groupes</Link>
            <Link to="/scrutins"      className="text-muted-foreground hover:text-primary transition-colors py-1">Les scrutins</Link>
            <Link to="/blog"          className="text-muted-foreground hover:text-primary transition-colors py-1">Blog</Link>
            <Link to="/recherche"     className="text-muted-foreground hover:text-primary transition-colors py-1">Recherche</Link>
            <Link to="/developers"    className="text-muted-foreground hover:text-primary transition-colors py-1">API développeurs</Link>
            <Link to="/confidentialite" className="text-muted-foreground hover:text-primary transition-colors py-1">Confidentialité</Link>
            <Link to="/statut"        className="text-muted-foreground hover:text-primary transition-colors py-1">Statut du service</Link>
            <Link to="/desabonnement"  className="text-muted-foreground hover:text-primary transition-colors py-1">Désabonnement</Link>
            <a href="https://data.assemblee-nationale.fr" target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-primary transition-colors py-1">Données AN ↗</a>
            <a href="https://clair-production.up.railway.app/docs" target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-primary transition-colors py-1">API CLAIR ↗</a>
            <a href="https://www.civix.fr" target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-primary transition-colors py-1">API CIVIX ↗</a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-primary transition-colors py-1 inline-flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" aria-hidden="true" /> GitHub ↗
            </a>
          </nav>
        </div>

        <div className="pt-6 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4 items-center">
            <span>© 2026 Mandat · Créé par Simon Chusseau</span>
            <span>·</span>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Github className="w-3.5 h-3.5" aria-hidden="true" /> Simonc44/mandat
            </a>
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
