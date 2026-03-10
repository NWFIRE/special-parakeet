import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/session";
import { canManageBilling } from "@/lib/permissions";
import { getBaseUrl } from "@/lib/utils";

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await getCurrentUser();

  if (!user || user.userType !== "INTERNAL") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const membership = user.memberships[0];

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
