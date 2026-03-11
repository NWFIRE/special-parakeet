import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { inspectionServiceLabels } from "@/lib/inspection-templates";
import { db } from "@/lib/db";
import { requireCustomerUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function PortalReportsPage() {
  const user = await requireCustomerUser();
  const clientId = user.clientId as string;
  const reports = await db.inspectionReport.findMany({
    where: {
      clientId,
      status: {
        in: ["ISSUED", "INVOICED", "ARCHIVED"]
      }
    },
    orderBy: { completedAt: "desc" }
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="eyebrow">Customer portal</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">{user.client?.companyName ?? user.name ?? user.email}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Review completed and invoiced inspection reports linked to your client account. Everything here is optimized for quick reading on desktop and mobile.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 px-5 py-4 text-left lg:w-full">
              <p className="text-sm text-slate-500">Published reports</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950">{reports.length}</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary">Sign out</Button>
            </form>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        {reports.length ? (
          <div className="grid gap-5">
            {reports.map((report) => (
              <Card key={report.id} className="glass-panel-strong">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-900">{report.title}</h2>
                    <p className="text-sm font-medium text-slate-700">{report.propertyName}</p>
                    <p className="text-sm text-slate-500">Completed {formatDate(report.completedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge value={report.status} />
                    <Badge value={report.serviceType} />
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-4 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">Inspector: {report.inspectorName ?? "Not recorded"} · {inspectionServiceLabels[report.serviceType]}</p>
                  <Link href={`/portal/reports/${report.id}`} className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,110,0.28)] transition hover:-translate-y-0.5 hover:bg-brand-dark">
                    View report
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No inspection reports yet" description="Your client account does not have any published inspection reports available." />
        )}
      </div>
    </main>
  );
}

