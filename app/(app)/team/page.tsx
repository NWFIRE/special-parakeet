import { InviteForm } from "@/components/forms/invite-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canManageMembers } from "@/lib/permissions";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate, getBaseUrl } from "@/lib/utils";

export default async function TeamPage() {
  const { membership } = await requireWorkspaceMembership();
  const team = await db.team.findUniqueOrThrow({
    where: { id: membership.teamId },
    include: {
      memberships: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      invites: {
        where: {
          acceptedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Team</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Invite teammates and manage roles.</h1>
        <div className="mt-6">
          {canManageMembers(membership.role) ? <InviteForm teamId={team.id} /> : <p className="text-sm text-slate-500">Admin or owner access is required to invite teammates.</p>}
        </div>
      </div>
      <div className="space-y-4">
        <Card className="bg-white shadow-card">
          <h2 className="text-xl font-semibold text-slate-900">Members</h2>
          <div className="mt-4 space-y-3">
            {team.memberships.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{item.user.name ?? item.user.email}</p>
                  <p className="text-sm text-slate-500">{item.user.email}</p>
                </div>
                <Badge value={item.role} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-white shadow-card">
          <h2 className="text-xl font-semibold text-slate-900">Pending invites</h2>
          <div className="mt-4 space-y-3">
            {team.invites.length ? (
              team.invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{invite.email}</p>
                      <p className="mt-1">Role: {invite.role}</p>
                      <p>Expires {formatDate(invite.expiresAt)}</p>
                    </div>
                    <Badge value={invite.role} />
                  </div>
                  <p className="mt-3 break-all rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                    {getBaseUrl()}/signup?invite={invite.token}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No active invites.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
