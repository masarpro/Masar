import { db } from "../client";
import type { PlanType } from "../generated/client";

export async function listPlanConfigs() {
	return db.planConfig.findMany({
		orderBy: { plan: "asc" },
	});
}

export async function getPlanConfigByPlan(plan: PlanType) {
	return db.planConfig.findUnique({
		where: { plan },
	});
}

export async function upsertPlanConfig(data: {
	plan: PlanType;
	name: { en: string; ar: string };
	maxUsers: number;
	maxProjects: number;
	maxStorageGB: number;
	monthlyPrice: number;
	yearlyPrice: number;
	features: { en: string[]; ar: string[] };
	isActive?: boolean;
}) {
	return db.planConfig.upsert({
		where: { plan: data.plan },
		create: {
			plan: data.plan,
			name: data.name,
			maxUsers: data.maxUsers,
			maxProjects: data.maxProjects,
			maxStorageGB: data.maxStorageGB,
			monthlyPrice: data.monthlyPrice,
			yearlyPrice: data.yearlyPrice,
			features: data.features,
			isActive: data.isActive ?? true,
		},
		update: {
			name: data.name,
			maxUsers: data.maxUsers,
			maxProjects: data.maxProjects,
			maxStorageGB: data.maxStorageGB,
			monthlyPrice: data.monthlyPrice,
			yearlyPrice: data.yearlyPrice,
			features: data.features,
			isActive: data.isActive,
		},
	});
}
