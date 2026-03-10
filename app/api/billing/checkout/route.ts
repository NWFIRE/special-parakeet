import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/session";
import { canManageBilling } from "@/lib/permissions";
import { getBaseUrl } from "@/lib/utils";

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  if (!process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe price id is not configured." }, { status: 500 });
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
  const customer = customerId
    ? customerId
    : (
        await stripe.customers.create({
          email: user.email ?? undefined,
          name: membership.team.name,
          metadata: { teamId: membership.teamId }
        })
      ).id;

  await db.subscription.upsert({
    where: { teamId: membership.teamId },
    create: {
      teamId: membership.teamId,
      stripeCustomerId: customer,
      status: "TRIALING"
    },
    update: {
      stripeCustomerId: customer
    }
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${getBaseUrl()}/billing?success=1`,
    cancel_url: `${getBaseUrl()}/billing?canceled=1`,
    metadata: { teamId: membership.teamId, initiatedByUserId: user.id }
  });

  if (!session.url) {
    return NextResponse.json({ error: "Unable to create Stripe checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
