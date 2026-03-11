import { CompanyProfileForm, ProfileForm, WorkspaceForm } from "@/components/forms/settings-forms";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";

export default async function SettingsPage() {
  const { user, membership } = await requireWorkspaceMembership();
  const profile = await db.teamProfile.findUnique({ where: { teamId: membership.teamId } });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Settings</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Account, workspace, and report branding.</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div>
            <Card className="mb-4 bg-white shadow-card"><h2 className="text-xl font-semibold text-slate-900">Profile</h2><p className="mt-2 text-sm text-slate-600">Update the name shown to teammates across projects, tasks, and reports.</p></Card>
            <ProfileForm name={user.name ?? ""} />
          </div>
          <div>
            <Card className="mb-4 bg-white shadow-card"><h2 className="text-xl font-semibold text-slate-900">Workspace</h2><p className="mt-2 text-sm text-slate-600">Only owners can rename the workspace and control billing settings.</p></Card>
            <WorkspaceForm teamId={membership.teamId} name={membership.team.name} />
          </div>
        </div>
        <div>
          <Card className="mb-4 bg-white shadow-card"><h2 className="text-xl font-semibold text-slate-900">Company report profile</h2><p className="mt-2 text-sm text-slate-600">This branding, license, and disclaimer content is injected automatically into printable customer reports.</p></Card>
          <CompanyProfileForm teamId={membership.teamId} initialValues={{ companyName: profile?.companyName ?? membership.team.name, logoUrl: profile?.logoUrl ?? "", addressLine1: profile?.addressLine1 ?? "", addressLine2: profile?.addressLine2 ?? "", city: profile?.city ?? "", state: profile?.state ?? "", postalCode: profile?.postalCode ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "", website: profile?.website ?? "", licenseNumbers: Array.isArray(profile?.licenseNumbers) ? (profile?.licenseNumbers as string[]).join("\n") : "", certificationText: profile?.certificationText ?? "", reportDisclaimer: profile?.reportDisclaimer ?? "", footerText: profile?.footerText ?? "", primaryColor: profile?.primaryColor ?? "#0f766e" }} />
        </div>
      </div>
    </div>
  );
}