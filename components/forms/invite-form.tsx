"use client";

import { useActionState } from "react";
import { inviteMemberAction } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { error: "", success: "" };

export function InviteForm({ teamId }: { teamId: string }) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Invite by email</label>
        <Input name="email" type="email" placeholder="teammate@company.com" required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
        <select name="role" defaultValue="MEMBER" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm">
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
        </select>
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Inviting..." : "Send invite"}</Button>
    </form>
  );
}
