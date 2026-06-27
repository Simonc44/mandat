import { groupeMeta } from "@/lib/api";

export function GroupBadge({ sigle, size = "md" }: { sigle: string; size?: "sm" | "md" }) {
  const g = groupeMeta(sigle);
  const cls =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5"
      : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${cls}`}
      style={{ borderColor: g.couleur, color: g.couleur }}
      title={g.nom}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.couleur }} />
      {sigle || "NI"}
    </span>
  );
}
