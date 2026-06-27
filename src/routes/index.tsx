// routes/index.tsx
// Page d'accueil — 17e législature
// Animations Apple-style, barre de recherche avec apparition progressive,
// derniers scrutins, stats d'impact.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  allDeputesQuery,
  scrutinsQuery,
  normalize,
  sanitizeSearchInput,
  type Depute,
  type Scrutin,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      ...createSeoMeta({
        title: "Mandat — Qui a voté quoi, et pourquoi",
        description:
          "Cherchez un·e député·e, un texte de loi, un scrutin. Les votes de l'Assemblée nationale (17e législature), enfin lisibles. Sans étiquette politique.",
        canonical: SITE_URL,
        ogType: "website",
      }),
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(allDeputesQuery),
      context.queryClient.ensureQueryData(scrutinsQuery),
    ]),
  component: Home,
});

function Home() {
  const { data: deputes } = useSuspenseQuery(allDeputesQuery);
  const { data: scrutins } = useSuspenseQuery(scrutinsQuery);

  const latest = useMemo(
    () => [...scrutins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [scrutins]
  );

  const stats = useMemo(() => {
    const groupes = new Set(deputes.map((d) => d.groupe_sigle).filter(Boolean));
    return {
      deputes: deputes.length,
      scrutins: scrutins.length,
      groupes: groupes.size,
    };
  }, [deputes, scrutins]);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 hero-gradient"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, var(--color-primary) 0%, transparent 45%), radial-gradient(circle at 80% 70%, var(--color-primary) 0%, transparent 40%)",
            opacity: 0.07,
          }}
          aria-hidden="true"
        />
        <div className="container-app pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-3xl">
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary font-medium mb-5 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              17e législature · Session 2024–2029
            </span>

            {/* Titre */}
            <h1
              className="font-display text-5xl md:text-7xl leading-[0.95] mb-5 animate-fade-up"
              style={{ animationDelay: "80ms" }}
            >
              Qui a voté quoi —
              <br />
              <span className="text-primary italic">et pourquoi.</span>
            </h1>

            {/* Sous-titre */}
            <p
              className="text-lg text-muted-foreground max-w-2xl mb-8 animate-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              Mandat rend lisibles les{" "}
              <strong className="text-foreground">
                {stats.scrutins.toLocaleString("fr-FR")} scrutins
              </strong>{" "}
              de la XVIIe législature. Cherchez un·e député·e, un texte de loi, un
              groupe. Sans étiquette, sans score idéologique.
            </p>

            {/* Barre de recherche */}
            <div
              className="search-container animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <SearchBar deputes={deputes} scrutins={scrutins} />
            </div>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-3 md:gap-6 mt-12 md:mt-16 max-w-2xl animate-fade-up"
            style={{ animationDelay: "320ms" }}
          >
            <Stat value={stats.deputes.toLocaleString("fr-FR")} label="Député·es" />
            <Stat value={stats.scrutins.toLocaleString("fr-FR")} label="Scrutins publics" />
            <Stat value={stats.groupes.toString()} label="Groupes politiques" />
          </div>
        </div>
      </section>

      {/* ── DERNIERS SCRUTINS ────────────────────────────────── */}
      <section className="container-app pb-20">
        <div className="flex items-end justify-between mb-6 mt-4">
          <h2 className="font-display text-3xl">Derniers scrutins</h2>
          <Link to="/scrutins" className="text-sm text-primary hover:underline transition-colors">
            Tout voir →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-3 animate-stagger">
          {latest.map((s, i) => (
            <ScrutinCard key={s.numero} s={s} index={i} />
          ))}
        </div>
      </section>

      {/* ── SECTION CONFIANCE ────────────────────────────────── */}
      <TrustSection />
    </div>
  );
}

// ── COMPOSANTS ──────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-box border-l-2 border-primary pl-4">
      <div className="stat-value font-display text-3xl md:text-4xl">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function SortBadge({ sort }: { sort: string }) {
  const isAdopted = /adopt/i.test(sort);
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
      style={{
        color: isAdopted ? "var(--color-pour)" : "var(--color-contre)",
        backgroundColor: isAdopted
          ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
          : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
      }}
    >
      {sort}
    </span>
  );
}

function ScrutinCard({ s, index = 0 }: { s: Scrutin; index?: number }) {
  return (
    <Link
      to="/scrutin/$numero"
      params={{ numero: s.numero }}
      className="scrutin-card group block p-5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`Scrutin n°${s.numero} : ${s.titre}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <time dateTime={s.date}>
          {new Date(s.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        <span aria-hidden="true">·</span>
        <span className="capitalize">{s.type}</span>
        <span aria-hidden="true">·</span>
        <SortBadge sort={s.sort} />
      </div>
      <p className="text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors duration-200 mb-3">
        {s.titre.charAt(0).toUpperCase() + s.titre.slice(1)}
      </p>
      <ResultBar s={s} />
    </Link>
  );
}

function ResultBar({ s }: { s: Scrutin }) {
  const p = +s.nombre_pours;
  const c = +s.nombre_contres;
  const a = +s.nombre_abstentions;
  const total = Math.max(1, p + c + a);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Déclenche l'animation de la barre après le premier rendu
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div
          className="result-bar-segment"
          style={{
            width: mounted ? `${(p / total) * 100}%` : "0%",
            backgroundColor: "var(--color-pour)",
          }}
        />
        <div
          className="result-bar-segment"
          style={{
            width: mounted ? `${(c / total) * 100}%` : "0%",
            backgroundColor: "var(--color-contre)",
          }}
        />
        <div
          className="result-bar-segment"
          style={{
            width: mounted ? `${(a / total) * 100}%` : "0%",
            backgroundColor: "var(--color-abstention)",
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
  );
}

function TrustSection() {
  const points = [
    {
      icon: "🔓",
      title: "100% opendata",
      desc: "Sources officielles de l'Assemblée nationale uniquement.",
    },
    {
      icon: "⚖️",
      title: "Zéro biais politique",
      desc: "Aucun score idéologique. Les faits, rien que les faits.",
    },
    {
      icon: "🔒",
      title: "Respect de la vie privée",
      desc: "Aucun cookie publicitaire. Aucun tracking tiers. Jamais.",
    },
  ];

  return (
    <section className="bg-surface-muted border-t border-border">
      <div className="container-app py-16">
        <h2 className="font-display text-2xl mb-8 text-center">
          La transparence, sans compromis
        </h2>
        <div className="grid md:grid-cols-3 gap-6 animate-stagger">
          {points.map((p, i) => (
            <div
              key={i}
              className="flex gap-4 p-5 rounded-xl bg-card border border-border animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-2xl" aria-hidden="true">
                {p.icon}
              </span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── BARRE DE RECHERCHE ──────────────────────────────────────

function SearchBar({ deputes, scrutins }: { deputes: Depute[]; scrutins: Scrutin[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize l'input avant traitement
  const safeQ = sanitizeSearchInput(q);

  const results = useMemo(() => {
    const n = normalize(safeQ);
    if (n.length < 2) return null;
    const ds = deputes
      .filter((d) =>
        normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.groupe_sigle}`
        ).includes(n)
      )
      .slice(0, 5);
    const ss = scrutins
      .filter((s) => normalize(s.titre).includes(n))
      .slice(0, 5);
    return { ds, ss };
  }, [safeQ, deputes, scrutins]);

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.ds.length > 0 || results.ss.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const safe = sanitizeSearchInput(q.trim());
          if (safe) {
            setOpen(false);
            nav({ to: "/recherche", search: { q: safe } });
          }
        }}
        role="search"
        aria-label="Rechercher un député ou un scrutin"
      >
        <div className="flex items-center gap-2 bg-surface border-2 border-border focus-within:border-primary rounded-2xl shadow-sm transition-colors duration-200">
          <svg
            className="ml-4 w-5 h-5 text-muted-foreground shrink-0"
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
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Cherchez un·e député·e, un texte de loi…"
            className="flex-1 py-4 px-2 bg-transparent outline-none text-base placeholder:text-muted-foreground"
            aria-label="Terme de recherche"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-expanded={open && hasResults ? "true" : "false"}
            maxLength={150}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="m-1.5 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            aria-label="Lancer la recherche"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {open && hasResults && (
        <div
          id="search-results"
          className="search-dropdown absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-30 max-h-[60vh] overflow-y-auto"
          role="listbox"
          aria-label="Suggestions de recherche"
        >
          {results!.ds.length > 0 && (
            <div className="p-2">
              <div
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                role="presentation"
              >
                Député·es
              </div>
              {results!.ds.map((d) => (
                <Link
                  key={d.slug}
                  to="/depute/$slug"
                  params={{ slug: d.slug }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  role="option"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-medium">
                    {d.prenom} {d.nom_de_famille}
                  </span>
                  <GroupBadge sigle={d.groupe_sigle} size="sm" />
                  <span className="text-xs text-muted-foreground ml-auto truncate">
                    {d.nom_circo}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {results!.ss.length > 0 && (
            <div className="p-2 border-t border-border">
              <div
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                role="presentation"
              >
                Scrutins
              </div>
              {results!.ss.map((s) => (
                <Link
                  key={s.numero}
                  to="/scrutin/$numero"
                  params={{ numero: s.numero }}
                  className="block px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  role="option"
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm line-clamp-2">
                    {s.titre.charAt(0).toUpperCase() + s.titre.slice(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(s.date).toLocaleDateString("fr-FR")} · {s.sort}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
