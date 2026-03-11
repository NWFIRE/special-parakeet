"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { InspectionOutcome, InspectionServiceType, ReportStatus } from "@prisma/client";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, CopyPlus, Save, Sparkles, WandSparkles } from "lucide-react";
import { autosaveInspectionReportAction } from "@/lib/actions/inspection-workflow";
import { InspectionAssetCard } from "@/components/inspections/inspection-asset-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyExtinguisherRules, buildDraftReportContext, createBlankDraftAsset, duplicateDraftAsset, type DraftAsset } from "@/lib/inspection-smart-defaults";
import { getServiceConfig, inspectionServiceLabels, outcomeLabels, reportStatusLabels } from "@/lib/inspection-config";

const initialState = { error: "", success: "" };
const steps = ["Context", "Assets", "Findings", "Review"];

type AssetOption = {
  id: string;
  name: string;
  location: string | null;
  assetTag: string | null;
  deviceType: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  ulListing: string | null;
  complianceFrequency: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  serviceType: InspectionServiceType;
  profileData: Record<string, string> | null;
  lastInspectionData: Record<string, unknown> | null;
};

type SiteOption = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  contactName: string | null;
  assets: AssetOption[];
};

type ClientOption = {
  id: string;
  companyName: string;
  contactName: string | null;
  sites: SiteOption[];
};

type TeamProfileInput = {
  licenseNumbers: string[];
  certificationText: string;
};

type WorkflowValues = {
  id?: string;
  clientId: string;
  siteId: string;
  title: string;
  reportNumber: string;
  serviceType: InspectionServiceType;
  status: ReportStatus;
  overallStatus: InspectionOutcome;
  propertyName: string;
  propertyAddress: string;
  serviceDate: string;
  completedAt: string;
  nextInspectionDate: string;
  frequencyLabel: string;
  inspectorName: string;
  pointOfContact: string;
  technicianLicense: string;
  technicianCertification: string;
  summary: string;
  recommendations: string;
  notes: string;
  codeReferences: string[];
  photoUrls: string[];
  customerPrintedName: string;
  customerSignatureName: string;
  technicianPrintedName: string;
  technicianSignatureName: string;
  assets: DraftAsset[];
};

type AutosaveState = "idle" | "saving" | "saved" | "offline" | "error";

function formatSiteAddress(site?: SiteOption) {
  return site ? [site.addressLine1, site.addressLine2, site.city, site.state, site.postalCode].filter(Boolean).join(", ") : "";
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function StepPill({ active, complete, label }: { active: boolean; complete: boolean; label: string }) {
  const tone = active ? "border-brand bg-brand/10 text-brand-dark" : complete ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400";
  return <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${tone}`}>{label}</div>;
}

function buildInitialDraft(clients: ClientOption[], initialValues: WorkflowValues | undefined, technicianName: string, teamProfile: TeamProfileInput): WorkflowValues {
  if (initialValues) return initialValues;

  const client = clients[0];
  const site = client?.sites[0];
  const serviceType: InspectionServiceType = "FIRE_EXTINGUISHER";
  const context = buildDraftReportContext(serviceType, site?.name ?? "Site", (site?.assets ?? []).filter((asset) => asset.serviceType === serviceType), technicianName);

  return {
    clientId: client?.id ?? "",
    siteId: site?.id ?? "",
    title: context.title,
    reportNumber: "",
    serviceType,
    status: "DRAFT",
    overallStatus: "PASS",
    propertyName: site?.name ?? "",
    propertyAddress: formatSiteAddress(site),
    serviceDate: context.serviceDate,
    completedAt: context.serviceDate,
    nextInspectionDate: context.nextInspectionDate,
    frequencyLabel: context.frequencyLabel,
    inspectorName: technicianName,
    pointOfContact: site?.contactName ?? client?.contactName ?? "",
    technicianLicense: teamProfile.licenseNumbers[0] ?? "",
    technicianCertification: teamProfile.certificationText ?? "",
    summary: context.summary,
    recommendations: "",
    notes: "",
    codeReferences: context.codeReferences,
    photoUrls: [],
    customerPrintedName: site?.contactName ?? client?.contactName ?? "",
    customerSignatureName: "",
    technicianPrintedName: technicianName,
    technicianSignatureName: technicianName,
    assets: context.assets.length ? context.assets : [createBlankDraftAsset(serviceType)],
  };
}

function buildPayload(teamId: string, draft: WorkflowValues) {
  return JSON.stringify({
    ...draft,
    reportId: draft.id,
    teamId,
    photoUrls: draft.photoUrls,
    autoFillSummary: JSON.stringify(
      draft.assets.map((asset, index) => ({
        index,
        assetName: asset.assetName,
        autoFilledFields: Object.keys(asset.autofillMeta),
      }))
    ),
  });
}

function canAutosaveDraft(draft: WorkflowValues) {
  return Boolean(draft.clientId && draft.siteId && draft.title.trim() && draft.propertyName.trim() && draft.serviceDate && draft.assets.length > 0);
}

function SaveStatus({ state, lastSavedAt, error }: { state: AutosaveState; lastSavedAt: string; error: string }) {
  if (state === "saving") return <p className="inline-flex items-center gap-2 text-sm text-slate-500"><Save className="h-4 w-4 animate-pulse" /> Saving draft…</p>;
  if (state === "saved" && lastSavedAt) return <p className="inline-flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>;
  if (state === "offline") return <p className="inline-flex items-center gap-2 text-sm text-amber-700"><CircleAlert className="h-4 w-4" /> Offline. Draft backed up on this device.</p>;
  if (state === "error") return <p className="inline-flex items-center gap-2 text-sm text-rose-700"><CircleAlert className="h-4 w-4" /> {error || "Autosave failed."}</p>;
  return <p className="text-sm text-slate-400">Draft protection is on.</p>;
}

export function InspectionReportForm({ teamId, clients, submitLabel, action, initialValues, mode, technicianName, teamProfile }: { teamId: string; clients: ClientOption[]; submitLabel: string; action: (state: typeof initialState | undefined, formData: FormData) => Promise<typeof initialState>; initialValues?: WorkflowValues; mode: "create" | "update"; technicianName: string; teamProfile: TeamProfileInput }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WorkflowValues>(() => buildInitialDraft(clients, initialValues, technicianName, teamProfile));
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [autosaveError, setAutosaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [isAutosaving, startAutosaveTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const selectedClient = clients.find((client) => client.id === draft.clientId) ?? clients[0];
  const availableSites = selectedClient?.sites ?? [];
  const selectedSite = availableSites.find((site) => site.id === draft.siteId) ?? availableSites[0];
  const serviceConfig = getServiceConfig(draft.serviceType);
  const storageKey = useMemo(() => `tradeworx-inspection-draft:${pathname}`, [pathname]);
  const hydratedBackup = useRef(false);
  const lastAutosavedPayload = useRef("");

  useEffect(() => {
    if (initialValues || hydratedBackup.current || typeof window === "undefined") return;
    hydratedBackup.current = true;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as WorkflowValues;
      if (parsed?.serviceType && parsed?.assets?.length) {
        setDraft(parsed);
        setAutosaveState(navigator.onLine ? "saved" : "offline");
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [initialValues, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (autosaveState !== "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [autosaveState]);

  useEffect(() => {
    if (state.success) {
      setLastSavedAt(new Date().toISOString());
      setAutosaveState("saved");
      setAutosaveError("");
    }
  }, [state.success]);

  useEffect(() => {
    if (!canAutosaveDraft(draft)) return;
    const payload = buildPayload(teamId, draft);
    if (payload === lastAutosavedPayload.current) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAutosaveState("offline");
      return;
    }

    const timer = window.setTimeout(() => {
      setAutosaveState("saving");
      startAutosaveTransition(async () => {
        const formData = new FormData();
        formData.set("payload", payload);
        if (draft.id) formData.set("reportId", draft.id);
        const result = await autosaveInspectionReportAction(undefined, formData);
        if (result.error) {
          setAutosaveState("error");
          setAutosaveError(result.error);
          return;
        }
        lastAutosavedPayload.current = payload;
        setAutosaveState("saved");
        setAutosaveError("");
        setLastSavedAt(result.savedAt ?? new Date().toISOString());
        if (result.reportId && result.reportId !== draft.id) {
          setDraft((current) => ({ ...current, id: result.reportId }));
          if (mode === "create") router.replace(`/inspections/${result.reportId}`);
        }
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [draft, mode, router, teamId]);

  useEffect(() => {
    if (initialValues || !selectedClient || !selectedSite) return;
    setDraft((current) => ({
      ...current,
      clientId: selectedClient.id,
      siteId: selectedSite.id,
      propertyName: selectedSite.name,
      propertyAddress: formatSiteAddress(selectedSite),
    }));
  }, [initialValues, selectedClient, selectedSite]);

  function applySiteAndService(nextClientId: string, nextSiteId: string, nextServiceType: InspectionServiceType) {
    const client = clients.find((item) => item.id === nextClientId) ?? clients[0];
    const site = client?.sites.find((item) => item.id === nextSiteId) ?? client?.sites[0];
    const context = buildDraftReportContext(nextServiceType, site?.name ?? "Site", (site?.assets ?? []).filter((asset) => asset.serviceType === nextServiceType), technicianName);
    setDraft((current) => ({
      ...current,
      clientId: client?.id ?? "",
      siteId: site?.id ?? "",
      serviceType: nextServiceType,
      title: mode === "create" ? context.title : current.title,
      propertyName: site?.name ?? current.propertyName,
      propertyAddress: formatSiteAddress(site),
      pointOfContact: site?.contactName ?? client?.contactName ?? current.pointOfContact,
      frequencyLabel: context.frequencyLabel,
      nextInspectionDate: context.nextInspectionDate,
      codeReferences: context.codeReferences,
      summary: mode === "create" ? context.summary : current.summary,
      assets: context.assets.length ? context.assets : [createBlankDraftAsset(nextServiceType)],
    }));
  }

  function replaceAsset(index: number, next: DraftAsset) {
    setDraft((current) => ({
      ...current,
      assets: current.assets.map((item, assetIndex) => (assetIndex === index ? next : item)),
    }));
  }

  function addAsset() {
    setDraft((current) => ({ ...current, assets: [...current.assets, createBlankDraftAsset(current.serviceType)] }));
  }

  function duplicateAsset(index: number) {
    setDraft((current) => {
      const assetToDuplicate = current.assets[index];
      const nextAssets = [...current.assets];
      nextAssets.splice(index + 1, 0, duplicateDraftAsset(current.serviceType, assetToDuplicate));
      return { ...current, assets: nextAssets };
    });
  }

  function removeAsset(index: number) {
    setDraft((current) => ({ ...current, assets: current.assets.filter((_, assetIndex) => assetIndex !== index) }));
  }

  const payload = buildPayload(teamId, draft);

  return (
    <form action={formAction} className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-card">
      {mode === "update" && draft.id ? <input type="hidden" name="reportId" value={draft.id} /> : null}
      <input type="hidden" name="payload" value={payload} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">{steps.map((label, index) => <StepPill key={label} label={label} active={step === index} complete={step > index} />)}</div>
        <SaveStatus state={isAutosaving ? "saving" : autosaveState} lastSavedAt={lastSavedAt} error={autosaveError} />
      </div>

      <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 text-brand" /><div><p className="font-semibold text-slate-900">Smart inspection workflow</p><p className="mt-1 leading-6">TradeWorx reuses site assets, prior service history, and service-type templates. Auto-filled values stay editable, autosave protects every draft, and technician overrides are tracked.</p></div></div></div>

      {step === 0 ? <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><div className="space-y-4 rounded-[1.6rem] border border-slate-200/80 bg-white p-5"><div className="grid gap-4 md:grid-cols-3"><div><label className="mb-2 block text-sm font-medium text-slate-700">Customer</label><select value={draft.clientId} onChange={(event) => applySiteAndService(event.currentTarget.value, clients.find((client) => client.id === event.currentTarget.value)?.sites[0]?.id ?? "", draft.serviceType)} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">{clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}</select></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Site</label><select value={draft.siteId} onChange={(event) => applySiteAndService(draft.clientId, event.currentTarget.value, draft.serviceType)} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">{availableSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Service type</label><select value={draft.serviceType} onChange={(event) => applySiteAndService(draft.clientId, draft.siteId, event.currentTarget.value as InspectionServiceType)} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">{Object.entries(inspectionServiceLabels).filter(([value]) => value !== "BACKFLOW" && value !== "OTHER").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-slate-700">Report title</label><Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Report number</label><Input value={draft.reportNumber} onChange={(event) => setDraft((current) => ({ ...current, reportNumber: event.currentTarget.value }))} placeholder="Auto-generated if blank" /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Status</label><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.currentTarget.value as ReportStatus }))} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">{Object.entries(reportStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Service date</label><Input type="date" value={draft.serviceDate} onChange={(event) => setDraft((current) => ({ ...current, serviceDate: event.currentTarget.value, completedAt: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Next service date</label><Input type="date" value={draft.nextInspectionDate} onChange={(event) => setDraft((current) => ({ ...current, nextInspectionDate: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Frequency</label><Input value={draft.frequencyLabel} onChange={(event) => setDraft((current) => ({ ...current, frequencyLabel: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Overall status</label><select value={draft.overallStatus} onChange={(event) => setDraft((current) => ({ ...current, overallStatus: event.currentTarget.value as InspectionOutcome }))} className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10">{Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Technician</label><Input value={draft.inspectorName} onChange={(event) => setDraft((current) => ({ ...current, inspectorName: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Point of contact</label><Input value={draft.pointOfContact} onChange={(event) => setDraft((current) => ({ ...current, pointOfContact: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Tech license</label><Input value={draft.technicianLicense} onChange={(event) => setDraft((current) => ({ ...current, technicianLicense: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Certification</label><Input value={draft.technicianCertification} onChange={(event) => setDraft((current) => ({ ...current, technicianCertification: event.currentTarget.value }))} /></div></div></div><div className="space-y-4 rounded-[1.6rem] border border-slate-200/80 bg-white p-5"><div><p className="eyebrow">Auto-filled</p><h3 className="mt-2 text-xl font-semibold text-slate-900">Site + compliance details</h3></div><div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Property</p><p className="mt-2 font-semibold text-slate-900">{selectedSite?.name ?? "No site selected"}</p><p className="mt-2 text-sm leading-6 text-slate-600">{formatSiteAddress(selectedSite) || "Choose a site to auto-fill customer and location details."}</p></div><div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Workflow focus</p><p className="mt-2 text-sm leading-6 text-slate-700">{serviceConfig.summaryHint}</p></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Code references</label><Input value={draft.codeReferences.join(", ")} onChange={(event) => setDraft((current) => ({ ...current, codeReferences: dedupe(event.currentTarget.value.split(",")) }))} /></div></div></div> : null}

      {step === 1 ? <div className="space-y-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="eyebrow">Assets</p><h3 className="mt-2 text-2xl font-semibold text-slate-900">Reusable equipment and device records</h3><p className="mt-2 text-sm text-slate-500">Item numbers stay sequential automatically in the workflow, saved report, and printable output.</p></div><Button type="button" variant="secondary" onClick={addAsset}><CopyPlus className="mr-2 h-4 w-4" /> Add {serviceConfig.assetLabel}</Button></div><div className="space-y-5">{draft.assets.map((asset, index) => <InspectionAssetCard key={`${asset.assetId ?? "new"}-${index}`} asset={asset} index={index} serviceType={draft.serviceType} serviceConfig={serviceConfig} canRemove={draft.assets.length > 1} onDuplicate={() => duplicateAsset(index)} onRemove={() => removeAsset(index)} onChange={(next) => replaceAsset(index, next)} onApplyTemplate={(templateKey) => { const selected = serviceConfig.deficiencyTemplates.find((template) => template.key === templateKey); setDraft((current) => ({ ...current, assets: current.assets.map((item, assetIndex) => assetIndex === index ? (!selected ? { ...item, deficiencyTemplateKey: "" } : { ...item, deficiencyTemplateKey: selected.key, status: selected.severity, followUpRequired: selected.severity !== "PASS", deficiencySummary: selected.description, recommendationText: selected.recommendation }) : item) })); }} />)}</div></div> : null}

      {step >= 2 ? <div className="grid gap-4 xl:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-slate-700">Overall summary</label><Textarea className="min-h-40" value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Overall recommendations</label><Textarea className="min-h-40" value={draft.recommendations} onChange={(event) => setDraft((current) => ({ ...current, recommendations: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Technician notes</label><Textarea className="min-h-28" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.currentTarget.value }))} /></div><div className="space-y-4"><div><label className="mb-2 block text-sm font-medium text-slate-700">Photo / attachment URLs</label><Textarea className="min-h-28" value={draft.photoUrls.join("\n")} onChange={(event) => setDraft((current) => ({ ...current, photoUrls: dedupe(event.currentTarget.value.split(/\r?\n/)) }))} placeholder="One hosted URL per line" /></div><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-slate-700">Customer printed name</label><Input value={draft.customerPrintedName} onChange={(event) => setDraft((current) => ({ ...current, customerPrintedName: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Customer signature</label><Input value={draft.customerSignatureName} onChange={(event) => setDraft((current) => ({ ...current, customerSignatureName: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Technician printed name</label><Input value={draft.technicianPrintedName} onChange={(event) => setDraft((current) => ({ ...current, technicianPrintedName: event.currentTarget.value }))} /></div><div><label className="mb-2 block text-sm font-medium text-slate-700">Technician signature</label><Input value={draft.technicianSignatureName} onChange={(event) => setDraft((current) => ({ ...current, technicianSignatureName: event.currentTarget.value }))} /></div></div></div></div> : null}

      {step === 3 ? <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-5"><p className="eyebrow">Review</p><h3 className="mt-2 text-2xl font-semibold text-slate-900">Customer-ready report preview</h3><div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"><div className="space-y-4"><div className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer + property</p><p className="mt-3 text-lg font-semibold text-slate-900">{selectedClient?.companyName}</p><p className="mt-1 text-sm text-slate-600">{draft.propertyName}</p><p className="mt-1 text-sm text-slate-500">{draft.propertyAddress}</p></div><div className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Summary</p><p className="mt-3 text-sm leading-7 text-slate-700">{draft.summary || "Add a report summary before finalizing."}</p></div><div className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Signatures</p><p className="mt-3 text-sm text-slate-700">Customer: {draft.customerPrintedName || "Not entered"} / {draft.customerSignatureName || "Signature pending"}</p><p className="mt-2 text-sm text-slate-700">Technician: {draft.technicianPrintedName || draft.inspectorName || "Not entered"} / {draft.technicianSignatureName || "Signature pending"}</p></div></div><div className="space-y-4">{draft.assets.map((asset, index) => <div key={`${asset.assetId ?? 'review'}-${index}`} className="rounded-[1.4rem] border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{serviceConfig.assetLabel} {index + 1}: {asset.assetName || `${serviceConfig.assetLabel} ${index + 1}`}</p><p className="mt-1 text-sm text-slate-500">{asset.location || "Location not set"}</p></div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{outcomeLabels[asset.status]}</div></div>{asset.deficiencySummary ? <p className="mt-4 text-sm leading-6 text-slate-700">{asset.deficiencySummary}</p> : null}{asset.recommendationText ? <p className="mt-2 text-sm leading-6 text-slate-500">Recommendation: {asset.recommendationText}</p> : null}</div>)}</div></div></div> : null}

      {state.error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p> : null}
      {autosaveError && autosaveState === "error" ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{autosaveError}</p> : null}

      <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-2"><Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>{step < steps.length - 1 ? <Button type="button" onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button> : null}</div><div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => applySiteAndService(draft.clientId, draft.siteId, draft.serviceType)}><WandSparkles className="mr-2 h-4 w-4" /> Refresh smart defaults</Button><Button type="submit" disabled={pending || !draft.clientId || !draft.siteId}>{pending ? "Saving report..." : submitLabel}</Button></div></div>
    </form>
  );
}

