"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function markPaidAction(
  projectIds: string[],
  quarter: string,
): Promise<{ error?: string } | void> {
  await requireAdmin();
  if (projectIds.length === 0) return;
  if (!/^\d{4}-Q[1-4]$/.test(quarter)) return { error: "Invalid quarter format." };

  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      status: "paid",
      prize_paid_at: new Date().toISOString(),
      prize_paid_in_quarter: quarter,
    })
    .in("id", projectIds)
    .eq("status", "awarded");

  if (error) return { error: error.message };

  revalidatePath("/payouts");
  revalidatePath("/");
  for (const id of projectIds) {
    revalidatePath(`/projects/${id}`);
  }
}
