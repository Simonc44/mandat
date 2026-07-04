// routes/groupes.tsx — Heatmap de proximité + simulateur de coalition

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { scrutinsQuery, allDeputesQuery, GROUPES, groupeMeta, sanitizeText } from "@/lib/api";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

export const Route = createFileRoute("/groupes")({
  head: () => ({
    meta: createSeoMeta({
      title: "Groupes politiques — Proximité, coalition et votes · Mandat",
      description: "Analysez la proximité de vote entre les groupes politiques de l'Assemblée nationale. Simulez des coalitions et calculez leur majorité.",
      canonical: `${SITE_URL}/groupes`,
    }),
    links: createSeoLinks(`${SITE_URL}/groupes`),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(scrutinsQuery),
      context.queryClient.ensureQueryData(allDeputesQuery),
    ]),
  component: GroupesPage,
});

// ── TYPES ──
type GroupeStats = {
  sigle: string;
  nom: string;
  couleur: string;
  sieges: number;
};

function GroupesPage() {
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);

  // ── Liste des groupes avec nombre de sièges ──
  const groupes: GroupeStats[] = useMemo(() => {
    const map = new Map<string, number>();
    deputes.forEach(d => { if (d.groupe_sigle) map.set(d.groupe_sigle, (map.get(d.groupe_sigle) ?? 0) + 1); });
    return Array.from(map.entries())
      .map(([sigle, sieges]) => ({ sigle, sieges, ...groupeMeta(sigle) }))
      .sort((a, b) => b.sieges - a.sieges);
  }, [deputes]);

  // ── Matrice de proximité ──
  // Pour chaque paire de groupes, ratio de scrutins où les deux ont voté dans le même sens
  const proximite: Map<string, Map<string, number>> = useMemo(() => {
    const mat = new Map<string, Map<string, number>>();
    const sigles = groupes.map(g => g.sigle);

    // Pour chaque scrutin avec données groupes, on compte les votes convergents
    const concordance = new Map<string, Map<string, { same: number; total: number }>>();
    sigles.forEach(a => { concordance.set(a, new Map()); sigles.forEach(b => concordance.get(a)!.set(b, { same: 0, total: 0 })); });

    for (const s of scrutins) {
      if (!s.groupes || s.groupes.length < 2) continue;
      const positions = new Map<string, string>();
      for (const g of s.groupes) {
        if (g.positionMajoritaire && g.organeRef) positions.set(g.organeRef, g.positionMajoritaire);
      }
      for (const [a, posA] of positions) {
        for (const [b, posB] of positions) {
          if (a === b) continue;
          const cell = concordance.get(a)?.get(b);
          if (!cell) continue;
          cell.total++;
          if (posA === posB) cell.same++;
        }
      }
    }

    sigles.forEach(a => {
      mat.set(a, new Map());
      sigles.forEach(b => {
        const cell = concordance.get(a)?.get(b);
        const pct = cell && cell.total >= 5 ? Math.round((cell.same / cell.total) * 100) : null;
        mat.get(a)!.set(b, pct ?? -1);
      });
    });

    return mat;
  }, [scrutins, groupes]);

  return (
    <div className="container-app py-12">
      <div className="mb-10 animate-fade-up">
        <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3 font-medium">Analyse politique</div>
        <h1 className="font-display text-4xl md:text-5xl mb-3 tracking-tight">Groupes politiques</h1>
        <p className="text-muted-foreground max-w-2xl">
          Proximité de vote entre groupes et simulateur de coalition — basés sur les scrutins réels de la 17e législature.
        </p>
      </div>

      {/* ── HEATMAP ── */}
      <section className="mb-14 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <h2 className="font-display text-2xl mb-2">Proximité de vote</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Pourcentage de scrutins où deux groupes ont voté dans le même sens. Plus c'est élevé, plus ils votent ensemble.
        </p>
        <ProximiteHeatmap groupes={groupes} proximite={proximite} />
      </section>

      {/* ── SIMULATEUR ── */}
      <section className="mb-14 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <h2 className="font-display text-2xl mb-2">Simulateur de coalition</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Sélectionnez des groupes pour calculer leur poids combiné. La majorité absolue est à 289 sièges.
        </p>
        <CoalitionSimulator groupes={groupes} />
      </section>
    </div>
  );
}

// ── HEATMAP ──────────────────────────────────────────────────────────────────────

function heatColor(pct: number): string {
  if (pct < 0) return "oklch(0.92 0 0 / 30%)";
  if (pct >= 70) return `oklch(${0.35 + (pct - 70) * 0.003} 0.18 145 / ${40 + (pct - 70) * 1.5}%)`;
  if (pct >= 40) return `oklch(0.65 0.18 60 / ${20 + (pct - 40) * 0.8}%)`;
  return `oklch(0.55 0.20 15 / ${15 + (100 - pct) * 0.4}%)`;
}

function ProximiteHeatmap({ groupes, proximite }: { groupes: GroupeStats[]; proximite: Map<string, Map<string, number>> }) {
  const top = groupes.slice(0, 10); // On affiche les 10 plus grands groupes pour la lisibilité

  return (
    <div className="card-glass rounded-[2rem] p-4 overflow-x-auto">
      <table className="text-xs border-collapse w-full" aria-label="Matrice de proximité entre groupes">
        <thead>
          <tr>
            <th className="w-8 h-8" />
            {top.map(g => (
              <th key={g.sigle} className="pb-3 text-center font-medium" style={{ minWidth: 48 }}>
                <div className="flex flex-col items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: g.couleur }} aria-hidden="true" />
                  <span className="text-muted-foreground" style={{ fontSize: 10 }}>{g.sigle}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {top.map(rowG => (
            <tr key={rowG.sigle}>
              <td className="pr-3 text-right" style={{ minWidth: 48 }}>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-muted-foreground font-medium" style={{ fontSize: 10 }}>{rowG.sigle}</span>
                  <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: rowG.couleur }} aria-hidden="true" />
                </div>
              </td>
              {top.map(colG => {
                const pct = rowG.sigle === colG.sigle ? 100 : (proximite.get(rowG.sigle)?.get(colG.sigle) ?? -1);
                const isDiag = rowG.sigle === colG.sigle;
                return (
                  <td key={colG.sigle} className="text-center" style={{ padding: "2px" }}>
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold mx-auto"
                      style={{
                        background: isDiag ? `color-mix(in oklch, ${rowG.couleur} 30%, transparent)` : heatColor(pct),
                        color: pct >= 60 || isDiag ? "oklch(0.2 0 0)" : "var(--text-foreground)",
                        fontSize: 11,
                      }}
                      title={pct >= 0 ? `${rowG.sigle} / ${colG.sigle} : ${isDiag ? "100" : pct}%` : "Données insuffisantes"}
                      aria-label={`${rowG.sigle} et ${colG.sigle} : ${isDiag ? "même groupe" : pct >= 0 ? `${pct}% de votes convergents` : "données insuffisantes"}`}
                    >
                      {isDiag ? rowG.sigle.slice(0, 2) : pct >= 0 ? `${pct}%` : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground px-1">
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(80) }} />≥ 70 % — Votes très convergents</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(50) }} />40–70 % — Neutres</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(20) }} />≤ 40 % — Votes divergents</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(-1) }} />— Données insuffisantes</div>
      </div>
    </div>
  );
}

// ── SIMULATEUR COALITION ───────────────────────────────────────────────────────────

const MAJORITE_ABSOLUE = 289;
const TOTAL_SIEGES = 577;

function CoalitionSimulator({ groupes }: { groupes: GroupeStats[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (sigle: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(sigle) ? n.delete(sigle) : n.add(sigle); return n; });
  };

  const totalSieges = groupes.filter(g => selected.has(g.sigle)).reduce((s, g) => s + g.sieges, 0);
  const hasMajorite = totalSieges >= MAJORITE_ABSOLUE;
  const pct = Math.round((totalSieges / TOTAL_SIEGES) * 100);

  return (
    <div className="card-glass rounded-[2rem] p-6">
      {/* Barre de l'hémicycle */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{totalSieges} sièges sélectionnés</span>
          <span className={`font-semibold ${ hasMajorite ? "text-green-600" : "text-muted-foreground" }`}>
            {hasMajorite ? `✓ Majorité absolue (+${totalSieges - MAJORITE_ABSOLUE})` : `${MAJORITE_ABSOLUE - totalSieges} manquants pour la majorité`}
          </span>
        </div>
        <div className="relative h-5 rounded-full overflow-hidden bg-muted/60">
          {/* Segments par groupe */}
          {(() => {
            let left = 0;
            return groupes.filter(g => selected.has(g.sigle)).map(g => {
              const w = (g.sieges / TOTAL_SIEGES) * 100;
              const el = (
                <div key={g.sigle} className="absolute top-0 bottom-0 transition-all duration-500"
                  style={{ left: `${left}%`, width: `${w}%`, backgroundColor: g.couleur }}
                  title={`${g.sigle} : ${g.sieges} sièges`} />
              );
              left += w;
              return el;
            });
          })()}
          {/* Ligne majorité absolue */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/60 z-10" style={{ left: `${(MAJORITE_ABSOLUE / TOTAL_SIEGES) * 100}%` }}
            title="Majorité absolue : 289 sièges" aria-label="Seuil de majorité absolue" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0</span>
          <span style={{ marginLeft: `${(MAJORITE_ABSOLUE / TOTAL_SIEGES) * 100 - 10}%` }}>289</span>
          <span>{TOTAL_SIEGES}</span>
        </div>
      </div>

      {/* Grille des groupes — boutons toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {groupes.map(g => {
          const active = selected.has(g.sigle);
          return (
            <button
              key={g.sigle}
              onClick={() => toggle(g.sigle)}
              aria-pressed={active}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all duration-200 ${
                active ? "border-2 shadow-md" : "glass border-border/40 hover:border-primary/30"
              }`}
              style={active ? { borderColor: g.couleur, backgroundColor: `color-mix(in oklch, ${g.couleur} 10%, transparent)` } : {}}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.couleur }} aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-semibold text-xs truncate" style={{ color: active ? g.couleur : "var(--foreground)" }}>{g.sigle}</div>
                <div className="text-[10px] text-muted-foreground">{g.sieges} sièges</div>
              </div>
              {active && <span className="ml-auto text-[10px] font-bold" style={{ color: g.couleur }}>✓</span>}
            </button>
          );
        })}
      </div>

      {selected.size === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">Sélectionnez des groupes pour simuler une coalition.</p>
      )}

      {selected.size > 0 && (
        <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            Coalition : {groupes.filter(g => selected.has(g.sigle)).map(g => g.sigle).join(" + ")}
          </span>
          <span className="ml-auto font-semibold" style={{ color: hasMajorite ? "var(--color-pour)" : "var(--color-contre)" }}>
            {pct} % des sièges — {hasMajorite ? "Majorité absolue" : "Minorité"}
          </span>
        </div>
      )}
    </div>
  );
}
