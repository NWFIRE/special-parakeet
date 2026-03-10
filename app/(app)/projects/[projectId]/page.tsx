import { notFound } from "next/navigation";
import { TaskForm } from "@/components/forms/task-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { membership } = await requireWorkspaceMembership();

  const project = await db.project.findFirst({
    where: { id: projectId, teamId: membership.teamId },
    include: {
      tasks: {
        include: { assignee: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const assignees = await db.user.findMany({
    where: {
      memberships: {
        some: {
          teamId: membership.teamId
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Project detail</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">{project.name}</h1>
          <p className="mt-3 text-sm text-slate-600">{project.description || "No description yet."}</p>
        </div>
        {project.tasks.length ? (
          project.tasks.map((task) => (
            <Card key={task.id} className="bg-white shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{task.description || "No description provided."}</p>
                  <p className="mt-3 text-xs text-slate-500">Due {formatDate(task.dueDate)}</p>
                  <p className="mt-1 text-xs text-slate-500">Assigned to {task.assignee?.name ?? task.assignee?.email ?? "Nobody yet"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge value={task.status} />
                  <Badge value={task.priority} />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No tasks yet" description="Add the first task for this project using the form on the right." />
        )}
      </div>
      <div>
        <TaskForm teamId={membership.teamId} projectId={project.id} assignees={assignees.map((item) => ({ id: item.id, name: item.name, email: item.email }))} />
      </div>
    </div>
  );
}
