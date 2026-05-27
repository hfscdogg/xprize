"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { ProjectStatus } from "@/types/database";

type ActionResult = { error?: string } | void;

async function projectIdToSlug(projectId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", projectId)
    .maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

async function revalidateProject(projectId: string) {
  const slug = await projectIdToSlug(projectId);
  if (slug) revalidatePath(`/projects/${slug}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

// ---------- Votes ----------

export async function toggleProjectVote(projectId: string): Promise<ActionResult> {
  const me = await requireUser();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("project_votes")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("user_id", me.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("project_votes")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", me.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("project_votes")
      .insert({ project_id: projectId, user_id: me.id });
    if (error) return { error: error.message };
  }

  await revalidateProject(projectId);
}

export async function castContributorVote(
  projectId: string,
  contributorId: string,
): Promise<ActionResult> {
  const me = await requireUser();
  const supabase = createClient();

  // Upsert: change vote if already cast.
  const { error } = await supabase
    .from("contributor_votes")
    .upsert(
      {
        project_id: projectId,
        voter_id: me.id,
        contributor_id: contributorId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "project_id,voter_id" },
    );

  if (error) return { error: error.message };

  await revalidateProject(projectId);
}

// ---------- Contributions ----------

export async function addContribution(
  projectId: string,
  notes: string,
): Promise<ActionResult> {
  const me = await requireUser();
  const cleaned = notes.trim();
  if (!cleaned) return { error: "Notes required." };

  const supabase = createClient();
  const { error } = await supabase.from("contributions").insert({
    project_id: projectId,
    user_id: me.id,
    notes: cleaned,
  });
  if (error) return { error: error.message };

  await revalidateProject(projectId);
}

// ---------- Admin: status / prize / winner ----------

export async function setStatusAction(
  projectId: string,
  status: ProjectStatus,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createClient();

  const update: Record<string, unknown> = { status };
  if (status === "awarded") update.awarded_at = new Date().toISOString();
  if (status !== "awarded" && status !== "paid") {
    update.awarded_at = null;
    update.winner_id = null;
  }
  if (status !== "paid") {
    update.prize_paid_at = null;
    update.prize_paid_in_quarter = null;
  }

  const { error } = await supabase.from("projects").update(update).eq("id", projectId);
  if (error) return { error: error.message };

  await revalidateProject(projectId);
}

export async function setPrizeAction(
  projectId: string,
  prizeCents: number,
): Promise<ActionResult> {
  await requireAdmin();
  if (prizeCents < 0 || !Number.isFinite(prizeCents)) {
    return { error: "Invalid prize amount." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ prize_cents: Math.round(prizeCents) })
    .eq("id", projectId);
  if (error) return { error: error.message };

  await revalidateProject(projectId);
}

export async function setWinnerAction(
  projectId: string,
  contributorId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      winner_id: contributorId,
      status: "awarded",
      awarded_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error) return { error: error.message };

  await revalidateProject(projectId);
}

// ---------- Idea creation (anyone) ----------

export async function createIdeaAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const supabase = createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Title required.");

  const { slugify } = await import("@/lib/slug");
  const base = slugify(title) || "project";
  let slug = base;
  // Suffix until unique.
  for (let i = 1; i < 50; i++) {
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${i}`;
  }

  const insert: Record<string, unknown> = {
    title,
    description,
    slug,
    created_by: me.id,
    status: "open",
    prize_cents: 0,
  };

  // Admin form may include prize_cents and status.
  if (me.is_admin) {
    const prizeRaw = formData.get("prize_cents");
    if (typeof prizeRaw === "string" && prizeRaw) {
      const n = Number.parseInt(prizeRaw, 10);
      if (!Number.isNaN(n) && n >= 0) insert.prize_cents = n;
    }
    const status = formData.get("status");
    if (typeof status === "string" && status) insert.status = status;
  }

  const { error } = await supabase.from("projects").insert(insert);
  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${slug}`);
}
