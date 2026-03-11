import { InspectionOutcome, InspectionServiceType, ReportStatus } from "@prisma/client";

export type InspectionFieldConfig = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "number";
  placeholder?: string;
  helper?: string;
  options?: string[];
};

export type InspectionCheckConfig = {
  key: string;
  label: string;
  helper?: string;
};

export type DeficiencyTemplate = {
  key: string;
  title: string;
  severity: InspectionOutcome;
  description: string;
  recommendation: string;
  codeReferences?: string[];
};

export type ServiceWorkflowConfig = {
  title: string;
  shortLabel: string;
  defaultFrequency: string;
  defaultNextIntervalMonths: number;
  codeReferences: string[];
  assetLabel: string;
  summaryHint: string;
  baseFields?: string[];
  attributeFields: InspectionFieldConfig[];
  checkFields: InspectionCheckConfig[];
  deficiencyTemplates: DeficiencyTemplate[];
};

export type ExtinguisherRuleMatch = {
  value: string;
  sourceLabel: string;
};

type ExtinguisherHydroRule = {
  intervalYears: number;
  label: string;
};

type ExtinguisherSixYearRule = {
  applicable: boolean;
  intervalYears?: number;
  label: string;
};

const currentYear = new Date().getFullYear();

export const inspectionServiceLabels: Record<InspectionServiceType, string> = {
  FIRE_EXTINGUISHER: "Fire Extinguishers",
  KITCHEN_SUPPRESSION: "Kitchen Suppression",
  FIRE_ALARM: "Fire Alarm",
  EMERGENCY_EXIT_LIGHTING: "Emergency / Exit Lighting",
  FIRE_SPRINKLER: "Fire Sprinkler",
  BACKFLOW: "Backflow",
  OTHER: "Other",
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  INVOICED: "Invoiced",
  ARCHIVED: "Archived",
};

export const outcomeLabels: Record<InspectionOutcome, string> = {
  PASS: "Pass",
  ATTENTION: "Attention needed",
  FAIL: "Fail",
  NOT_APPLICABLE: "N/A",
};

export const outcomeTone: Record<InspectionOutcome, string> = {
  PASS: "emerald",
  ATTENTION: "amber",
  FAIL: "rose",
  NOT_APPLICABLE: "slate",
};

export const recentInspectionYears = Array.from({ length: 25 }, (_, index) => String(currentYear - index));
export const upcomingInspectionYears = Array.from({ length: 20 }, (_, index) => String(currentYear + index));

export const extinguisherManufacturerOptions = [
  "Amerex",
  "Ansul",
  "Badger",
  "Buckeye",
  "First Alert",
  "Flag Fire",
  "Globe",
  "JL Industries",
  "Kidde",
  "Larsen's",
  "Pye-Barker",
  "Pyro-Chem",
  "Strike First",
];

export const extinguisherTypeOptions = ["ABC", "BC", "CO2", "Class K", "Water", "Water Mist"] as const;
export const extinguisherSizeOptions = ["2.5 lb", "5 lb", "10 lb", "15 lb", "20 lb", "2.5 gal", "6 L"] as const;

const extinguisherUlLookup: Record<string, Record<string, string>> = {
  ABC: {
    "2.5 LB": "UL 299 / UL 711 1-A:10-B:C",
    "5 LB": "UL 299 / UL 711 3-A:40-B:C",
    "10 LB": "UL 299 / UL 711 4-A:80-B:C",
    "15 LB": "UL 299 / UL 711 6-A:120-B:C",
    "20 LB": "UL 299 / UL 711 10-A:120-B:C",
  },
  BC: {
    "5 LB": "UL 299 / UL 711 10-B:C",
    "10 LB": "UL 299 / UL 711 20-B:C",
    "20 LB": "UL 299 / UL 711 40-B:C",
  },
  CO2: {
    "5 LB": "UL 154 / UL 711 5-B:C",
    "10 LB": "UL 154 / UL 711 10-B:C",
    "15 LB": "UL 154 / UL 711 10-B:C",
    "20 LB": "UL 154 / UL 711 20-B:C",
  },
  "CLASS K": {
    "6 L": "UL 8 / UL 711A Class K",
    "2.5 GAL": "UL 8 / UL 711A Class K",
  },
  WATER: {
    "2.5 GAL": "UL 626 / UL 711 2-A",
  },
  "WATER MIST": {
    "2.5 GAL": "UL 2129 / UL 711 2-A:C",
  },
};

const extinguisherHydroIntervals: Record<string, ExtinguisherHydroRule> = {
  ABC: { intervalYears: 12, label: "Stored-pressure dry chemical hydro interval" },
  BC: { intervalYears: 12, label: "Stored-pressure dry chemical hydro interval" },
  CO2: { intervalYears: 5, label: "CO2 hydro interval" },
  "CLASS K": { intervalYears: 5, label: "Wet chemical hydro interval" },
  WATER: { intervalYears: 5, label: "Water extinguisher hydro interval" },
  "WATER MIST": { intervalYears: 5, label: "Water mist hydro interval" },
};

const extinguisherSixYearIntervals: Record<string, ExtinguisherSixYearRule> = {
  ABC: { applicable: true, intervalYears: 6, label: "Stored-pressure dry chemical teardown interval" },
  BC: { applicable: true, intervalYears: 6, label: "Stored-pressure dry chemical teardown interval" },
  CO2: { applicable: false, label: "Six-year maintenance is not typically required for CO2 units" },
  "CLASS K": { applicable: false, label: "Six-year maintenance is not typically required for wet chemical units" },
  WATER: { applicable: false, label: "Six-year maintenance is not typically required for water units" },
  "WATER MIST": { applicable: false, label: "Six-year maintenance is not typically required for water mist units" },
};

export function normalizeExtinguisherValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function addYearsToYearString(year: string, intervalYears: number) {
  if (!/^\d{4}$/.test(year)) return "";
  return String(Number(year) + intervalYears);
}

export function buildExtinguisherAssetName(extinguisherType: string, size: string) {
  const pieces = [size.trim(), extinguisherType.trim()].filter(Boolean);
  return pieces.length ? `${pieces.join(" ")} Extinguisher` : "Untitled Extinguisher";
}

export function getSuggestedExtinguisherUlRating(extinguisherType: string, size: string): ExtinguisherRuleMatch | null {
  const typeKey = normalizeExtinguisherValue(extinguisherType);
  const sizeKey = normalizeExtinguisherValue(size);
  const value = extinguisherUlLookup[typeKey]?.[sizeKey];
  if (!value) return null;

  return {
    value,
    sourceLabel: `${extinguisherType || "Type"} / ${size || "Size"} UL lookup`,
  };
}

export function getExtinguisherHydroRule(extinguisherType: string) {
  return extinguisherHydroIntervals[normalizeExtinguisherValue(extinguisherType)] ?? null;
}

export function getExtinguisherSixYearRule(extinguisherType: string) {
  return extinguisherSixYearIntervals[normalizeExtinguisherValue(extinguisherType)] ?? null;
}

export function getSuggestedExtinguisherNextHydroTest(extinguisherType: string, lastHydroTest: string): ExtinguisherRuleMatch | null {
  const rule = getExtinguisherHydroRule(extinguisherType);
  if (!rule) return null;

  const value = addYearsToYearString(lastHydroTest, rule.intervalYears);
  if (!value) return null;

  return {
    value,
    sourceLabel: `${rule.label} from ${lastHydroTest}`,
  };
}

export function getSuggestedExtinguisherNextSixYearService(extinguisherType: string, lastSixYearService: string): ExtinguisherRuleMatch | null {
  const rule = getExtinguisherSixYearRule(extinguisherType);
  if (!rule?.applicable || !rule.intervalYears) return null;

  const value = addYearsToYearString(lastSixYearService, rule.intervalYears);
  if (!value) return null;

  return {
    value,
    sourceLabel: `${rule.label} from ${lastSixYearService}`,
  };
}

export const serviceWorkflows: Record<InspectionServiceType, ServiceWorkflowConfig> = {
  FIRE_EXTINGUISHER: {
    title: "Portable extinguisher inspection",
    shortLabel: "Extinguishers",
    defaultFrequency: "Annual",
    defaultNextIntervalMonths: 12,
    codeReferences: ["NFPA 10"],
    assetLabel: "Extinguisher",
    summaryHint: "Capture extinguisher readiness, due-year milestones, and replacement recommendations with reusable site equipment history.",
    baseFields: ["location", "manufacturer", "ulListing"],
    attributeFields: [
      { key: "extinguisherType", label: "Extinguisher type", type: "select", options: [...extinguisherTypeOptions] },
      { key: "size", label: "Size", type: "select", options: [...extinguisherSizeOptions] },
      { key: "lastSixYearService", label: "Last 6-year service", type: "select", options: recentInspectionYears },
      { key: "nextSixYearService", label: "Next 6-year service", type: "select", options: upcomingInspectionYears },
      { key: "lastHydroTest", label: "Last hydro test", type: "select", options: recentInspectionYears },
      { key: "nextHydroTest", label: "Next hydro test", type: "select", options: upcomingInspectionYears },
    ],
    checkFields: [
      { key: "sealPin", label: "Seal and pin intact" },
      { key: "hoseCondition", label: "Hose / nozzle condition" },
      { key: "labelCondition", label: "Label legible" },
      { key: "mounting", label: "Mounting and signage" },
      { key: "accessibility", label: "Accessible and unobstructed" },
      { key: "physicalDamage", label: "No physical damage or corrosion" },
    ],
    deficiencyTemplates: [
      { key: "low-pressure", title: "Low pressure reading", severity: "ATTENTION", description: "Pressure gauge is below the operable range.", recommendation: "Recharge or replace the extinguisher and retag after service.", codeReferences: ["NFPA 10"] },
      { key: "missing-seal", title: "Missing seal / pin", severity: "ATTENTION", description: "Tamper seal or pull pin was not present at time of inspection.", recommendation: "Install a new tamper seal after confirming the unit remains serviceable.", codeReferences: ["NFPA 10"] },
      { key: "failed-hydro", title: "Hydro test overdue", severity: "FAIL", description: "Hydrostatic test interval has expired for this extinguisher.", recommendation: "Remove from service and complete hydrostatic testing before returning to service.", codeReferences: ["NFPA 10"] },
    ],
  },
  FIRE_ALARM: {
    title: "Fire alarm inspection and testing",
    shortLabel: "Fire Alarm",
    defaultFrequency: "Quarterly",
    defaultNextIntervalMonths: 3,
    codeReferences: ["NFPA 72", "UL 864"],
    assetLabel: "Panel / device",
    summaryHint: "Track panel condition, device functionality, batteries, communications, and code-based deficiencies.",
    attributeFields: [
      { key: "panelName", label: "Panel name", type: "text" },
      { key: "panelLocation", label: "Panel location", type: "text" },
      { key: "deviceAddress", label: "Device address / ID", type: "text" },
      { key: "batteryInfo", label: "Battery / power supply info", type: "text" },
      { key: "communicationPath", label: "Communication path", type: "text" },
      { key: "sensitivityResult", label: "Sensitivity / functional test", type: "text" },
    ],
    checkFields: [
      { key: "panelNormal", label: "Panel normal condition" },
      { key: "initiatingDevices", label: "Initiating devices tested" },
      { key: "notificationDevices", label: "Notification appliances tested" },
      { key: "batteryPower", label: "Battery / power supply verified" },
      { key: "communications", label: "Communication / monitoring verified" },
      { key: "functionalTesting", label: "Functional and sensitivity testing complete" },
    ],
    deficiencyTemplates: [
      { key: "battery-fail", title: "Battery capacity issue", severity: "ATTENTION", description: "Standby batteries did not meet required capacity or age limits.", recommendation: "Replace batteries and retest the standby power system.", codeReferences: ["NFPA 72"] },
      { key: "device-fail", title: "Device failed functional test", severity: "FAIL", description: "An initiating or notification device failed during functional testing.", recommendation: "Repair or replace the affected device and verify operation.", codeReferences: ["NFPA 72"] },
      { key: "comm-fail", title: "Communication path issue", severity: "ATTENTION", description: "Signal transmission or communication path did not verify successfully.", recommendation: "Investigate communicator programming, signal path, or network outage and retest.", codeReferences: ["NFPA 72", "UL 864"] },
    ],
  },
  FIRE_SPRINKLER: {
    title: "Fire sprinkler inspection",
    shortLabel: "Sprinkler",
    defaultFrequency: "Annual",
    defaultNextIntervalMonths: 12,
    codeReferences: ["NFPA 25"],
    assetLabel: "Riser / valve point",
    summaryHint: "Document risers, valves, gauges, waterflow tests, tamper results, and obstruction concerns.",
    attributeFields: [
      { key: "systemType", label: "System type", type: "select", options: ["Wet", "Dry", "Pre-action", "Deluge"] },
      { key: "riserId", label: "Riser", type: "text" },
      { key: "valveId", label: "Valve / control point", type: "text" },
      { key: "gaugeStatic", label: "Static pressure", type: "text" },
      { key: "gaugeResidual", label: "Residual pressure", type: "text" },
      { key: "inspectionFrequency", label: "Inspection / test frequency", type: "text" },
    ],
    checkFields: [
      { key: "waterflowTest", label: "Waterflow test" },
      { key: "tamperTest", label: "Tamper / supervisory test" },
      { key: "gauges", label: "Gauges in acceptable condition" },
      { key: "headsAndPiping", label: "Pipe, fittings, and heads inspected" },
      { key: "obstructions", label: "No storage or coverage obstructions" },
      { key: "valvesSecured", label: "Valves supervised / secured" },
    ],
    deficiencyTemplates: [
      { key: "valve-unsecured", title: "Valve unsecured", severity: "ATTENTION", description: "A control valve was not properly supervised, locked, or sealed.", recommendation: "Restore proper valve supervision and document the corrective action.", codeReferences: ["NFPA 25"] },
      { key: "obstruction", title: "Sprinkler obstruction", severity: "ATTENTION", description: "Storage or building conditions may interfere with sprinkler discharge pattern.", recommendation: "Remove the obstruction and maintain required clearance below heads.", codeReferences: ["NFPA 25"] },
      { key: "corrosion", title: "Corrosion or leakage", severity: "FAIL", description: "Visible corrosion, leakage, or damage was observed in the sprinkler system trim or piping.", recommendation: "Repair the affected components and complete follow-up inspection/testing.", codeReferences: ["NFPA 25"] },
    ],
  },
  KITCHEN_SUPPRESSION: {
    title: "Kitchen suppression inspection",
    shortLabel: "Kitchen Suppression",
    defaultFrequency: "Semi-annual",
    defaultNextIntervalMonths: 6,
    codeReferences: ["NFPA 17A", "NFPA 96"],
    assetLabel: "Protected appliance / system",
    summaryHint: "Capture cylinder details, nozzle coverage, detection line, pull station, and utility shutoff verification.",
    attributeFields: [
      { key: "systemManufacturer", label: "System manufacturer", type: "text" },
      { key: "systemModel", label: "System model", type: "text" },
      { key: "applianceCoverage", label: "Appliance coverage", type: "text" },
      { key: "fusibleLinksDate", label: "Fusible links / detection service date", type: "date" },
      { key: "pullStationLocation", label: "Manual pull station", type: "text" },
      { key: "cylinderDetails", label: "Cylinder / tank details", type: "text" },
    ],
    checkFields: [
      { key: "fusibleLinks", label: "Fusible links / detection verified" },
      { key: "manualPullStation", label: "Manual pull station accessible" },
      { key: "gasElectricShutoff", label: "Gas / electric shutoff verified" },
      { key: "nozzleCaps", label: "Nozzle caps / placement / condition" },
      { key: "cylinderCondition", label: "Cylinder / tank condition" },
      { key: "applianceCoverageVerified", label: "Appliance coverage verified" },
    ],
    deficiencyTemplates: [
      { key: "links-expired", title: "Detection links due", severity: "ATTENTION", description: "Fusible links or detection components are at or beyond replacement interval.", recommendation: "Replace detection links and retag the system.", codeReferences: ["NFPA 17A"] },
      { key: "shutoff-fail", title: "Utility shutoff failed", severity: "FAIL", description: "Gas and/or electric shutoff did not verify during functional testing.", recommendation: "Repair the interlock and perform a witnessed retest.", codeReferences: ["NFPA 17A", "NFPA 96"] },
      { key: "nozzle-missing-cap", title: "Nozzle cap missing", severity: "ATTENTION", description: "One or more discharge nozzles were missing caps or found contaminated.", recommendation: "Install new caps and clean / verify nozzle orientation.", codeReferences: ["NFPA 17A"] },
    ],
  },
  EMERGENCY_EXIT_LIGHTING: {
    title: "Emergency and exit lighting inspection",
    shortLabel: "Emergency Lighting",
    defaultFrequency: "Monthly",
    defaultNextIntervalMonths: 1,
    codeReferences: ["NFPA 101", "NFPA 70"],
    assetLabel: "Fixture / sign",
    summaryHint: "Track fixture inventory, illumination, charging indicators, and battery duration testing across the site.",
    attributeFields: [
      { key: "fixtureType", label: "Fixture / sign type", type: "select", options: ["Exit sign", "Emergency head", "Combo unit", "Remote head"] },
      { key: "batteryType", label: "Battery type", type: "text" },
      { key: "batteryDuration", label: "Battery duration result", type: "text" },
      { key: "circuitInfo", label: "Circuit / branch info", type: "text" },
      { key: "illuminationArea", label: "Coverage area", type: "text" },
      { key: "fixtureCount", label: "Fixture quantity", type: "number" },
    ],
    checkFields: [
      { key: "functionalTest", label: "Functional test completed" },
      { key: "batteryDurationTest", label: "Battery duration test" },
      { key: "chargingIndicator", label: "Charging indicator normal" },
      { key: "lampHeads", label: "Lamp / head condition" },
      { key: "illuminationVisibility", label: "Sign illumination / visibility" },
      { key: "mountingCondition", label: "Mounting / housing condition" },
    ],
    deficiencyTemplates: [
      { key: "battery-short", title: "Battery duration short", severity: "ATTENTION", description: "Emergency unit did not maintain required illumination duration during test.", recommendation: "Replace the battery pack or fixture and repeat duration test.", codeReferences: ["NFPA 101"] },
      { key: "lamp-out", title: "Lamp / head out", severity: "ATTENTION", description: "One or more lamp heads or sign faces were not illuminated.", recommendation: "Repair or replace failed lamps / heads and verify illumination.", codeReferences: ["NFPA 101"] },
      { key: "visibility-obstructed", title: "Exit visibility obstructed", severity: "FAIL", description: "Exit sign visibility or egress path illumination was obstructed or insufficient.", recommendation: "Restore visibility and correct the obstruction or fixture placement.", codeReferences: ["NFPA 101", "NFPA 70"] },
    ],
  },
  BACKFLOW: {
    title: "Backflow inspection",
    shortLabel: "Backflow",
    defaultFrequency: "Annual",
    defaultNextIntervalMonths: 12,
    codeReferences: ["ASSE", "AWWA"],
    assetLabel: "Backflow assembly",
    summaryHint: "Capture assembly readings, check valves, and relief valve operation.",
    attributeFields: [
      { key: "assemblyType", label: "Assembly type", type: "text" },
      { key: "assemblySize", label: "Assembly size", type: "text" },
      { key: "serialTag", label: "Serial / tag", type: "text" },
    ],
    checkFields: [
      { key: "reliefValve", label: "Relief valve operation" },
      { key: "checkValveOne", label: "Check valve 1" },
      { key: "checkValveTwo", label: "Check valve 2" },
    ],
    deficiencyTemplates: [],
  },
  OTHER: {
    title: "Custom inspection",
    shortLabel: "Custom",
    defaultFrequency: "Custom",
    defaultNextIntervalMonths: 12,
    codeReferences: [],
    assetLabel: "Asset",
    summaryHint: "Use custom fields to document inspection scope and findings.",
    attributeFields: [{ key: "scope", label: "Scope", type: "textarea" }],
    checkFields: [{ key: "generalInspection", label: "General inspection complete" }],
    deficiencyTemplates: [],
  },
};

export function getServiceConfig(serviceType: InspectionServiceType) {
  return serviceWorkflows[serviceType];
}

export function getInspectionTemplate(serviceType: InspectionServiceType) {
  const config = getServiceConfig(serviceType);
  return {
    frequencyLabel: config.defaultFrequency,
    checklistItems: config.checkFields.map((check) => ({
      item: check.label,
      status: "PASS",
      notes: check.helper ?? "",
    })),
    equipmentSummary: [{ category: config.assetLabel, quantity: "", notes: config.summaryHint }],
  };
}

export function toPrettyInspectionType(serviceType: InspectionServiceType | string) {
  return inspectionServiceLabels[serviceType as InspectionServiceType] ?? String(serviceType).replaceAll("_", " ").toLowerCase();
}

export function toLegacyInspectionType(serviceType: InspectionServiceType) {
  switch (serviceType) {
    case "FIRE_EXTINGUISHER":
      return "fire_extinguisher";
    case "KITCHEN_SUPPRESSION":
      return "kitchen_suppression";
    case "FIRE_ALARM":
      return "fire_alarm";
    case "EMERGENCY_EXIT_LIGHTING":
      return "emergency_exit_lighting";
    case "FIRE_SPRINKLER":
      return "wet_sprinkler";
    case "BACKFLOW":
      return "backflow";
    default:
      return "other";
  }
}

