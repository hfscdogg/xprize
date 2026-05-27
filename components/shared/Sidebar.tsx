"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/projects/new", label: "New project" },
  { href: "/payouts", label: "Payouts", adminOnly: true },
];

export function Sidebar({ isAdmin, fullName, email }: { isAdmin: boolean; fullName: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-background flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="block">
          <div className="text-lg font-semibold tracking-tight">XPrize</div>
          <div className="text-xs text-muted-foreground">Livewire</div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-5 py-4">
        <div className="text-sm font-medium">{fullName}</div>
        <div className="text-xs text-muted-foreground truncate">{email}</div>
        {isAdmin && (
          <div className="mt-2 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            Admin
          </div>
        )}
        <form action="/auth/sign-out" method="post" className="mt-3">
          <button
            type="submit"
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
