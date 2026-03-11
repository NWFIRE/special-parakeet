"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InspectionServiceType, ReportStatus } from "@prisma/client";
import { getInspectionTemplate } from "@/lib/inspection-templates";
import { db } from "@/lib/db";
import { canEditProjects } from "@/lib/permissions";
import { requireWorkspaceMembership } from "@/lib/session";
import { clientSchema } from "@/lib/validations/inspections";

const initialState = { error: "", success: "" };

function toActionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
}

export async function createClientAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const teamId = String(raw.teamId ?? "");
    const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");

    if (!canEditProjects(membership.role)) {
      return { error: "You do not have permission to manage clients.", success: "" };
    }

    const parsed = clientSchema.safeParse({
      companyName: raw.companyName,
      contactName: raw.contactName,
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone,
      siteCount: raw.siteCount ? Number(raw.siteCount) : undefined,
      notes: raw.notes,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid client.", success: "" };
    }

    await db.client.create({
      data: {
        teamId,
        companyName: parsed.data.companyName,
        contactName: parsed.data.contactName || null,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
        siteCount: parsed.data.siteCount ?? null,
        notes: parsed.data.notes || null,
      },
    });

    revalidatePath("/inspections");
    return { error: "", success: "Client added." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to create client right now."), success: "" };
  }
}

export async function createInspectionReportAction() {
  return { error: "Legacy inspection action is no longer supported. Use the inspection workflow actions instead.", success: "" };
}

export async function updateInspectionReportAction() {
  return { error: "Legacy inspection action is no longer supported. Use the inspection workflow actions instead.", success: "" };
}

export async function deleteInspectionReportAction(reportId: string, teamId: string) {
  const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");

  if (!canEditProjects(membership.role)) {
    throw new Error("You do not have permission to delete reports.");
  }

  const report = await db.inspectionReport.findFirst({ where: { id: reportId, teamId } });

  if (!report) {
    throw new Error("Report not found.");
  }

  await db.inspectionReport.delete({ where: { id: reportId } });
  revalidatePath("/inspections");
  revalidatePath("/dashboard");
  redirect("/inspections");
}

export async function applyInspectionTemplateAction(serviceType: InspectionServiceType) {
  return getInspectionTemplate(serviceType);
}

export async function updateInspectionStatusAction(reportId: string, teamId: string, status: ReportStatus) {
  const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");

  if (!canEditProjects(membership.role)) {
    throw new Error("You do not have permission to update report status.");
  }

  const report = await db.inspectionReport.findFirst({ where: { id: reportId, teamId } });

  if (!report) {
    throw new Error("Report not found.");
  }

  await db.inspectionReport.update({ where: { id: reportId }, data: { status } });
  revalidatePath("/inspections");
  revalidatePath(`/inspections/${reportId}`);
  revalidatePath("/portal/reports");
}
