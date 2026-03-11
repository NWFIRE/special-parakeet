"use client";

import { useActionState } from "react";
import { createClientAction } from "@/lib/actions/inspections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState = { error: "", success: "" };

export function ClientForm({ teamId }: { teamId: string }) {
  const [state, formAction, pending] = useActionState(createClientAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Client company</label>
          <Input name="companyName" placeholder="North Ridge Properties" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Primary contact</label>
          <Input name="contactName" placeholder="Avery Collins" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Contact email</label>
          <Input name="contactEmail" type="email" placeholder="client@example.com" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
          <Input name="contactPhone" placeholder="(312) 555-0144" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Site count</label>
          <Input name="siteCount" type="number" min="0" placeholder="4" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
          <Textarea name="notes" placeholder="Any service preferences, access notes, or reporting expectations." />
        </div>
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving client..." : "Add client"}</Button>
    </form>
  );
}

