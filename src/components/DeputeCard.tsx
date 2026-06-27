// components/DeputeCard.tsx
// Carte député avec animations Apple-style et micro-interactions

import { Link } from "@tanstack/react-router";
import type { Depute } from "@/lib/api";
import { photoUrl } from "@/lib/api";
import { GroupBadge } from "./GroupBadge";
import { useState } from "react";

interface DeputeCardProps {
  d: Depute;
  index?: number; // Pour le délai de cascade
}

export function DeputeCard({ d, index = 0 }: DeputeCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to="/depute/$slug"
      params={{ slug: d.slug }}
      className="depute-card group flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 360)}ms` }}
      aria-label={`Voir le profil de ${d.prenom} ${d.nom_de_famille}`}
    >
      {/* Photo avec zoom au survol */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 relative">
        {!imgError ? (
          <img
            src={photoUrl(d.id_an)}
            alt={`Photo de ${d.prenom} ${d.nom_de_famille}`}
            loading="lazy"
            width={56}
            height={56}
            className="depute-photo w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder initiales si photo absente */
          <div
            className="w-full h-full flex items-center justify-center text-lg font-display font-medium"
            style={{
              backgroundColor: "color-mix(in oklch, var(--color-primary) 10%, var(--color-muted))",
              color: "var(--color-primary)",
            }}
            aria-hidden="true"
          >
            {d.prenom[0]}{d.nom_de_famille[0]}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {d.prenom} {d.nom_de_famille}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {d.nom_circo}
          {d.num_deptmt && ` (${d.num_deptmt})`}
          {d.num_circo ? ` · circ. ${d.num_circo}` : ""}
        </div>
        <div className="mt-1.5">
          <GroupBadge sigle={d.groupe_sigle} size="sm" />
        </div>
      </div>

      {/* Flèche indicatrice */}
      <div
        className="self-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
        style={{ transform: "translateX(-4px)" }}
        aria-hidden="true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>
    </Link>
  );
}

// ============================================================
// SKELETON — Chargement élégant
// ============================================================

export function DeputeCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="flex gap-3 p-3 rounded-xl bg-card border border-border animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
      aria-hidden="true"
    >
      <div className="skeleton w-14 h-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-4 rounded-full w-16 mt-1" />
      </div>
    </div>
  );
}

export function DeputeCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DeputeCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
