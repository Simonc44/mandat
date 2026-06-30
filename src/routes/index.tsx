// routes/index.tsx — Page d'accueil Liquid Glass + orbes + 17e législature

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
  photoUrl,
} from "@/lib/api";
import { GroupBadge } from "@/components/GroupBadge";
import { ScrollScene } from "@/components/ScrollScene";
import { Unlock, Scale, ShieldCheck } from "lucide-react";
import { createSeoMeta, SITE_URL } from "./__root";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: createSeoMeta({
      title: "Mandat — Qui a voté quoi, et pourquoi",
      description:
        "Cherchez un·e député·e, un texte de loi, un scrutin. Les votes de l'Assemblée nationale 17e législature, enfin lisibles. Sans étiquette politique.",
      canonical: SITE_URL,
      ogType: "website",
    }),
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
    () =>
      [...scrutins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [scrutins],
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
      {/* ── HERO LIQUID GLASS ── */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        {/* Orbes de fond animés */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="hero-orb w-[600px] h-[600px] -top-32 -left-32 opacity-30"
            style={
              {
                background:
                  "radial-gradient(circle, oklch(0.50 0.20 285), transparent 70%)",
                "--duration": "7s",
                "--delay": "0s",
              } as React.CSSProperties
            }
          />
          <div
            className="hero-orb w-[400px] h-[400px] top-1/3 right-0 opacity-20"
            style={
              {
                background:
                  "radial-gradient(circle, oklch(0.55 0.18 215), transparent 70%)",
                "--duration": "9s",
                "--delay": "2s",
              } as React.CSSProperties
            }
          />
          <div
            className="hero-orb w-[300px] h-[300px] bottom-0 left-1/3 opacity-15"
            style={
              {
                background:
                  "radial-gradient(circle, oklch(0.60 0.16 165), transparent 70%)",
                "--duration": "11s",
                "--delay": "4s",
              } as React.CSSProperties
            }
          />
        </div>

        <div className="container-app py-16 md:py-24 w-full">
          <div className="max-w-3xl">
            {/* Badge législature */}
            <div
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-primary mb-6 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                aria-hidden="true"
              />
              17e législature · Session 2024–2029
            </div>

            {/* H1 */}
            <h1
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.92] mb-6 animate-fade-up tracking-tight"
              style={{ animationDelay: "80ms" }}
            >
              Qui a voté quoi —
              <br />
              <span className="text-gradient italic">et pourquoi.</span>
            </h1>

            {/* Sous-titre */}
            <p
              className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed animate-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              Mandat rend lisibles les{" "}
              <strong className="text-foreground">
                {stats.scrutins.toLocaleString("fr-FR")} scrutins
              </strong>{" "}
              de la XVIIe législature. Cherchez un·e député·e, un texte de loi.
              Sans étiquette, sans score idéologique.
            </p>

            {/* Search */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <SearchBar deputes={deputes} scrutins={scrutins} />
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-4 mt-12 max-w-xl animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              <StatPill
                value={stats.deputes.toLocaleString("fr-FR")}
                label="Député·es"
              />
              <StatPill
                value={stats.scrutins.toLocaleString("fr-FR")}
                label="Scrutins"
              />
              <StatPill value={stats.groupes.toString()} label="Groupes" />
            </div>
          </div>
        </div>
      </section>

      {/* ── DERNIERS SCRUTINS ── */}
      <section className="container-app pb-24 pt-4">
        <ScrollScene variant="rise">
          <div className="flex items-end justify-between mb-8 mt-2" data-rise>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-2 font-medium">
                En direct de l'hémicycle
              </div>
              <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">
                Derniers scrutins.
              </h2>
            </div>
            <Link
              to="/scrutins"
              className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
            >
              Tout voir
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </ScrollScene>

        <ScrollScene variant="tilt" className="grid md:grid-cols-2 gap-4">
          {latest.map((s, i) => (
            <div key={s.numero} data-tilt className="will-change-transform">
              <ScrutinCard s={s} index={i} />
            </div>
          ))}
        </ScrollScene>
      </section>

      {/* ── SECTION CONFIANCE ── */}
      <TrustSection />
    </div>
  );
}

// ── STAT PILL ───────────────────────────────────────────────

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-box glass rounded-2xl px-4 py-3 border border-border/40 text-center">
      <div className="stat-value font-display text-2xl md:text-3xl text-ink">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

// ── SCRUTIN CARD ────────────────────────────────────────────

function SortBadge({ sort }: { sort: string }) {
  const isAdopted = /adopt/i.test(sort);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: isAdopted ? "var(--color-pour)" : "var(--color-contre)",
        backgroundColor: isAdopted
          ? "color-mix(in oklch, var(--color-pour) 12%, transparent)"
          : "color-mix(in oklch, var(--color-contre) 12%, transparent)",
      }}
    >
      {isAdopted ? "✓ Adopté" : "✗ Rejeté"}
    </span>
  );
}

function ScrutinCard({ s, index = 0 }: { s: Scrutin; index?: number }) {
  return (
    <Link
      to="/scrutin/$numero"
      params={{ numero: s.numero }}
      className="scrutin-card card-glass group block p-5 rounded-2xl animate-fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
      aria-label={`Scrutin n°${s.numero} : ${s.titre}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
        {s.date && (
          <time dateTime={s.date}>
            {new Date(s.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        )}
        {s.sort && (
          <>
            <span aria-hidden="true">·</span>
            <SortBadge sort={s.sort} />
          </>
        )}
      </div>

      <p className="text-foreground text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors duration-200 mb-3 font-medium">
        {s.titre
          ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
          : `Scrutin n°${s.numero}`}
      </p>

      <ResultMiniBar s={s} />
    </Link>
  );
}

function ResultMiniBar({ s }: { s: Scrutin }) {
  const p = Math.max(0, parseInt(s.nombre_pours) || 0);
  const c = Math.max(0, parseInt(s.nombre_contres) || 0);
  const a = Math.max(0, parseInt(s.nombre_abstentions) || 0);
  const total = Math.max(1, p + c + a);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (p === 0 && c === 0 && a === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/60">
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
            transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms",
          }}
        />
        <div
          style={{
            width: mounted ? `${(a / total) * 100}%` : "0%",
            backgroundColor: "var(--color-abstention)",
            transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
          }}
        />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
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

// ── TRUST SECTION ───────────────────────────────────────────

function TrustSection() {
  const points = [
    {
      Icon: Unlock,
      title: "100 % opendata",
      desc: "Sources officielles AN, API CLAIR et CIVIX. Aucune donnée inventée.",
    },
    {
      Icon: Scale,
      title: "Zéro biais politique",
      desc: "Pas de score idéologique, pas de classement. Les faits bruts.",
    },
    {
      Icon: ShieldCheck,
      title: "Vie privée respectée",
      desc: "Aucun cookie publicitaire. Aucun tracker. Conformité RGPD.",
    },
  ];

  return (
    <section className="border-t border-border/40">
      <div className="container-app py-20">
        <ScrollScene variant="rise">
          <h2
            className="font-display text-3xl md:text-5xl mb-12 text-center leading-[1.05]"
            data-rise
          >
            La transparence,
            <br />
            <span className="text-gradient italic">sans compromis.</span>
          </h2>
        </ScrollScene>
        <ScrollScene variant="tilt" className="grid md:grid-cols-3 gap-5">
          {points.map(({ Icon, title, desc }, i) => (
            <div
              key={i}
              data-tilt
              className="card-glass rounded-3xl p-7 will-change-transform"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.50 0.20 285 / 14%), oklch(0.42 0.22 260 / 22%))",
                  color: "oklch(0.50 0.20 285)",
                }}
                aria-hidden="true"
              >
                <Icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </ScrollScene>
      </div>
    </section>
  );
}

// ── SEARCH BAR ──────────────────────────────────────────────

function SearchBar({
  deputes,
  scrutins,
}: {
  deputes: Depute[];
  scrutins: Scrutin[];
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const safeQ = sanitizeSearchInput(q);

  const results = useMemo(() => {
    const n = normalize(safeQ);
    if (n.length < 2) return null;
    const ds = deputes
      .filter((d) =>
        normalize(
          `${d.prenom} ${d.nom_de_famille} ${d.nom_circo} ${d.groupe_sigle}`,
        ).includes(n),
      )
      .slice(0, 5);
    const ss = scrutins
      .filter((s) => normalize(s.titre).includes(n))
      .slice(0, 5);
    return { ds, ss };
  }, [safeQ, deputes, scrutins]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasResults =
    results && (results.ds.length > 0 || results.ss.length > 0);

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
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
        <div className="search-ring flex items-center gap-2 glass-strong rounded-2xl border border-white/30 shadow-lg">
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
            aria-expanded={open && hasResults ? "true" : "false"}
            maxLength={150}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="btn-primary m-2 px-5 py-3 rounded-xl text-sm font-medium"
            aria-label="Lancer la recherche"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Dropdown résultats — au-dessus de tout, opaque */}
      {open && hasResults && (
        <div
          className="animate-slide-down absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl overflow-hidden max-h-[65vh] overflow-y-auto border border-border/60 bg-white"
          style={{ zIndex: 9999, backgroundColor: "oklch(1 0 0)" }}
          role="listbox"
          aria-label="Suggestions"
        >

          {results!.ds.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Député·es
              </div>
              {results!.ds.map((d) => (
                <Link
                  key={d.slug}
                  to="/depute/$slug"
                  params={{ slug: d.slug }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <DeputeAvatarSmall d={d} />
                  <span className="font-medium text-sm">
                    {d.prenom} {d.nom_de_famille}
                  </span>
                  <GroupBadge sigle={d.groupe_sigle} size="sm" />
                  <span className="text-xs text-muted-foreground ml-auto truncate hidden sm:block">
                    {d.nom_circo}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {results!.ss.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Scrutins
              </div>
              {results!.ss.map((s) => (
                <Link
                  key={s.numero}
                  to="/scrutin/$numero"
                  params={{ numero: s.numero }}
                  className="block px-3 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: /adopt/i.test(s.sort)
                          ? "var(--color-pour)"
                          : "var(--color-contre)",
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-sm line-clamp-1 font-medium">
                      {s.titre
                        ? s.titre.charAt(0).toUpperCase() + s.titre.slice(1)
                        : `Scrutin n°${s.numero}`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-4">
                    {s.date ? new Date(s.date).toLocaleDateString("fr-FR") : ""}{" "}
                    {s.sort ? `· ${s.sort}` : ""}
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

function DeputeAvatarSmall({ d }: { d: Depute }) {
  const [err, setErr] = useState(false);
  const src = d.id_an ? photoUrl(d.id_an, 17) : "";

  if (!src || err) {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.50 0.20 285 / 15%), oklch(0.42 0.22 215 / 20%))",
          color: "oklch(0.50 0.20 285)",
        }}
        aria-hidden="true"
      >
        {`${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`.toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="w-7 h-7 rounded-full object-cover shrink-0"
      onError={() => setErr(true)}
    />
  );
}

// Nécessaire pour le type JSX dans les orbes
import type React from "react";
