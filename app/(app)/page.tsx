import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/queries/projects";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const me = await requireUser();
  const supabase = createClient();

  const [ideas, inProgress, judging, recentPaidRes, myAwardsRes] = await Promise.all([
    listProjects({ ideaOnly: true }),
    listProjects({ status: "in_progress" }),
    listProjects({ status: "judging" }),
    supabase
      .from("projects")
      .select("id, slug, title, prize_cents, prize_paid_at, winner_id, prize_paid_in_quarter")
      .eq("status", "paid")
      .order("prize_paid_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id, slug, title, prize_cents, status, prize_paid_in_quarter")
      .eq("winner_id", me.id)
      .order("awarded_at", { ascending: false }),
  ]);

  // Sort ideas by vote count, highest first.
  const topIdeas = [...ideas]
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 8);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {me.full_name ?? me.email.split("@")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {me.is_admin
            ? "List projects, set prizes, pick winners, mark payouts at the all-hands."
            : "Submit ideas, upvote what to build, log your contributions, vote on winners."}
        </p>
      </header>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Top ideas</h2>
          <Link href="/ideas/new" className="text-sm underline">
            Submit an idea
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          What employees want to see worked on next.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {topIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ideas yet.</p>
          ) : (
            topIdeas.map((p) => (
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
      </section>

      {judging.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Up for judging</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vote on the winning contributor.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {judging.map((p) => (
              <ProjectCard
                key={p.id}
                slug={p.slug}
                title={p.title}
                description={p.description}
                status={p.status}
                prizeCents={p.prize_cents}
                contributorCount={p.contributor_count}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">In progress</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in progress.</p>
          ) : (
            inProgress.map((p) => (
              <ProjectCard
                key={p.id}
                slug={p.slug}
                title={p.title}
                description={p.description}
                status={p.status}
                prizeCents={p.prize_cents}
                contributorCount={p.contributor_count}
              />
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Recently paid</h2>
          <div className="mt-3 space-y-2">
            {(recentPaidRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No payouts yet.</p>
            ) : (
              (recentPaidRes.data ?? []).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="block rounded-lg border border-border bg-background p-3 hover:border-foreground/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMoney(p.prize_cents)}
                    </div>
                  </div>
                  {p.prize_paid_in_quarter && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Paid in {p.prize_paid_in_quarter}
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Your wins</h2>
          <div className="mt-3 space-y-2">
            {(myAwardsRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None yet. Contribute to a project to be eligible.
              </p>
            ) : (
              (myAwardsRes.data ?? []).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="block rounded-lg border border-border bg-background p-3 hover:border-foreground/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMoney(p.prize_cents)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.status === "paid"
                      ? `Paid in ${p.prize_paid_in_quarter ?? "—"}`
                      : "Awarded — payout at next all-hands"}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
