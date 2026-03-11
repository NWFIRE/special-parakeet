"use client";

import { useActionState, useState } from "react";
import type { InspectionServiceType, ReportStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getInspectionTemplate, inspectionServiceLabels, reportStatusLabels } from "@/lib/inspection-templates";

const initialState = { error: "", success: "" };

type ClientOption = {
  id: string;
  companyName: string;
  contactName: string | null;
};

type InspectionReportValues = {
  id?: string;
  clientId: string;
  title: string;
  reportNumber: string;
  serviceType: InspectionServiceType;
  status: ReportStatus;
  propertyName: string;
  propertyAddress: string;
  inspectorName: string;
  pointOfContact: string;
  frequencyLabel: string;
  completedAt: string;
  nextInspectionDate: string;
  notes: string;
  checklistItems: string;
  deficiencies: string;
  equipmentSummary: string;
};

type InspectionReportFormProps = {
  teamId: string;
  clients: ClientOption[];
  submitLabel: string;
  action: (state: typeof initialState | undefined, formData: FormData) => Promise<typeof initialState>;
  initialValues?: InspectionReportValues;
  mode: "create" | "update";
};

const defaultTemplate = getInspectionTemplate("FIRE_EXTINGUISHER");

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function InspectionReportForm({ teamId, clients, submitLabel, action, initialValues, mode }: InspectionReportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [serviceType, setServiceType] = useState<InspectionServiceType>(initialValues?.serviceType ?? "FIRE_EXTINGUISHER");
  const [checklistItems, setChecklistItems] = useState(initialValues?.checklistItems ?? toPrettyJson(defaultTemplate.checklistItems));
  const [deficiencies, setDeficiencies] = useState(initialValues?.deficiencies ?? toPrettyJson([]));
  const [equipmentSummary, setEquipmentSummary] = useState(initialValues?.equipmentSummary ?? toPrettyJson(defaultTemplate.equipmentSummary));
  const [frequencyLabel, setFrequencyLabel] = useState(initialValues?.frequencyLabel ?? defaultTemplate.frequencyLabel);

  function applyTemplate(nextType: InspectionServiceType) {
    const template = getInspectionTemplate(nextType);
    setServiceType(nextType);
    setChecklistItems(toPrettyJson(template.checklistItems));
    setEquipmentSummary(toPrettyJson(template.equipmentSummary));
    setDeficiencies(toPrettyJson([]));
    setFrequencyLabel(template.frequencyLabel);
  }

  return (
    <form action={formAction} className="space-y-5 rounded-[1.85rem] border border-slate-200/80 bg-white/90 p-6 shadow-card">
      <input type="hidden" name="teamId" value={teamId} />
      {mode === "update" && initialValues?.id ? <input type="hidden" name="reportId" value={initialValues.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Client</label>
          <select name="clientId" defaultValue={initialValues?.clientId ?? ""} className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10" required>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.companyName}{client.contactName ? ` - ${client.contactName}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Service type</label>
          <div className="flex gap-2">
            <select
              name="serviceType"
              value={serviceType}
              onChange={(event) => setServiceType(event.currentTarget.value as InspectionServiceType)}
              className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
            >
              {Object.entries(inspectionServiceLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <Button type="button" variant="secondary" className="shrink-0" onClick={() => applyTemplate(serviceType)}>Use template</Button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Report title</label>
          <Input name="title" defaultValue={initialValues?.title ?? ""} placeholder="Quarterly Fire Alarm Inspection" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Report number</label>
          <Input name="reportNumber" defaultValue={initialValues?.reportNumber ?? ""} placeholder="FA-2401" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <select name="status" defaultValue={initialValues?.status ?? "DRAFT"} className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10">
            {Object.entries(reportStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Site / property name</label>
          <Input name="propertyName" defaultValue={initialValues?.propertyName ?? ""} placeholder="North Ridge Tower" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Site address</label>
          <Input name="propertyAddress" defaultValue={initialValues?.propertyAddress ?? ""} placeholder="2140 Lakeview Ave, Chicago, IL" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Inspector</label>
          <Input name="inspectorName" defaultValue={initialValues?.inspectorName ?? ""} placeholder="Jordan Rivera" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Point of contact</label>
          <Input name="pointOfContact" defaultValue={initialValues?.pointOfContact ?? ""} placeholder="Facilities desk" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Frequency</label>
          <Input name="frequencyLabel" value={frequencyLabel} onChange={(event) => setFrequencyLabel(event.currentTarget.value)} placeholder="Quarterly" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Completed date</label>
          <Input name="completedAt" type="date" defaultValue={initialValues?.completedAt ?? ""} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Next inspection date</label>
          <Input name="nextInspectionDate" type="date" defaultValue={initialValues?.nextInspectionDate ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Service notes</label>
          <Textarea name="notes" defaultValue={initialValues?.notes ?? ""} placeholder="Summarize service completed, repairs made, and recommendations." />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Checklist items (JSON)</label>
          <Textarea name="checklistItems" value={checklistItems} onChange={(event) => setChecklistItems(event.currentTarget.value)} className="min-h-48 font-mono text-xs leading-6" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Deficiencies (JSON)</label>
          <Textarea name="deficiencies" value={deficiencies} onChange={(event) => setDeficiencies(event.currentTarget.value)} className="min-h-44 font-mono text-xs leading-6" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Equipment summary (JSON)</label>
          <Textarea name="equipmentSummary" value={equipmentSummary} onChange={(event) => setEquipmentSummary(event.currentTarget.value)} className="min-h-44 font-mono text-xs leading-6" />
        </div>
      </div>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving report..." : submitLabel}</Button>
    </form>
  );
}

