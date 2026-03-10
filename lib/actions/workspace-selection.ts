"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_WORKSPACE_COOKIE, requireUser } from "@/lib/session";
import { resolveActiveMembership } from "@/lib/workspace";

function getSafeRedirectPath(value: string) {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

export async function setActiveWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const redirectPath = getSafeRedirectPath(String(formData.get("redirectTo") ?? "/dashboard"));
  const membership = resolveActiveMembership(user.memberships, teamId);

  if (!membership || membership.teamId !== teamId) {
    redirect(redirectPath);
  }

  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, teamId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect(redirectPath);
}
