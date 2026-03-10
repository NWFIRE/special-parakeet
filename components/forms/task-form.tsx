"use client";

import { useActionState } from "react";
import { createTaskAction } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState = { error: "", success: "" };

export function TaskForm({
  teamId,
  projectId,
  assignees
}: {
  teamId: string;
  projectId: string;
  assignees: Array<{ id: string; name: string | null; email: string }>;
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Task title</label>
        <Input name="title" placeholder="Prepare launch checklist" required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <Textarea name="description" placeholder="Add context, notes, or acceptance criteria." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due date</label>
          <Input name="dueDate" type="date" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Assignee</label>
          <select name="assigneeId" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>{assignee.name ?? assignee.email}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <select name="status" defaultValue="TODO" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="IN_REVIEW">In review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
          <select name="priority" defaultValue="MEDIUM" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Adding..." : "Add task"}</Button>
    </form>
  );
}
