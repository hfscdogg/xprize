import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStatus } from "@/types/database";

export interface ProjectListItem extends Project {
  vote_count: number;
  contributor_count: number;
}

export async function listProjects(filter?: {
  status?: ProjectStatus;
  ideaOnly?: boolean;
}): Promise<ProjectListItem[]> {
  const supabase = createClient();

  let query = supabase
    .from("projects")
    .select(
      "*, project_votes(count), contributions(user_id)",
    )
    .order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.ideaOnly) query = query.eq("prize_cents", 0).eq("status", "open");

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const voteCount =
      Array.isArray(row.project_votes) && row.project_votes[0]
        ? Number(row.project_votes[0].count)
        : 0;
    const uniqueContributors = new Set(
      (row.contributions ?? []).map((c: { user_id: string }) => c.user_id),
    );
    return {
      ...row,
      vote_count: voteCount,
      contributor_count: uniqueContributors.size,
    } as ProjectListItem;
  });
}

export async function getProjectBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Project | null;
}
