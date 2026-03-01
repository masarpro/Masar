import { db } from "@repo/database";
import type { OrgStatus, SubscriptionStatus } from "@repo/database";
import { logger } from "@repo/logs";
import type Stripe from "stripe";
import { getPlanFromPriceId, getPlanLimits } from "./stripe-products";

export function mapStripeStatusToOrgStatus(
	status: Stripe.Subscription.Status,
): OrgStatus {
	switch (status) {
		case "active":
			return "ACTIVE";
		case "trialing":
			return "TRIALING";
		case "past_due":
			return "PAST_DUE";
		case "canceled":
			return "CANCELLED";
		case "unpaid":
			return "SUSPENDED";
		case "incomplete":
		case "incomplete_expired":
			return "SUSPENDED";
		case "paused":
			return "SUSPENDED";
		default:
			return "ACTIVE";
	}
}

export function mapStripeStatusToSubscriptionStatus(
	status: Stripe.Subscription.Status,
): SubscriptionStatus {
	switch (status) {
		case "active":
			return "ACTIVE";
		case "trialing":
			return "TRIALING";
		case "past_due":
			return "PAST_DUE";
		case "canceled":
			return "CANCELED";
		case "unpaid":
			return "UNPAID";
		case "incomplete":
		case "incomplete_expired":
			return "INCOMPLETE";
		case "paused":
			return "PAUSED";
		default:
			return "ACTIVE";
	}
}

export async function syncOrganizationFromSubscription(
	orgId: string,
	subscription: Stripe.Subscription,
	stripeEventId: string,
	eventType: string,
) {
	const priceId = subscription.items.data[0]?.price?.id;
	const productId = subscription.items.data[0]?.price?.product as string;
	const plan = priceId ? getPlanFromPriceId(priceId) : "FREE";
	const limits = getPlanLimits(plan);

	// Stripe v19: current_period_start/end removed. Use billing_cycle_anchor for start.
	const periodStart = subscription.billing_cycle_anchor
		? new Date(subscription.billing_cycle_anchor * 1000)
		: null;
	const periodEnd = subscription.cancel_at
		? new Date(subscription.cancel_at * 1000)
		: null;

	try {
		await db.$transaction(async (tx) => {
			// Idempotency: create event record (unique stripeEventId will fail if duplicate)
			await tx.subscriptionEvent.create({
				data: {
					organizationId: orgId,
					eventType,
					stripeEventId,
					data: JSON.parse(JSON.stringify(subscription)),
				},
			});

			// Update organization subscription fields
			await tx.organization.update({
				where: { id: orgId },
				data: {
					status: mapStripeStatusToOrgStatus(subscription.status),
					plan,
					planName: plan,
					stripeSubscriptionId: subscription.id,
					stripeProductId: productId,
					stripePriceId: priceId,
					subscriptionStatus: mapStripeStatusToSubscriptionStatus(
						subscription.status,
					),
					maxUsers: limits.maxUsers,
					maxProjects: limits.maxProjects,
					maxStorage: limits.maxStorageGB,
					currentPeriodStart: periodStart,
					currentPeriodEnd: periodEnd,
					trialEndsAt: subscription.trial_end
						? new Date(subscription.trial_end * 1000)
						: null,
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
				},
			});
		});
	} catch (error: unknown) {
		// If it's a unique constraint violation on stripeEventId, it's a duplicate - skip
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			logger.info(`Duplicate event ${stripeEventId}, skipping`);
			return;
		}
		throw error;
	}
}

function getOrgIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
	// Try metadata directly first, then cast to access subscription_details
	const metadata = invoice.metadata;
	if (metadata?.organization_id) return metadata.organization_id;

	// Stripe v19 may not expose subscription_details directly on the type
	const raw = invoice as unknown as Record<string, unknown>;
	const subDetails = raw.subscription_details as
		| { metadata?: Record<string, string> }
		| undefined;
	return subDetails?.metadata?.organization_id;
}

export async function handleInvoicePaid(
	invoice: Stripe.Invoice,
	stripeEventId: string,
) {
	const orgId = getOrgIdFromInvoice(invoice);
	if (!orgId) return;

	try {
		await db.$transaction(async (tx) => {
			await tx.subscriptionEvent.create({
				data: {
					organizationId: orgId,
					eventType: "invoice.paid",
					stripeEventId,
					data: JSON.parse(JSON.stringify(invoice)),
				},
			});

			await tx.organization.update({
				where: { id: orgId },
				data: {
					lastPaymentAt: new Date(),
					lastPaymentAmount: invoice.amount_paid / 100,
				},
			});
		});
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			return; // Duplicate event
		}
		throw error;
	}
}

export async function handlePaymentFailed(
	invoice: Stripe.Invoice,
	stripeEventId: string,
) {
	const orgId = getOrgIdFromInvoice(invoice);
	if (!orgId) return;

	try {
		await db.subscriptionEvent.create({
			data: {
				organizationId: orgId,
				eventType: "invoice.payment_failed",
				stripeEventId,
				data: JSON.parse(JSON.stringify(invoice)),
			},
		});
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "P2002"
		) {
			return;
		}
		throw error;
	}
}

export async function checkEventProcessed(
	stripeEventId: string,
): Promise<boolean> {
	const existing = await db.subscriptionEvent.findUnique({
		where: { stripeEventId },
	});
	return !!existing;
}
