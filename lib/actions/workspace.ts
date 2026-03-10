"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireWorkspaceMembership } from "@/lib/session";
import { projectSchema, taskSchema, inviteSchema } from "@/lib/validations/workspace";
import { canEditProjects, canEditTasks, canManageBilling, canManageMembers } from "@/lib/permissions";
import { z } from "zod";

const initialState = { error: "", success: "" };

async function getScopedProject(projectId: string, teamId: string) {
  return db.project.findFirst({
    where: {
      id: projectId,
      teamId
    }
  });
}

async function isValidAssigneeForTeam(assigneeId: string | null, teamId: string) {
  if (!assigneeId) {
    return true;
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: assigneeId,
      teamId
    }
  });

  return Boolean(membership);
}

export async function createProjectAction(_: typeof initialState | undefined, formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");

  if (!canEditProjects(membership.role)) {
    return { error: "You do not have permission to create projects.", success: "" };
  }

  const parsed = projectSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project.", success: "" };
  }

  await db.project.create({
    data: {
      teamId,
      name: parsed.data.name,
      description: parsed.data.description || null
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return { error: "", success: "Project created." };
}

export async function createTaskAction(_: typeof initialState | undefined, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const teamId = String(raw.teamId ?? "");
  const { membership } = await requireWorkspaceMembership(teamId, "MEMBER");

  if (!canEditTasks(membership.role)) {
    return { error: "You do not have permission to create tasks.", success: "" };
  }

  const parsed = taskSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task.", success: "" };
  }

  const project = await getScopedProject(parsed.data.projectId, teamId);

  if (!project) {
    return { error: "The selected project does not belong to this workspace.", success: "" };
  }

  const assigneeId = parsed.data.assigneeId || null;
  const validAssignee = await isValidAssigneeForTeam(assigneeId, teamId);

  if (!validAssignee) {
    return { error: "The selected assignee is not a member of this workspace.", success: "" };
  }

  const dueDate = parsed.data.dueDate ? new Date(String(parsed.data.dueDate)) : null;

  await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueDate,
      assigneeId,
      projectId: parsed.data.projectId,
      teamId,
      status: parsed.data.status,
      priority: parsed.data.priority
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/board");
  return { error: "", success: "Task created." };
}

const taskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
});

export async function updateTaskStatusAction(taskId: string, status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE") {
  const user = await requireUser();
  const parsed = taskStatusSchema.safeParse({ taskId, status });

  if (!parsed.success) {
    throw new Error("Invalid task update.");
  }

  const task = await db.task.findUnique({ where: { id: parsed.data.taskId } });

  if (!task) {
    throw new Error("Task not found.");
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      teamId: task.teamId
    }
  });

  if (!membership || !canEditTasks(membership.role)) {
    throw new Error("You do not have permission to update this task.");
  }

  await db.task.update({ where: { id: task.id }, data: { status: parsed.data.status } });
  revalidatePath("/board");
  revalidatePath("/dashboard");
}

export async function inviteMemberAction(_: typeof initialState | undefined, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const teamId = String(raw.teamId ?? "");
  const { user, membership } = await requireWorkspaceMembership(teamId, "ADMIN");

  if (!canManageMembers(membership.role)) {
    return { error: "You do not have permission to invite teammates.", success: "" };
  }

  const parsed = inviteSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite.", success: "" };
  }

  const email = parsed.data.email.toLowerCase();
  const existingMembership = await db.membership.findFirst({
    where: {
      teamId,
      user: {
        email
      }
    }
  });

  if (existingMembership) {
    return { error: "That user is already a member of this workspace.", success: "" };
  }

  const existingInvite = await db.invite.findFirst({
    where: {
      teamId,
      email,
      acceptedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (existingInvite) {
    return { error: "An active invite already exists for that email.", success: "" };
  }

  await db.invite.create({
    data: {
      teamId,
      email,
      role: parsed.data.role,
      token: crypto.randomUUID(),
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  revalidatePath("/team");
  return { error: "", success: "Invite created. Share it from the team page." };
}

export async function updateSettingsAction(_: typeof initialState | undefined, formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ name: z.string().min(2).max(80) }).safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile.", success: "" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name }
  });

  revalidatePath("/settings");
  return { error: "", success: "Profile updated." };
}

export async function updateWorkspaceAction(_: typeof initialState | undefined, formData: FormData) {
  const parsed = z.object({ teamId: z.string().min(1), name: z.string().min(2).max(80) }).safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid workspace.", success: "" };
  }

  const { membership } = await requireWorkspaceMembership(parsed.data.teamId, "OWNER");

  if (!canManageBilling(membership.role)) {
    return { error: "Only the workspace owner can rename the workspace.", success: "" };
  }

  await db.team.update({
    where: { id: parsed.data.teamId },
    data: { name: parsed.data.name }
  });

  revalidatePath("/settings");
  return { error: "", success: "Workspace updated." };
}
