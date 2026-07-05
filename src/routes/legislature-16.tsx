// routes/legislature-16.tsx — Archive 16e législature (2022-2024)
// Données nosdeputes.fr via server function (CORS contourné).
// Onglets Député·es / Scrutins.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  getDeputes16,
  getScrutins16,
  type Depute16,
  type Scrutin16,
} from "@/lib/legislature16.functions";
import { groupeMeta, normalize, sanitizeSearchInput } from "@/lib/api";
import { Archive, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { createSeoMeta, createSeoLinks, SITE_URL } from "./__root";

const deputes16Query = queryOptions({
  queryKey: ["deputes", 16],
  staleTime: 1000 * 60 * 60,
  queryFn: () => getDeputes16(),
});

const scrutins16Query = queryOptions({
  queryKey: ["scrutins", 16],
  staleTime: 1000 * 60 * 60,
  queryFn: () => getScrutins16(),
});

const searchSchema = z.object({
  tab: fallback(z.enum(["deputes", "scrutins"]), "deputes").default("deputes"),
  q: fallback(z.string(), "").default(""),
  groupe: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/legislature-16")({
  head: () => ({
    meta: createSeoMeta({
      title: "16ᵉ législature (2022-2024) — Archive · Mandat",
      description:
        "Archive complète des 577 député·es et des scrutins de la 16e législature de l'Assemblée nationale (2022-2024). Données ouvertes nosdeputes.fr.",
      canonical: `${SITE_URL}/legislature-16`,
    }),
    links: createSeoLinks(`${SITE_URL}/legislature-16`),
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(deputes16Query),
      context.queryClient.ensureQueryData(scrutins16Query),
    ]),
  component: Legislature16Page,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center glass rounded-[2.5rem] border border-red-200/30 my-12">
      <div className="w-16 h-16 bg-red-100/50 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-3">
        Erreur d'affichage
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Une erreur est survenue lors du chargement des archives de la 16e
        législature. Cela peut être dû à une interruption de connexion.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="btn-primary px-8 py-3 rounded-full font-semibold flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
        <Link
          to="/"
          className="glass px-8 py-3 rounded-full font-semibold text-foreground/70 hover:text-foreground transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 p-4 bg-black/5 rounded-lg text-xs font-mono text-left max-w-full overflow-auto">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      )}
    </div>
  ),
});

function Legislature16Page() {
  const { data: deputes } = useSuspenseQuery(deputes16Query);
  const { data: scrutins } = useSuspenseQuery(scrutins16Query);
  const { tab, q, groupe } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  // Reset le champ texte affiché quand on change d'onglet ou que l'URL change
  useEffect(() => setSearch(q), [q, tab]);

  const filteredDeputes = useMemo(() => {
    let list = [...deputes];
    if (groupe) list = list.filter((d) => d.groupe_sigle === groupe);
    const n = normalize(q);
    if (!n) return list;
    return list.filter((d) => {
      const full = normalize(`${d.prenom} ${d.nom_de_famille}`);
      return (
        full.includes(n) ||
        normalize(d.nom_circo || "").includes(n) ||
        normalize(d.num_deptmt || "").includes(n)
      );
    });
  }, [deputes, q, groupe]);

  const stats = useMemo(() => {
    const total = deputes.length;
    const femmes = deputes.filter((d) => d.sexe === "F").length;
    const groups = deputes.reduce(
      (acc, d) => {
        const s = d.groupe_sigle || "NI";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      femmes,
      femmesPct: Math.round((femmes / total) * 100),
      groups: Object.entries(groups).sort((a, b) => b[1] - a[1]),
    };
  }, [deputes]);

  return (
    <main className="container max-w-5xl mx-auto px-4 py-12 md:py-20 animate-fade-in">
      {/* Header Editorial */}
      <header className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-border/40 text-[11px] font-semibold uppercase tracking-widest text-primary mb-6">
          <Archive className="w-3.5 h-3.5" />
          Archives Historiques
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          16<sup className="lowercase">e</sup> Législature
          <span className="block text-primary/40 mt-1">2022 — 2024</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Consultation des archives de l'Assemblée nationale sous la mandature
          précédente. Retrouvez l'intégralité des 577 député·es et des scrutins
          publics.
        </p>
      </header>

      {/* Statistiques clés */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        aria-label="Statistiques de la 16e législature"
      >
        <StatCard label="Député·es" value={stats.total} />
        <StatCard
          label="Femmes"
          value={`${stats.femmesPct}%`}
          sub={`${stats.femmes} élues`}
        />
        <StatCard label="Scrutins" value={scrutins.length} />
        <StatCard label="Durée" value="2 ans" sub="22 juin 22 - 9 juin 24" />
      </section>

      {/* Navigation Onglets */}
      <nav
        className="flex p-1.5 glass rounded-[2rem] border border-border/40 mb-10 sticky top-4 z-50 shadow-sm backdrop-blur-xl"
        aria-label="Menu des archives"
      >
        <TabButton
          active={tab === "deputes"}
          onClick={() =>
            navigate({
              search: (p: Record<string, unknown>) => ({
                ...p,
                tab: "deputes",
              }),
            })
          }
        >
          Député·es
        </TabButton>
        <TabButton
          active={tab === "scrutins"}
          onClick={() =>
            navigate({
              search: (p: Record<string, unknown>) => ({
                ...p,
                tab: "scrutins",
              }),
            })
          }
        >
          Scrutins
        </TabButton>
      </nav>

      {/* Contenu */}
      <div className="min-h-[600px]">
        {tab === "deputes" ? (
          <DeputesTab
            deputes={filteredDeputes}
            stats={stats}
            q={q}
            groupe={groupe}
            search={search}
            setSearch={setSearch}
            navigate={navigate}
          />
        ) : (
          <ScrutinsTab
            scrutins={scrutins}
            q={q}
            search={search}
            setSearch={setSearch}
            navigate={navigate}
          />
        )}
      </div>

      <footer className="mt-24 pt-12 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          Données historiques issues de{" "}
          <a
            href="https://www.nosdeputes.fr"
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            NosDéputés.fr
          </a>{" "}
          et de l'Assemblée nationale.
        </p>
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="glass-strong p-6 rounded-[2rem] border border-white/40 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </div>
      <div className="font-display text-3xl font-bold text-foreground">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
      )}
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-6 rounded-full text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/40"
      }`}
    >
      {children}
    </button>
  );
}

// ─── ONGLET DEPUTES ───────────────────────────────────────────────────────

function DeputesTab({
  deputes,
  stats,
  q,
  groupe,
  search,
  setSearch,
  navigate,
}: {
  deputes: Depute16[];
  stats: any;
  q: string;
  groupe: string;
  search: string;
  setSearch: (v: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any;
}) {
  return (
    <div className="animate-fade-up">
      {/* Filtres */}
      <div className="sticky-toolbar sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 mb-10">
        <div className="flex flex-col md:flex-row gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({
                search: (p: Record<string, unknown>) => ({
                  ...p,
                  q: sanitizeSearchInput(search),
                }),
              });
            }}
            className="flex-1 flex gap-2"
            role="search"
          >
            <div className="search-ring flex-1 flex items-center glass-strong rounded-full border border-white/30 px-5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
                placeholder="Nom, département, circonscription…"
                className="flex-1 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                maxLength={100}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6 py-3 rounded-full text-sm font-medium"
            >
              Filtrer
            </button>
          </form>

          <select
            value={groupe}
            onChange={(e) =>
              navigate({
                search: (p: Record<string, unknown>) => ({
                  ...p,
                  groupe: e.target.value,
                }),
              })
            }
            className="glass-strong px-6 py-3 rounded-full text-sm font-medium border border-white/30 outline-none appearance-none cursor-pointer hover:border-primary/30 transition-colors"
            aria-label="Filtrer par groupe politique"
          >
            <option value="">Tous les groupes</option>
            {stats.groups.map(([sigle, count]: [string, number]) => (
              <option key={sigle} value={sigle}>
                {groupeMeta(sigle).nom} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      {deputes.length === 0 ? (
        <div className="py-24 text-center glass rounded-[3rem] border border-border/40">
          <div className="text-4xl mb-4" aria-hidden="true">
            🔍
          </div>
          <p className="text-muted-foreground">
            Aucun député ne correspond à votre recherche.
          </p>
          <button
            onClick={() =>
              navigate({
                search: (p: any) => ({ ...p, q: "", groupe: "" }),
              })
            }
            className="mt-4 text-primary font-semibold hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-label="Liste des député·es — 16e législature"
        >
          {deputes.map((d) => (
            <Depute16Card key={d.slug} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function Depute16Card({ d }: { d: Depute16 }) {
  const g = groupeMeta(d.groupe_sigle);
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Tente photo nosdeputes.fr, puis fallback SVG, puis initiales
  const photoSrc = d.photo || "";
  const fallbackSrc = "/images/depute-placeholder.svg";
  const initials =
    `${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`.toUpperCase();
  const nom = `${d.prenom || ""} ${d.nom_de_famille || ""}`.trim();

  return (
    <a
      href={d.url_an || `https://2022-2024.nosdeputes.fr/${d.slug}`}
      target="_blank"
      rel="noreferrer noopener"
      className="card-glass group p-4 rounded-[2rem] flex items-center gap-3 hover:border-primary/40 transition-all"
    >
      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-muted ring-1 ring-black/5">
        {!imgError && photoSrc ? (
          <img
            src={photoSrc}
            alt={`Photo de ${nom}`}
            loading="lazy"
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : !useFallback ? (
          <img
            src={fallbackSrc}
            alt=""
            loading="lazy"
            width={48}
            height={48}
            className="w-full h-full object-cover opacity-20 grayscale"
            onError={() => setUseFallback(true)}
          />
        ) : (
          /* Initiales colorées fallback */
          <div
            className="w-full h-full flex items-center justify-center font-display font-semibold text-xs"
            style={{
              background: `color-mix(in oklch, ${g.couleur} 18%, white)`,
              color: g.couleur,
            }}
            aria-hidden="true"
          >
            {initials || "?"}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
          {nom || "Inconnu"}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: g.couleur }}
            aria-hidden="true"
          />
          <span className="truncate">{g.nom}</span>
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {d.num_deptmt || "?"} · {d.nom_circo || "Inconnue"}
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
    </a>
  );
}

// ─── ONGLET SCRUTINS ───────────────────────────────────────────────────────

function ScrutinsTab({
  scrutins,
  q,
  search,
  setSearch,
  navigate,
}: {
  scrutins: Scrutin16[];
  q: string;
  search: string;
  setSearch: (v: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any;
}) {
  const filtered = useMemo(() => {
    const n = normalize(q);
    const sorted = [...scrutins].sort((a, b) => b.date.localeCompare(a.date));
    if (!n) return sorted;
    return sorted.filter((s) => normalize(s.titre || "").includes(n));
  }, [scrutins, q]);

  return (
    <>
      <div className="sticky-toolbar sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({
              search: (p: Record<string, unknown>) => ({
                ...p,
                q: sanitizeSearchInput(search),
              }),
            });
          }}
          className="flex gap-2"
          role="search"
        >
          <div className="search-ring flex-1 flex items-center glass-strong rounded-full border border-white/30 px-5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
              placeholder="Mot-clé dans l'intitulé du texte…"
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
        </form>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length.toLocaleString("fr-FR")} scrutin
        {filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center glass rounded-3xl border border-border/50">
          <span className="text-4xl block mb-3" aria-hidden="true">
            📋
          </span>
          <p className="text-muted-foreground">
            Aucun scrutin ne correspond à ces critères.
          </p>
        </div>
      ) : (
        <ul
          className="space-y-3 animate-stagger"
          aria-label="Liste des scrutins — 16e législature"
        >
          {filtered.slice(0, 100).map((s, i) => (
            <Scrutin16Row key={s.numero} s={s} index={i} />
          ))}
        </ul>
      )}
      {filtered.length > 100 && (
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Affichage limité aux 100 premiers résultats — affinez votre recherche.
        </p>
      )}
    </>
  );
}

function Scrutin16Row({ s, index }: { s: Scrutin16; index: number }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0);
  const c = Math.max(0, parseInt(s.nombre_contres) || 0);
  const a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100 + index * 30);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <li
      className="animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <a
        href={s.url_institution}
        target="_blank"
        rel="noreferrer noopener"
        className="scrutin-card card-glass group block p-5 rounded-[2rem] border border-border/40"
        aria-label={`Scrutin n°${s.numero} : ${s.titre || "Sans titre"}`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-mono text-foreground/50">n°{s.numero}</span>
          {s.date && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={s.date}>
                {new Date(s.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span
            className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px]"
            style={{
              color: s.isAdopte ? "var(--color-pour)" : "var(--color-contre)",
              backgroundColor: s.isAdopte
                ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
                : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
            }}
          >
            {s.isAdopte ? "✓ Adopté" : "✗ Rejeté"}
          </span>
          <span aria-hidden="true">·</span>
          <span>16e législature</span>
        </div>

        <p className="text-foreground font-medium leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors duration-200">
          {s.titre
            ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
            : `Scrutin n°${s.numero}`}
        </p>

        {(p > 0 || c > 0 || a > 0) && (
          <div className="space-y-1.5">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted/60">
              <div
                style={{
                  width: mounted ? `${(p / total) * 100}%` : "0%",
                  backgroundColor: "var(--color-pour)",
                  transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
              <div
                style={{
                  width: mounted ? `${(c / total) * 100}%` : "0%",
                  backgroundColor: "var(--color-contre)",
                  transition:
                    "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms",
                }}
              />
              <div
                style={{
                  width: mounted ? `${(a / total) * 100}%` : "0%",
                  backgroundColor: "var(--color-abstention)",
                  transition:
                    "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
                }}
              />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{p}</strong> pour
              </span>
              <span>
                <strong className="text-foreground">{c}</strong> contre
              </span>
              <span>
                <strong className="text-foreground">{a}</strong> abst.
              </span>
            </div>
          </div>
        )}
      </a>
    </li>
  );
}
