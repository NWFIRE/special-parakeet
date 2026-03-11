import Link from "next/link";
import { FileCheck2, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { ClientForm } from "@/components/forms/client-form";
import { InspectionReportForm } from "@/components/forms/inspection-report-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createInspectionReportAction } from "@/lib/actions/inspections";
import { inspectionServiceLabels } from "@/lib/inspection-templates";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function InspectionsPage() {
  const { membership } = await requireWorkspaceMembership();
  const [clients, reports] = await Promise.all([
    db.client.findMany({
      where: { teamId: membership.teamId },
      orderBy: { companyName: "asc" }
    }),
    db.inspectionReport.findMany({
      where: { teamId: membership.teamId },
      include: { client: true },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      take: 12
    })
  ]);

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="eyebrow">Inspections</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">Build, publish, and track fire protection service reports.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              TradeWorx now keeps field-ready inspection reports inside the workspace so your team can capture extinguisher, suppression, alarm, lighting, and sprinkler service history in one place.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-2 text-teal-200"><FileCheck2 className="h-5 w-5" /> Reports</div>
              <p className="mt-4 font-display text-3xl font-bold">{reports.length}</p>
              <p className="mt-1 text-sm text-slate-300">recent service records</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5">
              <div className="flex items-center gap-2 text-emerald-800"><ShieldCheck className="h-5 w-5" /> Published</div>
              <p className="mt-4 font-display text-3xl font-bold text-slate-950">{reports.filter((report) => report.status !== "DRAFT").length}</p>
              <p className="mt-1 text-sm text-slate-600">visible to clients</p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-5">
              <div className="flex items-center gap-2 text-amber-800"><UsersRound className="h-5 w-5" /> Clients</div>
              <p className="mt-4 font-display text-3xl font-bold text-slate-950">{clients.length}</p>
              <p className="mt-1 text-sm text-slate-600">accounts tied to this team</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="glass-panel-strong">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Clients</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Service accounts</h2>
              </div>
            </div>
            <ClientForm teamId={membership.teamId} />
          </Card>

          <Card className="glass-panel-strong">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Recent reports</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Inspection history</h2>
              </div>
            </div>
            {reports.length ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <Link href={`/inspections/${report.id}`} className="text-lg font-semibold text-slate-900">{report.title}</Link>
                        <p className="mt-1 text-sm text-slate-600">{report.client.companyName} · {report.propertyName}</p>
                        <p className="mt-1 text-sm text-slate-500">Completed {formatDate(report.completedAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge value={report.status} />
                        <Badge value={report.serviceType} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200/80 pt-4">
                      <p className="text-sm text-slate-600">{inspectionServiceLabels[report.serviceType]}</p>
                      <Link href={`/inspections/${report.id}`} className="text-sm font-semibold text-brand-dark">Open report</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No inspection reports yet" description="Create your first report to start building client service history." />
            )}
          </Card>
        </div>

        <Card className="glass-panel-strong">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">New report</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create an inspection report</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
              <ShieldAlert className="h-4 w-4" />
              Templates included
            </div>
          </div>
          {clients.length ? (
            <InspectionReportForm
              teamId={membership.teamId}
              clients={clients.map((client) => ({ id: client.id, companyName: client.companyName, contactName: client.contactName }))}
              submitLabel="Create report"
              action={createInspectionReportAction}
              mode="create"
            />
          ) : (
            <EmptyState title="Add a client first" description="Create a service account for the property owner or customer before creating reports." />
          )}
        </Card>
      </div>
    </div>
  );
}

