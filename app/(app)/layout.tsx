import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/shared/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const fullName = me.full_name ?? me.email.split("@")[0];

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={me.is_admin} fullName={fullName} email={me.email} />
      <main className="flex-1 bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
