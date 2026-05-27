"use client";

import { useState, useTransition } from "react";
import { addContribution } from "@/app/(app)/projects/[slug]/actions";

export function ContributionForm({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      action={(formData) => {
        const value = String(formData.get("notes") ?? "").trim();
        if (!value) {
          setError("Add some notes first.");
          return;
        }
        setError(null);
        startTransition(async () => {
          const res = await addContribution(projectId, value);
          if (res?.error) {
            setError(res.error);
          } else {
            setNotes("");
          }
        });
      }}
    >
      <textarea
        name="notes"
        required
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What did you ship for this project?"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Saving..." : "Log contribution"}
        </button>
      </div>
    </form>
  );
}
