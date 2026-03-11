import Link from "next/link";
import { notFound } from "next/navigation";
import { InspectionReportDocument } from "@/components/inspections/report-document";
import { canViewInspectionReport } from "@/lib/portal";
import { db } from "@/lib/db";
import { requireCustomerUser } from "@/lib/session";

export default async function PortalReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const user = await requireCustomerUser();
  const report = await db.inspectionReport.findUnique({ where: { id: reportId }, include: { client: true, site: true, team: { include: { profile: true } }, assets: true } });

  if (!report || report.status === "DRAFT" || !canViewInspectionReport(user.userType, user.clientId, report.clientId)) {
    notFound();
  }

  const profile = report.team.profile;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Customer report</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Inspection details</h1>
        </div>
        <div className="flex gap-2"><Link href={`/inspections/${report.id}/print`} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Open printable view</Link><Link href="/portal/reports" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900">Back to reports</Link></div>
      </div>
      <InspectionReportDocument report={{ ...report, codeReferences: Array.isArray(report.codeReferences) ? (report.codeReferences as string[]) : null, customerSignature: (report.customerSignature as { printedName?: string; name?: string; signedAt?: string } | null) ?? null, technicianSignature: (report.technicianSignature as { printedName?: string; name?: string; signedAt?: string } | null) ?? null, photoUrls: Array.isArray(report.photoUrls) ? (report.photoUrls as string[]) : null }} assets={report.assets.map((asset) => ({ ...asset, attributes: (asset.attributes as Record<string, string> | null) ?? null, testResults: Array.isArray(asset.testResults) ? (asset.testResults as Array<{ key: string; label: string; status: string; note: string }>) : null }))} profile={{ companyName: profile?.companyName ?? report.team.name, logoUrl: profile?.logoUrl ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "", website: profile?.website ?? "", addressLine1: profile?.addressLine1 ?? "", addressLine2: profile?.addressLine2 ?? "", city: profile?.city ?? "", state: profile?.state ?? "", postalCode: profile?.postalCode ?? "", licenseNumbers: Array.isArray(profile?.licenseNumbers) ? (profile?.licenseNumbers as string[]) : [], certificationText: profile?.certificationText ?? "", reportDisclaimer: profile?.reportDisclaimer ?? "", footerText: profile?.footerText ?? "" }} customerName={report.client.companyName} siteName={report.site?.name ?? report.propertyName} />
    </main>
  );
}

