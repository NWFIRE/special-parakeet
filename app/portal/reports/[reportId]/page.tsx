import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canViewInspectionReport } from "@/lib/portal";
import { db } from "@/lib/db";
import { requireCustomerUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

type ReportChecklistItem = {
  item?: string;
  status?: string;
  notes?: string;
};

type ReportDeficiency = {
  description?: string;
  severity?: string;
  location?: string;
  corrective_action?: string;
  due_date?: string;
};

export default async function PortalReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const user = await requireCustomerUser();
  const report = await db.inspectionReport.findUnique({ where: { id: reportId } });

  if (!report || !canViewInspectionReport(user.userType, user.clientId, report.clientId)) {
    notFound();
  }

  const checklistItems = (report.checklistItems as ReportChecklistItem[] | null) ?? [];
  const deficiencies = (report.deficiencies as ReportDeficiency[] | null) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div>
            <p className="eyebrow">Inspection report</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">{report.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{report.propertyName}{report.propertyAddress ? `, ${report.propertyAddress}` : ""}</p>
          </div>
          <Link href="/portal/reports" className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white">
            Back to reports
          </Link>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel-strong">
          <h2 className="text-xl font-semibold text-slate-900">Report summary</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Inspection details</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge value={report.status} />
                <Badge value={report.inspectionType.replace(/\s+/g, "_").toUpperCase()} />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-2 font-medium text-slate-900">{formatDate(report.completedAt)}</p>
              <p className="mt-1 text-sm text-slate-600">Inspector: {report.inspectorName ?? "Not recorded"}</p>
            </div>
          </div>
          {report.notes ? (
            <div className="mt-6 rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5">
              <p className="text-sm font-semibold text-slate-900">Notes</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{report.notes}</p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          {checklistItems.length ? (
            <Card className="glass-panel-strong">
              <h2 className="text-xl font-semibold text-slate-900">Checklist items</h2>
              <div className="mt-4 space-y-4">
                {checklistItems.map((item, index) => (
                  <div key={`${item.item ?? "item"}-${index}`} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.item ?? "Checklist item"}</p>
                        {item.notes ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.notes}</p> : null}
                      </div>
                      <Badge value={(item.status ?? "unknown").toUpperCase()} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {deficiencies.length ? (
            <Card className="glass-panel-strong">
              <h2 className="text-xl font-semibold text-slate-900">Deficiencies</h2>
              <div className="mt-4 space-y-4">
                {deficiencies.map((item, index) => (
                  <div key={`${item.description ?? "deficiency"}-${index}`} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4">
                    <p className="font-medium text-slate-900">{item.description ?? "Deficiency"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.severity ? <Badge value={item.severity.toUpperCase()} /> : null}
                      {item.location ? <Badge value={item.location} /> : null}
                    </div>
                    {item.corrective_action ? <p className="mt-3 text-sm leading-6 text-slate-600">Recommended action: {item.corrective_action}</p> : null}
                    {item.due_date ? <p className="mt-1 text-sm text-slate-500">Due {formatDate(item.due_date)}</p> : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
