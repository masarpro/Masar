import {
	getChurnRate,
	getMrrTrend,
	getNewOrgsTrend,
	getSuperAdminDashboardStats,
} from "@repo/database";
import { adminProcedure } from "../../../orpc/procedures";
import { trendInput } from "../schema";

export const getStats = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/dashboard/stats",
		tags: ["Super Admin"],
		summary: "Get dashboard KPIs",
	})
	.handler(async () => {
		return getSuperAdminDashboardStats();
	});

export const getMrrTrendProcedure = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/dashboard/mrr-trend",
		tags: ["Super Admin"],
		summary: "Get MRR trend",
	})
	.input(trendInput)
	.handler(async ({ input }) => {
		return getMrrTrend(input.months);
	});

export const getPlanDistribution = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/dashboard/plan-distribution",
		tags: ["Super Admin"],
		summary: "Get plan distribution",
	})
	.handler(async () => {
		const stats = await getSuperAdminDashboardStats();
		return stats.planDistribution;
	});

export const getNewOrgsTrendProcedure = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/dashboard/new-orgs-trend",
		tags: ["Super Admin"],
		summary: "Get new orgs trend",
	})
	.input(trendInput)
	.handler(async ({ input }) => {
		return getNewOrgsTrend(input.months);
	});

export const getChurnRateProcedure = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/dashboard/churn-rate",
		tags: ["Super Admin"],
		summary: "Get churn rate",
	})
	.input(trendInput)
	.handler(async ({ input }) => {
		return getChurnRate(input.months);
	});
