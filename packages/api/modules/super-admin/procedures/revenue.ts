import {
	getRevenueSummary,
	getRevenueByPlan,
	getMrrTrend,
} from "@repo/database";
import { adminProcedure } from "../../../orpc/procedures";
import { trendInput } from "../schema";

export const getSummary = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/revenue/summary",
		tags: ["Super Admin"],
		summary: "Get revenue summary",
	})
	.handler(async () => {
		return getRevenueSummary();
	});

export const getByPeriod = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/revenue/by-period",
		tags: ["Super Admin"],
		summary: "Get revenue by period",
	})
	.input(trendInput)
	.handler(async ({ input }) => {
		return getMrrTrend(input.months);
	});

export const getByPlan = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/revenue/by-plan",
		tags: ["Super Admin"],
		summary: "Get revenue by plan",
	})
	.handler(async () => {
		return getRevenueByPlan();
	});
