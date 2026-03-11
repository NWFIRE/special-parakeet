"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type BillingActionsProps = {
  stripeConfigured: boolean;
};

export function BillingActions({ stripeConfigured }: BillingActionsProps) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState("");

  async function launch(endpoint: "/api/billing/checkout" | "/api/billing/portal", mode: "checkout" | "portal") {
    try {
      setError("");
      setLoading(mode);
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
      }

      window.location.href = payload.url;
    } catch (message) {
      setError(message instanceof Error ? message.message : "Unable to start billing flow.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => launch("/api/billing/checkout", "checkout")} disabled={loading !== null || !stripeConfigured}>
        {loading === "checkout" ? "Opening checkout..." : "Start subscription"}
      </Button>
      <Button variant="secondary" onClick={() => launch("/api/billing/portal", "portal")} disabled={loading !== null || !stripeConfigured}>
        {loading === "portal" ? "Opening portal..." : "Open billing portal"}
      </Button>
      {!stripeConfigured ? <p className="basis-full text-sm text-slate-500">Add Stripe configuration in Vercel to enable billing actions.</p> : null}
      {error ? <p className="basis-full text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
