import type { AutofillSourceType, InspectionOutcome, InspectionServiceType } from "@prisma/client";
import { getServiceConfig } from "@/lib/inspection-config";

type JsonObject = Record<string, string | number | boolean | null | undefined>;
type InspectionAssetLike = {
  id: string;
  name: string;
  location: string | null;
  assetTag: string | null;
  deviceType: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  ulListing: string | null;
  complianceFrequency: string | null;
  lastServiceDate: Date | string | null;
  nextServiceDate: Date | string | null;
  profileData: unknown;
  lastInspectionData: unknown;
};
type AutofillMetaRecord = Record<string, { sourceType: AutofillSourceType; sourceLabel: string; sourceValue: string }>;

export type DraftCheck = {
  key: string;
  label: string;
  status: InspectionOutcome;
  note: string;
};

export type DraftAsset = {
  assetId?: string;
  assetName: string;
  location: string;
  assetTag: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  ulListing: string;
  complianceFrequency: string;
  lastServiceDate: string;
  nextServiceDate: string;
  status: InspectionOutcome;
  deficiencySummary: string;
  recommendationText: string;
  followUpRequired: boolean;
  deficiencyTemplateKey: string;
  attributes: Record<string, string>;
  checks: DraftCheck[];
  autofillMeta: AutofillMetaRecord;
};

export type DraftReportContext = {
  title: string;
  frequencyLabel: string;
  serviceDate: string;
  nextInspectionDate: string;
  codeReferences: string[];
  summary: string;
  recommendations: string;
  assets: DraftAsset[];
};

function asObject(value: unknown): JsonObject {
  return !value || typeof value !== "object" || Array.isArray(value) ? {} : (value as JsonObject);
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function addMonths(value: Date, months: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
}

function setAutofill(
  meta: AutofillMetaRecord,
  path: string,
  sourceType: AutofillSourceType,
  sourceLabel: string,
  sourceValue: unknown
) {
  if (sourceValue === null || sourceValue === undefined || sourceValue === "") return;
  meta[path] = {
    sourceType,
    sourceLabel,
    sourceValue: String(sourceValue),
  };
}

export function createBlankDraftAsset(serviceType: InspectionServiceType): DraftAsset {
  const config = getServiceConfig(serviceType);

  return {
    assetName: "",
    location: "",
    assetTag: "",
    deviceType: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    ulListing: "",
    complianceFrequency: config.defaultFrequency,
    lastServiceDate: "",
    nextServiceDate: "",
    status: "PASS",
    deficiencySummary: "",
    recommendationText: "",
    followUpRequired: false,
    deficiencyTemplateKey: "",
    attributes: Object.fromEntries(config.attributeFields.map((field) => [field.key, ""])),
    checks: config.checkFields.map((field) => ({
      key: field.key,
      label: field.label,
      status: "PASS",
      note: field.helper ?? "",
    })),
    autofillMeta: {},
  };
}

export function buildDraftAssetsFromHistory(serviceType: InspectionServiceType, assets: InspectionAssetLike[]) {
  const config = getServiceConfig(serviceType);

  return assets.filter(Boolean).map((asset) => {
    const draft = createBlankDraftAsset(serviceType);
    const profileData = asObject(asset.profileData);
    const lastInspection = asObject(asset.lastInspectionData);
    const lastChecks = Array.isArray(lastInspection.checks)
      ? (lastInspection.checks as Array<Record<string, unknown>>)
      : [];
    const lastAttributes = asObject(lastInspection.attributes);

    draft.assetId = asset.id;
    draft.assetName = asset.name;
    draft.location = asset.location ?? "";
    draft.assetTag = asset.assetTag ?? "";
    draft.deviceType = asset.deviceType ?? String(profileData.deviceType ?? "");
    draft.manufacturer = asset.manufacturer ?? String(profileData.manufacturer ?? "");
    draft.model = asset.model ?? String(profileData.model ?? "");
    draft.serialNumber = asset.serialNumber ?? String(profileData.serialNumber ?? "");
    draft.ulListing = asset.ulListing ?? String(profileData.ulListing ?? "");
    draft.complianceFrequency = asset.complianceFrequency ?? config.defaultFrequency;
    draft.lastServiceDate = toDateInput(asset.lastServiceDate ?? (lastInspection.lastServiceDate as string | undefined));
    draft.nextServiceDate = toDateInput(asset.nextServiceDate ?? (lastInspection.nextServiceDate as string | undefined));
    draft.status = String(lastInspection.status ?? "PASS") as InspectionOutcome;
    draft.deficiencySummary = String(lastInspection.deficiencySummary ?? "");
    draft.recommendationText = String(lastInspection.recommendationText ?? "");
    draft.followUpRequired = Boolean(lastInspection.followUpRequired ?? false);
    draft.deficiencyTemplateKey = String(lastInspection.deficiencyTemplateKey ?? "");

    [
      "assetName",
      "location",
      "assetTag",
      "deviceType",
      "manufacturer",
      "model",
      "serialNumber",
      "ulListing",
      "complianceFrequency",
    ].forEach((key) => {
      setAutofill(draft.autofillMeta, key, "ASSET_RECORD", "Asset record", (draft as unknown as Record<string, string>)[key]);
    });

    setAutofill(draft.autofillMeta, "lastServiceDate", "PREVIOUS_REPORT", "Previous inspection", draft.lastServiceDate);
    setAutofill(draft.autofillMeta, "nextServiceDate", "PREVIOUS_REPORT", "Previous inspection", draft.nextServiceDate);

    for (const field of config.attributeFields) {
      const value = String(lastAttributes[field.key] ?? profileData[field.key] ?? "");
      draft.attributes[field.key] = value;
      setAutofill(
        draft.autofillMeta,
        `attributes.${field.key}`,
        lastAttributes[field.key] ? "PREVIOUS_REPORT" : profileData[field.key] ? "ASSET_RECORD" : "TEMPLATE",
        lastAttributes[field.key] ? "Previous inspection" : profileData[field.key] ? "Asset record" : "Template",
        value
      );
    }

    draft.checks = config.checkFields.map((field) => {
      const fromHistory = lastChecks.find((entry) => entry.key === field.key);
      const status = String(fromHistory?.status ?? "PASS") as InspectionOutcome;
      const note = String(fromHistory?.note ?? field.helper ?? "");
      setAutofill(draft.autofillMeta, `checks.${field.key}.status`, "PREVIOUS_REPORT", "Previous inspection", status);
      return {
        key: field.key,
        label: field.label,
        status,
        note,
      };
    });

    return draft;
  });
}

export function buildDraftReportContext(
  serviceType: InspectionServiceType,
  siteName: string,
  assets: InspectionAssetLike[],
  technicianName: string
) {
  const config = getServiceConfig(serviceType);
  const today = new Date();
  const nextDate = addMonths(today, config.defaultNextIntervalMonths);
  const draftAssets = buildDraftAssetsFromHistory(serviceType, assets);

  return {
    title: `${config.title} - ${siteName}`,
    frequencyLabel: config.defaultFrequency,
    serviceDate: toDateInput(today),
    nextInspectionDate: toDateInput(nextDate),
    codeReferences: config.codeReferences,
    summary: `${config.title} completed for ${siteName}. Review each ${config.assetLabel.toLowerCase()} below and confirm any follow-up items before finalizing.`,
    recommendations: ``,
    assets: draftAssets.length ? draftAssets : [createBlankDraftAsset(serviceType)],
  } satisfies DraftReportContext;
}

export function stringifyAutofillSummary(assets: DraftAsset[]) {
  return JSON.stringify(
    assets.map((asset, index) => ({
      index,
      assetName: asset.assetName,
      autoFilledFields: Object.keys(asset.autofillMeta),
    }))
  );
}
