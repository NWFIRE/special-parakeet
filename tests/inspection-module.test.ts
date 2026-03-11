import { describe, expect, it } from "vitest";
import { getInspectionTemplate, inspectionServiceLabels } from "@/lib/inspection-templates";
import { inspectionReportSchema, parseChecklistItems } from "@/lib/validations/inspections";

describe("inspection templates", () => {
  it("provides a default template for fire alarm inspections", () => {
    const template = getInspectionTemplate("FIRE_ALARM");

    expect(template.frequencyLabel).toBe("Quarterly");
    expect(template.checklistItems.length).toBeGreaterThan(0);
    expect(inspectionServiceLabels.FIRE_ALARM).toBe("Fire Alarm");
  });

  it("validates workflow payloads with structured asset data", () => {
    const payload = inspectionReportSchema.safeParse({
      teamId: "team_1",
      clientId: "client_1",
      siteId: "site_1",
      title: "Annual extinguisher inspection",
      reportNumber: "FE-1001",
      serviceType: "FIRE_EXTINGUISHER",
      status: "ISSUED",
      overallStatus: "ATTENTION",
      propertyName: "North Ridge Tower",
      propertyAddress: "123 Main St",
      serviceDate: "2026-03-11",
      completedAt: "2026-03-11",
      nextInspectionDate: "2027-03-11",
      inspectorName: "Jordan Rivera",
      pointOfContact: "Avery Collins",
      frequencyLabel: "Annual",
      technicianLicense: "LIC-1234",
      technicianCertification: "NICET II",
      summary: "One extinguisher requires replacement.",
      recommendations: "Replace the low-pressure unit and reinspect.",
      notes: "All but one unit passed inspection.",
      codeReferences: ["NFPA 10"],
      photoUrls: [],
      customerSignatureName: "Avery Collins",
      technicianSignatureName: "Jordan Rivera",
      autoFillSummary: "2 asset fields reused from previous annual service.",
      assets: [
        {
          assetName: "Lobby extinguisher",
          location: "Lobby",
          assetTag: "FE-001",
          deviceType: "ABC extinguisher",
          manufacturer: "Badger",
          model: "B250",
          serialNumber: "SN-1001",
          ulListing: "UL 299",
          complianceFrequency: "Annual",
          lastServiceDate: "2025-03-11",
          nextServiceDate: "2027-03-11",
          status: "ATTENTION",
          deficiencySummary: "Pressure gauge below operable range.",
          recommendationText: "Replace or recharge extinguisher.",
          followUpRequired: true,
          deficiencyTemplateKey: "extinguisher-low-pressure",
          attributes: {
            size: "10 lb",
            pressureStatus: "Low",
          },
          checks: [
            { key: "gauge", label: "Gauge in range", status: "FAIL", note: "Gauge reads low." },
          ],
          autofillMeta: {
            manufacturer: {
              sourceType: "PREVIOUS_REPORT",
              sourceLabel: "Previous annual inspection",
              sourceValue: "Badger",
            },
          },
        },
      ],
    });

    expect(payload.success).toBe(true);
    expect(parseChecklistItems(JSON.stringify([{ item: "Gauge in range", status: "PASS", notes: "ok" }]))).toHaveLength(1);
  });
});
