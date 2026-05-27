"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { markPaidAction } from "@/app/(app)/payouts/actions";

interface AwardRow {
  projectId: string;
  title: string;
  prizeCents: number;
  winnerName: string;
  winnerEmail: string;
  awardedAt: string;
}

export function PayoutForm({
  rows,
  quarterChoices,
  defaultQuarter,
}: {
  rows: AwardRow[];
  quarterChoices: string[];
  defaultQuarter: string;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  const total = rows
    .filter((r) => selected[r.projectId])
    .reduce((s, r) => s + r.prizeCents, 0);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing pending. Awarded projects show up here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left w-10"></th>
              <th className="px-4 py-2 text-left">Project</th>
              <th className="px-4 py-2 text-left">Winner</th>
              <th className="px-4 py-2 text-left">Awarded</th>
              <th className="px-4 py-2 text-right">Prize</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.projectId} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={!!selected[r.projectId]}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [r.projectId]: e.target.checked }))
                    }
                  />
                </td>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2">
                  <div>{r.winnerName}</div>
                  <div className="text-xs text-muted-foreground">{r.winnerEmail}</div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(r.awardedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  {formatMoney(r.prizeCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-4">
        <label className="block">
          <span className="block text-xs font-medium mb-1">Pay in quarter</span>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {quarterChoices.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto text-right">
          <div className="text-xs text-muted-foreground">
            {selectedIds.length} selected · total
          </div>
          <div className="text-xl font-semibold tabular-nums">{formatMoney(total)}</div>
        </div>

        <button
          type="button"
          disabled={pending || selectedIds.length === 0}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await markPaidAction(selectedIds, quarter);
              if (res?.error) setError(res.error);
              else setSelected({});
            });
          }}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Marking paid..." : "Mark paid"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
