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
}

export const STRIPE_PLANS: Record<PlanType, PlanDefinition> = {
	FREE: {
		type: "FREE",
		name: { en: "Free", ar: "مجاني" },
		maxUsers: 2,
		maxProjects: 1,
		maxStorageGB: 0,
		monthlyPrice: 0,
		yearlyPrice: 0,
		features: {
			en: [
				"1 project",
				"2 users",
				"10 AI chat sessions",
				"Basic project management",
			],
			ar: [
				"مشروع واحد",
				"مستخدمين اثنين",
				"10 محادثات ذكاء اصطناعي",
				"إدارة مشاريع أساسية",
			],
		},
	},
	PRO: {
		type: "PRO",
		name: { en: "Pro", ar: "احترافي" },
		maxUsers: 50,
		maxProjects: 100,
		maxStorageGB: 50,
		monthlyPrice: 199,
		yearlyPrice: 1990,
		features: {
			en: [
				"Up to 50 users",
				"Up to 100 projects",
				"50 GB storage",
				"All reports & analytics",
				"PDF & CSV exports",
				"AI chatbot — unlimited",
				"Owner portal",
				"ZATCA e-invoicing",
				"Priority support",
			],
			ar: [
				"حتى 50 مستخدمين",
				"حتى 100 مشروع",
				"50 جيجابايت تخزين",
				"جميع التقارير والتحليلات",
				"تصدير PDF و CSV",
				"شات الذكاء الاصطناعي — بلا حدود",
				"بوابة المالك",
				"فوترة زاتكا الإلكترونية",
				"دعم ذو أولوية",
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
