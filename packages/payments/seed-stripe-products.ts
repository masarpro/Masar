/**
 * Seed Stripe Products & Prices for Masar
 * Run: npx tsx packages/payments/seed-stripe-products.ts
 *
 * This script is idempotent - it checks for existing products by metadata
 * before creating new ones.
 */

import Stripe from "stripe";
import { STRIPE_PLANS } from "./stripe-products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function seedProducts() {
	console.log("Seeding Stripe products for Masar...\n");

	const results: Record<string, { monthlyPriceId: string; yearlyPriceId: string }> = {};

	for (const [planType, plan] of Object.entries(STRIPE_PLANS)) {
		if (planType === "FREE") continue;

		// Check if product already exists
		const existing = await stripe.products.search({
			query: `metadata["masar_plan"]:"${planType}"`,
		});

		let product: Stripe.Product;

		if (existing.data.length > 0) {
			product = existing.data[0];
			console.log(`Product "${plan.name.en}" already exists: ${product.id}`);
		} else {
			product = await stripe.products.create({
				name: `Masar - ${plan.name.en} (${plan.name.ar})`,
				description: plan.features.en.join(", "),
				metadata: {
					masar_plan: planType,
					max_users: String(plan.maxUsers),
					max_projects: String(plan.maxProjects),
					max_storage_gb: String(plan.maxStorageGB),
				},
			});
			console.log(`Created product "${plan.name.en}": ${product.id}`);
		}

		// Check for existing prices
		const prices = await stripe.prices.list({ product: product.id, active: true });
		let monthlyPrice = prices.data.find(
			(p) => p.recurring?.interval === "month",
		);
		let yearlyPrice = prices.data.find(
			(p) => p.recurring?.interval === "year",
		);

		if (!monthlyPrice) {
			monthlyPrice = await stripe.prices.create({
				product: product.id,
				unit_amount: plan.monthlyPrice * 100, // Convert to halalah
				currency: "sar",
				recurring: { interval: "month" },
				metadata: { masar_plan: planType, interval: "monthly" },
			});
			console.log(`  Created monthly price: ${monthlyPrice.id} (${plan.monthlyPrice} SAR/mo)`);
		} else {
			console.log(`  Monthly price exists: ${monthlyPrice.id}`);
		}

		if (!yearlyPrice) {
			yearlyPrice = await stripe.prices.create({
				product: product.id,
				unit_amount: plan.yearlyPrice * 100,
				currency: "sar",
				recurring: { interval: "year" },
				metadata: { masar_plan: planType, interval: "yearly" },
			});
			console.log(`  Created yearly price: ${yearlyPrice.id} (${plan.yearlyPrice} SAR/yr)`);
		} else {
			console.log(`  Yearly price exists: ${yearlyPrice.id}`);
		}

		results[planType] = {
			monthlyPriceId: monthlyPrice.id,
			yearlyPriceId: yearlyPrice.id,
		};
	}

	console.log("\n--- Add to .env ---");
	for (const [planType, { monthlyPriceId, yearlyPriceId }] of Object.entries(results)) {
		console.log(`STRIPE_${planType}_MONTHLY_PRICE_ID=${monthlyPriceId}`);
		console.log(`STRIPE_${planType}_YEARLY_PRICE_ID=${yearlyPriceId}`);
	}
}

seedProducts().catch(console.error);
