import { z } from "zod";
import {
	listPlanConfigs,
	getPlanConfigByPlan,
	upsertPlanConfig,
	logSuperAdminAction,
} from "@repo/database";
import { adminProcedure } from "../../../orpc/procedures";

export const listPlans = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/plans",
		tags: ["Super Admin"],
		summary: "List all plan configs",
	})
	.handler(async () => {
		return listPlanConfigs();
	});

export const getPlan = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/plans/{plan}",
		tags: ["Super Admin"],
		summary: "Get plan config by plan type",
	})
	.input(z.object({ plan: z.enum(["FREE", "PRO"]) }))
	.handler(async ({ input }) => {
		return getPlanConfigByPlan(input.plan);
	});

export const updatePlan = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/plans/update",
		tags: ["Super Admin"],
		summary: "Update plan config",
	})
	.input(
		z.object({
			plan: z.enum(["FREE", "PRO"]),
			name: z.object({ en: z.string(), ar: z.string() }),
			maxUsers: z.number().min(0),
			maxProjects: z.number().min(0),
			maxStorageGB: z.number().min(0),
			monthlyPrice: z.number().min(0),
			yearlyPrice: z.number().min(0),
			features: z.object({
				en: z.array(z.string()),
				ar: z.array(z.string()),
			}),
			isActive: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const result = await upsertPlanConfig(input);

		logSuperAdminAction({
			adminId: context.user.id,
			action: "UPDATE_PLAN",
			targetType: "plan",
			targetId: input.plan,
			details: {
				plan: input.plan,
				maxUsers: input.maxUsers,
				maxProjects: input.maxProjects,
				maxStorageGB: input.maxStorageGB,
				monthlyPrice: input.monthlyPrice,
				yearlyPrice: input.yearlyPrice,
			},
		});

		return result;
	});

export const syncPlanToStripe = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/plans/sync-stripe",
		tags: ["Super Admin"],
		summary: "Sync plan to Stripe (placeholder)",
	})
	.input(z.object({ plan: z.enum(["FREE", "PRO"]) }))
	.handler(async ({ input, context }) => {
		// Placeholder — implement Stripe price sync later
		logSuperAdminAction({
			adminId: context.user.id,
			action: "SYNC_PLAN_STRIPE",
			targetType: "plan",
			targetId: input.plan,
			details: { plan: input.plan },
		});

		return { success: true, message: "Stripe sync placeholder" };
	});
