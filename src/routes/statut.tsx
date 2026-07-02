// /statut — Page de statut du service, vérifie /api/status toutes les 30s.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

type StatusPayload = {
  ok: boolean;
  db?: string;
  deputes?: number;
  scrutins?: number;
  lastUpdated?: string | null;
  checkedAt?: string;
  responseMs?: number;
  error?: string;
};

const REFRESH_MS = 30_000;

export const Route = createFileRoute("/statut")({
  head: () => ({
    meta: [
      { title: "Statut du service — Mandat" },
      {
        name: "description",
        content:
          "État en temps réel de Mandat : disponibilité du site, base de données et dernière synchronisation des données de l'Assemblée nationale.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Statut du service — Mandat" },
      {
        property: "og:description",
        content: "Vert = tout fonctionne. Rouge = incident en cours.",
      },
    ],
  }),
  component: StatusPage,
});

function formatFr(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusPage() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextIn, setNextIn] = useState(REFRESH_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function check() {
    setLoading(true);
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      const d = (await r.json()) as StatusPayload;
      setStatus(d);
    } catch (e) {
      setStatus({ ok: false, error: (e as Error).message });
    } finally {
      setLoading(false);
      setNextIn(REFRESH_MS / 1000);
    }
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, REFRESH_MS);
    timerRef.current = setInterval(
      () => setNextIn((n) => (n > 1 ? n - 1 : REFRESH_MS / 1000)),
      1000,
    );
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const ok = status?.ok === true;
  const color = ok ? "bg-green-500" : "bg-red-500";
  const label = loading
    ? "Vérification…"
    : ok
      ? "Tout fonctionne"
      : "Incident détecté";
  const bg = ok
    ? "from-green-500/10 via-green-500/5 to-transparent"
    : "from-red-500/10 via-red-500/5 to-transparent";

  return (
    <main className="container-app py-10 md:py-16 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Monitoring
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
          Statut du service
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Cette page vérifie automatiquement toutes les {REFRESH_MS / 1000}{" "}
          secondes que le site et la base de données répondent correctement.
        </p>
      </header>

      {/* Carte principale */}
      <section
        aria-live="polite"
        className={`relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br ${bg} p-6 md:p-10`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex items-center gap-4">
            <span className="relative flex h-5 w-5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`}
                aria-hidden="true"
              />
              <span
                className={`relative inline-flex rounded-full h-5 w-5 ${color}`}
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-2xl md:text-3xl font-semibold text-ink">
                {label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Dernière vérification&nbsp;: {formatFr(status?.checkedAt)} ·
                Nouvelle vérification dans {nextIn}s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={check}
            disabled={loading}
            className="md:ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass border border-border/60 hover:bg-white/40 transition-colors disabled:opacity-50 self-start"
          >
            {loading ? "Vérification…" : "Vérifier maintenant"}
          </button>
        </div>
      </section>

      {/* Détails */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label="Site web"
          value={status ? "En ligne" : "…"}
          ok={!!status}
        />
        <StatusCard
          label="Base de données"
          value={status?.db === "up" ? "Opérationnelle" : "Indisponible"}
          ok={status?.db === "up"}
        />
        <StatusCard
          label="Député·es en base"
          value={
            status?.deputes != null
              ? status.deputes.toLocaleString("fr-FR")
              : "…"
          }
          ok={(status?.deputes ?? 0) > 0}
        />
        <StatusCard
          label="Scrutins en base"
          value={
            status?.scrutins != null
              ? status.scrutins.toLocaleString("fr-FR")
              : "…"
          }
          ok={(status?.scrutins ?? 0) > 0}
        />
      </section>

      {/* Métadonnées */}
      <section className="rounded-3xl border border-border/50 p-6 space-y-3 text-sm">
        <h2 className="font-display text-lg font-semibold text-ink">
          Informations
        </h2>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
              Dernière synchronisation des données
            </dt>
            <dd className="text-foreground mt-0.5">
              {formatFr(status?.lastUpdated)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
              Temps de réponse
            </dt>
            <dd className="text-foreground mt-0.5">
              {status?.responseMs != null ? `${status.responseMs} ms` : "—"}
            </dd>
          </div>
        </dl>
        {status?.error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3 border border-red-200">
            Erreur&nbsp;: {status.error}
          </p>
        )}
      </section>
    </main>
  );
}

function StatusCard({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/50 p-4 space-y-2 bg-white/40">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
          aria-hidden="true"
        />
      </div>
      <p className="text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
