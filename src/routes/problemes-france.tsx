// routes/problemes-france.tsx — État de la France + Problèmes structurels
// ⚠️ ÉDITE PROBLEMS_DATA ci-dessous pour mettre à jour chaque problème.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

export const Route = createFileRoute("/problemes-france")({
  head: () => ({
    meta: createSeoMeta({
      title: "État de la France — Problèmes & Score | Mandat",
      description:
        "Déficit, logement, santé, éducation : le tableau de bord honnête des défis structurels de la France avec un score par dimension mis à jour régulièrement.",
      canonical: `${SITE_URL}/problemes-france`,
    }),
    links: createSeoLinks(`${SITE_URL}/problemes-france`),
  }),
  component: ProblemesFrancePage,
});

// ─── Types ─────────────────────────────────────────────────────────────────

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
  current: string;
  currentLabel: string;
  description: string;
  done: string[];
  ongoing: string[];
  toWatch: string[];
  sources: Array<{ label: string; url?: string }>;
}

interface ScoreDimension {
  id: string;
  label: string;
  icon: string;
  score: number; // 0-100
  trend: Trend;
  summary: string;
  lastUpdate: string;
}

type Category = { id: string; label: string; icon: string };

// ─── Score dimensions ──────────────────────────────────────────────────────
// ÉDITE ICI pour mettre à jour le score. Score = note /100 (100 = parfait).

const SCORE_DIMENSIONS: ScoreDimension[] = [
  {
    id: "economie",
    label: "Économie",
    icon: "📈",
    score: 42,
    trend: "baisse",
    summary: "Déficit à -5,5 % du PIB, dette à 112 %. Croissance faible mais chômage en recul.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "sante",
    label: "Santé",
    icon: "🏥",
    score: 51,
    trend: "stable",
    summary: "Système de qualité mondiale mais déserts médicaux croissants et urgences saturées.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "education",
    label: "Éducation",
    icon: "🎓",
    score: 58,
    trend: "stable",
    summary: "PISA en légère amélioration, mais inégalités territoriales persistantes.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "securite",
    label: "Sécurité",
    icon: "🛡️",
    score: 55,
    trend: "stable",
    summary: "Homicides stables, mais violences intrafamiliales et cybercriminalité en hausse.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "logement",
    label: "Logement",
    icon: "🏠",
    score: 34,
    trend: "baisse",
    summary: "4 millions de mal-logés, construction en effondrement depuis la hausse des taux.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "environnement",
    label: "Environnement",
    icon: "🌿",
    score: 47,
    trend: "hausse",
    summary: "Émissions en léger recul, mais objectifs 2030 hors de portée au rythme actuel.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "transport",
    label: "Transports",
    icon: "🚆",
    score: 53,
    trend: "stable",
    summary: "Réseau ferroviaire vieillissant, retards chroniques, investissements insuffisants.",
    lastUpdate: "Juillet 2025",
  },
  {
    id: "democratie",
    label: "Démocratie",
    icon: "🗳️",
    score: 61,
    trend: "baisse",
    summary: "Abstention record, défiance institutionnelle en hausse, mais liberté de presse préservée.",
    lastUpdate: "Juillet 2025",
  },
];

// Score global = moyenne pondérée
const GLOBAL_SCORE = Math.round(
  SCORE_DIMENSIONS.reduce((acc, d) => acc + d.score, 0) / SCORE_DIMENSIONS.length
);

// ─── Catégories ────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "all", label: "Tous", icon: "🇫🇷" },
  { id: "economie", label: "Économie", icon: "📈" },
  { id: "sante", label: "Santé", icon: "🏥" },
  { id: "education", label: "Éducation", icon: "🎓" },
  { id: "securite", label: "Sécurité", icon: "🛡️" },
  { id: "logement", label: "Logement", icon: "🏠" },
  { id: "environnement", label: "Environnement", icon: "🌿" },
  { id: "transport", label: "Transports", icon: "🚆" },
  { id: "democratie", label: "Démocratie", icon: "🗳️" },
];

// ─── Données problèmes ─────────────────────────────────────────────────────

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
    id: "pouvoir-achat",
    title: "Pouvoir d'achat",
    subtitle: "L'inflation a rogné les revenus des ménages",
    category: "economie",
    severity: "important",
    trend: "stable",
    trendLabel: "inflation en recul depuis 2024",
    current: "+3,4 %",
    currentLabel: "inflation cumulée 2022-2024",
    description:
      "Les vagues inflationnistes de 2022-2023 ont durablement érodé le pouvoir d'achat des ménages les plus modestes. Malgré le ralentissement de l'inflation en 2024, les prix alimentaires restent 20 % au-dessus de 2021.",
    done: [
      "Bouclier tarifaire énergie (2022-2023, coût 25 Mds€)",
      "Revalorisation du SMIC (+5 % en 2022, +2,2 % en 2024)",
      "Chèque alimentaire expérimental pour les plus démunis",
    ],
    ongoing: [
      "Indexation des retraites sur l'inflation",
      "Négociations avec la grande distribution sur les prix des produits du quotidien",
      "Prime de partage de la valeur étendue aux PME",
    ],
    toWatch: [
      "🔮 Retour de tensions inflationnistes lié aux conflits géopolitiques",
      "🔮 Hausse des prix de l'énergie en hiver 2025-2026",
      "🔮 Désindexation progressive des boucliers tarifaires",
    ],
    sources: [
      { label: "INSEE — Indice des prix", url: "https://www.insee.fr" },
      { label: "Banque de France", url: "https://www.banque-france.fr" },
    ],
  },
  {
    id: "chomage-jeunes",
    title: "Chômage des jeunes",
    subtitle: "Les moins de 25 ans deux fois plus touchés",
    category: "economie",
    severity: "important",
    trend: "baisse",
    trendLabel: "amélioration depuis 2021",
    current: "17,1 %",
    currentLabel: "taux chômage 15-24 ans (2024)",
    description:
      "Malgré une amélioration depuis 2021, le chômage des jeunes reste structurellement élevé en France, presque le double de la moyenne européenne. L'insertion professionnelle après les études reste difficile dans de nombreux secteurs.",
    done: [
      "Plan 1 Jeune 1 Solution (3,3 millions de jeunes accompagnés)",
      "Développement massif de l'apprentissage (1 million de contrats en 2023)",
      "Garantie jeunes / CEJ (Contrat d'Engagement Jeune)",
    ],
    ongoing: [
      "Réforme du lycée professionnel pour améliorer l'insertion",
      "Service public de l'insertion (France Travail)",
      "Extension de la VAE (validation des acquis)",
    ],
    toWatch: [
      "🔮 Risque de remontée avec le ralentissement économique",
      "🔮 Inadéquation formation / besoins du marché du travail",
      "🔮 Impact de l'IA sur les métiers d'entrée de gamme",
    ],
    sources: [
      { label: "INSEE — Emploi", url: "https://www.insee.fr" },
      { label: "DARES — Statistiques emploi", url: "https://dares.travail-emploi.gouv.fr" },
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
    ],
  },
  {
    id: "urgences",
    title: "Crise des urgences",
    subtitle: "Temps d'attente records et services saturés",
    category: "sante",
    severity: "critique",
    trend: "hausse",
    trendLabel: "aggravation chaque été",
    current: "21 M",
    currentLabel: "passages aux urgences/an",
    description:
      "Les urgences hospitalières sont chroniquement saturées. Les passages ont explosé (+40 % en 10 ans) sans que les capacités ne suivent. Les fermetures de lits et le manque de personnel soignant aggravent la situation.",
    done: [
      "Plans blanc activés chaque été depuis 2022",
      "Service d'Accès aux Soins (SAS) pour trier les appels non urgents",
      "Hausse des rémunérations des gardes de nuit (Ségur 2)",
    ],
    ongoing: [
      "Réforme du financement des urgences (sortie du T2A)",
      "Déploiement national du SAS (numéro unique 15)",
      "Plan de recrutement infirmier 2025-2027",
    ],
    toWatch: [
      "🔮 Vague de départs infirmiers vers le secteur privé",
      "🔮 Fermetures de services d'urgences dans les petits hôpitaux",
      "🔮 Impact du vieillissement de la population sur la demande",
    ],
    sources: [
      { label: "DREES — Urgences", url: "https://drees.solidarites-sante.gouv.fr" },
      { label: "Fédération Hospitalière de France", url: "https://www.fhf.fr" },
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
      { label: "Ministère de l'Éducation nationale", url: "https://www.education.gouv.fr" },
      { label: "DEPP — Données éducation", url: "https://www.education.gouv.fr/les-indicateurs-de-resultats-des-lycees" },
    ],
  },
  {
    id: "inegalites-scolaires",
    title: "Inégalités scolaires",
    subtitle: "L'origine sociale détermine trop le destin scolaire",
    category: "education",
    severity: "important",
    trend: "stable",
    trendLabel: "persistant depuis 20 ans",
    current: "Rang 27e",
    currentLabel: "sur l'équité scolaire (PISA)",
    description:
      "La France est l'un des pays de l'OCDE où l'origine sociale a le plus d'impact sur la réussite scolaire. Les écarts entre REP et hors-REP se creusent dès le primaire.",
    done: [
      "Dédoublement des classes en REP+ (CP, CE1, CE2)",
      "Internat d'excellence pour les élèves méritants de milieux modestes",
      "Cité éducative dans 200 quartiers prioritaires",
    ],
    ongoing: [
      "Pacte enseignant pour augmenter les heures de soutien",
      "Réforme du recrutement des enseignants en REP",
      "Expérimentation des groupes de niveaux en collège",
    ],
    toWatch: [
      "🔮 Impact des groupes de niveaux sur la mixité scolaire",
      "🔮 Résultats PISA 2025 sur l'équité",
      "🔮 Turnover des enseignants en zones difficiles",
    ],
    sources: [
      { label: "PISA OCDE", url: "https://www.oecd.org/pisa" },
      { label: "INSEE — Éducation et formation", url: "https://www.insee.fr" },
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
      { label: "Ministère de l'Intérieur — Interstats", url: "https://www.interieur.gouv.fr/Interstats" },
      { label: "INSEE — Enquête CVS", url: "https://www.insee.fr" },
    ],
  },
  {
    id: "cybersecurite",
    title: "Cybersécurité",
    subtitle: "Les cyberattaques contre les institutions se multiplient",
    category: "securite",
    severity: "important",
    trend: "hausse",
    trendLabel: "+40 % d'incidents en 2023",
    current: "+40 %",
    currentLabel: "incidents signalés à l'ANSSI",
    description:
      "Hôpitaux, collectivités locales, ministères : les cyberattaques se multiplient en France. L'ANSSI a enregistré une forte hausse des incidents en 2023, dont plusieurs ont paralysé des services publics.",
    done: [
      "Création de l'ANSSI (Agence nationale de la sécurité des systèmes d'information)",
      "Stratégie nationale cyber 2021 (1 Md€ investi)",
      "Programme CaRE pour la cybersécurité des hôpitaux",
    ],
    ongoing: [
      "Directive NIS 2 (transposition en droit français)",
      "Formation de 37 000 experts cyber d'ici 2025",
      "Campus Cyber à La Défense",
    ],
    toWatch: [
      "🔮 Risque d'attaques étatiques (Russie, Chine)",
      "🔮 Vulnérabilité des infrastructures critiques",
      "🔮 Rançongiciels ciblant les TPE/PME",
    ],
    sources: [
      { label: "ANSSI — Rapport annuel", url: "https://www.ssi.gouv.fr" },
      { label: "Cybermalveillance.gouv.fr", url: "https://www.cybermalveillance.gouv.fr" },
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
      { label: "INSEE — Statistiques logement", url: "https://www.insee.fr/fr/statistiques?idtheme=14" },
    ],
  },
  {
    id: "sans-abri",
    title: "Sans-abrisme",
    subtitle: "330 000 personnes sans domicile en France",
    category: "logement",
    severity: "critique",
    trend: "hausse",
    trendLabel: "doublement en 10 ans",
    current: "330 000",
    currentLabel: "personnes sans domicile",
    description:
      "La France compte 330 000 personnes sans domicile fixe selon la dernière enquête INSEE, soit le double d'il y a 10 ans. La politique du 'Logement d'abord' peine à inverser la tendance.",
    done: [
      "Plan Logement d'abord (2018-2022 puis prolongé)",
      "115 places d'hébergement d'urgence portées à 200 000",
      "Intermédiation locative pour réinsertion",
    ],
    ongoing: [
      "Construction de 10 000 logements PLAI/an supplémentaires",
      "Réforme de l'hébergement d'urgence vers le logement stable",
      "Accompagnement social renforcé",
    ],
    toWatch: [
      "🔮 Hausse des expulsions locatives après la fin de la trêve hivernale",
      "🔮 Migrants et demandeurs d'asile sans hébergement",
      "🔮 Tension sur les places d'hébergement en Île-de-France",
    ],
    sources: [
      { label: "INSEE — Enquête sans-domicile", url: "https://www.insee.fr" },
      { label: "SIAO — Système intégré d'accueil", url: "https://www.gouvernement.fr/sans-abri" },
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
      "Planification écologique (CNP)",
      "Déploiement du ZAN (Zéro artificialisation nette)",
      "Décarbonation de l'industrie (contrats de transition écologique)",
    ],
    toWatch: [
      "🔮 Risque de retard sur l'objectif -55 % d'émissions à horizon 2030",
      "🔮 Tensions sociales liées à la fiscalité écologique",
      "🔮 Vague de sécheresses et leurs impacts sur l'agriculture",
    ],
    sources: [
      { label: "CITEPA — Inventaire GES", url: "https://www.citepa.org" },
      { label: "Haut conseil pour le climat", url: "https://www.hautconseilclimat.fr" },
    ],
  },
  {
    id: "biodiversite",
    title: "Effondrement de la biodiversité",
    subtitle: "Un tiers des espèces en déclin en France",
    category: "environnement",
    severity: "important",
    trend: "hausse",
    trendLabel: "accélération documentée",
    current: "-30 %",
    currentLabel: "d'oiseaux agricoles en 30 ans",
    description:
      "La France a perdu 30 % de ses oiseaux des champs en 30 ans. Les pollinisateurs, amphibiens et insectes sont en déclin accéléré, menaçant les écosystèmes agricoles et naturels.",
    done: [
      "Plan biodiversité 2018",
      "Création de l'Office français de la biodiversité (OFB)",
      "Interdiction progressive des néonicotinoïdes",
    ],
    ongoing: [
      "Stratégie nationale biodiversité 2030",
      "30x30 : protéger 30 % des milieux naturels d'ici 2030",
      "Plan ecophyto pour réduire les pesticides",
    ],
    toWatch: [
      "🔮 Dérogations accordées aux néonicotinoïdes par filière",
      "🔮 Artificialisation continue des terres agricoles",
      "🔮 Impact du changement climatique sur les zones humides",
    ],
    sources: [
      { label: "MNHN — Vigie-Nature", url: "https://www.vigienature.mnhn.fr" },
      { label: "OFB — Biodiversité en France", url: "https://www.ofb.gouv.fr" },
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
      "LGV Bordeaux-Toulouse lancée",
    ],
    ongoing: [
      "RER métropolitains dans 10 grandes villes",
      "Rapport COI 2023-2040",
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
    ],
  },
  {
    id: "abstention",
    title: "Abstention record",
    subtitle: "La désaffection électorale s'accélère",
    category: "democratie",
    severity: "important",
    trend: "hausse",
    trendLabel: "record historique en 2022",
    current: "53,8 %",
    currentLabel: "d'abstention aux législatives 2022",
    description:
      "Plus d'un Français sur deux ne vote plus aux législatives. L'abstention touche particulièrement les jeunes et les milieux populaires, fragilisant la légitimité démocratique des gouvernements.",
    done: [
      "Vote anticipé expérimental dans certaines communes",
      "Réforme de la procuration simplifiée",
      "Éducation civique renforcée au lycée",
    ],
    ongoing: [
      "Réflexion sur le vote électronique",
      "Commission Barthélémy sur l'abstention",
      "Expérimentation de la reconnaissance proportionnelle",
    ],
    toWatch: [
      "🔮 Présidentielle 2027 : premier test majeur",
      "🔮 Défiance institutionnelle en hausse dans les sondages",
      "🔮 Impact des réseaux sociaux sur la mobilisation",
    ],
    sources: [
      { label: "Ministère de l'Intérieur — Résultats électoraux", url: "https://www.interieur.gouv.fr/Elections" },
      { label: "CEVIPOF — Baromètre de la confiance", url: "https://www.sciencespo.fr/cevipof/fr/content/le-barometre-de-la-confiance-politique.html" },
    ],
  },
];

// ─── Config badges ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; dot: string; text: string; bg: string }> = {
  critique: { label: "🔴 Critique", dot: "#ef4444", text: "#ef4444", bg: "color-mix(in oklch, #ef4444 12%, transparent)" },
  important: { label: "🟠 Important", dot: "#f97316", text: "#f97316", bg: "color-mix(in oklch, #f97316 12%, transparent)" },
  modere: { label: "🟡 Modéré", dot: "#eab308", text: "#ca8a04", bg: "color-mix(in oklch, #eab308 12%, transparent)" },
  surveiller: { label: "🔵 À surveiller", dot: "#3b82f6", text: "#3b82f6", bg: "color-mix(in oklch, #3b82f6 12%, transparent)" },
};

const TREND_CONFIG: Record<Trend, { icon: string; label: string; color: string }> = {
  hausse: { icon: "📈", label: "En hausse", color: "#ef4444" },
  baisse: { icon: "📉", label: "En baisse", color: "#22c55e" },
  stable: { icon: "➡️", label: "Stable", color: "#94a3b8" },
};

// ─── Score color ────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 70) return { text: "#22c55e", bg: "color-mix(in oklch, #22c55e 12%, transparent)" };
  if (s >= 50) return { text: "#f97316", bg: "color-mix(in oklch, #f97316 12%, transparent)" };
  return { text: "#ef4444", bg: "color-mix(in oklch, #ef4444 12%, transparent)" };
}

function scoreLabel(s: number) {
  if (s >= 70) return "Satisfaisant";
  if (s >= 50) return "Insuffisant";
  return "Alarmant";
}

// ─── Animated counter ──────────────────────────────────────────────────────

function AnimatedScore({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────

function ProblemesFrancePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = activeCategory === "all" ? PROBLEMS_DATA : PROBLEMS_DATA.filter((p) => p.category === activeCategory);

  const stats = {
    critique: PROBLEMS_DATA.filter((p) => p.severity === "critique").length,
    important: PROBLEMS_DATA.filter((p) => p.severity === "important").length,
    hausse: PROBLEMS_DATA.filter((p) => p.trend === "hausse").length,
  };

  const globalColor = scoreColor(GLOBAL_SCORE);

  return (
    <div className="container-app py-12">
      {/* ── Hero ── */}
      <div className="mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/40 text-xs font-semibold text-muted-foreground mb-4">
          🇫🇷 Tableau de bord — mis à jour manuellement
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">
          État de la France
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Un état des lieux honnête des défis structurels du pays — avec les actions du Parlement et ce qu'il faut surveiller.
        </p>
      </div>

      {/* ── Score global ── */}
      <div className="mb-10 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <div className="card-glass rounded-[2rem] border border-border/40 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score global</p>
              <div className="flex items-end gap-3">
                <div
                  className="font-display text-6xl md:text-7xl font-bold"
                  style={{ color: globalColor.text }}
                >
                  <AnimatedScore target={GLOBAL_SCORE} /><span className="text-3xl">/100</span>
                </div>
                <div
                  className="px-3 py-1.5 rounded-full text-sm font-bold mb-2"
                  style={{ color: globalColor.text, backgroundColor: globalColor.bg }}
                >
                  {scoreLabel(GLOBAL_SCORE)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                Moyenne pondérée sur {SCORE_DIMENSIONS.length} dimensions. Mis à jour manuellement à partir de données officielles.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Link
                to="/defis-france"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full btn-primary text-sm font-semibold"
              >
                🎯 Voir les défis à relever →
              </Link>
              <Link
                to="/scrutins-semaine"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border/50 text-sm font-medium hover:border-primary/30 transition-colors"
              >
                📅 Scrutins de la semaine
              </Link>
            </div>
          </div>

          {/* Grille scores par dimension */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {SCORE_DIMENSIONS.map((dim, i) => {
              const c = scoreColor(dim.score);
              const trd = TREND_CONFIG[dim.trend];
              return (
                <div
                  key={dim.id}
                  className="rounded-2xl p-3 text-center glass border border-border/30 animate-fade-up"
                  style={{ animationDelay: `${100 + i * 40}ms` }}
                  title={dim.summary}
                >
                  <div className="text-xl mb-1" aria-hidden="true">{dim.icon}</div>
                  <div className="font-display font-bold text-xl" style={{ color: c.text }}>
                    <AnimatedScore target={dim.score} duration={900 + i * 80} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{dim.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: trd.color }}>{trd.icon} {trd.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stats globales ── */}
      <div className="grid grid-cols-3 gap-4 mb-10 animate-fade-up" style={{ animationDelay: "100ms" }}>
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
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

      {/* ── Liste problèmes ── */}
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
              onToggle={() => setExpanded(expanded === problem.id ? null : problem.id)}
            />
          ))}
        </ul>
      )}

      {/* ── Note source ── */}
      <div className="mt-12 p-5 rounded-2xl glass border border-border/30 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "400ms" }}>
        <p className="font-semibold text-foreground mb-1">📊 Sources et méthodologie</p>
        <p>
          Les données présentées sont issues d'organismes publics officiels (INSEE, DREES, Ministères, Haut conseil pour le climat, ANSSI…). Les scores sont des évaluations éditoriales basées sur ces données, mis à jour manuellement. Ils ne constituent pas des indicateurs officiels.
        </p>
      </div>
    </div>
  );
}

// ─── Problem Card ──────────────────────────────────────────────────────────

function ProblemCard({ problem, index, isExpanded, onToggle }: { problem: Problem; index: number; isExpanded: boolean; onToggle: () => void }) {
  const sev = SEVERITY_CONFIG[problem.severity];
  const trd = TREND_CONFIG[problem.trend];
  const cat = CATEGORIES.find((c) => c.id === problem.category);
  return (
    <li className="animate-fade-up" style={{ animationDelay: `${Math.min(index * 55, 400)}ms` }}>
      <article className="card-glass rounded-[2rem] border border-border/40 overflow-hidden" style={{ borderColor: isExpanded ? `color-mix(in oklch, ${sev.dot} 25%, var(--border))` : undefined }}>
        <button className="w-full text-left p-6 pb-5 group" onClick={onToggle} aria-expanded={isExpanded} aria-controls={`problem-detail-${problem.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ color: sev.text, backgroundColor: sev.bg }}>{sev.label}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs glass border border-border/40 text-muted-foreground">{cat?.icon} {cat?.label}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: trd.color }}>
              {trd.icon} {trd.label}
              <span className="text-muted-foreground font-normal">· {problem.trendLabel}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl md:text-3xl leading-tight group-hover:text-primary transition-colors duration-200">{problem.title}</h2>
              <p className="text-muted-foreground text-sm mt-1">{problem.subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display font-bold text-3xl md:text-4xl" style={{ color: sev.dot }}>{problem.current}</div>
              <div className="text-xs text-muted-foreground">{problem.currentLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isExpanded ? "Masquer le détail" : "Voir l'état des lieux complet"}
          </div>
        </button>
        {isExpanded && (
          <div id={`problem-detail-${problem.id}`} className="px-6 pb-6 space-y-5 animate-fade-up">
            <div className="rounded-2xl bg-muted/30 border border-border/30 p-4">
              <p className="text-sm leading-relaxed text-foreground/80">{problem.description}</p>
            </div>
            <ActionSection title="Actions réalisées" icon="✅" items={problem.done} color="#22c55e" />
            <ActionSection title="Actions en cours" icon="🔄" items={problem.ongoing} color="#3b82f6" />
            <ActionSection title="À surveiller" icon="🔮" items={problem.toWatch} color="#f59e0b" />
            <div className="rounded-2xl glass border border-border/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">📊 Sources</p>
              <ul className="space-y-2">
                {problem.sources.map((src) => (
                  <li key={src.label}>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{src.label} ↗</a>
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

function ActionSection({ title, icon, items, color }: { title: string; icon: string; items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `color-mix(in oklch, ${color} 20%, transparent)`, backgroundColor: `color-mix(in oklch, ${color} 5%, transparent)` }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
        <span aria-hidden="true">{icon}</span>{title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="text-foreground/80 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
