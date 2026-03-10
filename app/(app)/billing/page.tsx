import { BillingActions } from "@/components/billing-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canManageBilling } from "@/lib/permissions";
import { requireWorkspaceMembership } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const { membership } = await requireWorkspaceMembership();
  const subscription = membership.team.subscription;
  const isOwner = canManageBilling(membership.role);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-dark">Billing</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">Manage subscription access for your workspace.</h1>
      </div>
      <Card className="bg-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Current plan status</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge value={subscription?.status ?? "TRIALING"} />
              <span className="text-sm text-slate-500">Renews or ends {formatDate(subscription?.currentPeriodEnd ?? null)}</span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Only workspace owners can start checkout or open the Stripe billing portal.</p>
          </div>
          {isOwner ? <BillingActions /> : <p className="text-sm text-slate-500">Owner access required for billing changes.</p>}
        </div>
      </Card>
    </div>
  );
}
