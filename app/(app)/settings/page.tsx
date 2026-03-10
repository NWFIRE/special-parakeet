import { ProfileForm, WorkspaceForm } from "@/components/forms/settings-forms";
import { Card } from "@/components/ui/card";
import { requireWorkspaceMembership } from "@/lib/session";

export default async function SettingsPage() {
  const { user, membership } = await requireWorkspaceMembership();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Settings</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Account and workspace settings.</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <Card className="mb-4 bg-white shadow-card">
            <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
            <p className="mt-2 text-sm text-slate-600">Update the name shown to teammates across projects and tasks.</p>
          </Card>
          <ProfileForm name={user.name ?? ""} />
        </div>
        <div>
          <Card className="mb-4 bg-white shadow-card">
            <h2 className="text-xl font-semibold text-slate-900">Workspace</h2>
            <p className="mt-2 text-sm text-slate-600">Only owners can rename the workspace and control billing settings.</p>
          </Card>
          <WorkspaceForm teamId={membership.teamId} name={membership.team.name} />
        </div>
      </div>
    </div>
  );
}
