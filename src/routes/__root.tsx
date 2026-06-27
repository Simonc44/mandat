import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header, Footer } from "../components/Header";

function NotFoundComponent() {
  return (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-6xl mb-3">404</h1>
      <p className="text-muted-foreground mb-6">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        Retour à l'accueil
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="container-app py-24 text-center">
      <h1 className="font-display text-3xl mb-3">Cette page n'a pas chargé</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Les données de l'Assemblée nationale n'ont pas pu être récupérées.
      </p>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Réessayer
        </button>
        <a href="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-accent">
          Accueil
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mandat — Qui a voté quoi, et pourquoi" },
      {
        name: "description",
        content:
          "Mandat rend lisibles les votes des député·es français. Cherchez un texte, un élu, un groupe. Transparence citoyenne, sans étiquette politique.",
      },
      { name: "author", content: "Mandat" },
      { property: "og:title", content: "Mandat — Qui a voté quoi, et pourquoi" },
      {
        property: "og:description",
        content:
          "Le moteur de recherche citoyen des votes à l'Assemblée nationale.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
