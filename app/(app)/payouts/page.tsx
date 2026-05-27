import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { quarterChoices, quarterOf } from "@/lib/quarter";
import { PayoutForm } from "@/components/shared/PayoutForm";
import { formatMoney } from "@/lib/money";

export default async function PayoutsPage() {
  const me = await requireUser();
  if (!me.is_admin) redirect("/");

  const supabase = createClient();

  const { data: pending } = await supabase
    .from("projects")
    .select(
      "id, title, prize_cents, awarded_at, winner:profiles!projects_winner_id_fkey(id, email, full_name)",
    )
    .eq("status", "awarded")
    .order("awarded_at", { ascending: true });

  const { data: paid } = await supabase
    .from("projects")
    .select(
      "id, slug, title, prize_cents, prize_paid_at, prize_paid_in_quarter, winner:profiles!projects_winner_id_fkey(id, email, full_name)",
    )
    .eq("status", "paid")
    .order("prize_paid_at", { ascending: false })
    .limit(20);

  const rows = (pending ?? []).map((row: any) => ({
    projectId: row.id as string,
    title: row.title as string,
    prizeCents: row.prize_cents as number,
    winnerName: row.winner?.full_name ?? row.winner?.email?.split("@")[0] ?? "—",
    winnerEmail: row.winner?.email ?? "",
    awardedAt: row.awarded_at as string,
  }));

  const totalPending = rows.reduce((s, r) => s + r.prizeCents, 0);

  // Group paid history by quarter.
  const paidByQuarter = new Map<string, typeof paid>();
  for (const p of paid ?? []) {
    const q = (p as any).prize_paid_in_quarter ?? "—";
    const arr = paidByQuarter.get(q) ?? [];
    arr.push(p as any);
    paidByQuarter.set(q, arr as any);
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Awarded projects waiting to be paid out. Mark them paid at the all-hands.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Pending</h2>
          <div className="text-sm text-muted-foreground">
            {rows.length} awards · total {formatMoney(totalPending)}
          </div>
        </div>
        <PayoutForm
          rows={rows}
          quarterChoices={quarterChoices()}
          defaultQuarter={quarterOf()}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Paid history</h2>
        <div className="mt-3 space-y-4">
          {paidByQuarter.size === 0 && (
            <p className="text-sm text-muted-foreground">No payouts yet.</p>
          )}
          {Array.from(paidByQuarter.entries()).map(([q, items]) => {
            const total = (items ?? []).reduce(
              (s, p) => s + ((p as any).prize_cents ?? 0),
              0,
            );
            return (
              <div key={q} className="rounded-xl border border-border bg-background">
                <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
                  <div className="text-sm font-semibold">{q}</div>
                  <div className="text-sm text-muted-foreground tabular-nums">
                    {(items ?? []).length} · {formatMoney(total)}
                  </div>
                </div>
                <div>
                  {(items ?? []).map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-0 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.winner?.full_name ?? p.winner?.email ?? "—"}
                        </div>
                      </div>
                      <div className="tabular-nums font-medium">
                        {formatMoney(p.prize_cents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
