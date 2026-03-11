"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/lib/session";
import { teamProfileSchema } from "@/lib/validations/inspections";
import { canManageBilling } from "@/lib/permissions";

const initialState = { error: "", success: "" };

export async function updateTeamProfileAction(_: typeof initialState | undefined, formData: FormData) {
  const parsed = teamProfileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid company profile.", success: "" };
  }

  const { membership } = await requireWorkspaceMembership(parsed.data.teamId, "OWNER");

  if (!canManageBilling(membership.role)) {
    return { error: "Only the workspace owner can update company report settings.", success: "" };
  }

  const licenseNumbers = (parsed.data.licenseNumbers || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);

  await db.teamProfile.upsert({
    where: { teamId: parsed.data.teamId },
    update: { companyName: parsed.data.companyName || null, logoUrl: parsed.data.logoUrl || null, addressLine1: parsed.data.addressLine1 || null, addressLine2: parsed.data.addressLine2 || null, city: parsed.data.city || null, state: parsed.data.state || null, postalCode: parsed.data.postalCode || null, phone: parsed.data.phone || null, email: parsed.data.email || null, website: parsed.data.website || null, licenseNumbers, certificationText: parsed.data.certificationText || null, reportDisclaimer: parsed.data.reportDisclaimer || null, footerText: parsed.data.footerText || null, primaryColor: parsed.data.primaryColor || null },
    create: { teamId: parsed.data.teamId, companyName: parsed.data.companyName || null, logoUrl: parsed.data.logoUrl || null, addressLine1: parsed.data.addressLine1 || null, addressLine2: parsed.data.addressLine2 || null, city: parsed.data.city || null, state: parsed.data.state || null, postalCode: parsed.data.postalCode || null, phone: parsed.data.phone || null, email: parsed.data.email || null, website: parsed.data.website || null, licenseNumbers, certificationText: parsed.data.certificationText || null, reportDisclaimer: parsed.data.reportDisclaimer || null, footerText: parsed.data.footerText || null, primaryColor: parsed.data.primaryColor || null }
  });

  revalidatePath("/settings");
  revalidatePath("/inspections");
  return { error: "", success: "Company report profile updated." };
}