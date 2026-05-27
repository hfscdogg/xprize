import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VoteButton } from "@/components/shared/VoteButton";
import { JudgingPanel } from "@/components/shared/JudgingPanel";
import { AdminControls } from "@/components/shared/AdminControls";
import { ContributionForm } from "@/components/shared/ContributionForm";
import type { Project } from "@/types/database";

interface ProfileLite {
  id: string;
  email: string;
  full_name: string | null;
}

interface ContributionRow {
  id: string;
  project_id: string;
  user_id: string;
  notes: string;
  created_at: string;
  profile: ProfileLite | null;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const me = await requireUser();
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!project) notFound();
  const p = project as Project;

  const [voteCountRes, myVoteRes, contributionsRes, contributorVotesRes, myCvRes, winnerRes, creatorRes] =
    await Promise.all([
      supabase
        .from("project_votes")
        .select("project_id", { count: "exact", head: true })
        .eq("project_id", p.id),
      supabase
        .from("project_votes")
        .select("project_id")
        .eq("project_id", p.id)
        .eq("user_id", me.id)
        .maybeSingle(),
      supabase
        .from("contributions")
        .select("id, project_id, user_id, notes, created_at, profile:profiles!contributions_user_id_fkey(id, email, full_name)")
        .eq("project_id", p.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contributor_votes")
        .select("contributor_id")
        .eq("project_id", p.id),
      supabase
        .from("contributor_votes")
        .select("contributor_id")
        .eq("project_id", p.id)
        .eq("voter_id", me.id)
        .maybeSingle(),
      p.winner_id
        ? supabase.from("profiles").select("id, email, full_name").eq("id", p.winner_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", p.created_by)
        .maybeSingle(),
    ]);

  const voteCount = voteCountRes.count ?? 0;
  const iVoted = !!myVoteRes.data;
  const contributions = (contributionsRes.data ?? []) as unknown as ContributionRow[];

  // Build unique contributors + tally judging votes for each.
  const tally = new Map<string, number>();
  for (const row of contributorVotesRes.data ?? []) {
    tally.set(row.contributor_id, (tally.get(row.contributor_id) ?? 0) + 1);
  }
  const uniqueContributors = new Map<string, ProfileLite>();
  for (const c of contributions) {
    if (c.profile && !uniqueContributors.has(c.profile.id)) {
      uniqueContributors.set(c.profile.id, c.profile);
    }
  }
  const contributorList = Array.from(uniqueContributors.values()).map((profile) => ({
    id: profile.id,
    name: profile.full_name ?? profile.email.split("@")[0],
    email: profile.email,
    voteCount: tally.get(profile.id) ?? 0,
  }));
  contributorList.sort((a, b) => b.voteCount - a.voteCount);

  const totalCvVotes = contributorList.reduce((s, c) => s + c.voteCount, 0);
  const myCvFor = (myCvRes.data?.contributor_id as string | undefined) ?? null;
  const winner = (winnerRes.data ?? null) as ProfileLite | null;
  const creator = (creatorRes.data ?? null) as ProfileLite | null;

  const isIdea = p.status === "open" && p.prize_cents === 0;
  const canPriorityVote = p.status === "open" || p.status === "in_progress";
  const canContribute =
    p.prize_cents > 0 &&
    (p.status === "open" || p.status === "in_progress" || p.status === "judging");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{p.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Created by {creator?.full_name ?? creator?.email ?? "—"}
              {p.awarded_at && ` · Awarded ${new Date(p.awarded_at).toLocaleDateString()}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-semibold tabular-nums">
              {p.prize_cents > 0 ? formatMoney(p.prize_cents) : "—"}
            </div>
            <div className="mt-1">
              <StatusBadge status={p.status} prizeCents={p.prize_cents} />
            </div>
          </div>
        </div>
        {p.description && (
          <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {p.description}
          </div>
        )}
        <div className="flex items-center gap-3 pt-2">
          <VoteButton
            projectId={p.id}
            voted={iVoted}
            count={voteCount}
            disabled={!canPriorityVote}
          />
          {!canPriorityVote && (
            <span className="text-xs text-muted-foreground">
              Priority voting closes once a project starts judging.
            </span>
          )}
        </div>
      </header>

      {winner && (
        <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Winner
          </div>
          <div className="mt-1 text-sm font-medium text-emerald-900">
            {winner.full_name ?? winner.email.split("@")[0]} — {formatMoney(p.prize_cents)}
          </div>
          {p.status === "awarded" && (
            <div className="mt-0.5 text-xs text-emerald-800">
              Payout at the next all-hands.
            </div>
          )}
          {p.status === "paid" && (
            <div className="mt-0.5 text-xs text-emerald-800">
              Paid {p.prize_paid_at ? new Date(p.prize_paid_at).toLocaleDateString() : ""}
              {p.prize_paid_in_quarter && ` (${p.prize_paid_in_quarter})`}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Contributions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isIdea
                ? "Idea-stage. Once a prize is attached, you can log contributions here."
                : "What people have shipped for this project."}
            </p>

            {canContribute && (
              <div className="mt-4">
                <ContributionForm projectId={p.id} />
              </div>
            )}

            <div className="mt-6 space-y-3">
              {contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contributions yet.</p>
              ) : (
                contributions.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm font-medium">
                        {c.profile?.full_name ?? c.profile?.email ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1.5 whitespace-pre-wrap text-sm">{c.notes}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {p.status === "judging" && (
            <section>
              <h2 className="text-base font-semibold">Vote for winner</h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Pick the contributor you think should win.
              </p>
              <JudgingPanel
                projectId={p.id}
                contributors={contributorList}
                myVoteFor={myCvFor}
                totalVotes={totalCvVotes}
              />
            </section>
          )}

          {(p.status === "awarded" || p.status === "paid") && contributorList.length > 0 && (
            <section>
              <h2 className="text-base font-semibold">Final tally</h2>
              <div className="mt-2 space-y-1.5">
                {contributorList.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c.voteCount} {c.voteCount === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {me.is_admin && (
            <AdminControls
              projectId={p.id}
              status={p.status}
              prizeCents={p.prize_cents}
              winnerId={p.winner_id}
              contributors={contributorList.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email,
              }))}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
