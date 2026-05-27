"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { castContributorVote } from "@/app/(app)/projects/[slug]/actions";

interface ContributorTally {
  id: string;
  name: string;
  email: string;
  voteCount: number;
}

export function JudgingPanel({
  projectId,
  contributors,
  myVoteFor,
  totalVotes,
}: {
  projectId: string;
  contributors: ContributorTally[];
  myVoteFor: string | null;
  totalVotes: number;
}) {
  const [pending, startTransition] = useTransition();

  if (contributors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No contributors logged yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {contributors.map((c) => {
        const pct =
          totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0;
        const selected = myVoteFor === c.id;
        return (
          <button
            key={c.id}
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await castContributorVote(projectId, c.id);
              });
            }}
            className={cn(
              "w-full text-left rounded-lg border p-3 transition",
              selected
                ? "border-foreground bg-accent"
                : "border-border bg-background hover:border-foreground/50",
              pending && "opacity-60",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.email}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium tabular-nums">
                  {c.voteCount} {c.voteCount === 1 ? "vote" : "votes"}
                </div>
                <div className="text-xs text-muted-foreground">{pct}%</div>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground/80"
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Click a contributor to vote. You can change your vote any time while judging is open.
      </p>
    </div>
  );
}
