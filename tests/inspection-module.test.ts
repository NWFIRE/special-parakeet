import { describe, expect, it } from "vitest";
import {
  getInspectionTemplate,
  getSuggestedExtinguisherNextHydroTest,
  getSuggestedExtinguisherNextSixYearService,
  getSuggestedExtinguisherUlRating,
  inspectionServiceLabels,
} from "@/lib/inspection-templates";
import { inspectionReportSchema, parseChecklistItems } from "@/lib/validations/inspections";

describe("inspection templates", () => {
  it("provides a default template for fire alarm inspections", () => {
    const template = getInspectionTemplate("FIRE_ALARM");

    expect(template.frequencyLabel).toBe("Quarterly");
    expect(template.checklistItems.length).toBeGreaterThan(0);
    expect(inspectionServiceLabels.FIRE_ALARM).toBe("Fire Alarm");
  });

  it("applies extinguisher rules for ul listings and future service years", () => {
    expect(getSuggestedExtinguisherUlRating("ABC", "10 lb")?.value).toContain("4-A:80-B:C");
    expect(getSuggestedExtinguisherNextHydroTest("ABC", "2019")?.value).toBe("2031");
    expect(getSuggestedExtinguisherNextSixYearService("ABC", "2022")?.value).toBe("2028");
    expect(getSuggestedExtinguisherNextSixYearService("CO2", "2022")).toBeNull();
  });

  it("validates workflow payloads with structured asset data and printed signatures", () => {
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
      customerPrintedName: "Avery Collins",
      customerSignatureName: "Avery Collins",
      technicianPrintedName: "Jordan Rivera",
      technicianSignatureName: "Jordan Rivera",
      autoFillSummary: "2 asset fields reused from previous annual service.",
      assets: [
        {
          assetName: "10 lb ABC Extinguisher",
          location: "Lobby",
          assetTag: "",
          deviceType: "ABC",
          manufacturer: "Badger",
          model: "",
          serialNumber: "",
          ulListing: "UL 299 / UL 711 4-A:80-B:C",
          complianceFrequency: "Annual",
          lastServiceDate: "",
          nextServiceDate: "2027-03-11",
          status: "ATTENTION",
          deficiencySummary: "Pressure gauge below operable range.",
          recommendationText: "Replace or recharge extinguisher.",
          followUpRequired: true,
          deficiencyTemplateKey: "extinguisher-low-pressure",
          attributes: {
            extinguisherType: "ABC",
            size: "10 lb",
            lastSixYearService: "2022",
            nextSixYearService: "2028",
            lastHydroTest: "2019",
            nextHydroTest: "2031",
          },
          checks: [{ key: "gauge", label: "Gauge in range", status: "FAIL", note: "Gauge reads low." }],
          autofillMeta: {
            ulListing: {
              sourceType: "TEMPLATE",
              sourceLabel: "ABC / 10 lb UL lookup",
              sourceValue: "UL 299 / UL 711 4-A:80-B:C",
            },
          },
        },
      ],
    });

    expect(payload.success).toBe(true);
    expect(parseChecklistItems(JSON.stringify([{ item: "Gauge in range", status: "PASS", notes: "ok" }]))).toHaveLength(1);
  });
});
