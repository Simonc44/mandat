// routes/a-propos.tsx — Page À propos de Mandat

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Github,
  Unlock,
  Scale,
  ShieldCheck,
  Database,
  RefreshCw,
  Heart,
} from "lucide-react";
import { createSeoMeta, createSeoLinks, SITE_URL, SITE_NAME } from "./__root";
import { GITHUB_REPO_URL } from "../components/Header";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: createSeoMeta({
      title: "À propos — Mandat, le projet citoyen sur les votes des députés",
      description:
        "Qui est derrière Mandat ? Simon Chusseau, développeur indépendant. Découvrez les motivations, les sources de données et la philosophie du projet.",
      canonical: `${SITE_URL}/a-propos`,
    }),
    links: createSeoLinks(`${SITE_URL}/a-propos`),
  }),
  component: APropos,
});

function APropos() {
  return (
    <div className="container-app py-16 max-w-3xl mx-auto animate-fade-up">
      {/* ── EN-TÊTE ── */}
      <div className="mb-14">
        <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-4 font-medium">
          Le projet
        </div>
        <h1 className="font-display text-4xl sm:text-6xl leading-[0.95] tracking-tight mb-6">
          Derrière Mandat,
          <br />
          <span className="text-gradient italic">un citoyen comme vous.</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Mandat est un projet indépendant, sans affiliation politique, sans
          publicité et sans financeur institutionnel. Il est développé et
          maintenu par une seule personne, par conviction que la transparence
          démocratique ne devrait pas être réservée aux experts.
        </p>
      </div>

      {/* ── FONDATEUR ── */}
      <section className="mb-14">
        <div className="card-glass rounded-[2rem] p-8 flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar initiales */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-semibold shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.50 0.20 285 / 18%), oklch(0.42 0.22 260 / 28%))",
              color: "oklch(0.50 0.20 285)",
            }}
            aria-hidden="true"
          >
            SC
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-tight mb-1">
              Simon Chusseau
            </h2>
            <p className="text-sm text-primary/80 font-medium mb-4">
              Fondateur &amp; développeur
            </p>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Développeur indépendant, je me suis retrouvé incapable de répondre
              à une question simple : «&nbsp;Comment mon député a-t-il voté sur
              la réforme des retraites&nbsp;?&nbsp;» Les données existaient sur
              le site de l'Assemblée nationale, mais elles étaient
              inexploitables pour un citoyen ordinaire. J'ai créé Mandat pour
              changer ça.
            </p>
            <p className="text-muted-foreground leading-relaxed text-sm mt-3">
              Ce projet est mon pari que la démocratie fonctionne mieux quand
              les citoyens peuvent vérifier, eux-mêmes, ce que leurs élus ont
              réellement voté — sans passer par le filtre d'un éditorialiste ou
              d'un algorithme.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-sm glass border border-border/60 px-4 py-2 rounded-xl hover:border-primary/40 transition-colors"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
                Code source
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHIE ── */}
      <section className="mb-14">
        <h2 className="font-display text-3xl tracking-tight mb-6">
          La philosophie du projet
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              Icon: Scale,
              title: "Zéro étiquette",
              desc: "Aucun score idéologique. Aucune mise en scène partisane. Les données brutes, telles que votées dans l'hémicycle, rien de plus.",
            },
            {
              Icon: Unlock,
              title: "Radical transparency",
              desc: "Le code source est public sur GitHub. Les sources de données sont citées explicitement. Vous pouvez vérifier chaque chiffre.",
            },
            {
              Icon: Heart,
              title: "Projet citoyen",
              desc: "Pas d'investisseur, pas de publicité. Mandat existe parce que la transparence démocratique mérite mieux qu'un PDF illisible.",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="card-glass rounded-2xl p-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.50 0.20 285 / 12%), oklch(0.42 0.22 260 / 20%))",
                  color: "oklch(0.50 0.20 285)",
                }}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-base mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOURCES ── */}
      <section className="mb-14">
        <h2 className="font-display text-3xl tracking-tight mb-2">
          Les données
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Toutes les données affichées sur Mandat proviennent de sources
          officielles ou académiques, distribuées en open data. Aucune donnée
          n'est inventée ou interpolée.
        </p>
        <div className="space-y-3">
          {[
            {
              Icon: Database,
              name: "Assemblée nationale — Open Data",
              desc: "Scrutins, votes nominatifs, composition des groupes, biographies des députés.",
              href: "https://data.assemblee-nationale.fr",
            },
            {
              Icon: RefreshCw,
              name: "API CLAIR",
              desc: "Enrichissement et structuration des données parlementaires en temps réel.",
              href: "https://clair-production.up.railway.app/docs",
            },
            {
              Icon: RefreshCw,
              name: "API CIVIX",
              desc: "Données complémentaires sur les votes et l'activité des élus.",
              href: "https://www.civix.fr",
            },
          ].map(({ Icon, name, desc, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-start gap-4 p-4 glass border border-border/40 rounded-2xl hover:border-primary/40 transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: "oklch(0.50 0.20 285 / 10%)",
                  color: "oklch(0.50 0.20 285)",
                }}
                aria-hidden="true"
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {name} ↗
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {desc}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── MISE À JOUR ── */}
      <section className="mb-14 p-6 glass border border-border/40 rounded-2xl">
        <h2 className="font-display text-xl tracking-tight mb-3">
          Fréquence de mise à jour
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Les scrutins et votes sont synchronisés{" "}
          <strong className="text-foreground">quotidiennement</strong> à partir
          des publications officielles de l'Assemblée nationale. La composition
          des groupes politiques est mise à jour dès qu'un changement est
          annoncé. Si vous constatez une anomalie ou une donnée manquante,
          n'hésitez pas à ouvrir une issue sur le dépôt GitHub.
        </p>
        <a
          href={`${GITHUB_REPO_URL}/issues`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Github className="w-4 h-4" aria-hidden="true" />
          Signaler une erreur sur GitHub →
        </a>
      </section>

      {/* ── CONTACT & LIENS ── */}
      <section className="border-t border-border/40 pt-10 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Des questions ? Une suggestion ?
          </p>
          <a
            href={`${GITHUB_REPO_URL}/issues`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Ouvrir une discussion sur GitHub →
          </a>
        </div>
        <div className="flex gap-3">
          <Link
            to="/confidentialite"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Confidentialité
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
