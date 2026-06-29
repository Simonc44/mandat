// components/DeputeCard.tsx — Liquid Glass + photos correctes + initiales fallback

import { Link } from "@tanstack/react-router";
import type { Depute } from "@/lib/api";
import { photoUrl } from "@/lib/api";
import { GroupBadge } from "./GroupBadge";
import { useState } from "react";

export function DeputeCard({ d, index = 0 }: { d: Depute; index?: number }) {
  const [imgError, setImgError] = useState(false);
  const [imgError16, setImgError16] = useState(false);

  // Tente photo 17e, puis 16e si disponible, puis initiales
  const photoSrc = d.id_an ? photoUrl(d.id_an, 17) : "";
  const photo16Src = d.id_an ? photoUrl(d.id_an, 16) : "";

  const initials =
    `${d.prenom?.[0] ?? ""}${d.nom_de_famille?.[0] ?? ""}`.toUpperCase();

  return (
    <Link
      to="/depute/$slug"
      params={{ slug: d.slug }}
      className="depute-card card-glass group flex gap-3 p-3 rounded-2xl animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 35, 400)}ms` }}
      aria-label={`Profil de ${d.prenom} ${d.nom_de_famille}`}
    >
      {/* Photo avec fallback en cascade */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
        {!imgError && photoSrc ? (
          <img
            src={photoSrc}
            alt={`Photo de ${d.prenom} ${d.nom_de_famille}`}
            loading="lazy"
            width={56}
            height={56}
            className="depute-photo w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : !imgError16 && photo16Src ? (
          <img
            src={photo16Src}
            alt={`Photo de ${d.prenom} ${d.nom_de_famille}`}
            loading="lazy"
            width={56}
            height={56}
            className="depute-photo w-full h-full object-cover"
            onError={() => setImgError16(true)}
          />
        ) : (
          /* Initiales colorées */
          <div
            className="w-full h-full flex items-center justify-center font-display font-semibold text-lg"
            style={{
              background: `linear-gradient(135deg, oklch(0.50 0.20 285 / 15%), oklch(0.42 0.22 215 / 20%))`,
              color: "oklch(0.50 0.20 285)",
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200 text-sm">
          {d.prenom} {d.nom_de_famille}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {d.nom_circo}
          {d.num_deptmt ? ` (${d.num_deptmt})` : ""}
        </div>
        <div className="mt-1.5">
          <GroupBadge sigle={d.groupe_sigle} size="sm" />
        </div>
      </div>

      {/* Flèche */}
      <svg
        className="self-center shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-1"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}

export function DeputeCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="flex gap-3 p-3 rounded-2xl glass border border-border/40 animate-fade-in"
      style={{ animationDelay: `${index * 25}ms` }}
      aria-hidden="true"
    >
      <div className="skeleton w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 rounded-lg w-3/4" />
        <div className="skeleton h-3 rounded-lg w-1/2" />
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
