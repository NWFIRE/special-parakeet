import type { MembershipRole } from "@prisma/client";

export type WorkspaceMembershipLike = {
  teamId: string;
  role?: MembershipRole | string;
};

export function resolveActiveMembership<T extends WorkspaceMembershipLike>(memberships: T[], activeTeamId?: string | null) {
  if (!memberships.length) {
    return null;
  }

  if (activeTeamId) {
    const activeMembership = memberships.find((item) => item.teamId === activeTeamId);
    if (activeMembership) {
      return activeMembership;
    }
  }

  return memberships[0];
}
