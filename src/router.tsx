import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createIsomorphicFn, getGlobalStartContext } from "@tanstack/react-start";

export const getCspNonce = createIsomorphicFn()
  .server(() => {
    try {
      const ctx = getGlobalStartContext();
      return (ctx?.cspNonce as string) || "";
    } catch (e) {
      return "";
    }
  })
  .client(() => {
    if (typeof document !== "undefined") {
      const el = document.querySelector(
        "meta[property=csp-nonce]",
      ) as HTMLMetaElement | null;
      return el?.content || "";
    }
    return "";
  });

export const getRouter = () => {
  // Query client partagé (nouveau à chaque requête SSR, réutilisé côté client).
  // staleTime > 0 : les données déjà chargées ne re-fetch pas immédiatement,
  //                 ce qui rend la navigation retour quasi instantanée (<50ms).
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 min : navigations retour instantanées
        gcTime: 1000 * 60 * 30, // 30 min en mémoire
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });

  const nonce = getCspNonce();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload au survol : le loader s'exécute avant le clic ⇒ navigation ~instant.
    defaultPreload: "intent",
    // Query gère la fraîcheur — 0 côté router pour ne pas doubler.
    defaultPreloadStaleTime: 0,
    // Cache le HTML rendu pendant 30s en mémoire pour retour arrière rapide.
    defaultStaleTime: 1000 * 30,
    ssr: {
      nonce,
    },
  });

  return router;
};
