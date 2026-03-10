import Link from "next/link";
import { ProjectForm } from "@/components/forms/project-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { canEditProjects } from "@/lib/permissions";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";

export default async function ProjectsPage() {
  const { membership } = await requireWorkspaceMembership();
  const projects = await db.project.findMany({
    where: { teamId: membership.teamId },
    include: { tasks: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Projects</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Organize work by initiative.</h1>
        <p className="mt-3 text-sm text-slate-600">Create projects, review scope, and drill into tasks without leaving the workspace.</p>
        <div className="mt-6">
          {canEditProjects(membership.role) ? <ProjectForm teamId={membership.teamId} /> : <p className="text-sm text-slate-500">Admin or owner access is required to create projects.</p>}
        </div>
      </div>
      <div className="space-y-4">
        {projects.length ? (
          projects.map((project) => (
            <Card key={project.id} className="bg-white shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-slate-900">{project.name}</Link>
                  <p className="mt-2 text-sm text-slate-600">{project.description || "No description yet."}</p>
                </div>
                <Badge value={`${project.tasks.length} tasks`} />
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No projects yet" description="Create your first project to start tracking tasks." />
        )}
      </div>
    </div>
  );
}
