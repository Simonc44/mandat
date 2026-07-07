// routes/groupes.tsx — Heatmap de proximité + simulateur de coalition hémicycle

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { scrutinsQuery, allDeputesQuery, groupeMeta } from "@/lib/api";
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

type GroupeStats = { sigle: string; nom: string; couleur: string; sieges: number; };

const MAJORITE_ABSOLUE = 289;
const TOTAL_SIEGES = 577;

// Hémicycle : rangées de sièges (approximation)
// L'AN a 577 sièges répartis sur ~10 rangées en demi-cercle
const ROWS = [34, 44, 53, 58, 62, 67, 70, 74, 59, 56];
// total = 577

function GroupesPage() {
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);

  const groupes: GroupeStats[] = useMemo(() => {
    const map = new Map<string, number>();
    deputes.forEach(d => { if (d.groupe_sigle) map.set(d.groupe_sigle, (map.get(d.groupe_sigle) ?? 0) + 1); });
    return Array.from(map.entries())
      .map(([sigle, sieges]) => ({ sigle, sieges, ...groupeMeta(sigle) }))
      .sort((a, b) => b.sieges - a.sieges);
  }, [deputes]);

  const proximite = useMemo(() => {
    const mat = new Map<string, Map<string, number>>();
    const sigles = groupes.map(g => g.sigle);
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
        <p className="text-muted-foreground max-w-2xl">Proximité de vote entre groupes et simulateur de coalition — basés sur les scrutins réels de la 17e législature.</p>
      </div>

      <section className="mb-14 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <h2 className="font-display text-2xl mb-2">Proximité de vote</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Pourcentage de scrutins où deux groupes ont voté dans le même sens. Vert = souvent d'accord, rouge = souvent opposés.
        </p>
        <ProximiteHeatmap groupes={groupes} proximite={proximite} />
      </section>

      <section className="mb-14 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <h2 className="font-display text-2xl mb-2">Simulateur de coalition</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Cliquez sur les groupes pour les ajouter à la coalition. La ligne rouge marque les 289 sièges de majorité absolue.
        </p>
        <CoalitionSimulator groupes={groupes} />
      </section>
    </div>
  );
}

// ── HEATMAP ────────────────────────────────────────────────────────────────────

function heatColor(pct: number): string {
  if (pct < 0) return "oklch(0.88 0.01 0 / 40%)";
  // vert foncé ≥ 70, orange 40-70, rouge < 40
  if (pct >= 70) return `color-mix(in oklch, oklch(0.52 0.17 145) ${Math.round(40 + (pct - 70) * 2)}%, transparent)`;
  if (pct >= 40) return `color-mix(in oklch, oklch(0.65 0.18 60) ${Math.round(15 + (pct - 40) * 0.8)}%, transparent)`;
  return `color-mix(in oklch, oklch(0.55 0.20 15) ${Math.round(20 + (100 - pct) * 0.5)}%, transparent)`;
}

function ProximiteHeatmap({ groupes, proximite }: { groupes: GroupeStats[]; proximite: Map<string, Map<string, number>> }) {
  const [hovered, setHovered] = useState<[string, string] | null>(null);
  const top = groupes.slice(0, 10);

  return (
    <div className="card-glass rounded-[2rem] p-5 overflow-x-auto">
      <table className="border-collapse" style={{ fontSize: 11 }} aria-label="Matrice de proximité entre groupes">
        <thead>
          <tr>
            {/* Coin vide */}
            <th className="pb-3" style={{ minWidth: 120 }} />
            {top.map(g => (
              <th key={g.sigle} className="pb-3 text-center" style={{ minWidth: 52 }}>
                <div className="flex flex-col items-center gap-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.couleur }} aria-hidden="true" />
                  <span className="font-semibold text-foreground" style={{ fontSize: 10 }}>{g.sigle}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {top.map(rowG => (
            <tr key={rowG.sigle}>
              {/* Libellé ligne — nom complet */}
              <td className="pr-4 py-0.5">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-right font-medium text-foreground/80" style={{ fontSize: 11, maxWidth: 110 }}>{rowG.nom}</span>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rowG.couleur }} aria-hidden="true" />
                </div>
              </td>
              {top.map(colG => {
                const isDiag = rowG.sigle === colG.sigle;
                const pct = isDiag ? 100 : (proximite.get(rowG.sigle)?.get(colG.sigle) ?? -1);
                const isHov = hovered && ((hovered[0]===rowG.sigle && hovered[1]===colG.sigle) || (hovered[0]===colG.sigle && hovered[1]===rowG.sigle));
                return (
                  <td key={colG.sigle} className="text-center" style={{ padding: "2px" }}>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold mx-auto cursor-default transition-transform duration-150 ${isHov ? "scale-110 ring-2 ring-blue-500/50" : ""}`}
                      style={{
                        background: isDiag
                          ? `color-mix(in oklch, ${rowG.couleur} 35%, transparent)`
                          : heatColor(pct),
                        fontSize: isDiag ? 9 : 12,
                        color: pct >= 65 && !isDiag ? "oklch(0.15 0 0)" : "var(--foreground)",
                      }}
                      onMouseEnter={() => !isDiag && setHovered([rowG.sigle, colG.sigle])}
                      onMouseLeave={() => setHovered(null)}
                      title={isDiag ? rowG.nom : pct >= 0 ? `${rowG.sigle} / ${colG.sigle} : ${pct}% de scrutins convergents` : "Données insuffisantes (<5 scrutins communs)"}
                      aria-label={isDiag ? rowG.nom : pct >= 0 ? `${rowG.sigle} et ${colG.sigle} : ${pct}%` : "—"}
                    >
                      {isDiag ? rowG.sigle : pct >= 0 ? `${pct}%` : "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tooltip hover */}
      {hovered && (() => {
        const pct = proximite.get(hovered[0])?.get(hovered[1]) ?? -1;
        const gA = groupes.find(g => g.sigle === hovered[0]);
        const gB = groupes.find(g => g.sigle === hovered[1]);
        if (!gA || !gB) return null;
        const label = pct < 0 ? "Données insuffisantes" : pct >= 70 ? "Votes très convergents" : pct >= 40 ? "Votes modérément convergents" : "Votes souvent opposés";
        return (
          <div className="mt-4 px-4 py-3 rounded-2xl glass border border-border/50 text-sm animate-fade-up" style={{ maxWidth: 420 }}>
            <span className="font-semibold" style={{ color: gA.couleur }}>{gA.nom}</span>
            <span className="text-muted-foreground mx-2">+</span>
            <span className="font-semibold" style={{ color: gB.couleur }}>{gB.nom}</span>
            <span className="mx-2 text-muted-foreground">—</span>
            {pct >= 0 ? <><span className="font-bold">{pct}%</span> <span className="text-muted-foreground text-xs">{label}</span></> : <span className="text-muted-foreground text-xs">{label}</span>}
          </div>
        );
      })()}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(80) }} />≥ 70 % — Souvent d'accord</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(50) }} />40–70 % — Neutres</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(20) }} />{"< 40 %"} — Souvent opposés</div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded" style={{ background: heatColor(-1) }} />— Données insuffisantes</div>
      </div>
    </div>
  );
}

// ── SIMULATEUR COALITION — HÉMICYCLE ──────────────────────────────────────────

function CoalitionSimulator({ groupes }: { groupes: GroupeStats[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (sigle: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(sigle) ? n.delete(sigle) : n.add(sigle); return n; });

  const totalSieges = groupes.filter(g => selected.has(g.sigle)).reduce((s, g) => s + g.sieges, 0);
  const hasMajorite = totalSieges >= MAJORITE_ABSOLUE;

  // Construire la liste ordonnée des sièges (gauche→droite politiquement)
  // On distribue les sièges par groupe dans l'ordre de la grille
  const seatList: { couleur: string; sigle: string; inCoalition: boolean }[] = useMemo(() => {
    const seats: { couleur: string; sigle: string; inCoalition: boolean }[] = [];
    for (const g of groupes) {
      for (let i = 0; i < g.sieges; i++) {
        seats.push({ couleur: g.couleur, sigle: g.sigle, inCoalition: selected.has(g.sigle) });
      }
    }
    return seats;
  }, [groupes, selected]);

  // Placement en hémicycle SVG
  // On place les sièges sur des arcs concentriques
  const W = 560, H = 300;
  const CX = W / 2, CY = H - 10;
  const ROWS_RADII = [90, 115, 140, 165, 190, 215, 240, 265, 290, 315];

  const seatPositions: { x: number; y: number; couleur: string; sigle: string; inCoalition: boolean; idx: number }[] = useMemo(() => {
    const positions: { x: number; y: number; couleur: string; sigle: string; inCoalition: boolean; idx: number }[] = [];
    let seatIdx = 0;
    ROWS.forEach((count, row) => {
      const r = ROWS_RADII[row];
      for (let i = 0; i < count; i++) {
        if (seatIdx >= seatList.length) break;
        // Angle : de PI (gauche) à 0 (droite), réparti uniformément
        const angle = Math.PI - (i / (count - 1)) * Math.PI;
        const x = CX + r * Math.cos(angle);
        const y = CY - r * Math.sin(angle);
        positions.push({ x, y, ...seatList[seatIdx], idx: seatIdx });
        seatIdx++;
      }
    });
    return positions;
  }, [seatList]);

  return (
    <div className="card-glass rounded-[2rem] p-6 space-y-6">
      {/* Hémicycle SVG */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto" style={{ minWidth: 320 }} role="img" aria-label="Hémicycle de l'Assemblée nationale — simulation de coalition">
          {/* Fond arc */}
          <path d={`M ${CX - 330} ${CY} A 330 330 0 0 1 ${CX + 330} ${CY}`} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.4" />

          {/* Ligne majorité absolue */}
          {(() => {
            // Le siège numéro 289 (majorité absolue)
            const majSeat = seatPositions[MAJORITE_ABSOLUE - 1];
            if (!majSeat) return null;
            return (
              <>
                <line x1={CX} y1={CY} x2={majSeat.x} y2={majSeat.y} stroke="oklch(0.6 0.18 30)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                <text x={majSeat.x + 4} y={majSeat.y - 4} fontSize="9" fill="oklch(0.6 0.18 30)" fontWeight="600">289 (maj.)</text>
              </>
            );
          })()}

          {/* Sièges */}
          {seatPositions.map(s => (
            <circle
              key={s.idx}
              cx={s.x}
              cy={s.y}
              r={4.2}
              fill={s.inCoalition ? s.couleur : "oklch(0.88 0.01 0 / 50%)"}
              stroke={s.inCoalition ? "white" : "transparent"}
              strokeWidth={s.inCoalition ? 0.8 : 0}
              style={{ transition: "fill 300ms ease, stroke 300ms ease" }}
              aria-hidden="true"
            />
          ))}

          {/* Centre — score */}
          <text x={CX} y={CY - 18} textAnchor="middle" fontSize="28" fontWeight="700"
            fill={hasMajorite ? "oklch(0.45 0.18 145)" : "var(--foreground)"}
            style={{ fontFamily: "var(--font-display, serif)" }}>
            {totalSieges}
          </text>
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize="10"
            fill={hasMajorite ? "oklch(0.45 0.18 145)" : "oklch(0.55 0.02 0)"} fontWeight="500">
            {hasMajorite ? `✓ Majorité absolue (+${totalSieges - MAJORITE_ABSOLUE})` : totalSieges === 0 ? "Sélectionnez des groupes" : `${MAJORITE_ABSOLUE - totalSieges} sièges manquants`}
          </text>
        </svg>
      </div>

      {/* Groupes — boutons toggle */}
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
              style={active ? { borderColor: g.couleur, backgroundColor: `color-mix(in oklch, ${g.couleur} 12%, transparent)` } : {}}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.couleur }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs truncate" style={{ color: active ? g.couleur : "var(--foreground)" }}>{g.sigle}</div>
                <div className="text-[10px] text-muted-foreground truncate">{g.nom}</div>
                <div className="text-[10px] text-muted-foreground">{g.sieges} sièges</div>
              </div>
              {active && <span className="ml-auto text-[10px] font-bold" style={{ color: g.couleur }}>✓</span>}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="pt-4 border-t border-border/40 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground text-xs">
            Coalition : {groupes.filter(g => selected.has(g.sigle)).map(g => g.nom).join(" + ")}
          </span>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">Réinitialiser</button>
        </div>
      )}
    </div>
  );
}
