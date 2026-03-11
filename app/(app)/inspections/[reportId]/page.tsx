import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInspectionReportAction, updateInspectionReportAction } from "@/lib/actions/inspections";
import { InspectionReportForm } from "@/components/forms/inspection-report-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inspectionServiceLabels } from "@/lib/inspection-templates";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

function toDateInput(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default async function InspectionReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const { membership } = await requireWorkspaceMembership();
  const [report, clients] = await Promise.all([
    db.inspectionReport.findFirst({
      where: { id: reportId, teamId: membership.teamId },
      include: { client: true }
    }),
    db.client.findMany({
      where: { teamId: membership.teamId },
      orderBy: { companyName: "asc" }
    })
  ]);

  if (!report) {
    notFound();
  }

  const deleteAction = deleteInspectionReportAction.bind(null, report.id, membership.teamId);

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div>
            <p className="eyebrow">Inspection report</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">{report.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{report.client.companyName} · {report.propertyName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge value={report.status} />
            <Badge value={report.serviceType} />
            <Link href="/inspections" className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white">Back to inspections</Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="glass-panel-strong">
          <h2 className="text-2xl font-semibold text-slate-900">Report snapshot</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Service type</p>
              <p className="mt-2 text-base font-medium text-slate-900">{inspectionServiceLabels[report.serviceType]}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Report number</p>
              <p className="mt-2 text-base font-medium text-slate-900">{report.reportNumber ?? "Not assigned"}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Completed</p>
              <p className="mt-2 text-base font-medium text-slate-900">{formatDate(report.completedAt)}</p>
              <p className="mt-1 text-sm text-slate-500">Next due {formatDate(report.nextInspectionDate)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inspector</p>
              <p className="mt-2 text-base font-medium text-slate-900">{report.inspectorName ?? "Not recorded"}</p>
              <p className="mt-1 text-sm text-slate-500">Contact {report.pointOfContact ?? "Not recorded"}</p>
            </div>
            <form action={deleteAction}>
              <Button type="submit" variant="secondary" className="w-full justify-center text-rose-700">Delete report</Button>
            </form>
          </div>
        </Card>

        <InspectionReportForm
          teamId={membership.teamId}
          clients={clients.map((client) => ({ id: client.id, companyName: client.companyName, contactName: client.contactName }))}
          submitLabel="Save report"
          action={updateInspectionReportAction}
          mode="update"
          initialValues={{
            id: report.id,
            clientId: report.clientId,
            title: report.title,
            reportNumber: report.reportNumber ?? "",
            serviceType: report.serviceType,
            status: report.status,
            propertyName: report.propertyName,
            propertyAddress: report.propertyAddress ?? "",
            inspectorName: report.inspectorName ?? "",
            pointOfContact: report.pointOfContact ?? "",
            frequencyLabel: report.frequencyLabel ?? "",
            completedAt: toDateInput(report.completedAt),
            nextInspectionDate: toDateInput(report.nextInspectionDate),
            notes: report.notes ?? "",
            checklistItems: JSON.stringify(report.checklistItems ?? [], null, 2),
            deficiencies: JSON.stringify(report.deficiencies ?? [], null, 2),
            equipmentSummary: JSON.stringify(report.equipmentSummary ?? [], null, 2)
          }}
        />
      </div>
    </div>
  );
}

