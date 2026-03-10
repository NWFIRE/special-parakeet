import { MembershipRole } from "@prisma/client";

const roleOrder: Record<MembershipRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1
};

export function canManageMembers(role: MembershipRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageBilling(role: MembershipRole) {
  return role === "OWNER";
}

export function canEditProjects(role: MembershipRole) {
  return roleOrder[role] >= roleOrder.ADMIN;
}

export function canEditTasks(role: MembershipRole) {
  return roleOrder[role] >= roleOrder.MEMBER;
}

export function hasRequiredRole(role: MembershipRole, minimumRole: MembershipRole) {
  return roleOrder[role] >= roleOrder[minimumRole];
}
