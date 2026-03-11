import { BillingActions } from "@/components/billing-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isStripeConfigured } from "@/lib/billing";
import { canManageBilling } from "@/lib/permissions";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function BillingPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string; canceled?: string }>;
}) {
  const { membership } = await requireWorkspaceMembership();
  const subscription = membership.team.subscription;
  const isOwner = canManageBilling(membership.role);
  const stripeConfigured = isStripeConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const billingSuccess = resolvedSearchParams?.success === "1";
  const billingCanceled = resolvedSearchParams?.canceled === "1";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Billing</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Manage subscription access for your workspace.</h1>
      </div>

      {billingSuccess ? (
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-card">
          <p className="text-sm font-medium text-emerald-900">Stripe checkout completed successfully. Your subscription status will refresh as soon as the webhook is received.</p>
        </Card>
      ) : null}

      {billingCanceled ? (
        <Card className="border-amber-200 bg-amber-50/80 shadow-card">
          <p className="text-sm font-medium text-amber-900">Checkout was canceled. No billing changes were made.</p>
        </Card>
      ) : null}

      <Card className="bg-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Current plan status</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge value={stripeConfigured ? subscription?.status ?? "TRIALING" : "NOT CONFIGURED"} />
              <span className="text-sm text-slate-500">
                {stripeConfigured
                  ? `Renews or ends ${formatDate(subscription?.currentPeriodEnd ?? null)}`
                  : "Add Stripe keys and a recurring price to enable subscriptions and the billing portal."}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {stripeConfigured
                ? "Only workspace owners can start checkout or open the Stripe billing portal."
                : "Billing is not enabled for this deployment yet."}
            </p>
          </div>
          {isOwner ? <BillingActions stripeConfigured={stripeConfigured} /> : <p className="text-sm text-slate-500">Owner access required for billing changes.</p>}
        </div>
      </Card>
    </div>
  );
}
