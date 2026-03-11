"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InspectionServiceType, ReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getInspectionTemplate, toLegacyInspectionType } from "@/lib/inspection-templates";
import { canEditProjects } from "@/lib/permissions";
import { requireWorkspaceMembership } from "@/lib/session";
import { clientSchema, inspectionReportSchema, parseChecklistItems, parseDeficiencies, parseEquipmentSummary } from "@/lib/validations/inspections";

const initialState = { error: "", success: "" };

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) {
      return message;
    }
  }

  return fallback;
}

async function ensureClientBelongsToTeam(clientId: string, teamId: string) {
  return db.client.findFirst({
    where: {
      id: clientId,
      teamId
    }
  });
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
      notes: raw.notes
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
        notes: parsed.data.notes || null
      }
    });

    revalidatePath("/inspections");
    return { error: "", success: "Client added." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to create client right now."), success: "" };
  }
}

export async function createInspectionReportAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const teamId = String(raw.teamId ?? "");
    const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");

    if (!canEditProjects(membership.role)) {
      return { error: "You do not have permission to create inspection reports.", success: "" };
    }

    const parsed = inspectionReportSchema.safeParse(raw);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid report.", success: "" };
    }

    const client = await ensureClientBelongsToTeam(parsed.data.clientId, teamId);

    if (!client) {
      return { error: "Selected client does not belong to this workspace.", success: "" };
    }

    let checklistItems;
    let deficiencies;
    let equipmentSummary;

    try {
      checklistItems = parseChecklistItems(parsed.data.checklistItems);
      deficiencies = parseDeficiencies(parsed.data.deficiencies);
      equipmentSummary = parseEquipmentSummary(parsed.data.equipmentSummary);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid report sections.", success: "" };
    }

    await db.inspectionReport.create({
      data: {
        teamId,
        clientId: parsed.data.clientId,
        title: parsed.data.title,
        reportNumber: parsed.data.reportNumber || null,
        serviceType: parsed.data.serviceType,
        status: parsed.data.status,
        propertyName: parsed.data.propertyName,
        propertyAddress: parsed.data.propertyAddress || null,
        inspectorName: parsed.data.inspectorName || null,
        pointOfContact: parsed.data.pointOfContact || null,
        frequencyLabel: parsed.data.frequencyLabel || null,
        completedAt: parseOptionalDate(parsed.data.completedAt),
        nextInspectionDate: parseOptionalDate(parsed.data.nextInspectionDate),
        notes: parsed.data.notes || null,
        checklistItems,
        deficiencies,
        equipmentSummary
      }
    });

    revalidatePath("/inspections");
    revalidatePath("/dashboard");
    return { error: "", success: "Inspection report created." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to create inspection report right now."), success: "" };
  }
}

export async function updateInspectionReportAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const teamId = String(raw.teamId ?? "");
    const reportId = String(raw.reportId ?? "");
    const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");

    if (!canEditProjects(membership.role)) {
      return { error: "You do not have permission to update inspection reports.", success: "" };
    }

    const parsed = inspectionReportSchema.safeParse(raw);

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid report.", success: "" };
    }

    const report = await db.inspectionReport.findFirst({ where: { id: reportId, teamId } });

    if (!report) {
      return { error: "Report not found in this workspace.", success: "" };
    }

    const client = await ensureClientBelongsToTeam(parsed.data.clientId, teamId);

    if (!client) {
      return { error: "Selected client does not belong to this workspace.", success: "" };
    }

    let checklistItems;
    let deficiencies;
    let equipmentSummary;

    try {
      checklistItems = parseChecklistItems(parsed.data.checklistItems);
      deficiencies = parseDeficiencies(parsed.data.deficiencies);
      equipmentSummary = parseEquipmentSummary(parsed.data.equipmentSummary);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid report sections.", success: "" };
    }

    await db.inspectionReport.update({
      where: { id: report.id },
      data: {
        clientId: parsed.data.clientId,
        title: parsed.data.title,
        reportNumber: parsed.data.reportNumber || null,
        serviceType: parsed.data.serviceType,
        status: parsed.data.status,
        propertyName: parsed.data.propertyName,
        propertyAddress: parsed.data.propertyAddress || null,
        inspectorName: parsed.data.inspectorName || null,
        pointOfContact: parsed.data.pointOfContact || null,
        frequencyLabel: parsed.data.frequencyLabel || null,
        completedAt: parseOptionalDate(parsed.data.completedAt),
        nextInspectionDate: parseOptionalDate(parsed.data.nextInspectionDate),
        notes: parsed.data.notes || null,
        checklistItems,
        deficiencies,
        equipmentSummary
      }
    });

    revalidatePath("/inspections");
    revalidatePath(`/inspections/${report.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/portal/reports");
    return { error: "", success: "Inspection report updated." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to update inspection report right now."), success: "" };
  }
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

  await db.inspectionReport.update({
    where: { id: reportId },
    data: {
      status
    }
  });

  revalidatePath("/inspections");
  revalidatePath(`/inspections/${reportId}`);
  revalidatePath("/portal/reports");
}

