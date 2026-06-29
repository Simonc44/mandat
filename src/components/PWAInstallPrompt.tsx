import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Empêche l'affichage automatique de la bannière par le navigateur
      e.preventDefault();
      // Stocke l'événement pour l'utiliser plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Affiche notre propre bannière si l'utilisateur n'a pas déjà décliné dans cette session
      if (!sessionStorage.getItem("pwa_prompt_dismissed")) {
        setVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Affiche la boîte de dialogue d'installation du navigateur
    await deferredPrompt.prompt();

    // Attend la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("L'utilisateur a accepté l'installation de la PWA");
    } else {
      console.log("L'utilisateur a refusé l'installation de la PWA");
    }

    // Réinitialise l'événement
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-8 md:bottom-8 md:max-w-sm animate-fade-up">
      <div className="glass-strong rounded-3xl p-5 shadow-2xl border border-primary/20 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Ajouter l'application
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Installez Mandat sur votre écran d'accueil pour un accès rapide
                et hors-ligne.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="btn-primary flex-1 py-2.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium glass border border-border/60 text-foreground/80 hover:text-foreground transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
