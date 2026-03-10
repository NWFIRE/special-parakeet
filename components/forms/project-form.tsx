"use client";

import { useActionState } from "react";
import { createProjectAction } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState = { error: "", success: "" };

export function ProjectForm({ teamId }: { teamId: string }) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Project name</label>
        <Input name="name" placeholder="Customer onboarding refresh" required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <Textarea name="description" placeholder="Describe the outcome and scope." />
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create project"}</Button>
    </form>
  );
}
