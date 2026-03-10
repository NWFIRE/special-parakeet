import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal(""))
});

export const taskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  projectId: z.string().min(1),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority)
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"])
});
