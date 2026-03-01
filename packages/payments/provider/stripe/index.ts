import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseBySubscriptionId,
	updatePurchase,
} from "@repo/database";
import { logger } from "@repo/logs";
import Stripe from "stripe";
import { setCustomerIdToEntity } from "../../src/lib/customer";
import type {
	CancelSubscription,
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	SetSubscriptionSeats,
	WebhookHandler,
} from "../../types";
import {
	checkEventProcessed,
	handleInvoicePaid,
	handlePaymentFailed,
	syncOrganizationFromSubscription,
} from "../../webhook-handlers";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
	if (stripeClient) {
		return stripeClient;
	}

	const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

	if (!stripeSecretKey) {
		throw new Error("Missing env variable STRIPE_SECRET_KEY");
	}

	stripeClient = new Stripe(stripeSecretKey);

	return stripeClient;
}

export const createCheckoutLink: CreateCheckoutLink = async (options) => {
	const stripeClient = getStripeClient();
	const {
		type,
		productId,
		redirectUrl,
		customerId,
		organizationId,
		userId,
		trialPeriodDays,
		seats,
		email,
	} = options;

	const metadata = {
		organization_id: organizationId || null,
		user_id: userId || null,
	};

	const response = await stripeClient.checkout.sessions.create({
		mode: type === "subscription" ? "subscription" : "payment",
		success_url: redirectUrl ?? "",
		line_items: [
			{
				quantity: seats ?? 1,
				price: productId,
			},
		],
		...(customerId ? { customer: customerId } : { customer_email: email }),
		...(type === "one-time"
			? {
					payment_intent_data: {
						metadata,
					},
					customer_creation: "always",
				}
			: {
					subscription_data: {
						metadata,
						trial_period_days: trialPeriodDays,
					},
				}),
		allow_promotion_codes: true,
		billing_address_collection: "required",
		metadata,
	});

	return response.url;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async ({
	customerId,
	redirectUrl,
}) => {
	const stripeClient = getStripeClient();

	const response = await stripeClient.billingPortal.sessions.create({
		customer: customerId,
		return_url: redirectUrl ?? "",
	});

	return response.url;
};

export const setSubscriptionSeats: SetSubscriptionSeats = async ({
	id,
	seats,
}) => {
	const stripeClient = getStripeClient();

	const subscription = await stripeClient.subscriptions.retrieve(id);

	if (!subscription) {
		throw new Error("Subscription not found.");
	}

	await stripeClient.subscriptions.update(id, {
		items: [
			{
				id: subscription.items.data[0].id,
				quantity: seats,
			},
		],
	});
};

export const cancelSubscription: CancelSubscription = async (id) => {
	const stripeClient = getStripeClient();

	await stripeClient.subscriptions.cancel(id);
};

export const webhookHandler: WebhookHandler = async (req) => {
	const stripeClient = getStripeClient();

	if (!req.body) {
		return new Response("Invalid request.", {
			status: 400,
		});
	}

	let event: Stripe.Event | undefined;

	try {
		event = await stripeClient.webhooks.constructEventAsync(
			await req.text(),
			req.headers.get("stripe-signature") as string,
			process.env.STRIPE_WEBHOOK_SECRET as string,
		);
	} catch (e) {
		logger.error(e);

		return new Response("Invalid request.", {
			status: 400,
		});
	}

	try {
		// Idempotency check for subscription events
		const isProcessed = await checkEventProcessed(event.id);
		if (isProcessed) {
			return new Response("Event already processed.", { status: 200 });
		}

		switch (event.type) {
			case "checkout.session.completed": {
				const { mode, metadata, customer, id } = event.data.object;

				if (mode === "subscription") {
					// For subscription checkouts, sync org from the subscription
					const subscriptionId = event.data.object.subscription as string;
					if (subscriptionId && metadata?.organization_id) {
						const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
						await syncOrganizationFromSubscription(
							metadata.organization_id,
							subscription,
							event.id,
							event.type,
						);
					}
					break;
				}

				const checkoutSession =
					await stripeClient.checkout.sessions.retrieve(id, {
						expand: ["line_items"],
					});

				const productId = checkoutSession.line_items?.data[0].price?.id;

				if (!productId) {
					return new Response("Missing product ID.", {
						status: 400,
					});
				}

				await createPurchase({
					organizationId: metadata?.organization_id || null,
					userId: metadata?.user_id || null,
					customerId: customer as string,
					type: "ONE_TIME",
					productId,
				});

				await setCustomerIdToEntity(customer as string, {
					organizationId: metadata?.organization_id,
					userId: metadata?.user_id,
				});

				break;
			}
			case "customer.subscription.created": {
				const { metadata, customer, items, id } = event.data.object;

				const productId = items?.data[0].price?.id;

				if (!productId) {
					return new Response("Missing product ID.", {
						status: 400,
					});
				}

				await createPurchase({
					subscriptionId: id,
					organizationId: metadata?.organization_id || null,
					userId: metadata?.user_id || null,
					customerId: customer as string,
					type: "SUBSCRIPTION",
					productId,
					status: event.data.object.status,
				});

				await setCustomerIdToEntity(customer as string, {
					organizationId: metadata?.organization_id,
					userId: metadata?.user_id,
				});

				// Sync org subscription state
				if (metadata?.organization_id) {
					await syncOrganizationFromSubscription(
						metadata.organization_id,
						event.data.object,
						event.id,
						event.type,
					);
				}

				break;
			}
			case "customer.subscription.updated": {
				const subscriptionId = event.data.object.id;
				const metadata = event.data.object.metadata;

				const existingPurchase =
					await getPurchaseBySubscriptionId(subscriptionId);

				if (existingPurchase) {
					await updatePurchase({
						id: existingPurchase.id,
						status: event.data.object.status,
						productId: event.data.object.items?.data[0].price?.id,
					});
				}

				// Sync org subscription state
				if (metadata?.organization_id) {
					await syncOrganizationFromSubscription(
						metadata.organization_id,
						event.data.object,
						event.id,
						event.type,
					);
				}

				break;
			}
			case "customer.subscription.deleted": {
				const metadata = event.data.object.metadata;

				await deletePurchaseBySubscriptionId(event.data.object.id);

				// Update org to CANCELLED
				if (metadata?.organization_id) {
					await syncOrganizationFromSubscription(
						metadata.organization_id,
						event.data.object,
						event.id,
						event.type,
					);
				}

				break;
			}

			case "invoice.paid": {
				await handleInvoicePaid(event.data.object, event.id);
				break;
			}

			case "invoice.payment_failed": {
				await handlePaymentFailed(event.data.object, event.id);
				break;
			}

			case "customer.subscription.paused": {
				const metadata = event.data.object.metadata;
				if (metadata?.organization_id) {
					await syncOrganizationFromSubscription(
						metadata.organization_id,
						event.data.object,
						event.id,
						event.type,
					);
				}
				break;
			}

			case "customer.subscription.resumed": {
				const metadata = event.data.object.metadata;
				if (metadata?.organization_id) {
					await syncOrganizationFromSubscription(
						metadata.organization_id,
						event.data.object,
						event.id,
						event.type,
					);
				}
				break;
			}

			default:
				return new Response("Unhandled event type.", {
					status: 200,
				});
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		return new Response(
			`Webhook error: ${error instanceof Error ? error.message : ""}`,
			{
				status: 400,
			},
		);
	}
};
