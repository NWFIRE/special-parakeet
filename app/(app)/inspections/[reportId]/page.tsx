import Link from "next/link";
import { AutofillSourceType } from "@prisma/client";
import { notFound } from "next/navigation";
import { deleteInspectionReportAction, updateInspectionReportAction } from "@/lib/actions/inspection-workflow";
import { InspectionReportForm } from "@/components/forms/inspection-report-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inspectionServiceLabels, outcomeLabels } from "@/lib/inspection-config";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default async function InspectionReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const { user, membership } = await requireWorkspaceMembership();
  const [report, clients, profile] = await Promise.all([
    db.inspectionReport.findFirst({
      where: { id: reportId, teamId: membership.teamId },
      include: { client: true, site: true, assets: true, audits: { orderBy: { createdAt: "desc" }, take: 12 } }
    }),
    db.client.findMany({
      where: { teamId: membership.teamId },
      include: { sites: { include: { assets: true }, orderBy: { name: "asc" } } },
      orderBy: { companyName: "asc" }
    }),
    db.teamProfile.findUnique({ where: { teamId: membership.teamId } })
  ]);

  if (!report) notFound();

  const deleteAction = deleteInspectionReportAction.bind(null, report.id, membership.teamId);

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div>
            <p className="eyebrow">Inspection report</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">{report.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{report.client.companyName} Â· {report.site?.name ?? report.propertyName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge value={report.status} />
            <Badge value={report.serviceType} />
            <Link href={`/inspections/${report.id}/print`} className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white">Open printable report</Link>
            <Link href="/inspections" className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white">Back to inspections</Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6">
          <Card className="glass-panel-strong"><h2 className="text-2xl font-semibold text-slate-900">Report snapshot</h2><div className="mt-5 space-y-4 text-sm text-slate-600"><div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Service type</p><p className="mt-2 text-base font-medium text-slate-900">{inspectionServiceLabels[report.serviceType]}</p></div><div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Overall result</p><p className="mt-2 text-base font-medium text-slate-900">{outcomeLabels[report.overallStatus]}</p><p className="mt-1 text-sm text-slate-500">Completed {formatDate(report.completedAt ?? report.serviceDate)} Â· Next due {formatDate(report.nextInspectionDate)}</p></div><div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inspector</p><p className="mt-2 text-base font-medium text-slate-900">{report.inspectorName ?? "Not recorded"}</p><p className="mt-1 text-sm text-slate-500">{report.technicianLicense ?? "No license info"}</p></div><div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Autofill audit</p><p className="mt-2 text-base font-medium text-slate-900">{report.audits.length} tracked field changes</p><p className="mt-1 text-sm text-slate-500">{report.audits.filter((audit) => audit.wasOverridden).length} manual overrides captured</p></div><form action={deleteAction}><Button type="submit" variant="secondary" className="w-full justify-center text-rose-700">Delete report</Button></form></div></Card>
          <Card className="glass-panel-strong"><h2 className="text-xl font-semibold text-slate-900">Inspected assets</h2><div className="mt-4 space-y-3">{report.assets.map((asset) => <div key={asset.id} className="rounded-[1.4rem] border border-slate-200/80 bg-white/85 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{asset.assetName}</p><p className="mt-1 text-sm text-slate-500">{asset.location ?? "No location recorded"}</p></div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{outcomeLabels[asset.status]}</div></div>{asset.deficiencySummary ? <p className="mt-3 text-sm leading-6 text-slate-700">{asset.deficiencySummary}</p> : null}</div>)}</div></Card>
        </div>

        <InspectionReportForm
          teamId={membership.teamId}
          clients={clients.map((client) => ({ id: client.id, companyName: client.companyName, contactName: client.contactName, sites: client.sites.map((site) => ({ id: site.id, name: site.name, addressLine1: site.addressLine1, addressLine2: site.addressLine2, city: site.city, state: site.state, postalCode: site.postalCode, contactName: site.contactName, assets: site.assets.map((asset) => ({ id: asset.id, name: asset.name, location: asset.location, assetTag: asset.assetTag, deviceType: asset.deviceType, manufacturer: asset.manufacturer, model: asset.model, serialNumber: asset.serialNumber, ulListing: asset.ulListing, complianceFrequency: asset.complianceFrequency, lastServiceDate: toDateInput(asset.lastServiceDate), nextServiceDate: toDateInput(asset.nextServiceDate), serviceType: asset.serviceType, profileData: (asset.profileData as Record<string, string> | null) ?? null, lastInspectionData: (asset.lastInspectionData as Record<string, unknown> | null) ?? null })) })) }))}
          submitLabel="Save report"
          action={updateInspectionReportAction}
          mode="update"
          technicianName={user.name ?? ""}
          teamProfile={{ licenseNumbers: Array.isArray(profile?.licenseNumbers) ? (profile?.licenseNumbers as string[]) : [], certificationText: profile?.certificationText ?? "" }}
          initialValues={{ id: report.id, clientId: report.clientId, siteId: report.siteId ?? "", title: report.title, reportNumber: report.reportNumber ?? "", serviceType: report.serviceType, status: report.status, overallStatus: report.overallStatus, propertyName: report.propertyName, propertyAddress: report.propertyAddress ?? "", serviceDate: toDateInput(report.serviceDate), completedAt: toDateInput(report.completedAt ?? report.serviceDate), nextInspectionDate: toDateInput(report.nextInspectionDate), frequencyLabel: report.frequencyLabel ?? "", inspectorName: report.inspectorName ?? "", pointOfContact: report.pointOfContact ?? "", technicianLicense: report.technicianLicense ?? "", technicianCertification: report.technicianCertification ?? "", summary: report.summary ?? report.notes ?? "", recommendations: report.recommendationSummary ?? "", notes: report.notes ?? "", codeReferences: Array.isArray(report.codeReferences) ? (report.codeReferences as string[]) : [], photoUrls: Array.isArray(report.photoUrls) ? (report.photoUrls as string[]) : [], customerSignatureName: ((report.customerSignature as { name?: string } | null)?.name) ?? "", technicianSignatureName: ((report.technicianSignature as { name?: string } | null)?.name) ?? "", assets: report.assets.map((asset) => ({ assetId: asset.assetId ?? undefined, assetName: asset.assetName, location: asset.location ?? "", assetTag: asset.assetTag ?? "", deviceType: asset.deviceType ?? "", manufacturer: asset.manufacturer ?? "", model: asset.model ?? "", serialNumber: asset.serialNumber ?? "", ulListing: asset.ulListing ?? "", complianceFrequency: asset.complianceFrequency ?? "", lastServiceDate: toDateInput(asset.lastServiceDate), nextServiceDate: toDateInput(asset.nextServiceDate), status: asset.status, deficiencySummary: asset.deficiencySummary ?? "", recommendationText: asset.recommendationText ?? "", followUpRequired: asset.followUpRequired, deficiencyTemplateKey: Array.isArray(asset.appliedTemplateKeys) && (asset.appliedTemplateKeys as string[])[0] ? (asset.appliedTemplateKeys as string[])[0] : "", attributes: (asset.attributes as Record<string, string> | null) ?? {}, checks: Array.isArray(asset.testResults) ? (asset.testResults as Array<{ key: string; label: string; status: "PASS" | "ATTENTION" | "FAIL" | "NOT_APPLICABLE"; note: string }>) : [], autofillMeta: Object.fromEntries(Object.entries((asset.autofillMeta as Record<string, { sourceType: string; sourceLabel: string; sourceValue: string }> | null) ?? {}).map(([key, value]) => [key, { sourceType: value.sourceType as AutofillSourceType, sourceLabel: value.sourceLabel, sourceValue: value.sourceValue }])) })) }}
        />
      </div>
    </div>
  );
}