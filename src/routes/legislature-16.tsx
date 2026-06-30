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
import { Archive, ExternalLink } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

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
  tab: fallback(z.enum(["deputes", "scrutins"]), "deputes").default(
    "deputes",
  ),
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
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(deputes16Query),
      context.queryClient.ensureQueryData(scrutins16Query),
    ]),
  component: Legislature16Page,
});

function Legislature16Page() {
  const { data: deputes } = useSuspenseQuery(deputes16Query);
  const { data: scrutins } = useSuspenseQuery(scrutins16Query);
  const { tab, q, groupe } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState(q);

  // Reset le champ texte affiché quand on change d'onglet ou que l'URL change
  useEffect(() => setSearch(q), [q, tab]);

  return (
    <div className="container-app py-12">
      <div className="mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs font-medium text-primary mb-4">
          <Archive className="w-3.5 h-3.5" />
          Archive · 2022 — 2024
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-2 tracking-tight">
          16<sup>e</sup> législature
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Les {deputes.length} député·es et les{" "}
          {scrutins.length.toLocaleString("fr-FR")} scrutins de la précédente
          législature. Données fournies par{" "}
          <a
            href="https://2022-2024.nosdeputes.fr"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            nosdeputes.fr (Regards Citoyens)
            <ExternalLink className="w-3 h-3" />
          </a>
          .
        </p>
      </div>

      {/* Onglets Député·es / Scrutins */}
      <div
        className="flex gap-2 mb-6 animate-fade-up"
        role="tablist"
        aria-label="Sections de la 16e législature"
        style={{ animationDelay: "30ms" }}
      >
        <button
          role="tab"
          aria-selected={tab === "deputes"}
          onClick={() =>
            navigate({ search: (p) => ({ ...p, tab: "deputes" }) })
          }
          className={tabClass(tab === "deputes")}
        >
          Député·es
          <span className="opacity-50">· {deputes.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "scrutins"}
          onClick={() =>
            navigate({ search: (p) => ({ ...p, tab: "scrutins" }) })
          }
          className={tabClass(tab === "scrutins")}
        >
          Scrutins
          <span className="opacity-50">
            · {scrutins.length.toLocaleString("fr-FR")}
          </span>
        </button>
      </div>

      {tab === "deputes" ? (
        <DeputesTab
          deputes={deputes}
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
  );
}

function tabClass(active: boolean) {
  return `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
    active
      ? "btn-primary border-transparent"
      : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
  }`;
}

// ─── ONGLET DÉPUTÉ·ES ──────────────────────────────────────────────────────

function DeputesTab({
  deputes,
  q,
  groupe,
  search,
  setSearch,
  navigate,
}: {
  deputes: Depute16[];
  q: string;
  groupe: string;
  search: string;
  setSearch: (v: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any;
}) {
  const groupes = useMemo(() => {
    const map = new Map<string, number>();
    deputes.forEach((d) =>
      map.set(d.groupe_sigle, (map.get(d.groupe_sigle) ?? 0) + 1),
    );
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [deputes]);

  const filtered = useMemo(() => {
    const n = normalize(q);
    return deputes.filter((d) => {
      if (groupe && d.groupe_sigle !== groupe) return false;
      if (
        n &&
        !normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.num_deptmt}`,
        ).includes(n)
      )
        return false;
      return true;
    });
  }, [deputes, q, groupe]);

  return (
    <>
      {/* Recherche et Filtres */}
      <div className="sticky-toolbar sticky top-[calc(4rem-1px)] z-40 -mx-4 px-4 py-4 mb-8 space-y-4">
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
          <div className="search-ring flex-1 flex items-center glass-strong rounded-2xl border border-white/30 px-4">
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
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-5 py-3 rounded-2xl text-sm font-medium"
          >
            Chercher
          </button>
        </form>

        {/* Filtres groupes — noms complets */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              navigate({
                search: (p: Record<string, unknown>) => ({ ...p, groupe: "" }),
              })
            }
            aria-pressed={!groupe}
            className={chip(!groupe)}
          >
            Tous les groupes
          </button>
          {groupes.map(([sig, n]) => {
            const g = groupeMeta(sig);
            return (
              <button
                key={sig}
                onClick={() =>
                  navigate({
                    search: (p: Record<string, unknown>) => ({
                      ...p,
                      groupe: sig,
                    }),
                  })
                }
                aria-pressed={groupe === sig}
                className={chip(groupe === sig)}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: g.couleur }}
                  aria-hidden="true"
                />
                {g.nom}
                <span className="opacity-50">· {n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length.toLocaleString("fr-FR")} résultat
        {filtered.length > 1 ? "s" : ""}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 120).map((d) => (
          <Depute16Card key={d.slug} d={d} />
        ))}
      </div>
      {filtered.length > 120 && (
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Affichage limité aux 120 premiers résultats — affinez votre recherche.
        </p>
      )}
    </>
  );
}

function chip(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
    active
      ? "btn-primary border-transparent"
      : "glass border-border/50 text-foreground/70 hover:text-foreground hover:border-primary/25"
  }`;
}

function Depute16Card({ d }: { d: Depute16 }) {
  const g = groupeMeta(d.groupe_sigle);
  const [err, setErr] = useState(false);
  return (
    <a
      href={d.url_an || `https://2022-2024.nosdeputes.fr/${d.slug}`}
      target="_blank"
      rel="noreferrer noopener"
      className="card-glass group p-4 rounded-2xl flex items-center gap-3 hover:border-primary/40 transition-all"
    >
      {err ? (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: `color-mix(in oklch, ${g.couleur} 18%, white)`,
            color: g.couleur,
          }}
        >
          {`${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`}
        </div>
      ) : (
        <img
          src={d.photo}
          alt=""
          aria-hidden="true"
          className="w-12 h-12 rounded-full object-cover shrink-0"
          onError={() => setErr(true)}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
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
        <div className="text-[11px] text-muted-foreground truncate">
          {d.num_deptmt} · {d.nom_circo}
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
          <div className="search-ring flex-1 flex items-center glass-strong rounded-2xl border border-white/30 px-4">
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
            className="btn-primary px-5 py-3 rounded-2xl text-sm font-medium"
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
          Affichage limité aux 100 premiers résultats — affinez votre
          recherche.
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
        className="scrutin-card card-glass group block p-5 rounded-2xl border border-border/40"
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
