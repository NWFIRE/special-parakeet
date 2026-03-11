import Link from "next/link";
import { FileCheck2, MapPinned, ShieldCheck, UsersRound } from "lucide-react";
import { ClientForm } from "@/components/forms/client-form";
import { InspectionReportForm } from "@/components/forms/inspection-report-form";
import { SiteForm } from "@/components/forms/site-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createInspectionReportAction, createSiteAction } from "@/lib/actions/inspection-workflow";
import { inspectionServiceLabels } from "@/lib/inspection-config";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

function toDateString(value: Date | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

export default async function InspectionsPage() {
  const { user, membership } = await requireWorkspaceMembership();
  const [clients, reports, profile] = await Promise.all([
    db.client.findMany({
      where: { teamId: membership.teamId },
      include: {
        sites: {
          include: {
            assets: {
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { companyName: "asc" }
    }),
    db.inspectionReport.findMany({
      where: { teamId: membership.teamId },
      include: { client: true, site: true, assets: true },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      take: 12
    }),
    db.teamProfile.findUnique({ where: { teamId: membership.teamId } })
  ]);

  const serializedClients = clients.map((client) => ({
    id: client.id,
    companyName: client.companyName,
    contactName: client.contactName,
    sites: client.sites.map((site) => ({
      id: site.id,
      name: site.name,
      addressLine1: site.addressLine1,
      addressLine2: site.addressLine2,
      city: site.city,
      state: site.state,
      postalCode: site.postalCode,
      contactName: site.contactName,
      assets: site.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        location: asset.location,
        assetTag: asset.assetTag,
        deviceType: asset.deviceType,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serialNumber: asset.serialNumber,
        ulListing: asset.ulListing,
        complianceFrequency: asset.complianceFrequency,
        lastServiceDate: toDateString(asset.lastServiceDate),
        nextServiceDate: toDateString(asset.nextServiceDate),
        serviceType: asset.serviceType,
        profileData: (asset.profileData as Record<string, string> | null) ?? null,
        lastInspectionData: (asset.lastInspectionData as Record<string, unknown> | null) ?? null
      }))
    }))
  }));

  const serializedProfile = {
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
    footerText: profile?.footerText ?? "",
    primaryColor: profile?.primaryColor ?? "#0f766e"
  };

  const totalSites = clients.reduce((count, client) => count + client.sites.length, 0);
  const totalAssets = clients.reduce((count, client) => count + client.sites.reduce((siteTotal, site) => siteTotal + site.assets.length, 0), 0);

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong overflow-hidden p-0">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="eyebrow">Inspections</p>
            <h1 className="mt-3 balance-text font-display text-4xl font-bold text-slate-950 sm:text-5xl">Professional fire inspection reporting with reusable site intelligence.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Technicians can now reuse devices, auto-fill compliance fields, build polished customer-ready reports, and publish a final document the client can review without cleanup.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white"><div className="flex items-center gap-2 text-teal-200"><FileCheck2 className="h-5 w-5" /> Reports</div><p className="mt-4 font-display text-3xl font-bold">{reports.length}</p><p className="mt-1 text-sm text-slate-300">recent service records</p></div>
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5"><div className="flex items-center gap-2 text-emerald-800"><ShieldCheck className="h-5 w-5" /> Published</div><p className="mt-4 font-display text-3xl font-bold text-slate-950">{reports.filter((report) => report.status !== "DRAFT").length}</p><p className="mt-1 text-sm text-slate-600">visible to clients</p></div>
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-5"><div className="flex items-center gap-2 text-sky-800"><MapPinned className="h-5 w-5" /> Sites</div><p className="mt-4 font-display text-3xl font-bold text-slate-950">{totalSites}</p><p className="mt-1 text-sm text-slate-600">customer properties</p></div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-5"><div className="flex items-center gap-2 text-amber-800"><UsersRound className="h-5 w-5" /> Assets</div><p className="mt-4 font-display text-3xl font-bold text-slate-950">{totalAssets}</p><p className="mt-1 text-sm text-slate-600">reusable devices / systems</p></div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="glass-panel-strong"><div className="mb-4"><p className="eyebrow">Clients</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Service accounts</h2></div><ClientForm teamId={membership.teamId} /></Card>
          <Card className="glass-panel-strong"><div className="mb-4"><p className="eyebrow">Sites</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Property defaults</h2></div>{clients.length ? <SiteForm teamId={membership.teamId} clients={clients.map((client) => ({ id: client.id, companyName: client.companyName }))} action={createSiteAction} /> : <EmptyState title="Add a client first" description="Sites belong to customers, so start by creating the service account before adding a property." />}</Card>
          <Card className="glass-panel-strong"><div className="mb-4"><p className="eyebrow">Recent reports</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Inspection history</h2></div>{reports.length ? <div className="space-y-4">{reports.map((report) => <div key={report.id} className="rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><Link href={`/inspections/${report.id}`} className="text-lg font-semibold text-slate-900">{report.title}</Link><p className="mt-1 text-sm text-slate-600">{report.client.companyName} · {report.site?.name ?? report.propertyName}</p><p className="mt-1 text-sm text-slate-500">Completed {formatDate(report.completedAt ?? report.serviceDate)}</p></div><div className="flex flex-wrap gap-2"><Badge value={report.status} /><Badge value={report.serviceType} /></div></div><div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200/80 pt-4"><p className="text-sm text-slate-600">{inspectionServiceLabels[report.serviceType]}</p><Link href={`/inspections/${report.id}`} className="text-sm font-semibold text-brand-dark">Open report</Link></div></div>)}</div> : <EmptyState title="No inspection reports yet" description="Create your first report to start building reusable service history." />}</Card>
        </div>

        <Card className="glass-panel-strong"><div className="mb-4 flex items-center justify-between gap-4"><div><p className="eyebrow">New report</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Field-ready inspection workflow</h2></div><div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">Smart autofill enabled</div></div>{clients.length && totalSites ? <InspectionReportForm teamId={membership.teamId} clients={serializedClients} submitLabel="Create report" action={createInspectionReportAction} mode="create" technicianName={user.name ?? ""} teamProfile={serializedProfile} /> : <EmptyState title="Add a client and site first" description="Once at least one customer property is in place, technicians can build reusable asset-based reports here." />}</Card>
      </div>
    </div>
  );
}
