"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import type { ProjectStatus } from "@/types/database";
import {
  setStatusAction,
  setPrizeAction,
  setWinnerAction,
} from "@/app/(app)/projects/[slug]/actions";

const STATUSES: ProjectStatus[] = ["open", "in_progress", "judging", "awarded", "paid"];

interface Contributor {
  id: string;
  name: string;
  email: string;
}

export function AdminControls({
  projectId,
  status,
  prizeCents,
  winnerId,
  contributors,
}: {
  projectId: string;
  status: ProjectStatus;
  prizeCents: number;
  winnerId: string | null;
  contributors: Contributor[];
}) {
  const [pending, startTransition] = useTransition();
  const [prizeInput, setPrizeInput] = useState(
    prizeCents > 0 ? (prizeCents / 100).toString() : "",
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
      <div className="text-xs font-semibold tracking-wide uppercase text-amber-900">
        Admin controls
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending || s === status}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await setStatusAction(projectId, s);
                  if (res?.error) setError(res.error);
                });
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                s === status
                  ? "border-foreground bg-foreground text-primary-foreground"
                  : "border-border bg-background hover:border-foreground/50",
                pending && "opacity-60",
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Prize ({prizeCents > 0 ? formatMoney(prizeCents) : "not set"})
        </label>
        <form
          className="flex gap-2"
          action={(formData) => {
            const raw = String(formData.get("prize") ?? "");
            const cents = parseMoneyToCents(raw);
            setError(null);
            startTransition(async () => {
              const res = await setPrizeAction(projectId, cents);
              if (res?.error) setError(res.error);
            });
          }}
        >
          <input
            name="prize"
            type="text"
            inputMode="decimal"
            placeholder="$1,000"
            value={prizeInput}
            onChange={(e) => setPrizeInput(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Save prize
          </button>
        </form>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Pick winner</label>
        {contributors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No contributors yet.</p>
        ) : (
          <div className="space-y-1.5">
            {contributors.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const res = await setWinnerAction(projectId, c.id);
                    if (res?.error) setError(res.error);
                  });
                }}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                  c.id === winnerId
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-border bg-background hover:border-foreground/50",
                  pending && "opacity-60",
                )}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.email}</div>
                {c.id === winnerId && (
                  <div className="text-xs font-medium text-emerald-700 mt-0.5">
                    Selected winner
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Selecting a winner moves the project to <strong>awarded</strong>.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
