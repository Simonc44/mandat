// Affiche la date de dernière mise à jour de la base (table meta).
import { useEffect, useState } from "react";

function formatFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LastUpdated() {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/meta?key=last_updated")
      .then((r) => r.json())
      .then((d: { value: string | null }) => {
        if (!cancelled && d?.value) setValue(d.value);
      })
      .catch(() => {
        /* silencieux */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!value) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={`Dernière synchronisation : ${value}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-primary/70"
        aria-hidden="true"
      />
      Dernière mise à jour&nbsp;: {formatFr(value)}
    </span>
  );
}
