"use client";

import { useActionState } from "react";
import { updateSettingsAction, updateWorkspaceAction } from "@/lib/actions/workspace";
import { updateTeamProfileAction } from "@/lib/actions/report-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState = { error: "", success: "" };

export function ProfileForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Display name</label><Input name="name" defaultValue={name} required /></div>
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
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Workspace name</label><Input name="name" defaultValue={name} required /></div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save workspace"}</Button>
    </form>
  );
}

export function CompanyProfileForm({ teamId, initialValues }: { teamId: string; initialValues: { companyName: string; logoUrl: string; addressLine1: string; addressLine2: string; city: string; state: string; postalCode: string; phone: string; email: string; website: string; licenseNumbers: string; certificationText: string; reportDisclaimer: string; footerText: string; primaryColor: string; } }) {
  const [state, formAction, pending] = useActionState(updateTeamProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="mb-2 block text-sm font-medium text-slate-700">Company name</label><Input name="companyName" defaultValue={initialValues.companyName} /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">Logo URL</label><Input name="logoUrl" defaultValue={initialValues.logoUrl} placeholder="https://..." /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">Phone</label><Input name="phone" defaultValue={initialValues.phone} /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">Email</label><Input name="email" type="email" defaultValue={initialValues.email} /></div>
        <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Website</label><Input name="website" defaultValue={initialValues.website} placeholder="https://..." /></div>
        <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Address line 1</label><Input name="addressLine1" defaultValue={initialValues.addressLine1} /></div>
        <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Address line 2</label><Input name="addressLine2" defaultValue={initialValues.addressLine2} /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">City</label><Input name="city" defaultValue={initialValues.city} /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">State</label><Input name="state" defaultValue={initialValues.state} /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">Postal code</label><Input name="postalCode" defaultValue={initialValues.postalCode} /></div>
        <div><label className="mb-2 block text-sm font-medium text-slate-700">Primary brand color</label><Input name="primaryColor" defaultValue={initialValues.primaryColor} placeholder="#0f766e" /></div>
      </div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">License numbers</label><Textarea name="licenseNumbers" defaultValue={initialValues.licenseNumbers} placeholder="One license number per line" /></div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Certification text</label><Textarea name="certificationText" defaultValue={initialValues.certificationText} placeholder="Certified fire protection inspection and reporting statement" /></div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Report disclaimer</label><Textarea name="reportDisclaimer" defaultValue={initialValues.reportDisclaimer} placeholder="Compliance or customer-facing disclaimer text" /></div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Footer text</label><Textarea name="footerText" defaultValue={initialValues.footerText} placeholder="Footer text printed on every report" /></div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save company report profile"}</Button>
    </form>
  );
}
