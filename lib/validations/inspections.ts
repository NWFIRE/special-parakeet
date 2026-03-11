import { InspectionServiceType, ReportStatus } from "@prisma/client";
import { z } from "zod";

const checklistItemSchema = z.object({
  item: z.string().min(1, "Checklist item title is required."),
  status: z.enum(["PASS", "FAIL", "REPAIR_REQUIRED", "NOT_APPLICABLE"]),
  notes: z.string().max(500).optional().default("")
});

const deficiencySchema = z.object({
  description: z.string().min(1, "Deficiency description is required."),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  location: z.string().max(120).optional().default(""),
  corrective_action: z.string().max(500).optional().default(""),
  due_date: z.string().optional().default("")
});

const equipmentRowSchema = z.object({
  category: z.string().min(1, "Equipment category is required."),
  quantity: z.string().max(50).optional().default(""),
  notes: z.string().max(300).optional().default("")
});

export const clientSchema = z.object({
  companyName: z.string().min(2).max(120),
  contactName: z.string().max(80).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  siteCount: z.coerce.number().int().min(0).max(1000).optional(),
  notes: z.string().max(1000).optional().or(z.literal(""))
});

export const inspectionReportSchema = z.object({
  teamId: z.string().min(1),
  clientId: z.string().min(1, "Client is required."),
  title: z.string().min(3).max(140),
  reportNumber: z.string().max(40).optional().or(z.literal("")),
  serviceType: z.nativeEnum(InspectionServiceType),
  status: z.nativeEnum(ReportStatus),
  propertyName: z.string().min(2).max(120),
  propertyAddress: z.string().max(200).optional().or(z.literal("")),
  inspectorName: z.string().max(80).optional().or(z.literal("")),
  pointOfContact: z.string().max(80).optional().or(z.literal("")),
  frequencyLabel: z.string().max(50).optional().or(z.literal("")),
  completedAt: z.string().optional().or(z.literal("")),
  nextInspectionDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  checklistItems: z.string().min(2),
  deficiencies: z.string().min(2),
  equipmentSummary: z.string().min(2)
});

export function parseChecklistItems(raw: string) {
  const parsed = z.array(checklistItemSchema).safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid checklist items.");
  }

  return parsed.data;
}

export function parseDeficiencies(raw: string) {
  const parsed = z.array(deficiencySchema).safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid deficiencies.");
  }

  return parsed.data;
}

export function parseEquipmentSummary(raw: string) {
  const parsed = z.array(equipmentRowSchema).safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid equipment summary.");
  }

  return parsed.data;
}

