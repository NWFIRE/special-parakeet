import { afterEach, describe, expect, it, vi } from "vitest";
import { isStripeConfigured, isStripeWebhookConfigured } from "@/lib/billing";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("billing configuration", () => {
  it("requires a secret key and price id for checkout", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_PRICE_ID", "");

    expect(isStripeConfigured()).toBe(false);
  });

  it("requires a secret key and webhook secret for webhooks", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");

    expect(isStripeWebhookConfigured()).toBe(true);
  });
});
