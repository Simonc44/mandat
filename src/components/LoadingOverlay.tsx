import { useRouterState } from "@tanstack/react-router";

export function LoadingOverlay() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm animate-fade-in"
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/favicon.svg"
          alt="Mandat Logo"
          className="w-20 h-20 animate-logo-pulse"
        />
        <div className="font-display text-xl font-medium text-ink tracking-tight">
          Chargement...
        </div>
      </div>
    </div>
  );
}
