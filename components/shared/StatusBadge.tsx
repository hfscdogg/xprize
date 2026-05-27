import type { ProjectStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STYLES: Record<ProjectStatus | "idea", string> = {
  idea: "bg-slate-100 text-slate-700 border-slate-200",
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  judging: "bg-purple-50 text-purple-800 border-purple-200",
  awarded: "bg-emerald-50 text-emerald-800 border-emerald-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-300",
};

const LABELS: Record<ProjectStatus | "idea", string> = {
  idea: "Idea",
  open: "Open",
  in_progress: "In progress",
  judging: "Judging",
  awarded: "Awarded",
  paid: "Paid",
};

export function StatusBadge({
  status,
  prizeCents,
}: {
  status: ProjectStatus;
  prizeCents?: number;
}) {
  const effective: ProjectStatus | "idea" =
    status === "open" && (prizeCents ?? 0) === 0 ? "idea" : status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STYLES[effective],
      )}
    >
      {LABELS[effective]}
    </span>
  );
}
