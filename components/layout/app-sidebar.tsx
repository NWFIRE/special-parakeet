"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, FolderKanban, LayoutDashboard, KanbanSquare, Settings, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/layout/logout-button";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/board", label: "Kanban board", icon: KanbanSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users2 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;

export function AppSidebar({
  teamName,
  role,
  memberships,
  activeTeamId
}: {
  teamName: string;
  role: string;
  memberships: Array<{ teamId: string; teamName: string; role: string }>;
  activeTeamId: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="glass-panel-strong flex h-full flex-col overflow-hidden rounded-[2rem] bg-slate-950/96 p-5 text-white">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <p className="font-display text-2xl font-bold tracking-tight">TaskFlow</p>
        <p className="mt-4 text-sm text-slate-400">{teamName}</p>
        <Badge value={role} className="mt-3" />
        <WorkspaceSwitcher memberships={memberships} activeTeamId={activeTeamId} />
      </div>
      <nav className="mt-6 space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/projects" && pathname.startsWith("/projects/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active ? "bg-white text-slate-950 shadow-[0_16px_30px_rgba(255,255,255,0.12)]" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
