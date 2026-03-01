import type { PlanType } from "@repo/database";

export interface PlanDefinition {
	type: PlanType;
	name: { en: string; ar: string };
	maxUsers: number;
	maxProjects: number;
	maxStorageGB: number;
	monthlyPrice: number; // SAR
	yearlyPrice: number; // SAR
	features: { en: string[]; ar: string[] };
	isReadOnly?: boolean;
}

export const STRIPE_PLANS: Record<PlanType, PlanDefinition> = {
	FREE: {
		type: "FREE",
		name: { en: "Free", ar: "مجاني" },
		maxUsers: 1,
		maxProjects: 0,
		maxStorageGB: 0,
		monthlyPrice: 0,
		yearlyPrice: 0,
		isReadOnly: true,
		features: {
			en: [
				"View-only demo access",
				"1 user",
			],
			ar: [
				"وصول تجريبي للعرض فقط",
				"مستخدم واحد",
			],
		},
	},
	PRO: {
		type: "PRO",
		name: { en: "Pro", ar: "احترافي" },
		maxUsers: 50,
		maxProjects: 100,
		maxStorageGB: 50,
		monthlyPrice: 299,
		yearlyPrice: 2990,
		features: {
			en: [
				"Up to 50 users",
				"Up to 100 projects",
				"50 GB storage",
				"All reports & analytics",
				"Priority support",
				"API access",
			],
			ar: [
				"حتى 50 مستخدمين",
				"حتى 100 مشروع",
				"50 جيجابايت تخزين",
				"جميع التقارير والتحليلات",
				"دعم ذو أولوية",
				"الوصول لواجهة API",
			],
		},
	},
};

export function getPlanLimits(plan: PlanType) {
	const planDef = STRIPE_PLANS[plan];
	return {
		maxUsers: planDef.maxUsers,
		maxProjects: planDef.maxProjects,
		maxStorageGB: planDef.maxStorageGB,
	};
}

const PRICE_ID_TO_PLAN: Record<string, PlanType> = {};

function initPriceMapping() {
	const mappings: Array<{ envKey: string; plan: PlanType }> = [
		{ envKey: "STRIPE_PRO_MONTHLY_PRICE_ID", plan: "PRO" },
		{ envKey: "STRIPE_PRO_YEARLY_PRICE_ID", plan: "PRO" },
	];

	for (const { envKey, plan } of mappings) {
		const priceId = process.env[envKey];
		if (priceId) {
			PRICE_ID_TO_PLAN[priceId] = plan;
		}
	}
}

export function getPlanFromPriceId(priceId: string): PlanType {
	if (Object.keys(PRICE_ID_TO_PLAN).length === 0) {
		initPriceMapping();
	}
	return PRICE_ID_TO_PLAN[priceId] ?? "FREE";
}
