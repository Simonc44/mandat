import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: createSeoMeta({
      title: "Politique de confidentialité — Mandat",
      description:
        "Apprenez-en plus sur la manière dont Mandat protège votre vie privée et vos données personnelles.",
      canonical: `${SITE_URL}/confidentialite`,
    }),
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="container-app py-12 md:py-20 max-w-3xl">
      <nav className="mb-8 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </nav>

      <header className="mb-12 animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Votre vie privée est au cœur de notre démarche citoyenne. Mandat est
          conçu pour être aussi transparent que les données qu'il présente.
        </p>
      </header>

      <div
        className="space-y-12 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Collecte de données</h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>
              Mandat est un projet indépendant et bénévole. Nous collectons le
              strict minimum d'informations nécessaires au bon fonctionnement du
              site :
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>
                <strong>Préférences de navigation :</strong> Nous utilisons le
                stockage local (localStorage) de votre navigateur pour mémoriser
                vos choix, comme l'acceptation de la bannière de cookies ou le
                mode d'affichage.
              </li>
              <li>
                <strong>Statistiques de visite :</strong> Nous pouvons utiliser
                des outils de mesure d'audience anonymisés (comme un compteur de
                visites interne) qui ne permettent pas de vous identifier
                personnellement.
              </li>
              <li>
                <strong>Données techniques :</strong> Comme tout service web,
                notre hébergeur peut enregistrer des journaux techniques
                (adresse IP, type de navigateur) pour assurer la sécurité et la
                stabilité du service.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Cookies et traceurs</h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>Nous sommes fermement opposés au pistage publicitaire.</p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li>
                <strong>Pas de cookies tiers :</strong> Nous n'utilisons aucun
                cookie de régie publicitaire ou de réseaux sociaux.
              </li>
              <li>
                <strong>Transparence :</strong> Seuls des cookies techniques
                essentiels ou des mesures d'audience anonymes peuvent être
                déposés.
              </li>
              <li>
                <strong>Contrôle :</strong> Vous pouvez à tout moment refuser
                les cookies via la bannière de consentement ou les paramètres de
                votre navigateur.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Données publiques</h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            <p>
              Les informations concernant les députés et les scrutins affichées
              sur ce site sont des <strong>données publiques</strong> fournies
              par l'Assemblée nationale en Open Data, ainsi que par les APIs
              citoyennes CLAIR et CIVIX.
            </p>
            <p className="mt-4">
              Mandat ne fait que faciliter la consultation de ces données déjà
              accessibles au public dans un but d'intérêt général et de
              transparence démocratique.
            </p>
          </div>
        </section>

        <footer className="pt-8 border-t border-border/40 text-sm text-muted-foreground">
          <p>
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-2">Pour toute question : simon.chusseau@gmail.com</p>
        </footer>
      </div>
    </div>
  );
}
