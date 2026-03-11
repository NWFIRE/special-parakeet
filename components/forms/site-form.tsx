"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState = { error: "", success: "" };

type ClientOption = { id: string; companyName: string; };

export function SiteForm({ teamId, clients, action }: { teamId: string; clients: ClientOption[]; action: (state: typeof initialState | undefined, formData: FormData) => Promise<typeof initialState>; }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[1.85rem] border border-slate-200/80 bg-white/90 p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Client</label><select name="clientId" className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10" required><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}</select></div>
      <div className="grid gap-4 md:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-slate-700">Site name</label><Input name="name" placeholder="North Ridge Tower" required /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Site code</label><Input name="siteCode" placeholder="NRT-01" /></div></div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Address</label><Input name="addressLine1" placeholder="2140 Lakeview Ave" required /></div>
      <div className="grid gap-4 md:grid-cols-4"><div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">City</label><Input name="city" placeholder="Chicago" /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">State</label><Input name="state" placeholder="IL" /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">ZIP</label><Input name="postalCode" placeholder="60614" /></div></div>
      <div className="grid gap-4 md:grid-cols-3"><div><label className="mb-2 block text-sm font-medium text-slate-700">Contact</label><Input name="contactName" placeholder="Avery Collins" /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Email</label><Input name="contactEmail" type="email" placeholder="avery@example.com" /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Phone</label><Input name="contactPhone" placeholder="(312) 555-0144" /></div></div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Notes</label><Textarea name="notes" placeholder="Access notes, delivery preferences, and site-specific defaults." /></div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving site..." : "Add site"}</Button>
    </form>
  );
}