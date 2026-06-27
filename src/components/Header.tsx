import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40">
      <div className="container-app flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-display text-lg font-semibold">M</span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight">Mandat</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Transparence citoyenne</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {[
            { to: "/deputes", label: "Députés" },
            { to: "/scrutins", label: "Scrutins" },
            { to: "/recherche", label: "Recherche" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors"
              activeProps={{ className: "px-3 py-2 rounded-md text-primary bg-secondary font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-muted">
      <div className="container-app py-10 text-sm text-muted-foreground space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded bg-primary text-primary-foreground font-display text-xs">M</span>
          <strong className="text-foreground">Mandat</strong>
          <span>— Qui a voté quoi, et pourquoi.</span>
        </div>
        <p>
          Données issues de l'open data de l'Assemblée nationale via{" "}
          <a className="underline hover:text-primary" href="https://www.nosdeputes.fr" target="_blank" rel="noreferrer">
            nosdeputes.fr
          </a>
          {" "}(Regards Citoyens). XVIe législature.
        </p>
        <p>Projet citoyen indépendant. Aucune affiliation politique.</p>
      </div>
    </footer>
  );
}
