// routes/problemes-france.tsx — Problèmes de la France
// ⚠️ DONNÉES : édite PROBLEMS_DATA ci-dessous pour mettre à jour
// chaque problème. Les sources sont cliquables (ajoute l'URL).

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

export const Route = createFileRoute("/problemes-france")({
  head: () => ({
    meta: createSeoMeta({
      title: "Les grands problèmes de la France — État des lieux | Mandat",
      description:
        "Déficit, chômage, logement, santé : un tableau de bord des problèmes structurels de la France avec les actions du Parlement pour y répondre.",
      canonical: `${SITE_URL}/problemes-france`,
    }),
    links: createSeoLinks(`${SITE_URL}/problemes-france`),
  }),
  component: ProblemesFrancePage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Severity = "critique" | "important" | "modere" | "surveiller";
type Trend = "hausse" | "baisse" | "stable";

interface Problem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  severity: Severity;
  trend: Trend;
  trendLabel: string;
  current: string; // Chiffre/état actuel
  currentLabel: string;
  description: string;
  done: string[]; // Actions réalisées
  ongoing: string[]; // Actions en cours
  toWatch: string[]; // À surveiller
  sources: Array<{ label: string; url?: string }>;
}

type Category = {
  id: string;
  label: string;
  icon: string;
};

// ─── Catégories ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "all", label: "Tous", icon: "🇫🇷" },
  { id: "economie", label: "Économie", icon: "📈" },
  { id: "sante", label: "Santé", icon: "🏥" },
  { id: "education", label: "Éducation", icon: "🎓" },
  { id: "securite", label: "Sécurité", icon: "🛡️" },
  { id: "logement", label: "Logement", icon: "🏠" },
  { id: "environnement", label: "Environnement", icon: "🌿" },
  { id: "transport", label: "Transport", icon: "🚆" },
];

// ─── Données — ÉDITE ICI ─────────────────────────────────────────────────────

const PROBLEMS_DATA: Problem[] = [
  {
    id: "deficit-public",
    title: "Déficit public",
    subtitle: "Les dépenses de l'État dépassent ses recettes",
    category: "economie",
    severity: "critique",
    trend: "hausse",
    trendLabel: "depuis 10 ans",
    current: "-5,5 %",
    currentLabel: "du PIB en 2024",
    description:
      "La France dépense chaque année davantage qu'elle ne perçoit en recettes fiscales. Le déficit structurel pèse sur la note de crédit du pays et réduit la marge de manœuvre budgétaire pour les services publics.",
    done: [
      "Plan de redressement budgétaire 2024 (coupes sur dépenses de fonctionnement)",
      "Hausse partielle de la fiscalité des grandes entreprises",
      "Commission Barnier sur la trajectoire pluriannuelle des finances publiques",
    ],
    ongoing: [
      "Projet de loi de finances 2025-2026 avec objectif de retour à -3 % du PIB",
      "Réforme de la gouvernance budgétaire (Haut conseil des finances publiques)",
      "Revue des niches fiscales",
    ],
    toWatch: [
      "🔮 Dégradation possible de la note souveraine par Moody's ou S&P",
      "🔮 Impact des taux d'intérêt élevés sur la charge de la dette",
      "🔮 Tensions avec la procédure de déficit excessif de l'UE",
    ],
    sources: [
      { label: "INSEE — Comptes nationaux", url: "https://www.insee.fr/fr/statistiques" },
      { label: "Haut Conseil des finances publiques", url: "https://www.hcfp.fr" },
      { label: "Cour des comptes", url: "https://www.ccomptes.fr" },
    ],
  },
  {
    id: "deserts-medicaux",
    title: "Déserts médicaux",
    subtitle: "Des millions de Français sans médecin traitant",
    category: "sante",
    severity: "critique",
    trend: "hausse",
    trendLabel: "accélération depuis 5 ans",
    current: "6 M+",
    currentLabel: "sans médecin traitant",
    description:
      "Plus de 6 millions de Français n'ont pas de médecin traitant. Le vieillissement du corps médical et la concentration géographique aggravent les inégalités d'accès aux soins primaires.",
    done: [
      "Création des Communautés Professionnelles Territoriales de Santé (CPTS)",
      "Développement de la télémédecine remboursée par l'Assurance maladie",
      "Aide à l'installation dans les zones sous-dotées",
    ],
    ongoing: [
      "Loi Valletoux (accès aux soins dans les territoires sous-dotés)",
      "Augmentation du numerus apertus en médecine (+30 % depuis 2020)",
      "Expérimentation des infirmières en pratique avancée (IPA)",
    ],
    toWatch: [
      "🔮 40 % des médecins généralistes en exercice ont plus de 55 ans",
      "🔮 Vagues de départ à la retraite attendues d'ici 2030",
      "🔮 Résistance au conventionnement territorial obligatoire",
    ],
    sources: [
      { label: "DREES — Statistiques de santé", url: "https://drees.solidarites-sante.gouv.fr" },
      { label: "Assurance maladie", url: "https://www.ameli.fr" },
      { label: "Observatoire de la démographie médicale", url: "https://www.conseil-national.medecin.fr" },
    ],
  },
  {
    id: "echec-scolaire",
    title: "Décrochage scolaire",
    subtitle: "Trop d'élèves quittent le système sans diplôme",
    category: "education",
    severity: "important",
    trend: "stable",
    trendLabel: "légère amélioration récente",
    current: "6,5 %",
    currentLabel: "taux de décrochage 2023",
    description:
      "Environ 75 000 jeunes quittent chaque année le système scolaire sans qualification. Les inégalités territoriales et sociales restent structurelles malgré les politiques de prévention.",
    done: [
      "Obligation de formation jusqu'à 18 ans (loi Avenir professionnel)",
      "Dédoublement des classes de CP et CE1 en REP+",
      "Renforcement des dispositifs de prévention du décrochage (PSAD)",
    ],
    ongoing: [
      "Plan lycée professionnel 2023-2027",
      "Développement de l'apprentissage comme voie de réinsertion",
      "Révision du baccalauréat professionnel",
    ],
    toWatch: [
      "🔮 Effets de la réforme du lycée professionnel sur les sorties sans diplôme",
      "🔮 Résultats PISA 2025 attendus",
      "🔮 Pénurie d'enseignants dans les zones REP",
    ],
    sources: [
      { label: "INSEE — Enquête emploi", url: "https://www.insee.fr" },
      { label: "Ministère de l'Éducation nationale", url: "https://www.education.gouv.fr" },
      { label: "DEPP — Données éducation", url: "https://www.education.gouv.fr/les-indicateurs-de-resultats-des-lycees" },
    ],
  },
  {
    id: "insecurite",
    title: "Insécurité et délinquance",
    subtitle: "Perception et réalité des violences en France",
    category: "securite",
    severity: "important",
    trend: "hausse",
    trendLabel: "sur les violences intrafamiliales",
    current: "+10 %",
    currentLabel: "coups et blessures volontaires (2023)",
    description:
      "Si les homicides restent stables, les violences physiques et intrafamiliales progressent. Le sentiment d'insécurité dépasse parfois la réalité statistique mais reste un enjeu démocratique majeur.",
    done: [
      "Doublement des caméras de vidéoprotection",
      "Recrutement de 10 000 policiers et gendarmes (plan 2021-2024)",
      "Loi contre les violences conjugales (2019)",
    ],
    ongoing: [
      "Loi sur les stupéfiants et le trafic",
      "Plan interministériel de lutte contre les violences faites aux femmes",
      "Déploiement de la police de sécurité du quotidien (PSQ)",
    ],
    toWatch: [
      "🔮 Évolution des trafics liés aux réseaux criminels organisés",
      "🔮 Recrutement et fidélisation dans les forces de l'ordre",
      "🔮 Impact des Jeux olympiques sur la sécurité dans les métropoles",
    ],
    sources: [
      { label: "ONDRP — Observatoire national", url: "https://www.inhesj.fr" },
      { label: "Ministère de l'Intérieur — Statistiques", url: "https://www.interieur.gouv.fr/Interstats" },
      { label: "INSEE — Enquête Cadre de vie et sécurité", url: "https://www.insee.fr" },
    ],
  },
  {
    id: "crise-logement",
    title: "Crise du logement",
    subtitle: "Manque de logements abordables dans les zones tendues",
    category: "logement",
    severity: "critique",
    trend: "hausse",
    trendLabel: "aggravée par la hausse des taux",
    current: "4 M",
    currentLabel: "de mal-logés (Fondation Abbé Pierre)",
    description:
      "La France compte 4 millions de personnes mal logées et 2 millions en attente d'un HLM. La hausse des taux d'intérêt depuis 2022 a effondré la construction neuve.",
    done: [
      "Plan Logement d'abord pour les sans-abri",
      "TVA réduite pour la construction en zones tendues",
      "Encadrement des loyers dans certaines métropoles",
    ],
    ongoing: [
      "Projet de loi logement 2024 (objectif 400 000 logements/an)",
      "Réforme du prêt à taux zéro (PTZ) étendu à tout le territoire",
      "Plan de rénovation énergétique MaPrimeRénov'",
    ],
    toWatch: [
      "🔮 Effondrement des permis de construire : -25 % en 2023",
      "🔮 Résistance des maires à la densification urbaine",
      "🔮 Tension entre propriétaires et dispositifs d'encadrement",
    ],
    sources: [
      { label: "Fondation Abbé Pierre", url: "https://www.fondation-abbe-pierre.fr" },
      { label: "Ministère du Logement", url: "https://www.cohesion-territoires.gouv.fr" },
      { label: "INSEE — Statistiques logement", url: "https://www.insee.fr/fr/statistiques?idtheme=14" },
    ],
  },
  {
    id: "transition-ecologique",
    title: "Retard climatique",
    subtitle: "Objectifs environnementaux partiellement atteints",
    category: "environnement",
    severity: "important",
    trend: "baisse",
    trendLabel: "émissions en léger recul",
    current: "-5 %",
    currentLabel: "d'émissions GES vs 2019",
    description:
      "La France réduit ses émissions mais trop lentement par rapport à ses engagements. La Stratégie nationale bas-carbone exige des efforts bien plus importants d'ici 2030.",
    done: [
      "Loi Climat et Résilience (2021)",
      "Fin progressive des chaudières à gaz neuves",
      "Développement des ENR : +40 % de capacité éolienne et solaire en 5 ans",
    ],
    ongoing: [
      "Planification écologique (CNP — Conseil national de planification)",
      "Déploiement du ZAN (Zéro artificialisation nette)",
      "Décarbonation de l'industrie (contrats de transition écologique)",
    ],
    toWatch: [
      "🔮 Risque de retard sur l'objectif -55 % d'émissions à horizon 2030 (vs 1990)",
      "🔮 Tensions sociales liées à la fiscalité écologique (après les Gilets jaunes)",
      "🔮 Vague de sécheresses et leurs impacts sur l'agriculture",
    ],
    sources: [
      { label: "CITEPA — Inventaire GES", url: "https://www.citepa.org" },
      { label: "Haut conseil pour le climat", url: "https://www.hautconseilclimat.fr" },
      { label: "Ministère de la Transition écologique", url: "https://www.ecologie.gouv.fr" },
    ],
  },
  {
    id: "transport-infrastructure",
    title: "Vieillissement des infrastructures",
    subtitle: "Retard d'entretien sur le réseau ferroviaire et routier",
    category: "transport",
    severity: "modere",
    trend: "stable",
    trendLabel: "investissements en légère hausse",
    current: "60 %",
    currentLabel: "du réseau ferré a plus de 30 ans",
    description:
      "SNCF Réseau estime à 100 milliards € le besoin d'investissement pour remettre à niveau le réseau ferroviaire national. Les retards et pannes restent une source majeure de mécontentement.",
    done: [
      "Plan de régénération du réseau (3 Mds€/an depuis 2019)",
      "Suppression progressive des petites lignes déficitaires",
      "LGV Bordeaux-Toulouse lancée",
    ],
    ongoing: [
      "Rapport du COI (Conseil d'orientation des infrastructures) 2023-2040",
      "RER métropolitains dans 10 grandes villes",
      "Investissements dans les transports en commun des villes moyennes",
    ],
    toWatch: [
      "🔮 Financement des LGV : l'État peut-il tenir ses engagements ?",
      "🔮 Saturation du réseau francilien (RER A, B)",
      "🔮 Impact du changement climatique sur les infrastructures routières",
    ],
    sources: [
      { label: "SNCF Réseau — Rapport annuel", url: "https://www.sncf-reseau.com" },
      { label: "Conseil d'orientation des infrastructures", url: "https://www.coi.gouv.fr" },
      { label: "Ministère des Transports", url: "https://www.ecologie.gouv.fr/politiques-publiques/transports" },
    ],
  },
];

// ─── Config badge sévérité ───────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; dot: string; text: string; bg: string }
> = {
  critique: {
    label: "🔴 Critique",
    dot: "#ef4444",
    text: "#ef4444",
    bg: "color-mix(in oklch, #ef4444 12%, transparent)",
  },
  important: {
    label: "🟠 Important",
    dot: "#f97316",
    text: "#f97316",
    bg: "color-mix(in oklch, #f97316 12%, transparent)",
  },
  modere: {
    label: "🟡 Modéré",
    dot: "#eab308",
    text: "#ca8a04",
    bg: "color-mix(in oklch, #eab308 12%, transparent)",
  },
  surveiller: {
    label: "🔵 À surveiller",
    dot: "#3b82f6",
    text: "#3b82f6",
    bg: "color-mix(in oklch, #3b82f6 12%, transparent)",
  },
};

const TREND_CONFIG: Record<Trend, { icon: string; label: string; color: string }> = {
  hausse: { icon: "📈", label: "En hausse", color: "#ef4444" },
  baisse: { icon: "📉", label: "En baisse", color: "#22c55e" },
  stable: { icon: "➡️", label: "Stable", color: "#94a3b8" },
};

// ─── Page principale ─────────────────────────────────────────────────────────

function ProblemesFrancePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    activeCategory === "all"
      ? PROBLEMS_DATA
      : PROBLEMS_DATA.filter((p) => p.category === activeCategory);

  const stats = {
    critique: PROBLEMS_DATA.filter((p) => p.severity === "critique").length,
    important: PROBLEMS_DATA.filter((p) => p.severity === "important").length,
    hausse: PROBLEMS_DATA.filter((p) => p.trend === "hausse").length,
  };

  return (
    <div className="container-app py-12">
      {/* ── Hero ── */}
      <div className="mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/40 text-xs font-semibold text-muted-foreground mb-4">
          🇫🇷 Tableau de bord
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">
          Les grands problèmes de la France
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Un état des lieux honnête des défis structurels du pays — avec les actions du Parlement pour y répondre et ce qu'il faut surveiller.
        </p>
      </div>

      {/* ── Stats globales ── */}
      <div
        className="grid grid-cols-3 gap-4 mb-10 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="glass rounded-2xl border border-red-500/20 p-4 text-center">
          <div className="text-2xl font-display font-bold text-red-400">{stats.critique}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Problèmes critiques</div>
        </div>
        <div className="glass rounded-2xl border border-orange-500/20 p-4 text-center">
          <div className="text-2xl font-display font-bold text-orange-400">{stats.important}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Importants</div>
        </div>
        <div className="glass rounded-2xl border border-red-500/20 p-4 text-center">
          <div className="text-2xl font-display font-bold text-red-400">{stats.hausse}</div>
          <div className="text-xs text-muted-foreground mt-0.5">En hausse 📈</div>
        </div>
      </div>

      {/* ── Filtres catégories ── */}
      <div
        className="sticky-toolbar sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 mb-8 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par catégorie"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                activeCategory === cat.id
                  ? "btn-primary border-transparent"
                  : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille des problèmes ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <p className="text-muted-foreground">Aucun problème dans cette catégorie.</p>
        </div>
      ) : (
        <ul className="space-y-4 animate-stagger">
          {filtered.map((problem, i) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              index={i}
              isExpanded={expanded === problem.id}
              onToggle={() =>
                setExpanded(expanded === problem.id ? null : problem.id)
              }
            />
          ))}
        </ul>
      )}

      {/* ── Note source ── */}
      <div
        className="mt-12 p-5 rounded-2xl glass border border-border/30 text-sm text-muted-foreground animate-fade-up"
        style={{ animationDelay: "400ms" }}
      >
        <p className="font-semibold text-foreground mb-1">📊 Sources et méthodologie</p>
        <p>
          Les données présentées sont issues d'organismes publics officiels (INSEE, DREES,
          Ministères, organismes indépendants). Cette page est mise à jour manuellement.
          Les chiffres sont indicatifs et peuvent légèrement varier selon la source et la période.
        </p>
      </div>
    </div>
  );
}

// ─── Problem Card ─────────────────────────────────────────────────────────────

function ProblemCard({
  problem,
  index,
  isExpanded,
  onToggle,
}: {
  problem: Problem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const sev = SEVERITY_CONFIG[problem.severity];
  const trd = TREND_CONFIG[problem.trend];
  const cat = CATEGORIES.find((c) => c.id === problem.category);

  return (
    <li
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}
    >
      <article
        className="card-glass rounded-[2rem] border border-border/40 overflow-hidden"
        style={{
          borderColor: isExpanded
            ? `color-mix(in oklch, ${sev.dot} 25%, var(--border))`
            : undefined,
        }}
      >
        {/* ── Header (toujours visible, cliquable) ── */}
        <button
          className="w-full text-left p-6 pb-5 group"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={`problem-detail-${problem.id}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-2">
              {/* Badge sévérité */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ color: sev.text, backgroundColor: sev.bg }}
              >
                {sev.label}
              </span>
              {/* Badge catégorie */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs glass border border-border/40 text-muted-foreground">
                {cat?.icon} {cat?.label}
              </span>
            </div>

            {/* Tendance */}
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: trd.color }}
            >
              {trd.icon} {trd.label}
              <span className="text-muted-foreground font-normal">· {problem.trendLabel}</span>
            </span>
          </div>

          {/* Titre + chiffre clé */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl md:text-3xl leading-tight group-hover:text-primary transition-colors duration-200">
                {problem.title}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{problem.subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              <div
                className="font-display font-bold text-3xl md:text-4xl"
                style={{ color: sev.dot }}
              >
                {problem.current}
              </div>
              <div className="text-xs text-muted-foreground">{problem.currentLabel}</div>
            </div>
          </div>

          {/* Toggle hint */}
          <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isExpanded ? "Masquer le détail" : "Voir l'état des lieux complet"}
          </div>
        </button>

        {/* ── Détail (expandable) ── */}
        {isExpanded && (
          <div
            id={`problem-detail-${problem.id}`}
            className="px-6 pb-6 space-y-5 animate-fade-up"
          >
            {/* Description */}
            <div className="rounded-2xl bg-muted/30 border border-border/30 p-4">
              <p className="text-sm leading-relaxed text-foreground/80">
                {problem.description}
              </p>
            </div>

            {/* Actions réalisées */}
            <ActionSection
              title="Actions réalisées"
              icon="✅"
              items={problem.done}
              color="#22c55e"
            />

            {/* Actions en cours */}
            <ActionSection
              title="Actions en cours"
              icon="🔄"
              items={problem.ongoing}
              color="#3b82f6"
            />

            {/* À surveiller */}
            <ActionSection
              title="À surveiller"
              icon="🔮"
              items={problem.toWatch}
              color="#f59e0b"
            />

            {/* Sources */}
            <div className="rounded-2xl glass border border-border/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                📊 Sources
              </p>
              <ul className="space-y-2">
                {problem.sources.map((src) => (
                  <li key={src.label}>
                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        {src.label} ↗
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">{src.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </article>
    </li>
  );
}

// ─── Action Section ───────────────────────────────────────────────────────────

function ActionSection({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: string;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: `color-mix(in oklch, ${color} 20%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 5%, transparent)`,
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
        style={{ color }}
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm">
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="text-foreground/80 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
