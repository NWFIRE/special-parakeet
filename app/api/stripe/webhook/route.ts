import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
      return "PAST_DUE" as const;
    case "canceled":
      return "CANCELED" as const;
    default:
      return "INCOMPLETE" as const;
  }
}

async function syncSubscriptionFromStripe(stripeSubscriptionId: string, stripeCustomerId?: string | null) {
  if (!stripe) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const stripePriceId = subscription.items.data[0]?.price?.id ?? null;

  await db.subscription.updateMany({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        ...(stripeCustomerId ? [{ stripeCustomerId }] : [])
      ]
    },
    data: {
      stripeCustomerId: stripeCustomerId ?? undefined,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      status: mapStripeStatus(subscription.status)
    }
  });
}

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const teamId = session.metadata?.teamId;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
    const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;

    if (teamId && stripeCustomerId) {
      await db.subscription.upsert({
        where: { teamId },
        create: {
          teamId,
          stripeCustomerId,
          stripeSubscriptionId,
          stripePriceId: process.env.STRIPE_PRICE_ID,
          status: "ACTIVE"
        },
        update: {
          stripeCustomerId,
          stripeSubscriptionId,
          stripePriceId: process.env.STRIPE_PRICE_ID,
          status: "ACTIVE"
        }
      });
    }

    if (stripeSubscriptionId) {
      await syncSubscriptionFromStripe(stripeSubscriptionId, stripeCustomerId);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
    await syncSubscriptionFromStripe(subscription.id, customerId);
  }

  return NextResponse.json({ received: true });
}
