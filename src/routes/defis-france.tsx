// routes/defis-france.tsx — Défis à relever par la France
// ÉDITE CHALLENGES_DATA ci-dessous pour mettre à jour les défis et leurs indicateurs.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

export const Route = createFileRoute("/defis-france")({
  head: () => ({
    meta: createSeoMeta({
      title: "Défis à relever — Ce que la France doit améliorer | Mandat",
      description:
        "Les objectifs concrets que le Parlement et le gouvernement doivent atteindre : état, indicateurs, progression. Un suivi citoyen honnête.",
      canonical: `${SITE_URL}/defis-france`,
    }),
    links: createSeoLinks(`${SITE_URL}/defis-france`),
  }),
  component: DefisFrancePage,
});

// ─── Types ─────────────────────────────────────────────────────────────────

type Status = "pas-atteint" | "en-progression" | "atteint";

interface Indicator {
  label: string;
  value: string;
  target?: string;
  status: Status;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  problem: string;
  objective: string;
  status: Status; // statut global du défi
  indicators: Indicator[];
  scrutins?: Array<{ label: string; to: string }>; // liens vers scrutins liés
  sources: Array<{ label: string; url?: string }>;
  lastUpdate: string;
}

type Category = { id: string; label: string; icon: string };

// ─── Catégories ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "all", label: "Tous", icon: "🎯" },
  { id: "sante", label: "Santé", icon: "🏥" },
  { id: "economie", label: "Économie", icon: "📈" },
  { id: "education", label: "Éducation", icon: "🎓" },
  { id: "logement", label: "Logement", icon: "🏠" },
  { id: "environnement", label: "Environnement", icon: "🌿" },
  { id: "justice", label: "Justice", icon: "⚖️" },
  { id: "democratie", label: "Démocratie", icon: "🗳️" },
];

// ─── Config status ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; icon: string; color: string; bg: string }> = {
  "pas-atteint": { label: "Pas atteint", icon: "🔴", color: "#ef4444", bg: "color-mix(in oklch, #ef4444 12%, transparent)" },
  "en-progression": { label: "En progression", icon: "🟡", color: "#f59e0b", bg: "color-mix(in oklch, #f59e0b 12%, transparent)" },
  "atteint": { label: "Objectif atteint", icon: "🟢", color: "#22c55e", bg: "color-mix(in oklch, #22c55e 12%, transparent)" },
};

// ─── Données ─────────────────────────────────────────────────────────────────
// ÉDITE ICI pour mettre à jour les défis, objectifs, indicateurs et statuts.

const CHALLENGES_DATA: Challenge[] = [
  {
    id: "attente-urgences",
    title: "Réduire le temps d'attente aux urgences",
    category: "sante",
    problem: "Les urgences hospitalières sont saturées : 21 millions de passages par an, avec des temps d'attente pouvant dépasser 6 heures. Le manque de médecins et d'infirmiers aggrave la situation chaque été.",
    objective: "Ramener le temps médian d'attente aux urgences sous les 90 minutes d'ici 2027, et réorienter 30 % des passages non urgents vers les soins de ville via le SAS 15.",
    status: "pas-atteint",
    indicators: [
      { label: "Nombre de médecins urgentistes", value: "6 500", target: "8 000", status: "pas-atteint" },
      { label: "Temps médian d'attente", value: "2h30", target: "< 1h30", status: "pas-atteint" },
      { label: "Passages non urgents réorientés (SAS)", value: "8 %", target: "30 %", status: "pas-atteint" },
      { label: "Services d'urgences ouverts 24h/24", value: "649", target: "maintenir", status: "en-progression" },
    ],
    sources: [
      { label: "DREES — Les urgences hospitalières", url: "https://drees.solidarites-sante.gouv.fr" },
      { label: "FHF — Baromètre urgences", url: "https://www.fhf.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "medecins-traitants",
    title: "Un médecin traitant pour chaque Français",
    category: "sante",
    problem: "6 millions de Français n'ont pas de médecin traitant. Le numerus clausus historique a créé une pénurie structurelle de médecins, aggravée par les départs à la retraite.",
    objective: "Réduire à moins de 2 millions le nombre de Français sans médecin traitant d'ici 2030, grâce à la formation, aux IPA et aux MSP.",
    status: "pas-atteint",
    indicators: [
      { label: "Français sans médecin traitant", value: "6,1 M", target: "< 2 M", status: "pas-atteint" },
      { label: "Nouveaux médecins formés/an", value: "9 800", target: "11 000", status: "en-progression" },
      { label: "Infirmières en pratique avancée (IPA)", value: "3 200", target: "10 000", status: "en-progression" },
      { label: "Maisons de santé pluriprofessionnelles", value: "2 100", target: "3 000", status: "en-progression" },
    ],
    sources: [
      { label: "Conseil national de l'Ordre des médecins", url: "https://www.conseil-national.medecin.fr" },
      { label: "Assurance maladie", url: "https://www.ameli.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "deficit-3pct",
    title: "Ramener le déficit public sous 3 % du PIB",
    category: "economie",
    problem: "Le déficit public de la France dépasse les 5 % du PIB, bien au-delà des critères de Maastricht. La France est sous procédure de déficit excessif de l'UE depuis 2024.",
    objective: "Atteindre un déficit inférieur à 3 % du PIB d'ici 2027 comme exigé par le Pacte de stabilité européen.",
    status: "pas-atteint",
    indicators: [
      { label: "Déficit public", value: "-5,5 % PIB", target: "< -3 % PIB", status: "pas-atteint" },
      { label: "Dette publique", value: "112 % PIB", target: "< 100 %", status: "pas-atteint" },
      { label: "Économies budgétaires programmées", value: "20 Mds€", target: "60 Mds€", status: "pas-atteint" },
      { label: "Charge de la dette", value: "54 Mds€/an", target: "stabiliser", status: "pas-atteint" },
    ],
    sources: [
      { label: "Haut Conseil des finances publiques", url: "https://www.hcfp.fr" },
      { label: "INSEE — Comptes nationaux", url: "https://www.insee.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "plein-emploi",
    title: "Atteindre le plein emploi (< 5 % de chômage)",
    category: "economie",
    problem: "La France affiche un taux de chômage structurellement plus élevé que ses voisins (Allemagne, Pays-Bas). Le chômage des jeunes et de longue durée reste un défi majeur.",
    objective: "Descendre sous les 5 % de chômage d'ici 2027 (objectif gouvernemental annoncé en 2022).",
    status: "en-progression",
    indicators: [
      { label: "Taux de chômage global", value: "7,3 %", target: "< 5 %", status: "en-progression" },
      { label: "Chômage de longue durée", value: "2,6 %", target: "< 2 %", status: "en-progression" },
      { label: "Chômage des jeunes (15-24 ans)", value: "17,1 %", target: "< 12 %", status: "en-progression" },
      { label: "Taux d'emploi 15-64 ans", value: "68,3 %", target: "70 %", status: "en-progression" },
    ],
    sources: [
      { label: "INSEE — Enquête Emploi", url: "https://www.insee.fr" },
      { label: "DARES", url: "https://dares.travail-emploi.gouv.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "construction-logements",
    title: "Construire 400 000 logements par an",
    category: "logement",
    problem: "La production de logements neufs s'est effondrée depuis la hausse des taux d'intérêt : 300 000 constructions en 2023, contre 400 000 nécessaires selon les experts. La demande reste très supérieure à l'offre dans les zones tendues.",
    objective: "Revenir à 400 000 logements construits par an d'ici 2026, dont au moins 150 000 logements sociaux.",
    status: "pas-atteint",
    indicators: [
      { label: "Logements construits/an", value: "300 000", target: "400 000", status: "pas-atteint" },
      { label: "Logements sociaux agréés", value: "90 000", target: "150 000", status: "pas-atteint" },
      { label: "Permis de construire délivrés", value: "-25 % vs 2022", target: "stabiliser", status: "pas-atteint" },
      { label: "Délai d'attente HLM moyen", value: "6,7 ans", target: "< 4 ans", status: "pas-atteint" },
    ],
    sources: [
      { label: "Ministère du Logement", url: "https://www.cohesion-territoires.gouv.fr" },
      { label: "Fondation Abbé Pierre", url: "https://www.fondation-abbe-pierre.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "renovation-energetique",
    title: "Rénover 500 000 passoires thermiques par an",
    category: "logement",
    problem: "La France compte 5,2 millions de 'passoires thermiques' (logements classés F ou G). Ces logements représentent 25 % des émissions du secteur résidentiel et pèsent lourdement sur les factures des ménages modestes.",
    objective: "Rénover 500 000 passoires thermiques par an d'ici 2025 (objectif RE2020), atteindre zéro passoire thermique d'ici 2034.",
    status: "pas-atteint",
    indicators: [
      { label: "Rénovations/an (MaPrimeRénov')", value: "~700 000", target: "+ gestes", status: "en-progression" },
      { label: "Rénovations performantes/an", value: "~65 000", target: "200 000", status: "pas-atteint" },
      { label: "Passoires thermiques restantes", value: "5,2 M", target: "0 en 2034", status: "pas-atteint" },
      { label: "Budget MaPrimeRénov' alloué", value: "4 Mds€/an", target: "maintenir", status: "en-progression" },
    ],
    sources: [
      { label: "ANAH — MaPrimeRénov'", url: "https://www.anah.gouv.fr" },
      { label: "ADEME", url: "https://www.ademe.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "emissions-2030",
    title: "Réduire les émissions de -55 % d'ici 2030",
    category: "environnement",
    problem: "La France s'est engagée à réduire ses émissions de gaz à effet de serre de 55 % d'ici 2030 par rapport à 1990. Mais le rythme actuel de réduction est insuffisant pour atteindre cet objectif.",
    objective: "Atteindre -55 % d'émissions GES d'ici 2030 (objectif européen). Cela implique une réduction annuelle de 5-6 % dès maintenant.",
    status: "pas-atteint",
    indicators: [
      { label: "Réduction émissions vs 1990", value: "-25 %", target: "-55 %", status: "pas-atteint" },
      { label: "Part des ENR dans l'électricité", value: "32 %", target: "50 %", status: "en-progression" },
      { label: "Véhicules électriques immatriculés/an", value: "350 000", target: "800 000", status: "en-progression" },
      { label: "Émissions du bâtiment", value: "- 11 % vs 2019", target: "- 49 %", status: "pas-atteint" },
    ],
    sources: [
      { label: "Haut conseil pour le climat", url: "https://www.hautconseilclimat.fr" },
      { label: "CITEPA", url: "https://www.citepa.org" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "decrochage-scolaire",
    title: "Réduire le décrochage scolaire à moins de 5 %",
    category: "education",
    problem: "Environ 75 000 jeunes quittent le système éducatif chaque année sans diplôme. Ce décrochage alimente le chômage de longue durée et les inégalités sociales.",
    objective: "Ramener le taux de décrochage scolaire sous les 5 % d'ici 2026 (objectif fixé par le gouvernement en 2022).",
    status: "en-progression",
    indicators: [
      { label: "Taux de décrochage scolaire", value: "6,5 %", target: "< 5 %", status: "en-progression" },
      { label: "Jeunes en apprentissage", value: "980 000", target: "1 000 000", status: "atteint" },
      { label: "CEJ signés (Contrat Engagement Jeune)", value: "400 000", target: "400 000", status: "atteint" },
      { label: "Sorties sans qualification", value: "75 000/an", target: "< 50 000", status: "pas-atteint" },
    ],
    sources: [
      { label: "Ministère de l'Éducation nationale", url: "https://www.education.gouv.fr" },
      { label: "INSEE — Formation", url: "https://www.insee.fr" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "justice-delais",
    title: "Réduire les délais de justice",
    category: "justice",
    problem: "Les délais de jugement en France font partie des plus longs d'Europe. En matière civile, le délai moyen dépasse 13 mois en première instance. Les tribunaux sont sous-dotés en magistrats et greffiers.",
    objective: "Ramener les délais civils en première instance sous les 9 mois et correctionnel sous les 12 mois d'ici 2027.",
    status: "pas-atteint",
    indicators: [
      { label: "Délai civil moyen (1re instance)", value: "13,4 mois", target: "< 9 mois", status: "pas-atteint" },
      { label: "Délai correctionnel moyen", value: "14 mois", target: "< 12 mois", status: "pas-atteint" },
      { label: "Magistrats recrutés (plan 2023-2027)", value: "1 500", target: "1 500", status: "en-progression" },
      { label: "Affaires en stock (TJ)", value: "1,3 M", target: "< 900 000", status: "pas-atteint" },
    ],
    sources: [
      { label: "Ministère de la Justice — Statistiques", url: "https://www.justice.gouv.fr" },
      { label: "CEPEJ — Rapport européen", url: "https://www.coe.int/en/web/cepej" },
    ],
    lastUpdate: "Juillet 2025",
  },
  {
    id: "participation-electorale",
    title: "Relancer la participation électorale",
    category: "democratie",
    problem: "Le taux d'abstention aux élections législatives a atteint 53,8 % en 2022, un record historique. La désaffection touche particulièrement les jeunes et les quartiers populaires.",
    objective: "Revenir à un taux de participation supérieur à 60 % aux législatives de 2027.",
    status: "pas-atteint",
    indicators: [
      { label: "Participation législatives 2022", value: "46,2 %", target: "60 %", status: "pas-atteint" },
      { label: "Jeunes 18-24 ans inscrits sur les listes", value: "69 %", target: "85 %", status: "en-progression" },
      { label: "Procurations simplifiées", value: "Réformé en 2022", status: "atteint" },
      { label: "Confiance dans les institutions", value: "28 %", target: "40 %", status: "pas-atteint" },
    ],
    sources: [
      { label: "Ministère de l'Intérieur — Résultats", url: "https://www.interieur.gouv.fr/Elections" },
      { label: "CEVIPOF", url: "https://www.sciencespo.fr/cevipof" },
    ],
    lastUpdate: "Juillet 2025",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────

function DefisFrancePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = activeCategory === "all" ? CHALLENGES_DATA : CHALLENGES_DATA.filter((c) => c.category === activeCategory);

  const stats = {
    total: CHALLENGES_DATA.length,
    atteint: CHALLENGES_DATA.filter((c) => c.status === "atteint").length,
    progression: CHALLENGES_DATA.filter((c) => c.status === "en-progression").length,
    pasAtteint: CHALLENGES_DATA.filter((c) => c.status === "pas-atteint").length,
  };

  return (
    <div className="container-app py-12">
      {/* ── Hero ── */}
      <div className="mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/40 text-xs font-semibold text-muted-foreground mb-4">
          🎯 Suivi citoyen des objectifs
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">
          Défis à relever
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Pas d'opinion, pas de polémique. Des objectifs concrets, des indicateurs mesurables, et l'état d'avancement honnête.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <StatBox value={stats.total} label="Défis suivis" icon="🎯" color="#6366f1" />
        <StatBox value={stats.atteint} label="Objectif atteint" icon="🟢" color="#22c55e" />
        <StatBox value={stats.progression} label="En progression" icon="🟡" color="#f59e0b" />
        <StatBox value={stats.pasAtteint} label="Pas atteint" icon="🔴" color="#ef4444" />
      </div>

      {/* ── Barre de progression globale ── */}
      <div className="glass rounded-2xl border border-border/40 p-4 mb-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Progression globale</span>
          <span className="text-sm text-muted-foreground">
            {stats.atteint}/{stats.total} objectifs atteints
          </span>
        </div>
        <ProgressBar
          atteint={stats.atteint}
          progression={stats.progression}
          total={stats.total}
        />
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
          <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Atteint</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />En progression</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Pas atteint</span>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div
        className="sticky-toolbar sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 mb-8 animate-fade-up"
        style={{ animationDelay: "100ms" }}
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

      {/* ── Liste des défis ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <p className="text-muted-foreground">Aucun défi dans cette catégorie.</p>
        </div>
      ) : (
        <ul className="space-y-4 animate-stagger">
          {filtered.map((challenge, i) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              index={i}
              isExpanded={expanded === challenge.id}
              onToggle={() => setExpanded(expanded === challenge.id ? null : challenge.id)}
            />
          ))}
        </ul>
      )}

      {/* ── Liens ── */}
      <div className="mt-12 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "400ms" }}>
        <Link to="/problemes-france" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border/50 text-sm font-medium hover:border-primary/30 transition-colors">
          ← Problèmes de la France
        </Link>
        <Link to="/scrutins-semaine" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border/50 text-sm font-medium hover:border-primary/30 transition-colors">
          📅 Scrutins de la semaine
        </Link>
        <Link to="/scrutins" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border/50 text-sm font-medium hover:border-primary/30 transition-colors">
          Tous les scrutins →
        </Link>
      </div>
    </div>
  );
}

// ─── Stat Box ───────────────────────────────────────────────────────────────

function StatBox({ value, label, icon, color }: { value: number; label: string; icon: string; color: string }) {
  return (
    <div className="glass rounded-2xl border border-border/40 p-4 text-center">
      <div className="text-xl mb-1" aria-hidden="true">{icon}</div>
      <div className="font-display font-bold text-2xl" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({ atteint, progression, total }: { atteint: number; progression: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);
  const pctAtteint = (atteint / total) * 100;
  const pctProgression = (progression / total) * 100;
  return (
    <div ref={ref} className="flex h-3 rounded-full overflow-hidden bg-muted/50 gap-0.5">
      <div style={{ width: mounted ? `${pctAtteint}%` : "0%", backgroundColor: "#22c55e", transition: "width 900ms cubic-bezier(0.34,1.56,0.64,1)" }} />
      <div style={{ width: mounted ? `${pctProgression}%` : "0%", backgroundColor: "#f59e0b", transition: "width 900ms cubic-bezier(0.34,1.56,0.64,1) 100ms" }} />
    </div>
  );
}

// ─── Challenge Card ─────────────────────────────────────────────────────────

function ChallengeCard({ challenge, index, isExpanded, onToggle }: { challenge: Challenge; index: number; isExpanded: boolean; onToggle: () => void }) {
  const st = STATUS_CONFIG[challenge.status];
  const cat = CATEGORIES.find((c) => c.id === challenge.category);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200 + index * 40); return () => clearTimeout(t); }, [index]);

  const total = challenge.indicators.length;
  const atteint = challenge.indicators.filter((i) => i.status === "atteint").length;
  const progression = challenge.indicators.filter((i) => i.status === "en-progression").length;

  return (
    <li className="animate-fade-up" style={{ animationDelay: `${Math.min(index * 55, 400)}ms` }}>
      <article className="card-glass rounded-[2rem] border border-border/40 overflow-hidden" style={{ borderColor: isExpanded ? `color-mix(in oklch, ${st.color} 25%, var(--border))` : undefined }}>
        <button className="w-full text-left p-6 pb-5 group" onClick={onToggle} aria-expanded={isExpanded} aria-controls={`challenge-detail-${challenge.id}`}>
          {/* Header badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ color: st.color, backgroundColor: st.bg }}>
              {st.icon} {st.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs glass border border-border/40 text-muted-foreground">
              {cat?.icon} {cat?.label}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Mis à jour : {challenge.lastUpdate}</span>
          </div>

          {/* Titre */}
          <h2 className="font-display text-xl md:text-2xl leading-tight mb-3 group-hover:text-primary transition-colors duration-200">
            {challenge.title}
          </h2>

          {/* Mini barre indicateurs */}
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted/50 flex gap-0.5">
              <div style={{ width: mounted ? `${(atteint / total) * 100}%` : "0%", backgroundColor: "#22c55e", transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1)" }} />
              <div style={{ width: mounted ? `${(progression / total) * 100}%` : "0%", backgroundColor: "#f59e0b", transition: "width 700ms cubic-bezier(0.34,1.56,0.64,1) 80ms" }} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{atteint}/{total} indicateurs atteints</span>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isExpanded ? "Masquer le détail" : "Voir le détail du défi"}
          </div>
        </button>

        {/* Detail */}
        {isExpanded && (
          <div id={`challenge-detail-${challenge.id}`} className="px-6 pb-6 space-y-5 animate-fade-up">
            {/* Problème */}
            <div className="rounded-2xl bg-muted/30 border border-border/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">🔍 Problème</p>
              <p className="text-sm leading-relaxed text-foreground/80">{challenge.problem}</p>
            </div>
            {/* Objectif */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">🎯 Objectif</p>
              <p className="text-sm leading-relaxed text-foreground/80">{challenge.objective}</p>
            </div>
            {/* Indicateurs */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">📊 Indicateurs</p>
              {challenge.indicators.map((ind) => {
                const ist = STATUS_CONFIG[ind.status];
                return (
                  <div key={ind.label} className="glass rounded-xl border border-border/30 p-3 flex items-center gap-3">
                    <span className="text-lg shrink-0" aria-hidden="true">{ist.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ind.label}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold" style={{ color: ist.color }}>{ind.value}</span>
                        {ind.target && (
                          <span className="text-xs text-muted-foreground">→ Objectif : {ind.target}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: ist.color }}>{ist.label}</span>
                  </div>
                );
              })}
            </div>
            {/* Sources */}
            <div className="rounded-2xl glass border border-border/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">📊 Sources</p>
              <ul className="space-y-1">
                {challenge.sources.map((src) => (
                  <li key={src.label}>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-2 hover:text-primary/80">{src.label} ↗</a>
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
