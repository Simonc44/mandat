// components/PwaInstallBanner.tsx
// Notification d'installation PWA — Liquid Glass, non intrusive
// Apparaît 30s après la première visite, 1 fois par session
import { useState, useEffect } from "react";

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Déjà installé ou déjà rejeté cette session
    if (
      localStorage.getItem("mandat_pwa_dismissed") === "true" ||
      window.matchMedia("(display-mode: standalone)").matches
    ) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      // Délai 30s avant d'afficher
      setTimeout(() => setVisible(true), 30_000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prompt as any).prompt?.();
    setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("mandat_pwa_dismissed", "true");
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed || !prompt) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-50 max-w-xs animate-slide-down"
      role="dialog"
      aria-label="Installer l'application Mandat"
      aria-modal="false"
    >
      <div className="glass-strong rounded-3xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <img src="/favicon.svg" alt="Logo Mandat" className="w-10 h-10 rounded-xl shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Installer Mandat</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Accédez aux votes de l'Assemblée en un tap, même sans connexion.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="btn-primary flex-1 py-2 rounded-xl text-xs font-semibold"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 rounded-xl text-xs text-muted-foreground glass border border-border/40 hover:text-foreground transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
