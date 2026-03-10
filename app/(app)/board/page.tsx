import { KanbanBoard } from "@/components/tasks/kanban-board";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";

export default async function BoardPage() {
  const { membership } = await requireWorkspaceMembership();
  const tasks = await db.task.findMany({
    where: { teamId: membership.teamId },
    include: {
      assignee: true,
      project: true
    },
    orderBy: { createdAt: "desc" }
  });

  if (!tasks.length) {
    return <EmptyState title="No tasks yet" description="Create a task from a project to populate the Kanban board." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Kanban board</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Move work as it progresses.</h1>
      </div>
      <KanbanBoard
        tasks={tasks.map((task) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() ?? null,
          assignee: task.assignee?.name ?? task.assignee?.email ?? null,
          status: task.status,
          project: task.project.name
        }))}
      />
    </div>
  );
}
