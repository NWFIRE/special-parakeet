"use client";

import type { InspectionOutcome } from "@prisma/client";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DraftAsset } from "@/lib/inspection-smart-defaults";
import { type ServiceWorkflowConfig, outcomeLabels } from "@/lib/inspection-config";
import { cn } from "@/lib/utils";

function FieldMeta({ meta, currentValue }: { meta?: { sourceLabel: string; sourceValue: string }; currentValue: string }) {
  if (!meta) {
    return null;
  }

  const overridden = meta.sourceValue !== currentValue;
  return <p className={cn("mt-1 text-xs", overridden ? "text-amber-700" : "text-slate-500")}>{overridden ? "Overridden" : "Auto-filled"} from {meta.sourceLabel}</p>;
}

export function InspectionAssetCard({
  asset,
  index,
  serviceConfig,
  canRemove,
  onRemove,
  onChange,
  onApplyTemplate
}: {
  asset: DraftAsset;
  index: number;
  serviceConfig: ServiceWorkflowConfig;
  canRemove: boolean;
  onRemove: () => void;
  onChange: (next: DraftAsset) => void;
  onApplyTemplate: (templateKey: string) => void;
}) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-dark">{serviceConfig.assetLabel} {index + 1}</p>
          <h4 className="mt-2 text-xl font-semibold text-slate-900">{asset.assetName || `Untitled ${serviceConfig.assetLabel}`}</h4>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("rounded-full px-3 py-1 text-xs font-semibold", asset.status === "PASS" ? "bg-emerald-50 text-emerald-700" : asset.status === "FAIL" ? "bg-rose-50 text-rose-700" : asset.status === "ATTENTION" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>{outcomeLabels[asset.status]}</div>
          {canRemove ? <Button type="button" variant="ghost" onClick={onRemove}>Remove</Button> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["assetName", "location", "assetTag", "deviceType", "manufacturer", "model", "serialNumber", "ulListing", "complianceFrequency"].map((key) => (
          <div key={key}>
            <label className="mb-2 block text-sm font-medium capitalize text-slate-700">{key.replace(/([A-Z])/g, " $1")}</label>
            <Input value={String((asset as unknown as Record<string, string>)[key] ?? "")} onChange={(event) => onChange({ ...asset, [key]: event.currentTarget.value } as DraftAsset)} />
            <FieldMeta meta={asset.autofillMeta[key]} currentValue={String((asset as unknown as Record<string, string>)[key] ?? "")} />
          </div>
        ))}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Last service date</label>
          <Input type="date" value={asset.lastServiceDate} onChange={(event) => onChange({ ...asset, lastServiceDate: event.currentTarget.value })} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Next service date</label>
          <Input type="date" value={asset.nextServiceDate} onChange={(event) => onChange({ ...asset, nextServiceDate: event.currentTarget.value })} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileSpreadsheet className="h-4 w-4 text-brand" /> Service-specific details</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {serviceConfig.attributeFields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
                {field.type === "select" ? (
                  <select value={asset.attributes[field.key] ?? ""} onChange={(event) => onChange({ ...asset, attributes: { ...asset.attributes, [field.key]: event.currentTarget.value } })} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">
                    <option value="">Select</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === "textarea" ? (
                  <Textarea value={asset.attributes[field.key] ?? ""} onChange={(event) => onChange({ ...asset, attributes: { ...asset.attributes, [field.key]: event.currentTarget.value } })} placeholder={field.placeholder} />
                ) : (
                  <Input type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"} value={asset.attributes[field.key] ?? ""} onChange={(event) => onChange({ ...asset, attributes: { ...asset.attributes, [field.key]: event.currentTarget.value } })} placeholder={field.placeholder} />
                )}
                <FieldMeta meta={asset.autofillMeta[`attributes.${field.key}`]} currentValue={asset.attributes[field.key] ?? ""} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck className="h-4 w-4 text-brand" /> Checklist + findings</div>
          <div className="mt-4 space-y-3">
            {asset.checks.map((check) => (
              <div key={check.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <p className="font-medium text-slate-900">{check.label}</p>
                    <FieldMeta meta={asset.autofillMeta[`checks.${check.key}.status`]} currentValue={check.status} />
                  </div>
                  <select value={check.status} onChange={(event) => onChange({ ...asset, checks: asset.checks.map((item) => item.key === check.key ? { ...item, status: event.currentTarget.value as InspectionOutcome } : item) })} className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">
                    {Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <Textarea className="mt-3 min-h-24" value={check.note} onChange={(event) => onChange({ ...asset, checks: asset.checks.map((item) => item.key === check.key ? { ...item, note: event.currentTarget.value } : item) })} placeholder="Field notes, readings, and observations." />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Deficiency workflow</p>
            <p className="mt-1 text-sm text-slate-500">Apply common deficiency language, then refine the finding and recommendation for the customer.</p>
          </div>
          <select value={asset.deficiencyTemplateKey} onChange={(event) => onApplyTemplate(event.currentTarget.value)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">
            <option value="">Apply common finding</option>
            {serviceConfig.deficiencyTemplates.map((template) => <option key={template.key} value={template.key}>{template.title}</option>)}
          </select>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Deficiency summary</label>
            <Textarea value={asset.deficiencySummary} onChange={(event) => onChange({ ...asset, deficiencySummary: event.currentTarget.value })} placeholder="Describe the deficiency clearly and professionally." />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Recommendation</label>
            <Textarea value={asset.recommendationText} onChange={(event) => onChange({ ...asset, recommendationText: event.currentTarget.value })} placeholder="Recommended corrective action or follow-up scope." />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Asset result</label>
            <select value={asset.status} onChange={(event) => onChange({ ...asset, status: event.currentTarget.value as InspectionOutcome })} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">
              {Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={asset.followUpRequired} onChange={(event) => onChange({ ...asset, followUpRequired: event.currentTarget.checked })} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              Follow-up / repair recommended
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}