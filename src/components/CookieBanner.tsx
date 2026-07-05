// components/CookieBanner.tsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";

// Clé de persistance — alignée avec le Consent Mode dans __root.tsx
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

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === "granted" || saved === "denied") {
        setVisible(false);
      } else {
        const t = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(t);
      }
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    try { localStorage.setItem(CONSENT_KEY, "granted"); } catch (e) {}
    setVisible(false);
    updateGAConsent(true);
  }, []);

  const handleRefuse = useCallback(() => {
    try { localStorage.setItem(CONSENT_KEY, "denied"); } catch (e) {}
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
          Conformément au RGPD ·{" "}
          <Link to="/confidentialite" className="underline hover:text-primary">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
