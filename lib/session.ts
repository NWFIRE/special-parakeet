import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Membership, MembershipRole, Team, Subscription, User, Client } from "@prisma/client";
import { hasRequiredRole } from "@/lib/permissions";
import { resolveActiveMembership } from "@/lib/workspace";

export const ACTIVE_WORKSPACE_COOKIE = "tradeworx-active-workspace";

type CurrentUser = User & {
  client: Client | null;
  memberships: Array<Membership & { team: Team & { subscription: Subscription | null } }>;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return db.user.findUnique({
    where: { id: session.user.id },
    include: {
      client: true,
      memberships: {
        include: {
          team: {
            include: {
              subscription: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.userType === "CUSTOMER") {
    redirect("/portal/reports");
  }

  return user;
}

export async function requireCustomerUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/portal/login");
  }

  if (user.userType !== "CUSTOMER" || !user.clientId) {
    redirect("/dashboard");
  }

  return user;
}

export async function getActiveWorkspaceMembership(user: CurrentUser) {
  const activeTeamId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;
  return resolveActiveMembership(user.memberships, activeTeamId);
}

export async function requireWorkspaceMembership(teamId?: string, minimumRole?: MembershipRole) {
  const user = await requireUser();
  const membership = teamId
    ? user.memberships.find((item) => item.teamId === teamId)
    : await getActiveWorkspaceMembership(user);

  if (!membership) {
    redirect("/settings");
  }

  if (minimumRole && !hasRequiredRole(membership.role, minimumRole)) {
    redirect("/dashboard");
  }

  return { user, membership };
}

