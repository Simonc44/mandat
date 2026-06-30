// components/LoadingOverlay.tsx
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function LoadingOverlay() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isLoading) {
      // Delay showing the overlay slightly to avoid flickering on fast transitions
      timeout = setTimeout(() => setShow(true), 150);
    } else {
      setShow(false);
    }

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col items-center gap-4 p-8 rounded-3xl glass-strong animate-scale-in">
        <div className="relative">
          <img
            src="/favicon.svg"
            alt="Chargement..."
            className="w-16 h-16 object-contain animate-logo-pulse"
          />
          <div
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col items-center">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Mandat
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground animate-pulse">
            Chargement en cours
          </span>
        </div>
      </div>
    </div>
  );
}
