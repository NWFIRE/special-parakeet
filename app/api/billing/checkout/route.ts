import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/billing";
import { db } from "@/lib/db";
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
  const customer = customerId
    ? customerId
    : (
        await stripe.customers.create({
          email: user.email ?? undefined,
          name: membership.team.name,
          metadata: { teamId: membership.teamId, workspaceName: membership.team.name }
        })
      ).id;

  await db.subscription.upsert({
    where: { teamId: membership.teamId },
    create: {
      teamId: membership.teamId,
      stripeCustomerId: customer,
      stripePriceId: process.env.STRIPE_PRICE_ID,
      status: "TRIALING"
    },
    update: {
      stripeCustomerId: customer,
      stripePriceId: process.env.STRIPE_PRICE_ID
    }
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: `${getBaseUrl()}/billing?success=1`,
    cancel_url: `${getBaseUrl()}/billing?canceled=1`,
    metadata: { teamId: membership.teamId, initiatedByUserId: user.id }
  });

  if (!session.url) {
    return NextResponse.json({ error: "Unable to create Stripe checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
