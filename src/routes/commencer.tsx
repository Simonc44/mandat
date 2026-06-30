// routes/commencer.tsx

import { createFileRoute } from "@tanstack/react-router";
import { createSeoMeta, SITE_URL } from "./__root";
import { CheckCircle2, Rocket, Terminal, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/commencer")({
  head: () => ({
    meta: createSeoMeta({
      title: "Commencer — Mandat",
      description:
        "Suivez ces étapes pour commencer à collecter des indicateurs de performance.",
      canonical: `${SITE_URL}/commencer`,
    }),
  }),
  component: CommencerPage,
});

function CommencerPage() {
  return (
    <div className="container-app py-12 max-w-4xl">
      <div className="mb-12 animate-fade-up">
        <h1 className="font-display text-4xl md:text-6xl mb-4">Commencer</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Pour commencer à collecter des indicateurs de performance, suivez ces
          étapes.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Étape 1 */}
        <section
          className="glass-strong rounded-[2rem] p-8 md:p-10 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              1
            </div>
            <h2 className="font-display text-2xl md:text-3xl">
              Installez notre package
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Commencez par installer{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">
              @vercel/speed-insights
            </code>{" "}
            dans votre projet existant.
          </p>
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 font-mono text-sm relative group overflow-x-auto">
            <div className="flex gap-4 mb-4 border-b border-border/50 pb-2">
              <span className="text-primary font-medium border-b-2 border-primary pb-2 px-1">
                pnpm
              </span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors pb-2 px-1">
                npm
              </span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors pb-2 px-1">
                yarn
              </span>
            </div>
            <code className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              pnpm add @vercel/speed-insights
            </code>
          </div>
        </section>

        {/* Étape 2 */}
        <section
          className="glass-strong rounded-[2rem] p-8 md:p-10 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              2
            </div>
            <h2 className="font-display text-2xl md:text-3xl">
              Ajoutez le composant SpeedInsights
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Importez et utilisez le composant{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">
              &lt;SpeedInsights/&gt;
            </code>{" "}
            dans la mise en page de votre application ou dans votre fichier
            principal.
          </p>
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
            <pre className="text-foreground">
              <code>{`import { SpeedInsights } from "@vercel/speed-insights/react"\n\n// Dans votre composant Root ou Layout\nfunction Root() {\n  return (\n    <>\n      <SpeedInsights />\n      <Outlet />\n    </>\n  )\n}`}</code>
            </pre>
          </div>
          <p className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            Pour des exemples complets et des informations complémentaires,
            veuillez consulter notre
            <a
              href="https://vercel.com/docs/speed-insights"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              documentation <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </section>

        {/* Étape 3 */}
        <section
          className="glass-strong rounded-[2rem] p-8 md:p-10 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              3
            </div>
            <h2 className="font-display text-2xl md:text-3xl">
              Déployez et visitez votre site
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Déployez vos modifications et consultez le déploiement pour
            recueillir vos premiers points de données.
          </p>
          <div className="glass border-border/40 rounded-2xl p-6 flex items-start gap-4">
            <Rocket className="w-6 h-6 text-primary shrink-0 mt-1" />
            <p className="text-sm leading-relaxed">
              Si vous ne voyez aucune donnée après 30 secondes, veuillez
              vérifier la présence de bloqueurs de contenu et essayer de
              naviguer entre les pages de votre site.
            </p>
          </div>
        </section>
      </div>

      <div
        className="mt-16 text-center animate-fade-up"
        style={{ animationDelay: "400ms" }}
      >
        <div className="inline-flex items-center gap-2 text-green-600 bg-green-500/10 px-4 py-2 rounded-full text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Indicateurs de performance activés
        </div>
      </div>
    </div>
  );
}
