import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

const goodPassword = "Password123!";

describe("auth validation", () => {
  it("accepts valid login payloads", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: goodPassword }).success).toBe(true);
  });

  it("rejects invalid signup payloads", () => {
    const result = signupSchema.safeParse({
      name: "A",
      workspaceName: "",
      email: "wrong",
      password: "123"
    });

    expect(result.success).toBe(false);
  });
});
