// components/CookieBanner.tsx — bandeau RGPD professionnel
import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, X } from "lucide-react";

const CONSENT_KEY = "mandat_analytics_consent";

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
  } catch {
    /* silent */
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
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = useCallback((value: "granted" | "denied") => {
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* silent */ }
    setVisible(false);
    updateGAConsent(value === "granted");
  }, []);

  if (!visible) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="glass-strong rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
        {/* Filet violet en haut, signature visuelle */}
        <div
          className="h-[3px] w-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.62 0.20 285), oklch(0.68 0.16 305), oklch(0.60 0.20 265))",
          }}
          aria-hidden="true"
        />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 grid place-items-center w-10 h-10 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.20 285 / 14%), oklch(0.68 0.16 305 / 18%))",
                color: "oklch(0.50 0.20 285)",
              }}
              aria-hidden="true"
            >
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="cookie-banner-title"
                  className="font-display text-base sm:text-lg tracking-tight text-ink"
                >
                  Votre vie privée, notre priorité
                </h2>
                <button
                  onClick={() => persist("denied")}
                  className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  aria-label="Fermer et refuser les cookies analytiques"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p
                id="cookie-banner-desc"
                className="text-xs sm:text-[13px] text-muted-foreground mt-1.5 leading-relaxed"
              >
                Mandat utilise une mesure d'audience anonymisée pour améliorer le site.
                Aucune publicité, aucun profilage, aucun partage à des tiers.
              </p>
            </div>
          </div>

          {/* Détail des cookies */}
          <ul className="mt-4 space-y-1.5 text-[12px] text-muted-foreground">
            <li className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.60 0.16 155)" }}
                aria-hidden="true"
              />
              <span>Cookies essentiels · toujours actifs</span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.62 0.20 285)" }}
                aria-hidden="true"
              />
              <span>Mesure d'audience anonymisée · avec votre accord</span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "oklch(0.75 0.02 285)" }}
                aria-hidden="true"
              />
              <span>Aucun cookie publicitaire, aucun tracker tiers</span>
            </li>
          </ul>

          {/* Actions */}
          <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => persist("denied")}
              className="flex-1 h-10 rounded-xl text-sm font-medium border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-foreground"
            >
              Refuser
            </button>
            <button
              onClick={() => persist("granted")}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.50 0.22 265))",
              }}
            >
              Accepter
            </button>
          </div>

          <p className="mt-3 text-[10.5px] text-muted-foreground text-center">
            Conforme RGPD ·{" "}
            <Link to="/confidentialite" className="underline underline-offset-2 hover:text-primary">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
