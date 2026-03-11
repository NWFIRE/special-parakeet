import { describe, expect, it } from "vitest";
import { getInspectionTemplate, inspectionServiceLabels } from "@/lib/inspection-templates";
import { inspectionReportSchema, parseChecklistItems } from "@/lib/validations/inspections";

describe("inspection templates", () => {
  it("provides a default template for fire alarm inspections", () => {
    const template = getInspectionTemplate("FIRE_ALARM");

    expect(template.frequencyLabel).toBe("Quarterly");
    expect(template.checklistItems.length).toBeGreaterThan(0);
    expect(inspectionServiceLabels.FIRE_ALARM).toBe("Fire alarm");
  });

  it("validates report payloads with structured JSON sections", () => {
    const payload = inspectionReportSchema.safeParse({
      teamId: "team_1",
      clientId: "client_1",
      title: "Annual extinguisher inspection",
      reportNumber: "FE-1001",
      serviceType: "FIRE_EXTINGUISHER",
      status: "ISSUED",
      propertyName: "North Ridge Tower",
      propertyAddress: "123 Main St",
      inspectorName: "Jordan Rivera",
      pointOfContact: "Avery Collins",
      frequencyLabel: "Annual",
      completedAt: "2026-03-11",
      nextInspectionDate: "2027-03-11",
      notes: "All but one unit passed inspection.",
      checklistItems: JSON.stringify([{ item: "Gauge in range", status: "PASS", notes: "11 of 12 passed" }]),
      deficiencies: JSON.stringify([{ description: "Low pressure extinguisher", severity: "HIGH", location: "Rear hall", corrective_action: "Replace unit", due_date: "2026-03-18" }]),
      equipmentSummary: JSON.stringify([{ category: "ABC extinguishers", quantity: "12", notes: "One replaced" }])
    });

    expect(payload.success).toBe(true);
    expect(parseChecklistItems(JSON.stringify([{ item: "Gauge in range", status: "PASS", notes: "ok" }]))).toHaveLength(1);
  });
});
