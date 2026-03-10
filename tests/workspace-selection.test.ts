import { describe, expect, it } from "vitest";
import { resolveActiveMembership } from "@/lib/workspace";

describe("workspace selection", () => {
  const memberships = [
    { teamId: "team_a", role: "OWNER" },
    { teamId: "team_b", role: "ADMIN" }
  ];

  it("uses the requested active workspace when it exists", () => {
    expect(resolveActiveMembership(memberships, "team_b")?.teamId).toBe("team_b");
  });

  it("falls back to the first membership when the cookie is invalid", () => {
    expect(resolveActiveMembership(memberships, "missing")?.teamId).toBe("team_a");
  });

  it("returns null when no memberships exist", () => {
    expect(resolveActiveMembership([], "team_a")).toBeNull();
  });
});
