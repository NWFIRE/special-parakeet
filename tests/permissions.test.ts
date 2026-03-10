import { describe, expect, it } from "vitest";
import { canEditProjects, canManageBilling, canManageMembers, hasRequiredRole } from "@/lib/permissions";

describe("permissions", () => {
  it("allows owners and admins to manage members", () => {
    expect(canManageMembers("OWNER")).toBe(true);
    expect(canManageMembers("ADMIN")).toBe(true);
    expect(canManageMembers("MEMBER")).toBe(false);
  });

  it("allows only owners to manage billing", () => {
    expect(canManageBilling("OWNER")).toBe(true);
    expect(canManageBilling("ADMIN")).toBe(false);
  });

  it("allows admins to edit projects", () => {
    expect(canEditProjects("ADMIN")).toBe(true);
    expect(canEditProjects("MEMBER")).toBe(false);
  });

  it("enforces role hierarchy consistently", () => {
    expect(hasRequiredRole("OWNER", "MEMBER")).toBe(true);
    expect(hasRequiredRole("ADMIN", "OWNER")).toBe(false);
    expect(hasRequiredRole("MEMBER", "MEMBER")).toBe(true);
  });
});
