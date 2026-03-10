import { describe, expect, it } from "vitest";
import { canViewInspectionReport } from "@/lib/portal";

describe("customer portal access", () => {
  it("allows customers to view reports for their own client", () => {
    expect(canViewInspectionReport("CUSTOMER", "client_1", "client_1")).toBe(true);
  });

  it("rejects customers viewing another client's report", () => {
    expect(canViewInspectionReport("CUSTOMER", "client_1", "client_2")).toBe(false);
  });

  it("rejects internal users from customer report views", () => {
    expect(canViewInspectionReport("INTERNAL", "client_1", "client_1")).toBe(false);
  });
});
