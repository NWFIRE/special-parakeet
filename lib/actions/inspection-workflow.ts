"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InspectionOutcome, InspectionServiceType, Prisma, ReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getServiceConfig, toLegacyInspectionType } from "@/lib/inspection-config";
import { stringifyAutofillSummary } from "@/lib/inspection-smart-defaults";
import { getBaseUrl } from "@/lib/utils";
import { canEditProjects } from "@/lib/permissions";
import { requireWorkspaceMembership } from "@/lib/session";
import { clientSchema, parseInspectionWorkflowPayload, siteSchema } from "@/lib/validations/inspections";

const initialState = { error: "", success: "" };

type SignaturePayload = {
  printedName?: string;
  name?: string;
  signedAt?: string;
};

function parseOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toActionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
}

async function ensureClientBelongsToTeam(clientId: string, teamId: string) {
  return db.client.findFirst({ where: { id: clientId, teamId } });
}

async function ensureSiteBelongsToTeam(siteId: string, teamId: string, clientId: string) {
  return db.clientSite.findFirst({ where: { id: siteId, teamId, clientId } });
}

function buildReportNumber(serviceType: InspectionServiceType) {
  const prefixMap: Record<InspectionServiceType, string> = {
    FIRE_EXTINGUISHER: "FE",
    FIRE_ALARM: "FA",
    FIRE_SPRINKLER: "FS",
    KITCHEN_SUPPRESSION: "KS",
    EMERGENCY_EXIT_LIGHTING: "EL",
    BACKFLOW: "BF",
    OTHER: "IR",
  };
  return `${prefixMap[serviceType]}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getOutcomeRank(status: InspectionOutcome) {
  return status === "FAIL" ? 3 : status === "ATTENTION" ? 2 : status === "PASS" ? 1 : 0;
}

function computeOverallStatus(assetStatuses: InspectionOutcome[], requested: InspectionOutcome) {
  const derived = assetStatuses.reduce<InspectionOutcome>((current, status) => (getOutcomeRank(status) > getOutcomeRank(current) ? status : current), "PASS");
  return getOutcomeRank(requested) > getOutcomeRank(derived) ? requested : derived;
}

function buildLegacyChecklist(assets: Array<{ assetName: string; checks: Array<{ label: string; status: InspectionOutcome; note: string }> }>) {
  return assets.flatMap((asset) => asset.checks.map((check) => ({ item: `${asset.assetName}: ${check.label}`, status: check.status, notes: check.note })));
}

function buildLegacyDeficiencies(assets: Array<{ assetName: string; location?: string; status: InspectionOutcome; deficiencySummary: string; recommendationText: string; nextServiceDate?: string; followUpRequired: boolean }>) {
  return assets
    .filter((asset) => asset.status !== "PASS" || asset.followUpRequired || asset.deficiencySummary || asset.recommendationText)
    .map((asset) => ({
      description: asset.deficiencySummary || `${asset.assetName} requires follow-up service.`,
      severity: asset.status,
      location: asset.location ?? "",
      corrective_action: asset.recommendationText || "Review and complete corrective work.",
      due_date: asset.nextServiceDate || "",
    }));
}

function buildEquipmentSummary(assets: Array<{ assetName: string; manufacturer?: string; location?: string; status: InspectionOutcome; deviceType?: string }>) {
  return assets.map((asset) => ({
    category: asset.deviceType || asset.assetName,
    quantity: "1",
    notes: [asset.manufacturer, asset.location, asset.status].filter(Boolean).join(" | "),
  }));
}

function serializeSignature(printedName: string | undefined, signatureName: string | undefined) {
  if (!printedName && !signatureName) return null;
  return {
    printedName,
    name: signatureName,
    signedAt: new Date().toISOString(),
  } satisfies SignaturePayload;
}

function valueAtPath(asset: { [key: string]: unknown; attributes: Record<string, string>; checks: Array<{ key: string; status: InspectionOutcome; note: string }> }, path: string) {
  if (path.startsWith("attributes.")) return asset.attributes[path.replace("attributes.", "")] ?? "";
  if (path.startsWith("checks.")) {
    const [, key, field] = path.split(".");
    const check = asset.checks.find((item) => item.key === key);
    return !check ? "" : field === "note" ? check.note : check.status;
  }
  return String(asset[path] ?? "");
}

async function saveInspectionReport(rawPayload: string, expectedReportId?: string) {
  const payload = parseInspectionWorkflowPayload(rawPayload);
  const { user, membership } = await requireWorkspaceMembership(payload.teamId, "ADMIN");
  if (!canEditProjects(membership.role)) throw new Error("You do not have permission to manage inspection reports.");

  const [client, site] = await Promise.all([
    ensureClientBelongsToTeam(payload.clientId, membership.teamId),
    ensureSiteBelongsToTeam(payload.siteId, membership.teamId, payload.clientId),
  ]);
  if (!client) throw new Error("Selected client does not belong to this workspace.");
  if (!site) throw new Error("Selected site does not belong to this workspace.");
  if (expectedReportId && payload.reportId && expectedReportId !== payload.reportId) throw new Error("Report mismatch.");

  const overallStatus = computeOverallStatus(payload.assets.map((asset) => asset.status), payload.overallStatus);
  const serviceConfig = getServiceConfig(payload.serviceType);
  const finalizedAt = payload.status === "DRAFT" ? null : new Date();
  const reportData = {
    teamId: membership.teamId,
    clientId: payload.clientId,
    siteId: payload.siteId,
    title: payload.title,
    reportNumber: payload.reportNumber || buildReportNumber(payload.serviceType),
    inspectionType: toLegacyInspectionType(payload.serviceType),
    serviceType: payload.serviceType,
    status: payload.status,
    overallStatus,
    propertyName: payload.propertyName,
    propertyAddress: payload.propertyAddress || null,
    inspectorName: payload.inspectorName || user.name || null,
    pointOfContact: payload.pointOfContact || null,
    frequencyLabel: payload.frequencyLabel || serviceConfig.defaultFrequency,
    serviceDate: parseOptionalDate(payload.serviceDate) ?? new Date(),
    completedAt: parseOptionalDate(payload.completedAt),
    nextInspectionDate: parseOptionalDate(payload.nextInspectionDate),
    summary: payload.summary || null,
    recommendationSummary: payload.recommendations || null,
    notes: payload.notes || null,
    codeReferences: payload.codeReferences,
    checklistItems: buildLegacyChecklist(payload.assets),
    deficiencies: buildLegacyDeficiencies(payload.assets),
    equipmentSummary: buildEquipmentSummary(payload.assets),
    technicianLicense: payload.technicianLicense || null,
    technicianCertification: payload.technicianCertification || null,
    customerSignature: serializeSignature(payload.customerPrintedName || undefined, payload.customerSignatureName || undefined) ?? Prisma.JsonNull,
    technicianSignature: serializeSignature(payload.technicianPrintedName || undefined, payload.technicianSignatureName || undefined) ?? Prisma.JsonNull,
    photoUrls: payload.photoUrls,
    autoFillSummary: payload.autoFillSummary || stringifyAutofillSummary(payload.assets),
    finalizedAt,
    portalPublishedAt: payload.status === "DRAFT" ? null : new Date(),
  };

  const report = await db.$transaction(async (tx) => {
    const savedReport = payload.reportId
      ? await tx.inspectionReport.update({ where: { id: payload.reportId }, data: reportData })
      : await tx.inspectionReport.create({ data: reportData });

    await tx.inspectionReport.update({ where: { id: savedReport.id }, data: { pdfUrl: `${getBaseUrl()}/inspections/${savedReport.id}/print` } });
    await tx.inspectionReportAsset.deleteMany({ where: { reportId: savedReport.id } });
    await tx.inspectionFieldAudit.deleteMany({ where: { reportId: savedReport.id } });
    const snapshots: Array<{ id: string; payloadIndex: number }> = [];

    for (let index = 0; index < payload.assets.length; index += 1) {
      const assetDraft = payload.assets[index];
      const existingAsset = assetDraft.assetId ? await tx.inspectionAsset.findFirst({ where: { id: assetDraft.assetId, teamId: membership.teamId } }) : null;
      const assetData = {
        clientId: payload.clientId,
        siteId: payload.siteId,
        serviceType: payload.serviceType,
        name: assetDraft.assetName,
        location: assetDraft.location || null,
        assetTag: assetDraft.assetTag || null,
        deviceType: assetDraft.deviceType || null,
        manufacturer: assetDraft.manufacturer || null,
        model: assetDraft.model || null,
        serialNumber: assetDraft.serialNumber || null,
        ulListing: assetDraft.ulListing || null,
        complianceFrequency: assetDraft.complianceFrequency || serviceConfig.defaultFrequency,
        lastServiceDate: parseOptionalDate(assetDraft.lastServiceDate),
        nextServiceDate: parseOptionalDate(assetDraft.nextServiceDate),
        profileData: assetDraft.attributes,
        lastInspectionData: {
          status: assetDraft.status,
          deficiencySummary: assetDraft.deficiencySummary,
          recommendationText: assetDraft.recommendationText,
          followUpRequired: assetDraft.followUpRequired,
          deficiencyTemplateKey: assetDraft.deficiencyTemplateKey,
          checks: assetDraft.checks,
          attributes: assetDraft.attributes,
          lastServiceDate: assetDraft.lastServiceDate,
          nextServiceDate: assetDraft.nextServiceDate,
          reportNumber: reportData.reportNumber,
          savedAt: new Date().toISOString(),
        },
      };
      const assetRecord = existingAsset
        ? await tx.inspectionAsset.update({ where: { id: existingAsset.id }, data: assetData })
        : await tx.inspectionAsset.create({ data: { teamId: membership.teamId, ...assetData } });
      const snapshot = await tx.inspectionReportAsset.create({
        data: {
          reportId: savedReport.id,
          assetId: assetRecord.id,
          sortOrder: index,
          assetName: assetDraft.assetName,
          location: assetDraft.location || null,
          assetTag: assetDraft.assetTag || null,
          deviceType: assetDraft.deviceType || null,
          manufacturer: assetDraft.manufacturer || null,
          model: assetDraft.model || null,
          serialNumber: assetDraft.serialNumber || null,
          ulListing: assetDraft.ulListing || null,
          complianceFrequency: assetDraft.complianceFrequency || null,
          lastServiceDate: parseOptionalDate(assetDraft.lastServiceDate),
          nextServiceDate: parseOptionalDate(assetDraft.nextServiceDate),
          status: assetDraft.status,
          deficiencySummary: assetDraft.deficiencySummary || null,
          recommendationText: assetDraft.recommendationText || null,
          followUpRequired: assetDraft.followUpRequired,
          attributes: assetDraft.attributes,
          testResults: assetDraft.checks,
          codeReferences: payload.codeReferences,
          appliedTemplateKeys: assetDraft.deficiencyTemplateKey ? [assetDraft.deficiencyTemplateKey] : [],
          autofillMeta: assetDraft.autofillMeta,
        },
      });
      snapshots.push({ id: snapshot.id, payloadIndex: index });
    }

    for (const snapshot of snapshots) {
      const assetDraft = payload.assets[snapshot.payloadIndex];
      const auditRows = Object.entries(assetDraft.autofillMeta).map(([fieldPath, meta]) => ({
        reportId: savedReport.id,
        reportAssetId: snapshot.id,
        changedById: user.id,
        fieldPath,
        sourceType: meta.sourceType,
        sourceLabel: meta.sourceLabel,
        sourceValue: meta.sourceValue,
        finalValue: String(valueAtPath(assetDraft, fieldPath) ?? ""),
        wasOverridden: String(valueAtPath(assetDraft, fieldPath) ?? "") !== meta.sourceValue,
      }));
      if (auditRows.length) await tx.inspectionFieldAudit.createMany({ data: auditRows });
    }

    return savedReport;
  });

  return report;
}

export async function createSiteAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const parsed = siteSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid site.", success: "" };
    const { membership } = await requireWorkspaceMembership(parsed.data.teamId, "ADMIN");
    if (!canEditProjects(membership.role)) return { error: "You do not have permission to manage sites.", success: "" };
    const client = await ensureClientBelongsToTeam(parsed.data.clientId, membership.teamId);
    if (!client) return { error: "Selected client does not belong to this workspace.", success: "" };
    await db.clientSite.create({
      data: {
        teamId: membership.teamId,
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        siteCode: parsed.data.siteCode || null,
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2 || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        postalCode: parsed.data.postalCode || null,
        contactName: parsed.data.contactName || null,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
        notes: parsed.data.notes || null,
      },
    });
    revalidatePath("/inspections");
    return { error: "", success: "Site added." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to create site right now."), success: "" };
  }
}

export async function createInspectionReportAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const payload = String(formData.get("payload") ?? "");
    await saveInspectionReport(payload);
    revalidatePath("/inspections");
    revalidatePath("/dashboard");
    revalidatePath("/portal/reports");
    return { error: "", success: "Inspection report created." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to create inspection report right now."), success: "" };
  }
}

export async function autosaveInspectionReportAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const reportId = String(formData.get("reportId") ?? "");
    const payload = String(formData.get("payload") ?? "");
    const report = await saveInspectionReport(payload, reportId || undefined);
    revalidatePath("/inspections");
    revalidatePath("/dashboard");
    if (report.id) {
      revalidatePath(`/inspections/${report.id}`);
      revalidatePath(`/inspections/${report.id}/print`);
    }
    return { error: "", success: "Draft saved.", reportId: report.id, savedAt: new Date().toISOString() };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to autosave this report right now."), success: "", reportId: "", savedAt: "" };
  }
}

export async function updateInspectionReportAction(_: typeof initialState | undefined, formData: FormData) {
  try {
    const reportId = String(formData.get("reportId") ?? "");
    const payload = String(formData.get("payload") ?? "");
    const report = await saveInspectionReport(payload, reportId);
    revalidatePath("/inspections");
    revalidatePath(`/inspections/${report.id}`);
    revalidatePath(`/inspections/${report.id}/print`);
    revalidatePath("/dashboard");
    revalidatePath("/portal/reports");
    return { error: "", success: "Inspection report updated." };
  } catch (error) {
    return { error: toActionErrorMessage(error, "Unable to update inspection report right now."), success: "" };
  }
}

export async function deleteInspectionReportAction(reportId: string, teamId: string) {
  const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");
  if (!canEditProjects(membership.role)) throw new Error("You do not have permission to delete reports.");
  const report = await db.inspectionReport.findFirst({ where: { id: reportId, teamId } });
  if (!report) throw new Error("Report not found.");
  await db.inspectionReport.delete({ where: { id: reportId } });
  revalidatePath("/inspections");
  revalidatePath("/dashboard");
  redirect("/inspections");
}

export async function updateInspectionStatusAction(reportId: string, teamId: string, status: ReportStatus) {
  const { membership } = await requireWorkspaceMembership(teamId, "ADMIN");
  if (!canEditProjects(membership.role)) throw new Error("You do not have permission to update report status.");
  const report = await db.inspectionReport.findFirst({ where: { id: reportId, teamId } });
  if (!report) throw new Error("Report not found.");
  await db.inspectionReport.update({ where: { id: reportId }, data: { status, finalizedAt: status === "DRAFT" ? null : report.finalizedAt ?? new Date(), portalPublishedAt: status === "DRAFT" ? null : report.portalPublishedAt ?? new Date() } });
  revalidatePath("/inspections");
  revalidatePath(`/inspections/${reportId}`);
  revalidatePath("/portal/reports");
}

