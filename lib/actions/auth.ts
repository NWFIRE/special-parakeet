"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validations/auth";
import { signIn, signOut } from "@/lib/auth";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/session";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

export async function signupAction(_: { error: string } | undefined, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid signup details." };
  }

  const email = parsed.data.email.toLowerCase();
  const inviteToken = String(formData.get("inviteToken") ?? "");
  const invite = inviteToken ? await db.invite.findUnique({ where: { token: inviteToken } }) : null;

  if (invite && invite.email.toLowerCase() !== email) {
    return { error: "This invite is for a different email address." };
  }

  if (invite && invite.expiresAt < new Date()) {
    return { error: "This invite has expired." };
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      userType: "INTERNAL"
    }
  });

  let createdTeamId: string | null = null;

  if (invite) {
    createdTeamId = invite.teamId;
    await db.membership.create({
      data: {
        userId: user.id,
        teamId: invite.teamId,
        role: invite.role
      }
    });

    await db.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() }
    });
  } else {
    const slugBase = slugify(parsed.data.workspaceName);
    const duplicateCount = await db.team.count({
      where: {
        slug: {
          startsWith: slugBase
        }
      }
    });

    const team = await db.team.create({
      data: {
        name: parsed.data.workspaceName,
        slug: duplicateCount ? `${slugBase}-${duplicateCount + 1}` : slugBase,
        memberships: {
          create: {
            role: "OWNER",
            userId: user.id
          }
        },
        subscription: {
          create: {
            status: "TRIALING"
          }
        }
      }
    });

    createdTeamId = team.id;
  }

  if (createdTeamId) {
    (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, createdTeamId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirect: false
  });

  redirect("/dashboard");
}

export async function credentialsLoginAction(_: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  const redirectTo = user?.userType === "CUSTOMER" ? "/portal/reports" : "/dashboard";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo
    });
  } catch {
    return { error: "Invalid email or password." };
  }
}

export async function portalLoginAction(_: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });

  if (!user || user.userType !== "CUSTOMER") {
    return { error: "Customer portal access is only available for client accounts." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/portal/reports"
    });
  } catch {
    return { error: "Invalid email or password." };
  }
}

export async function googleLoginAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function logoutAction() {
  (await cookies()).delete(ACTIVE_WORKSPACE_COOKIE);
  await signOut({ redirectTo: "/" });
}
