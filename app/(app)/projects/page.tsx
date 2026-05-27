import Link from "next/link";
import { listProjects } from "@/lib/queries/projects";
import { ProjectCard } from "@/components/shared/ProjectCard";
import type { ProjectStatus } from "@/types/database";

const FILTERS: Array<{ key: string; label: string; status?: ProjectStatus; idea?: boolean }> = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas", idea: true },
  { key: "in_progress", label: "In progress", status: "in_progress" },
  { key: "judging", label: "Judging", status: "judging" },
  { key: "awarded", label: "Awarded", status: "awarded" },
  { key: "paid", label: "Paid", status: "paid" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const active = FILTERS.find((f) => f.key === searchParams.filter) ?? FILTERS[0];

  const projects = await listProjects({
    status: active.status,
    ideaOnly: active.idea,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse every XPrize project and idea.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          New project
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/projects?filter=${f.key}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              active.key === f.key
                ? "border-foreground bg-foreground text-primary-foreground"
                : "border-border bg-background hover:border-foreground/50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects in this view.</p>
        ) : (
          projects.map((p) => (
            <ProjectCard
              key={p.id}
              slug={p.slug}
              title={p.title}
              description={p.description}
              status={p.status}
              prizeCents={p.prize_cents}
              voteCount={p.vote_count}
              contributorCount={p.contributor_count}
            />
          ))
        )}
      </div>
    </div>
  );
}
