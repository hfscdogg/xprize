import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ProjectStatus } from "@/types/database";

interface Props {
  slug: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  prizeCents: number;
  voteCount?: number;
  contributorCount?: number;
}

export function ProjectCard({
  slug,
  title,
  description,
  status,
  prizeCents,
  voteCount,
  contributorCount,
}: Props) {
  return (
    <Link
      href={`/projects/${slug}`}
      className="block rounded-xl border border-border bg-background p-5 hover:border-foreground/30 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-semibold tabular-nums">
            {prizeCents > 0 ? formatMoney(prizeCents) : "—"}
          </div>
          <div className="mt-1">
            <StatusBadge status={status} prizeCents={prizeCents} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {typeof voteCount === "number" && <span>▲ {voteCount} votes</span>}
        {typeof contributorCount === "number" && <span>{contributorCount} contributors</span>}
      </div>
    </Link>
  );
}
