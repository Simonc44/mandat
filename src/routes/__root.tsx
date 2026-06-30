// routes/__root.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Landmark, AlertTriangle, Home, RotateCcw } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header, Footer, CookieBanner } from "../components/Header";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";
import { LoadingOverlay } from "../components/LoadingOverlay";

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

export const SITE_URL = "https://mandat-fr.vercel.app";
export const SITE_NAME = "Mandat";
export const SITE_DESCRIPTION =
  "Le moteur de recherche citoyen des votes à l'Assemblée nationale (17e législature). Qui a voté quoi ? Pourquoi ? Transparence sans étiquette politique.";
export const KEYWORDS = [
  "votes",
  "Assemblée nationale",
  "scrutin",
  "députés",
  "député",
  "élus",
  "transparence politique",
  "politique française",
  "open data",
  "17e législature",
  "CLAIR",
  "CIVIX",
  "élu",
  "mandat",
  "lois",
  "amendements",
  "qui a voté quoi",
  "démocratie citoyenne",
  "engagement civique",
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface SeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

// ─── SEO ─────────────────────────────────────────────────────────────────────

export function createSeoMeta(config: SeoConfig) {
  const canonical = config.canonical ?? SITE_URL;
  const ogImage = config.ogImage ?? `${SITE_URL}/og-image.png`;
  const keywords = config.keywords ?? KEYWORDS;

  return [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: config.title },
    { name: "description", content: config.description },
    { name: "author", content: config.author ?? SITE_NAME },
    {
      name: "robots",
      content:
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    { name: "theme-color", content: "#5B4FCF" },
    { name: "keywords", content: keywords.join(", ") },
    { name: "application-name", content: SITE_NAME },
    { name: "apple-mobile-web-app-title", content: SITE_NAME },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },

    // Open Graph
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: config.ogType ?? "website" },
    { property: "og:url", content: canonical },
    { property: "og:title", content: config.title },
    { property: "og:description", content: config.description },
    { property: "og:locale", content: "fr_FR" },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:type", content: "image/png" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@MandatFr" },
    { name: "twitter:title", content: config.title },
    { name: "twitter:description", content: config.description },
    { name: "twitter:image", content: ogImage },

    ...(config.publishedTime
      ? [{ property: "article:published_time", content: config.publishedTime }]
      : []),
    ...(config.modifiedTime
      ? [{ property: "article:modified_time", content: config.modifiedTime }]
      : []),
  ];
}

export function createBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPersonSchema(deputy: any) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: deputy.name,
    givenName: deputy.firstName,
    familyName: deputy.lastName,
    image: deputy.imageUrl,
    jobTitle: "Député",
    affiliation: { "@type": "PoliticalParty", name: deputy.party },
    address: { "@type": "PostalAddress", addressLocality: deputy.region },
    url: `${SITE_URL}/depute/${deputy.slug}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createVoteEventSchema(vote: any) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: vote.title,
    description: vote.summary,
    startDate: vote.date,
    url: `${SITE_URL}/scrutin/${vote.id}`,
    location: {
      "@type": "Place",
      name: "Assemblée nationale française",
      address: { "@type": "PostalAddress", addressCountry: "FR" },
    },
  });
}

// ─── 404 / ERROR ─────────────────────────────────────────────────────────────

function NotFoundComponent() {
  return (
    <div className="container-app py-24 text-center animate-fade-up">
      <Landmark
        className="w-14 h-14 mx-auto mb-4 text-primary/60"
        strokeWidth={1.4}
        aria-hidden="true"
      />
      <h1 className="font-display text-6xl mb-3 tracking-tight">404</h1>
      <p className="text-muted-foreground mb-8">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium"
      >
        <Home className="w-4 h-4" aria-hidden="true" /> Retour à l'accueil
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="container-app py-24 text-center animate-fade-up">
      <AlertTriangle
        className="w-12 h-12 mx-auto mb-4 text-destructive/70"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h1 className="font-display text-3xl mb-3 tracking-tight">
        Cette page n'a pas chargé
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Les données n'ont pas pu être récupérées. Vérifiez votre connexion.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" /> Réessayer
        </button>
        <a
          href="/"
          className="glass px-5 py-2.5 rounded-2xl text-sm border border-border hover:border-primary/40 transition-colors"
        >
          Accueil
        </a>
      </div>
    </div>
  );
}

// ─── ROOT ROUTE ───────────────────────────────────────────────────────────────

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: createSeoMeta({
        title: `${SITE_NAME} — Qui a voté quoi, et pourquoi`,
        description: SITE_DESCRIPTION,
      }),
      links: [
        { rel: "canonical", href: SITE_URL },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/favicon.svg" },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,700&family=Inter:wght@300;400;500;600;700&display=swap",
        },
        { rel: "alternate", hrefLang: "fr-FR", href: SITE_URL },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

// ─── SHELL & COMPONENT ───────────────────────────────────────────────────────

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />

        {/* Service Worker PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(e) {
                    console.warn('[SW] Registration failed:', e);
                  });
                });
              }
            `,
          }}
        />

        {/* JSON-LD WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              description: SITE_DESCRIPTION,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/recherche?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              inLanguage: "fr-FR",
            }),
          }}
        />

        {/* JSON-LD Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/favicon.svg`,
              description: SITE_DESCRIPTION,
              foundingDate: "2025",
              foundingLocation: "France",
              areaServed: "FR",
            }),
          }}
        />
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
  useLocation(); // déclenche re-render sur navigation

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <LoadingOverlay />
        <Header />
        <main className="flex-1 pt-20">
          <Outlet />
        </main>
        <Footer />
        {/* Cookie Banner RGPD */}
        <CookieBanner />
        {/* Notification installation PWA */}
        <PWAInstallPrompt />
      </div>
    </QueryClientProvider>
  );
}
