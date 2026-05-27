"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleProjectVote } from "@/app/(app)/projects/[slug]/actions";

export function VoteButton({
  projectId,
  voted,
  count,
  disabled,
}: {
  projectId: string;
  voted: boolean;
  count: number;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          await toggleProjectVote(projectId);
        });
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
        voted
          ? "border-foreground bg-foreground text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-foreground/50",
        (disabled || pending) && "opacity-60",
      )}
    >
      <span>▲</span>
      <span>{count}</span>
      <span className="text-muted-foreground/70 font-normal">
        {voted ? "Voted" : "Vote"}
      </span>
    </button>
  );
}
