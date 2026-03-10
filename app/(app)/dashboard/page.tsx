import Link from "next/link";
import { ArrowUpRight, Layers3, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData } from "@/lib/dashboard";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const { user, membership } = await requireWorkspaceMembership();
  const dashboardMembership = await getDashboardData(membership.teamId);

  if (!dashboardMembership) {
    return <EmptyState title="No workspace found" description="Create or accept a workspace invite to get started." />;
  }

  const tasks = dashboardMembership.team.projects.flatMap((project) => project.tasks);
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < new Date() && task.status !== "DONE").length;

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
          <div>
            <p className="eyebrow">Overview</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">
              Welcome back, {user.name ?? user.email}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              You are working in <span className="font-semibold text-slate-900">{dashboardMembership.team.name}</span>. The workspace snapshot below keeps projects, invites, and delivery health in one view.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/projects" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 hover:bg-brand-dark">
                Open projects
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/board" className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white">
                Review board
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-[0_18px_40px_rgba(17,24,39,0.2)]">
              <div className="flex items-center gap-3 text-teal-200">
                <Layers3 className="h-5 w-5" />
                <span className="text-sm font-medium">Workspace status</span>
              </div>
              <p className="mt-4 font-display text-3xl font-bold">{dashboardMembership.team.projects.length} active</p>
              <p className="mt-1 text-sm text-slate-300">projects currently in motion</p>
            </div>
            <div className="rounded-[1.5rem] border border-brand/15 bg-brand/10 p-5">
              <div className="flex items-center gap-3 text-brand-dark">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">This week</span>
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-slate-950">{completedTasks}</p>
              <p className="mt-1 text-sm text-slate-600">tasks reached done</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projects" value={String(dashboardMembership.team.projects.length)} helper="Active initiatives in your workspace." />
        <StatCard label="Completed tasks" value={String(completedTasks)} helper="Tasks that made it all the way to done." />
        <StatCard label="Overdue" value={String(overdueTasks)} helper="Items that need attention this week." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel-strong">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Projects</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent project activity</h2>
            </div>
            <Link href="/projects" className="text-sm font-semibold text-brand-dark">Manage projects</Link>
          </div>
          <div className="space-y-4">
            {dashboardMembership.team.projects.slice(0, 4).map((project) => (
              <div key={project.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-slate-900">{project.name}</Link>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{project.description || "No description yet."}</p>
                  </div>
                  <Badge value={`${project.tasks.length} tasks`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel-strong">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Invites</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Pending team access</h2>
            </div>
            <Link href="/team" className="text-sm font-semibold text-brand-dark">Team settings</Link>
          </div>
          <div className="space-y-4">
            {dashboardMembership.team.invites.length ? (
              dashboardMembership.team.invites.map((invite) => (
                <div key={invite.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{invite.email}</p>
                      <p className="mt-1 text-sm text-slate-500">Expires {formatDate(invite.expiresAt)}</p>
                    </div>
                    <Badge value={invite.role} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No pending invites" description="Invite a teammate to start collaborating." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
