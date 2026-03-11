import { AutofillSourceType, InspectionOutcome, InspectionServiceType, ReportStatus } from "@prisma/client";
import { z } from "zod";

export const clientSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().max(80).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  siteCount: z.coerce.number().int().min(0).max(1000).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const siteSchema = z.object({
  teamId: z.string().min(1),
  clientId: z.string().min(1, "Client is required."),
  name: z.string().trim().min(2).max(120),
  siteCode: z.string().trim().max(40).optional().or(z.literal("")),
  addressLine1: z.string().trim().min(3).max(160),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(40).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  contactName: z.string().trim().max(80).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const teamProfileSchema = z.object({
  teamId: z.string().min(1),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  addressLine1: z.string().trim().max(160).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(40).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  licenseNumbers: z.string().trim().max(1500).optional().or(z.literal("")),
  certificationText: z.string().trim().max(2000).optional().or(z.literal("")),
  reportDisclaimer: z.string().trim().max(2000).optional().or(z.literal("")),
  footerText: z.string().trim().max(500).optional().or(z.literal("")),
  primaryColor: z.string().trim().max(20).optional().or(z.literal("")),
});

const autofillMetaSchema = z.record(
  z.object({
    sourceType: z.nativeEnum(AutofillSourceType),
    sourceLabel: z.string(),
    sourceValue: z.string(),
  })
);

export const reportAssetSchema = z.object({
  assetId: z.string().optional(),
  assetName: z.string().trim().min(1, "Asset name is required."),
  location: z.string().trim().optional().default(""),
  assetTag: z.string().trim().optional().default(""),
  deviceType: z.string().trim().optional().default(""),
  manufacturer: z.string().trim().optional().default(""),
  model: z.string().trim().optional().default(""),
  serialNumber: z.string().trim().optional().default(""),
  ulListing: z.string().trim().optional().default(""),
  complianceFrequency: z.string().trim().optional().default(""),
  lastServiceDate: z.string().optional().default(""),
  nextServiceDate: z.string().optional().default(""),
  status: z.nativeEnum(InspectionOutcome),
  deficiencySummary: z.string().trim().optional().default(""),
  recommendationText: z.string().trim().optional().default(""),
  followUpRequired: z.boolean().default(false),
  deficiencyTemplateKey: z.string().trim().optional().default(""),
  attributes: z.record(z.string()),
  checks: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        status: z.nativeEnum(InspectionOutcome),
        note: z.string().trim().max(500).optional().default(""),
      })
    )
    .min(1),
  autofillMeta: autofillMetaSchema.default({}),
});

export const inspectionWorkflowSchema = z.object({
  reportId: z.string().optional(),
  teamId: z.string().min(1),
  clientId: z.string().min(1),
  siteId: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  reportNumber: z.string().trim().max(40).optional().or(z.literal("")),
  serviceType: z.nativeEnum(InspectionServiceType),
  status: z.nativeEnum(ReportStatus),
  overallStatus: z.nativeEnum(InspectionOutcome),
  propertyName: z.string().trim().min(2).max(120),
  propertyAddress: z.string().trim().max(220).optional().or(z.literal("")),
  serviceDate: z.string().min(1),
  completedAt: z.string().optional().or(z.literal("")),
  nextInspectionDate: z.string().optional().or(z.literal("")),
  frequencyLabel: z.string().trim().max(80).optional().or(z.literal("")),
  inspectorName: z.string().trim().max(80).optional().or(z.literal("")),
  pointOfContact: z.string().trim().max(80).optional().or(z.literal("")),
  technicianLicense: z.string().trim().max(160).optional().or(z.literal("")),
  technicianCertification: z.string().trim().max(160).optional().or(z.literal("")),
  summary: z.string().trim().max(4000).optional().or(z.literal("")),
  recommendations: z.string().trim().max(4000).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  codeReferences: z.array(z.string().trim()).default([]),
  photoUrls: z.array(z.string().trim().url()).default([]),
  customerPrintedName: z.string().trim().max(120).optional().or(z.literal("")),
  customerSignatureName: z.string().trim().max(120).optional().or(z.literal("")),
  technicianPrintedName: z.string().trim().max(120).optional().or(z.literal("")),
  technicianSignatureName: z.string().trim().max(120).optional().or(z.literal("")),
  assets: z.array(reportAssetSchema).min(1),
  autoFillSummary: z.string().optional().or(z.literal("")),
});

export const inspectionReportSchema = inspectionWorkflowSchema;

export function parseInspectionWorkflowPayload(raw: string) {
  const parsed = inspectionWorkflowSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid inspection report.");
  return parsed.data;
}

export function parseChecklistItems(raw: string) {
  return z.array(z.object({ item: z.string(), status: z.string(), notes: z.string() })).parse(JSON.parse(raw));
}

export function parseDeficiencies(raw: string) {
  return z.array(z.object({ description: z.string(), severity: z.string(), location: z.string().optional(), corrective_action: z.string().optional(), due_date: z.string().optional() })).parse(JSON.parse(raw));
}

export function parseEquipmentSummary(raw: string) {
  return z.array(z.object({ category: z.string(), quantity: z.string(), notes: z.string().optional() })).parse(JSON.parse(raw));
}

