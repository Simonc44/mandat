import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("mandat_cookie_consent");
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem("mandat_cookie_consent", "accepted");
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
