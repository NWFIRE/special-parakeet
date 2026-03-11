import { InspectionServiceType, ReportStatus } from "@prisma/client";

export const inspectionServiceLabels: Record<InspectionServiceType, string> = {
  FIRE_EXTINGUISHER: "Fire extinguisher",
  KITCHEN_SUPPRESSION: "Kitchen suppression",
  FIRE_ALARM: "Fire alarm",
  EMERGENCY_EXIT_LIGHTING: "Emergency / exit lighting",
  FIRE_SPRINKLER: "Fire sprinkler",
  BACKFLOW: "Backflow",
  OTHER: "Other"
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  INVOICED: "Invoiced",
  ARCHIVED: "Archived"
};

type TemplateSection = {
  item: string;
  status: "PASS" | "FAIL" | "REPAIR_REQUIRED" | "NOT_APPLICABLE";
  notes: string;
};

type EquipmentRow = {
  category: string;
  quantity: string;
  notes: string;
};

export const inspectionTemplates: Record<InspectionServiceType, { frequencyLabel: string; checklistItems: TemplateSection[]; equipmentSummary: EquipmentRow[] }> = {
  FIRE_EXTINGUISHER: {
    frequencyLabel: "Annual",
    checklistItems: [
      { item: "Pressure gauge in operable range", status: "PASS", notes: "Record any units requiring recharge or replacement." },
      { item: "Tamper seals and pins intact", status: "PASS", notes: "Replace missing seals during service." },
      { item: "Hose, nozzle, and body condition", status: "PASS", notes: "Check for corrosion, dents, and obstruction." },
      { item: "Mounting and signage visible", status: "PASS", notes: "Confirm proper height and clear access." }
    ],
    equipmentSummary: [
      { category: "ABC extinguishers", quantity: "", notes: "" },
      { category: "CO2 extinguishers", quantity: "", notes: "" }
    ]
  },
  KITCHEN_SUPPRESSION: {
    frequencyLabel: "Semi-annual",
    checklistItems: [
      { item: "Agent cylinders and gauges", status: "PASS", notes: "Verify cylinders are charged and secure." },
      { item: "Fusible links and detection line", status: "PASS", notes: "Replace links when required by service interval." },
      { item: "Manual pull station and signage", status: "PASS", notes: "Ensure pull station remains accessible." },
      { item: "Gas/electric shutdown interlocks", status: "PASS", notes: "Document shutdown test results." }
    ],
    equipmentSummary: [
      { category: "Protected appliances", quantity: "", notes: "" },
      { category: "Nozzles serviced", quantity: "", notes: "" }
    ]
  },
  FIRE_ALARM: {
    frequencyLabel: "Quarterly",
    checklistItems: [
      { item: "Control panel normal condition", status: "PASS", notes: "Note any trouble, alarm, or supervisory conditions." },
      { item: "Battery and power supply test", status: "PASS", notes: "Record voltage and charger health." },
      { item: "Initiating devices sampled", status: "PASS", notes: "List device count or sample percentage." },
      { item: "Notification appliances tested", status: "PASS", notes: "Confirm horn, strobe, and speaker operation." }
    ],
    equipmentSummary: [
      { category: "Panels", quantity: "", notes: "" },
      { category: "Devices tested", quantity: "", notes: "" }
    ]
  },
  EMERGENCY_EXIT_LIGHTING: {
    frequencyLabel: "Monthly",
    checklistItems: [
      { item: "Exit signage illuminated", status: "PASS", notes: "Check each sign face and directional indicator." },
      { item: "Emergency heads operational", status: "PASS", notes: "Verify full illumination on battery mode." },
      { item: "Battery backup test performed", status: "PASS", notes: "Document duration and any failed units." },
      { item: "Lenses and housings intact", status: "PASS", notes: "Replace broken lenses or covers." }
    ],
    equipmentSummary: [
      { category: "Exit signs", quantity: "", notes: "" },
      { category: "Emergency lights", quantity: "", notes: "" }
    ]
  },
  FIRE_SPRINKLER: {
    frequencyLabel: "Annual",
    checklistItems: [
      { item: "Control valves supervised and sealed", status: "PASS", notes: "Document any missing locks or tamper issues." },
      { item: "Main drain and pressure readings", status: "PASS", notes: "Capture static and residual pressures." },
      { item: "Alarm devices and waterflow", status: "PASS", notes: "Confirm proper signaling to panel/monitoring." },
      { item: "Riser and trim condition", status: "PASS", notes: "Check for corrosion, leaks, and damage." }
    ],
    equipmentSummary: [
      { category: "Risers", quantity: "", notes: "" },
      { category: "Control valves", quantity: "", notes: "" }
    ]
  },
  BACKFLOW: {
    frequencyLabel: "Annual",
    checklistItems: [
      { item: "Relief valve operation", status: "PASS", notes: "Document test kit readings." },
      { item: "Check valve #1 differential", status: "PASS", notes: "Record pressure differential." },
      { item: "Check valve #2 differential", status: "PASS", notes: "Record pressure differential." },
      { item: "Assembly and shutoff valves condition", status: "PASS", notes: "Inspect for leaks and proper tagging." }
    ],
    equipmentSummary: [
      { category: "Backflow assemblies", quantity: "", notes: "" }
    ]
  },
  OTHER: {
    frequencyLabel: "Custom",
    checklistItems: [
      { item: "General inspection complete", status: "PASS", notes: "Document the custom service scope performed." }
    ],
    equipmentSummary: [
      { category: "Equipment serviced", quantity: "", notes: "" }
    ]
  }
};

export function getInspectionTemplate(serviceType: InspectionServiceType) {
  return inspectionTemplates[serviceType];
}

export function toPrettyInspectionType(serviceType: InspectionServiceType | string) {
  return inspectionServiceLabels[serviceType as InspectionServiceType] ?? String(serviceType).replaceAll("_", " ").toLowerCase();
}

