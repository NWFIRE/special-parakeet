import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { inspectionServiceLabels, outcomeLabels } from "@/lib/inspection-config";
import { formatDate } from "@/lib/utils";

type ReportAssetView = {
  id: string;
  assetName: string;
  location: string | null;
  deviceType: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  ulListing: string | null;
  status: string;
  deficiencySummary: string | null;
  recommendationText: string | null;
  followUpRequired: boolean;
  attributes: Record<string, string> | null;
  testResults: Array<{ key: string; label: string; status: string; note: string }> | null;
};

type TeamProfileView = {
  companyName: string;
  logoUrl: string;
  phone: string;
  email: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  licenseNumbers: string[];
  certificationText: string;
  reportDisclaimer: string;
  footerText: string;
};

export function InspectionReportDocument({ report, assets, profile, customerName, siteName }: { report: { id: string; title: string; reportNumber: string | null; serviceType: keyof typeof inspectionServiceLabels; status: string; overallStatus: string; propertyName: string; propertyAddress: string | null; serviceDate: Date; completedAt: Date | null; nextInspectionDate: Date | null; inspectorName: string | null; pointOfContact: string | null; summary: string | null; recommendationSummary: string | null; notes: string | null; codeReferences: string[] | null; technicianLicense: string | null; technicianCertification: string | null; customerSignature: { name?: string; signedAt?: string } | null; technicianSignature: { name?: string; signedAt?: string } | null; photoUrls: string[] | null; }; assets: ReportAssetView[]; profile: TeamProfileView; customerName: string; siteName: string }) {
  const address = [profile.addressLine1, profile.addressLine2, profile.city, profile.state, profile.postalCode].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-6xl space-y-6 print:max-w-none print:space-y-4">
      <Card className="overflow-hidden border border-slate-200 bg-white print:shadow-none">
        <div className="border-b border-slate-200 bg-slate-950 px-8 py-8 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-200">Inspection Report</p>
              <h1 className="font-display text-4xl font-bold">{profile.companyName || "TradeWorx"}</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300">{profile.certificationText || "Professional fire and life-safety inspection services."}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-200 lg:text-right">
              {address ? <p>{address}</p> : null}
              {profile.phone ? <p>{profile.phone}</p> : null}
              {profile.email ? <p>{profile.email}</p> : null}
              {profile.website ? <p>{profile.website}</p> : null}
            </div>
          </div>
        </div>
        <div className="grid gap-6 px-8 py-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Report</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">{report.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{inspectionServiceLabels[report.serviceType]}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Customer</p><p className="mt-2 font-semibold text-slate-900">{customerName}</p><p className="mt-1 text-sm text-slate-500">{siteName}</p></div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Inspection dates</p><p className="mt-2 font-semibold text-slate-900">{formatDate(report.completedAt ?? report.serviceDate)}</p><p className="mt-1 text-sm text-slate-500">Next due {formatDate(report.nextInspectionDate)}</p></div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Technician</p><p className="mt-2 font-semibold text-slate-900">{report.inspectorName ?? "Not recorded"}</p><p className="mt-1 text-sm text-slate-500">{report.technicianLicense ?? "No license on file"}</p></div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Report ID</p><p className="mt-2 font-semibold text-slate-900">{report.reportNumber ?? report.id.slice(0, 8).toUpperCase()}</p><div className="mt-2 flex flex-wrap gap-2"><Badge value={report.status} /><Badge value={report.overallStatus} /></div></div>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Executive summary</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{report.summary || report.notes || "No summary provided."}</p>
            {report.recommendationSummary ? <div className="mt-5 rounded-[1.2rem] border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Recommendations</p><p className="mt-2 text-sm leading-7 text-amber-900/80">{report.recommendationSummary}</p></div> : null}
            {report.codeReferences?.length ? <div className="mt-5 flex flex-wrap gap-2">{report.codeReferences.map((reference) => <span key={reference} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{reference}</span>)}</div> : null}
          </div>
        </div>
      </Card>

      <Card className="border border-slate-200 bg-white p-8 print:shadow-none">
        <div className="flex items-center justify-between gap-4"><h3 className="text-2xl font-semibold text-slate-950">Assets and findings</h3><p className="text-sm text-slate-500">{assets.length} inspected items</p></div>
        <div className="mt-6 space-y-6">
          {assets.map((asset, index) => (
            <div key={asset.id} className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Asset {index + 1}</p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-950">{asset.assetName}</h4>
                  <p className="mt-1 text-sm text-slate-500">{asset.location || "Location not recorded"}</p>
                </div>
                <div className="flex flex-wrap gap-2"><Badge value={asset.status} />{asset.followUpRequired ? <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Follow-up recommended</span> : null}</div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm text-slate-600">
                <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Type</p><p className="mt-2">{asset.deviceType || "Not recorded"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Manufacturer / model</p><p className="mt-2">{[asset.manufacturer, asset.model].filter(Boolean).join(" / ") || "Not recorded"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Serial</p><p className="mt-2">{asset.serialNumber || "Not recorded"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">UL listing</p><p className="mt-2">{asset.ulListing || "Not recorded"}</p></div>
              </div>
              {asset.deficiencySummary ? <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-900">Finding</p><p className="mt-2 text-sm leading-7 text-rose-900/80">{asset.deficiencySummary}</p>{asset.recommendationText ? <p className="mt-2 text-sm leading-7 text-rose-900/80">Recommendation: {asset.recommendationText}</p> : null}</div> : null}
              {asset.testResults?.length ? <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3 font-semibold">Check</th><th className="px-4 py-3 font-semibold">Result</th><th className="px-4 py-3 font-semibold">Notes</th></tr></thead><tbody>{asset.testResults.map((result) => <tr key={result.key} className="border-t border-slate-100"><td className="px-4 py-3 font-medium text-slate-900">{result.label}</td><td className="px-4 py-3 text-slate-600">{outcomeLabels[result.status as keyof typeof outcomeLabels] ?? result.status}</td><td className="px-4 py-3 text-slate-600">{result.note || "-"}</td></tr>)}</tbody></table></div> : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-slate-200 bg-white p-8 print:shadow-none">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Acknowledgements</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-900">Customer signature</p><p className="mt-2 text-sm text-slate-600">{report.customerSignature?.name || "Not captured"}</p><p className="mt-1 text-xs text-slate-400">{report.customerSignature?.signedAt ? formatDate(report.customerSignature.signedAt) : ""}</p></div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-900">Technician signature</p><p className="mt-2 text-sm text-slate-600">{report.technicianSignature?.name || report.inspectorName || "Not captured"}</p><p className="mt-1 text-xs text-slate-400">{report.technicianSignature?.signedAt ? formatDate(report.technicianSignature.signedAt) : ""}</p></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Compliance + footer</p>
            {profile.licenseNumbers.length ? <p className="mt-4 text-sm leading-7 text-slate-700">Licenses: {profile.licenseNumbers.join(" · ")}</p> : null}
            {profile.reportDisclaimer ? <p className="mt-3 text-sm leading-7 text-slate-600">{profile.reportDisclaimer}</p> : null}
            {profile.footerText ? <p className="mt-3 text-sm leading-7 text-slate-500">{profile.footerText}</p> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}