import { AppSidebar } from "@/components/layout/app-sidebar";
import { getActiveWorkspaceMembership, requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const membership = await getActiveWorkspaceMembership(user);

  if (!membership) {
    return <main className="mx-auto max-w-3xl px-6 py-16">No workspace available.</main>;
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-[1440px] gap-5 px-3 py-3 sm:px-4 lg:grid-cols-[300px_1fr] lg:px-6 lg:py-5">
      <div className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
        <AppSidebar
          teamName={membership.team.name}
          role={membership.role}
          activeTeamId={membership.teamId}
          memberships={user.memberships.map((item) => ({
            teamId: item.teamId,
            teamName: item.team.name,
            role: item.role
          }))}
        />
      </div>
      <main className="space-y-6 pb-8 pt-1 lg:pt-2">{children}</main>
    </div>
  );
}
