// components/GroupBadge.tsx — Liquid Glass avec glow coloré
import { groupeMeta } from "@/lib/api";

export function GroupBadge({
  sigle,
  size = "md",
}: {
  sigle: string;
  size?: "sm" | "md" | "lg";
}) {
  const g = groupeMeta(sigle || "NI");

  const cls = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }[size];

  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  }[size];

  return (
    <span
      className={`groupe-badge inline-flex items-center rounded-full font-semibold backdrop-blur-sm ${cls}`}
      style={{
        color: g.couleur,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `color-mix(in oklch, ${g.couleur} 40%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${g.couleur} 10%, oklch(1 0 0 / 60%))`,
      }}
      title={g.nom}
      aria-label={`Groupe : ${g.nom}`}
    >
      <span
        className={`${dotSize} rounded-full shrink-0`}
        style={{ backgroundColor: g.couleur, opacity: 0.8 }}
        aria-hidden="true"
      />
      {sigle || "NI"}
    </span>
  );
}
