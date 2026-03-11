import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/billing";
import { canManageBilling } from "@/lib/permissions";
import { getActiveWorkspaceMembership, getCurrentUser } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";

export async function POST() {
  if (!stripe || !isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe billing is not configured yet." }, { status: 503 });
  }

  const user = await getCurrentUser();

  if (!user || user.userType !== "INTERNAL") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const membership = await getActiveWorkspaceMembership(user);

  if (!membership || !canManageBilling(membership.role)) {
    return NextResponse.json({ error: "Only workspace owners can manage billing." }, { status: 403 });
  }

  const customerId = membership.team.subscription?.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found for this workspace." }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getBaseUrl()}/billing`
  });

  return NextResponse.json({ url: session.url });
}
