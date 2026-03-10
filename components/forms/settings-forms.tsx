"use client";

import { useActionState } from "react";
import { updateSettingsAction, updateWorkspaceAction } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { error: "", success: "" };

export function ProfileForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Display name</label>
        <Input name="name" defaultValue={name} required />
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

export function WorkspaceForm({ teamId, name }: { teamId: string; name: string }) {
  const [state, formAction, pending] = useActionState(updateWorkspaceAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Workspace name</label>
        <Input name="name" defaultValue={name} required />
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save workspace"}</Button>
    </form>
  );
}
