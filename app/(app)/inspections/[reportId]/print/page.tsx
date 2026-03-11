import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/inspections/print-button";
import { InspectionReportDocument } from "@/components/inspections/report-document";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";

export default async function InspectionReportPrintPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const { membership } = await requireWorkspaceMembership();
  const [report, profile] = await Promise.all([
    db.inspectionReport.findFirst({ where: { id: reportId, teamId: membership.teamId }, include: { client: true, site: true, assets: true } }),
    db.teamProfile.findUnique({ where: { teamId: membership.teamId } })
  ]);

  if (!report) notFound();

  const profileData = {
    companyName: profile?.companyName ?? membership.team.name,
    logoUrl: profile?.logoUrl ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
    website: profile?.website ?? "",
    addressLine1: profile?.addressLine1 ?? "",
    addressLine2: profile?.addressLine2 ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    postalCode: profile?.postalCode ?? "",
    licenseNumbers: Array.isArray(profile?.licenseNumbers) ? (profile?.licenseNumbers as string[]) : [],
    certificationText: profile?.certificationText ?? "",
    reportDisclaimer: profile?.reportDisclaimer ?? "",
    footerText: profile?.footerText ?? ""
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:px-0 print:py-0 sm:px-6">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">PDF-ready report</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Print or save as PDF</h1>
        </div>
        <div className="flex gap-2"><PrintButton /><Link href={`/inspections/${report.id}`} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900">Back to report</Link></div>
      </div>
      <InspectionReportDocument report={{ ...report, codeReferences: Array.isArray(report.codeReferences) ? (report.codeReferences as string[]) : null, customerSignature: (report.customerSignature as { printedName?: string; name?: string; signedAt?: string } | null) ?? null, technicianSignature: (report.technicianSignature as { printedName?: string; name?: string; signedAt?: string } | null) ?? null, photoUrls: Array.isArray(report.photoUrls) ? (report.photoUrls as string[]) : null }} assets={report.assets.map((asset) => ({ ...asset, attributes: (asset.attributes as Record<string, string> | null) ?? null, testResults: Array.isArray(asset.testResults) ? (asset.testResults as Array<{ key: string; label: string; status: string; note: string }>) : null }))} profile={profileData} customerName={report.client.companyName} siteName={report.site?.name ?? report.propertyName} />
    </main>
  );
}

