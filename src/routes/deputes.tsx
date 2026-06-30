// routes/deputes.tsx — Liquid Glass + filtres + pagination

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  allDeputesQuery,
  normalize,
  sanitizeSearchInput,
  GROUPES,
  groupeMeta,
} from "@/lib/api";

import { DeputeCard, DeputeCardSkeletonGrid } from "@/components/DeputeCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchX, Download, Map as MapIcon } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";
import { toPng } from "html-to-image";
import { toast } from "sonner";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  groupe: fallback(z.string(), "").default(""),
  dept: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/deputes")({
  head: () => ({
    meta: createSeoMeta({
      title: "Les 577 député·es — Mandat",
      description:
        "Cherchez et filtrez les député·es à l'Assemblée nationale par groupe politique, département ou nom. 17e législature.",
      canonical: `${SITE_URL}/deputes`,
    }),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(allDeputesQuery),
  component: DeputesPage,
});

const PAGE_SIZE = 30;

function DeputesPage() {
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);
  const { q, groupe, dept, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  const groupes = useMemo(() => {
    const map = new Map<string, number>();
    deputes.forEach((d) => {
      if (d.groupe_sigle)
        map.set(d.groupe_sigle, (map.get(d.groupe_sigle) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [deputes]);

  const departments = useMemo(() => {
    const map = new Map<string, string>();
    deputes.forEach((d) => {
      if (d.num_deptmt) map.set(d.num_deptmt, d.nom_circo);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [deputes]);

  const filtered = useMemo(() => {
    const n = normalize(q);
    return deputes.filter((d) => {
      if (groupe && d.groupe_sigle !== groupe) return false;
      if (dept && d.num_deptmt !== dept) return false;
      if (
        n &&
        !normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.num_deptmt}`,
        ).includes(n)
      )
        return false;
      return true;
    });
  }, [deputes, q, groupe, dept]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page > totalPages ? totalPages : page, totalPages);
  const slice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const setFilter = (
    patch: Partial<{ q: string; groupe: string; dept: string; page: number }>,
  ) =>
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        page: patch.page ?? 1,
      }),
    });

  const hasFilters = !!(q || groupe || dept);

  return (
    <div className="container-app py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl mb-2">Député·es</h1>
        <p className="text-muted-foreground">
          {filtered.length.toLocaleString("fr-FR")} résultat
          {filtered.length > 1 ? "s" : ""} sur {deputes.length} député·es ·
          XVIIe législature
        </p>
      </div>

      {/* Recherche */}
      <div
        className="sticky-toolbar sticky top-[calc(4rem-1px)] -mx-4 px-4 py-4 space-y-4 mb-8 animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ q: sanitizeSearchInput(search) });
          }}
          className="flex flex-col sm:flex-row gap-2"
          role="search"
        >
          <div className="search-ring flex-1 flex items-center glass-strong rounded-full border border-white/30 px-6">
            <svg
              className="w-4 h-4 text-muted-foreground shrink-0 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, prénom, circonscription…"
              className="flex-1 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-6 py-3 rounded-full text-sm font-medium"
          >
            Chercher
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                navigate({
                  search: { q: "", groupe: "", dept: "", page: 1 },
                });
              }}
              className="px-6 py-3 rounded-full glass border border-border/50 text-sm hover:border-primary/30 transition-colors"
            >
              ✕ Réinit.
            </button>
          )}
        </form>

        {/* Filtres groupes */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par groupe"
        >
          <button
            onClick={() => setFilter({ groupe: "" })}
            aria-pressed={!groupe}
            className={chipCls(!groupe)}
          >
            Tous
          </button>
          {groupes.map(([sig, count]) => (
            <button
              key={sig}
              onClick={() => setFilter({ groupe: sig })}
              aria-pressed={groupe === sig}
              className={chipCls(groupe === sig)}
              title={GROUPES[sig]?.nom ?? sig}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    GROUPES[sig]?.couleur ?? "oklch(0.55 0.02 285)",
                }}
                aria-hidden="true"
              />
              {sig || "NI"}
              <span className="opacity-50 text-[10px]">· {count}</span>
            </button>
          ))}
        </div>

        {/* Filtre département */}
        <div className="w-full sm:w-72">
          <Select
            value={dept || "all"}
            onValueChange={(v) => setFilter({ dept: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-auto py-2.5 px-6 rounded-full glass border-border/50 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              <SelectValue placeholder="Tous les départements" />
            </SelectTrigger>
            <SelectContent className="glass-strong border-border/40 rounded-2xl overflow-hidden shadow-2xl">
              <SelectItem value="all">Tous les départements</SelectItem>
              {departments.map(([num, nom]) => (
                <SelectItem
                  key={num}
                  value={num}
                  className="rounded-xl mx-1 my-0.5"
                >
                  <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px] mr-2">
                    {num}
                  </span>
                  {nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Carte département (quand un département est sélectionné) */}
      {dept && (
        <DepartementCard
          numero={dept}
          deputes={filtered}
          nomDepartement={departments.find(([n]) => n === dept)?.[1] ?? ""}
        />
      )}

      {/* Résultats */}

      {slice.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <SearchX
            className="w-10 h-10 mx-auto mb-3 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            Aucun·e député·e ne correspond à ces critères.
          </p>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                navigate({ search: { q: "", groupe: "", dept: "", page: 1 } });
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger">
          {slice.map((d, i) => (
            <DeputeCard key={d.id || d.slug} d={d} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-2"
          aria-label="Pagination"
        >
          <button
            onClick={() => setFilter({ page: Math.max(1, safePage - 1) })}
            disabled={safePage <= 1}
            className="px-4 py-2 rounded-xl glass border border-border/50 text-sm disabled:opacity-40 hover:border-primary/30 transition-colors"
          >
            ← Préc.
          </button>

          {/* Pages numérotées */}
          <div className="flex items-center gap-1">
            {buildPageRange(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-muted-foreground text-sm"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setFilter({ page: p as number })}
                  aria-current={safePage === p ? "page" : undefined}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    safePage === p
                      ? "btn-primary"
                      : "glass border border-border/40 hover:border-primary/30"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() =>
              setFilter({ page: Math.min(totalPages, safePage + 1) })
            }
            disabled={safePage >= totalPages}
            className="px-4 py-2 rounded-xl glass border border-border/50 text-sm disabled:opacity-40 hover:border-primary/30 transition-colors"
          >
            Suiv. →
          </button>
        </nav>
      )}
    </div>
  );
}

function chipCls(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
    active
      ? "btn-primary border-transparent"
      : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
  }`;
}

// ── CARTE DÉPARTEMENT ──────────────────────────────────────
// Cartogramme moderne : chaque circonscription est un hexagone teinté
// par la couleur du groupe politique de son·sa député·e.

function DepartementCard({
  numero,
  nomDepartement,
  deputes,
}: {
  numero: string;
  nomDepartement: string;
  deputes: import("@/lib/api").Depute[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const circos = [...deputes].sort(
    (a, b) => (a.num_circo ?? 0) - (b.num_circo ?? 0),
  );

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "white",
        style: {
          borderRadius: "0",
        },
      });
      const link = document.createElement("a");
      link.download = `mandat-carte-dept-${numero}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Carte téléchargée !");
    } catch (err) {
      console.error("Erreur téléchargement", err);
      toast.error("Échec du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  // Layout hexagonal — calcul des positions pour un cluster compact
  const n = circos.length;
  const cols = Math.ceil(Math.sqrt(n * 1.3));
  const hexW = 88;
  const hexH = 100;
  const xStep = hexW * 0.86;
  const yStep = hexH * 0.75;

  return (
    <section
      ref={cardRef}
      className="dept-card relative mb-10 overflow-hidden rounded-[2rem] border border-white/40 glass-strong animate-fade-up"
      aria-label={`Département ${numero}`}
    >
      <div
        className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(90% 70% at 80% 0%, oklch(0.62 0.20 285 / 28%), transparent 60%), radial-gradient(70% 60% at 0% 100%, oklch(0.55 0.18 215 / 22%), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="grid md:grid-cols-[auto_1fr] gap-8 p-8 md:p-12">
        {/* Numéro géant */}
        <div className="flex flex-col items-center md:items-start">
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary/80 font-medium mb-2">
            Département
          </div>
          <div
            className="font-display leading-none tracking-tighter text-gradient"
            style={{ fontSize: "clamp(7rem, 18vw, 14rem)" }}
          >
            {numero}
          </div>
          <div className="text-base md:text-lg text-foreground/80 font-medium mt-1 max-w-[18ch] text-center md:text-left">
            {nomDepartement || `Département ${numero}`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {circos.length} circonscription{circos.length > 1 ? "s" : ""}
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="mt-8 btn-primary px-4 py-2 text-xs flex items-center gap-2"
          >
            {downloading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Télécharger la carte
          </button>
        </div>

        {/* Cartogramme hexagonal */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5" />
              Circonscriptions
            </div>
            <div className="text-[10px] text-muted-foreground">
              Couleur = groupe politique
            </div>
          </div>

          {/* SVG hex grid */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${cols * xStep + hexW * 0.2} ${Math.ceil(n / cols) * yStep + hexH * 0.35}`}
              className="w-full h-auto"
              role="img"
              aria-label={`Carte des ${n} circonscriptions du département ${numero}`}
            >
              <defs>
                <filter
                  id="hexShadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2"
                    floodOpacity="0.15"
                  />
                </filter>
              </defs>
              {circos.map((d, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * xStep + (row % 2 ? xStep / 2 : 0) + hexW / 2;
                const y = row * yStep + hexH / 2;
                const g = groupeMeta(d.groupe_sigle);
                const r = hexW / 2 - 4;
                const points = Array.from({ length: 6 }, (_, k) => {
                  const a = (Math.PI / 3) * k - Math.PI / 2;
                  return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
                }).join(" ");
                return (
                  <Link
                    key={d.id || d.slug}
                    to="/depute/$slug"
                    params={{ slug: d.slug }}
                    className="dept-hex group/hex outline-none focus:ring-2 focus:ring-primary rounded-full"
                  >
                    <title>{`${d.num_circo}e circonscription — ${d.prenom} ${d.nom_de_famille} (${g.nom})`}</title>
                    <polygon
                      points={points}
                      fill={g.couleur}
                      fillOpacity="0.78"
                      stroke="white"
                      strokeWidth="2"
                      filter="url(#hexShadow)"
                      className="transition-all duration-200 group-hover/hex:fill-opacity-100 group-hover/hex:stroke-primary"
                    />
                    <text
                      x={x}
                      y={y - 6}
                      textAnchor="middle"
                      fill="white"
                      fontSize="20"
                      fontWeight="700"
                      style={{ fontFamily: "Fraunces, serif" }}
                      className="pointer-events-none"
                    >
                      {d.num_circo}
                    </text>
                    <text
                      x={x}
                      y={y + 14}
                      textAnchor="middle"
                      fill="white"
                      fontSize="8"
                      fontWeight="600"
                      opacity="0.95"
                      className="pointer-events-none"
                    >
                      {(d.nom_de_famille || "").slice(0, 10).toUpperCase()}
                    </text>
                  </Link>
                );
              })}
            </svg>
          </div>

          {/* Liste détaillée — noms complets, sans abréviations */}
          <ul className="mt-5 grid sm:grid-cols-2 gap-2">
            {circos.map((d) => {
              const g = groupeMeta(d.groupe_sigle);
              return (
                <li
                  key={`row-${d.id || d.slug}`}
                  className="flex items-center gap-3 rounded-xl glass border border-white/30 p-2.5"
                >
                  <span
                    className="font-display text-lg w-8 text-center text-primary"
                    aria-hidden="true"
                  >
                    {d.num_circo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {d.prenom} {d.nom_de_famille}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: g.couleur }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{g.nom}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Signature Mandat */}
          <div className="mt-6 pt-5 border-t border-white/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt=""
                aria-hidden="true"
                className="w-6 h-6"
                width={24}
                height={24}
              />
              <span className="font-display text-base text-ink tracking-tight">
                Mandat
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hidden sm:inline">
                · Transparence citoyenne
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              17<sup>e</sup> législature
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  )
    pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
