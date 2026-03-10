import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";

export default async function AnalyticsPage() {
  const { membership } = await requireWorkspaceMembership();
  const tasks = await db.task.findMany({ where: { teamId: membership.teamId } });

  const total = tasks.length || 1;
  const done = tasks.filter((task) => task.status === "DONE").length;
  const inFlight = tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "IN_REVIEW").length;
  const urgent = tasks.filter((task) => task.priority === "URGENT").length;

  const bars = [
    { label: "Done", value: done, color: "bg-emerald-500" },
    { label: "In flight", value: inFlight, color: "bg-sky-500" },
    { label: "Urgent", value: urgent, color: "bg-rose-500" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Analytics</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">A lightweight pulse on team delivery.</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Completion rate" value={`${Math.round((done / total) * 100)}%`} helper="Tasks that are fully shipped." />
        <StatCard label="Work in flight" value={String(inFlight)} helper="Tasks actively moving through the board." />
        <StatCard label="Urgent items" value={String(urgent)} helper="High-priority work that needs attention." />
      </div>
      <Card className="bg-white shadow-card">
        <h2 className="text-xl font-semibold text-slate-900">Status mix</h2>
        <div className="mt-6 space-y-4">
          {bars.map((bar) => (
            <div key={bar.label}>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>{bar.label}</span>
                <span>{bar.value}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className={`h-3 rounded-full ${bar.color}`} style={{ width: `${Math.max(8, Math.round((bar.value / total) * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
