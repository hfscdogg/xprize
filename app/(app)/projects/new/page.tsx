import { requireUser } from "@/lib/auth";
import { createIdeaAction } from "@/app/(app)/projects/[slug]/actions";

export default async function NewProjectPage() {
  const me = await requireUser();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {me.is_admin
            ? "Create a project with a prize attached, or leave the prize at $0 to log an idea."
            : "Submit an idea. Henry will attach a prize when it's a real project."}
        </p>
      </header>

      <form action={createIdeaAction} className="space-y-4 rounded-xl border border-border bg-background p-6">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Title</span>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="What's the project?"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium mb-1">Description</span>
          <textarea
            name="description"
            rows={6}
            placeholder="What is it? Why does it matter? Anything a contributor should know."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        {me.is_admin && (
          <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <div className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Admin-only fields
            </div>
            <label className="block">
              <span className="block text-xs font-medium mb-1">Prize (cents)</span>
              <input
                name="prize_cents"
                type="number"
                min={0}
                step={100}
                placeholder="e.g. 50000 for $500"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium mb-1">Status</span>
              <select
                name="status"
                defaultValue="open"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="judging">judging</option>
              </select>
            </label>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
