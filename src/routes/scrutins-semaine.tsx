// routes/scrutins-semaine.tsx — Scrutins de la semaine
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { scrutinsQuery, type Scrutin } from "@/lib/api";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

export const Route = createFileRoute("/scrutins-semaine")({
  head: () => ({
    meta: createSeoMeta({
      title: "Scrutins de la semaine — Les votes importants | Mandat",
      description:
        "Chaque semaine, les scrutins clés à l'Assemblée nationale. Résultats, répartition des votes, et résumé IA du contexte.",
      canonical: `${SITE_URL}/scrutins-semaine`,
    }),
    links: createSeoLinks(`${SITE_URL}/scrutins-semaine`),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(scrutinsQuery),
  component: ScrutinsSemainePage,
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return { start: monday, end: sunday, label: `${fmt(monday)} – ${fmt(sunday)}` };
}

function getLastWeekRange(): { start: Date; end: Date } {
  const { start } = getWeekRange();
  const prevMonday = new Date(start);
  prevMonday.setDate(start.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  prevSunday.setHours(23, 59, 59, 999);
  return { start: prevMonday, end: prevSunday };
}

// ─── Données de contexte IA statiques (édite librement) ──────────────────────
// Tu peux remplacer les textes par de vraies réponses Groq plus tard.
// Format : clé = numero du scrutin, valeur = résumé court.
const AI_CONTEXT: Record<string, string> = {
  // Exemple — remplace par les vrais numéros et résumés :
  // "5123": "Ce scrutin porte sur la réforme du logement social. Il modifie les règles d'attribution des HLM et affecte environ 10 millions de ménages en liste d'attente.",
};

// ─── Page principale ─────────────────────────────────────────────────────────

function ScrutinsSemainePage() {
  const { data: allScrutins } = useSuspenseQuery(scrutinsQuery);
  const [activeTab, setActiveTab] = useState<"semaine" | "precedente">("semaine");

  const { start, end, label } = getWeekRange();
  const prev = getLastWeekRange();

  const scrutinsSemaine = useMemo(() => {
    return allScrutins
      .filter((s) => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);
  }, [allScrutins, start, end]);

  const scrutinsPrecedente = useMemo(() => {
    return allScrutins
      .filter((s) => {
        const d = new Date(s.date);
        return d >= prev.start && d <= prev.end;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);
  }, [allScrutins, prev.start, prev.end]);

  const current = activeTab === "semaine" ? scrutinsSemaine : scrutinsPrecedente;

  // Stats agrégées
  const adopted = current.filter((s) => /adopt/i.test(s.sort)).length;
  const rejected = current.length - adopted;

  return (
    <div className="container-app py-12">
      {/* ── Hero ── */}
      <div className="mb-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          Mis à jour en temps réel
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">
          Les scrutins de la semaine
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Les votes importants à l'Assemblée nationale — avec le résultat, la répartition, et ce que ça change concrètement.
        </p>
      </div>

      {/* ── Tabs semaine / précédente ── */}
      <div
        className="flex gap-2 mb-8 animate-fade-up"
        style={{ animationDelay: "60ms" }}
        role="tablist"
        aria-label="Choisir la semaine"
      >
        <button
          role="tab"
          aria-selected={activeTab === "semaine"}
          onClick={() => setActiveTab("semaine")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
            activeTab === "semaine"
              ? "btn-primary border-transparent"
              : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
          }`}
        >
          📅 Cette semaine
          {scrutinsSemaine.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
              {scrutinsSemaine.length}
            </span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "precedente"}
          onClick={() => setActiveTab("precedente")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
            activeTab === "precedente"
              ? "btn-primary border-transparent"
              : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
          }`}
        >
          Semaine précédente
        </button>
      </div>

      {/* ── Résumé stats ── */}
      {current.length > 0 && (
        <div
          className="grid grid-cols-3 gap-4 mb-8 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <StatCard label="Scrutins" value={current.length} icon="📋" />
          <StatCard label="Adoptés" value={adopted} icon="✅" color="pour" />
          <StatCard label="Rejetés" value={rejected} icon="❌" color="contre" />
        </div>
      )}

      {/* ── Scrutins ── */}
      {current.length === 0 ? (
        <EmptyState activeTab={activeTab} label={label} />
      ) : (
        <ul className="space-y-5 animate-stagger" aria-label="Scrutins de la semaine">
          {current.map((s, i) => (
            <ScrutinWeekCard key={s.numero} s={s} index={i} />
          ))}
        </ul>
      )}

      {/* ── CTA vers tous les scrutins ── */}
      <div className="mt-12 text-center animate-fade-up" style={{ animationDelay: "300ms" }}>
        <Link
          to="/scrutins"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-border/50 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
        >
          Voir tous les scrutins →
        </Link>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color?: "pour" | "contre";
}) {
  return (
    <div
      className="glass rounded-2xl border border-border/40 p-4 text-center"
      style={{
        borderColor: color
          ? `color-mix(in oklch, var(--color-${color}) 30%, transparent)`
          : undefined,
      }}
    >
      <div className="text-2xl mb-1" aria-hidden="true">{icon}</div>
      <div
        className="text-2xl font-display font-bold"
        style={{
          color: color ? `var(--color-${color})` : "var(--color-foreground)",
        }}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  activeTab,
  label,
}: {
  activeTab: "semaine" | "precedente";
  label: string;
}) {
  return (
    <div className="py-20 text-center glass rounded-3xl border border-border/50 animate-fade-up">
      <span className="text-5xl block mb-4" aria-hidden="true">🗓️</span>
      <h2 className="font-display text-xl mb-2">
        {activeTab === "semaine"
          ? "Aucun scrutin cette semaine encore"
          : "Aucun scrutin trouvé pour la semaine précédente"}
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        {activeTab === "semaine"
          ? `La semaine ${label} n'a pas encore de scrutins enregistrés. Revenez bientôt.`
          : "Les données de la semaine précédente ne sont pas disponibles."}
      </p>
    </div>
  );
}

// ─── Scrutin Week Card ───────────────────────────────────────────────────────

function ScrutinWeekCard({ s, index }: { s: Scrutin; index: number }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0);
  const c = Math.max(0, parseInt(s.nombre_contres) || 0);
  const a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  const isAdopted = /adopt/i.test(s.sort);
  const [mounted, setMounted] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const aiContext = AI_CONTEXT[s.numero] ?? null;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150 + index * 60);
    return () => clearTimeout(t);
  }, [index]);

  const dateFormatted = s.date
    ? new Date(s.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <li
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <article className="card-glass rounded-[2rem] border border-border/40 overflow-hidden">
        {/* ── Header ── */}
        <div className="p-6 pb-4">
          {/* Badge résultat + date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {s.sort && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  color: isAdopted ? "var(--color-pour)" : "var(--color-contre)",
                  backgroundColor: isAdopted
                    ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
                    : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
                }}
              >
                {isAdopted ? "✅ Adopté" : "❌ Rejeté"}
              </span>
            )}
            {dateFormatted && (
              <span className="text-xs text-muted-foreground">
                🗓 <time dateTime={s.date}>{dateFormatted}</time>
              </span>
            )}
            <span className="ml-auto text-xs font-mono text-muted-foreground/50">
              n°{s.numero}
            </span>
          </div>

          {/* Titre */}
          <h2 className="font-display text-xl md:text-2xl leading-snug mb-4">
            {s.titre
              ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
              : `Scrutin n°${s.numero}`}
          </h2>

          {/* ── Résultats chiffrés ── */}
          {(p > 0 || c > 0 || a > 0) && (
            <div className="space-y-3 mb-4">
              {/* Barre de votes */}
              <div className="flex h-3 rounded-full overflow-hidden bg-muted/60 gap-0.5">
                <div
                  style={{
                    width: mounted ? `${(p / total) * 100}%` : "0%",
                    backgroundColor: "var(--color-pour)",
                    transition:
                      "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    borderRadius: c === 0 && a === 0 ? "9999px" : "9999px 0 0 9999px",
                  }}
                />
                <div
                  style={{
                    width: mounted ? `${(c / total) * 100}%` : "0%",
                    backgroundColor: "var(--color-contre)",
                    transition:
                      "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms",
                    borderRadius: a === 0 ? "0 9999px 9999px 0" : "0",
                  }}
                />
                <div
                  style={{
                    width: mounted ? `${(a / total) * 100}%` : "0%",
                    backgroundColor: "var(--color-abstention)",
                    transition:
                      "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms",
                    borderRadius: "0 9999px 9999px 0",
                  }}
                />
              </div>

              {/* Détail votes */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <VoteStat
                  label="Pour"
                  value={p}
                  pct={(p / total) * 100}
                  color="var(--color-pour)"
                  icon="✅"
                />
                <VoteStat
                  label="Contre"
                  value={c}
                  pct={(c / total) * 100}
                  color="var(--color-contre)"
                  icon="❌"
                />
                <VoteStat
                  label="Abstention"
                  value={a}
                  pct={(a / total) * 100}
                  color="var(--color-abstention)"
                  icon="⚪"
                />
              </div>
            </div>
          )}

          {/* ── Résumé IA ── */}
          {aiContext && (
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                <span aria-hidden="true">⭐</span>
                Pourquoi ce vote est important ?
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{aiContext}</p>
            </div>
          )}

          {/* ── Tags ── */}
          {s.tags && s.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {s.tags.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-[11px] rounded-full glass border border-border/40 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Actions / liens ── */}
        <div className="border-t border-border/30 px-6 py-4 flex flex-wrap gap-3">
          <Link
            to="/scrutin/$numero"
            params={{ numero: s.numero }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full btn-primary text-sm font-medium"
          >
            Voir les députés qui ont voté →
          </Link>
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass border border-border/50 text-sm font-medium hover:border-primary/30 transition-colors"
            aria-expanded={showDetail}
          >
            {showDetail ? "Masquer" : "Les groupes politiques"}
          </button>
        </div>

        {/* ── Détail groupes (expandable) ── */}
        {showDetail && (
          <div className="px-6 pb-6 animate-fade-up">
            <GroupsDetail s={s} />
          </div>
        )}
      </article>
    </li>
  );
}

// ─── Vote Stat ────────────────────────────────────────────────────────────────

function VoteStat({
  label,
  value,
  pct,
  color,
  icon,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="glass rounded-xl border border-border/30 p-3">
      <div className="text-lg mb-0.5" aria-hidden="true">{icon}</div>
      <div className="font-bold text-lg" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-[10px] font-semibold" style={{ color }}>
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

// ─── Groups Detail ────────────────────────────────────────────────────────────
// Affiche les votes par groupe si disponibles dans les données du scrutin.
// Si l'API expose groupesVotes, on les affiche ; sinon un message.
function GroupsDetail({ s }: { s: Scrutin }) {
  // Les données de l'API peuvent varier — adapte ce champ si nécessaire.
  const groups = (s as Record<string, unknown>).groupesVotes as
    | Array<{ sigle: string; pour: number; contre: number; abstention: number }>
    | undefined;

  if (!groups || groups.length === 0) {
    return (
      <div className="rounded-2xl glass border border-border/30 p-4 text-center text-sm text-muted-foreground">
        Détail par groupe non disponible pour ce scrutin.{" "}
        <Link
          to="/scrutin/$numero"
          params={{ numero: s.numero }}
          className="text-primary underline underline-offset-2"
        >
          Voir la page complète
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass border border-border/30 p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Vote par groupe politique
      </p>
      {groups.map((g) => {
        const t = Math.max(1, g.pour + g.contre + g.abstention);
        const pctPour = (g.pour / t) * 100;
        const majority = g.pour > g.contre ? "pour" : "contre";
        return (
          <div key={g.sigle} className="flex items-center gap-3">
            <span className="text-xs font-mono w-16 text-muted-foreground shrink-0">
              {g.sigle}
            </span>
            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pctPour}%`,
                  backgroundColor:
                    majority === "pour"
                      ? "var(--color-pour)"
                      : "var(--color-contre)",
                }}
              />
            </div>
            <div className="flex gap-2 text-[10px] shrink-0">
              <span style={{ color: "var(--color-pour)" }}>{g.pour}p</span>
              <span style={{ color: "var(--color-contre)" }}>{g.contre}c</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
