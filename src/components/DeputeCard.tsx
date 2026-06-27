import { Link } from "@tanstack/react-router";
import type { Depute } from "@/lib/api";
import { photoUrl } from "@/lib/api";
import { GroupBadge } from "./GroupBadge";

export function DeputeCard({ d }: { d: Depute }) {
  return (
    <Link
      to="/depute/$slug"
      params={{ slug: d.slug }}
      className="group flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <img
        src={photoUrl(d.id_an)}
        alt={d.nom}
        loading="lazy"
        className="w-14 h-14 rounded-lg object-cover bg-muted shrink-0"
        onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
      />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {d.prenom} {d.nom_de_famille}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {d.nom_circo} ({d.num_deptmt}) · circo. {d.num_circo}
        </div>
        <div className="mt-1.5">
          <GroupBadge sigle={d.groupe_sigle} size="sm" />
        </div>
      </div>
    </Link>
  );
}
