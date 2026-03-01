import { ORPCError } from "@orpc/client";
import {
	countSuperAdminOrganizations,
	getSuperAdminOrgDetail,
	getSuperAdminOrganizations,
	getOrgPaymentHistory,
	getSuperAdminOrgMembers,
	getSuperAdminOrgProjects,
	logSuperAdminAction,
	db,
} from "@repo/database";
import { getPlanLimits } from "@repo/payments/stripe-products";
import { adminProcedure } from "../../../orpc/procedures";
import {
	activateOrgInput,
	changePlanInput,
	listOrganizationsInput,
	orgIdInput,
	setFreeOverrideInput,
	suspendOrgInput,
	updateLimitsInput,
} from "../schema";

export const list = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/organizations",
		tags: ["Super Admin"],
		summary: "List organizations with filters",
	})
	.input(listOrganizationsInput)
	.handler(async ({ input }) => {
		const [organizations, total] = await Promise.all([
			getSuperAdminOrganizations(input),
			countSuperAdminOrganizations(input),
		]);
		return { organizations, total };
	});

export const getById = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/organizations/{organizationId}",
		tags: ["Super Admin"],
		summary: "Get organization detail",
	})
	.input(orgIdInput)
	.handler(async ({ input }) => {
		const org = await getSuperAdminOrgDetail(input.organizationId);
		if (!org) throw new ORPCError("NOT_FOUND");
		return org;
	});

export const changePlan = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/organizations/change-plan",
		tags: ["Super Admin"],
		summary: "Change organization plan",
	})
	.input(changePlanInput)
	.handler(async ({ input, context }) => {
		const limits = getPlanLimits(input.plan);

		const org = await db.organization.update({
			where: { id: input.organizationId },
			data: {
				plan: input.plan,
				planName: input.plan,
				maxUsers: limits.maxUsers,
				maxProjects: limits.maxProjects,
				maxStorage: limits.maxStorageGB,
			},
		});

		logSuperAdminAction({
			adminId: context.user.id,
			action: "CHANGE_PLAN",
			targetType: "organization",
			targetId: input.organizationId,
			targetOrgId: input.organizationId,
			details: {
				newPlan: input.plan,
				reason: input.reason,
			},
		});

		return org;
	});

export const suspend = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/organizations/suspend",
		tags: ["Super Admin"],
		summary: "Suspend organization",
	})
	.input(suspendOrgInput)
	.handler(async ({ input, context }) => {
		const org = await db.organization.update({
			where: { id: input.organizationId },
			data: {
				status: "SUSPENDED",
			},
		});

		logSuperAdminAction({
			adminId: context.user.id,
			action: "SUSPEND_ORG",
			targetType: "organization",
			targetId: input.organizationId,
			targetOrgId: input.organizationId,
			details: { reason: input.reason },
		});

		return org;
	});

export const activate = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/organizations/activate",
		tags: ["Super Admin"],
		summary: "Activate organization",
	})
	.input(activateOrgInput)
	.handler(async ({ input, context }) => {
		const org = await db.organization.update({
			where: { id: input.organizationId },
			data: {
				status: "ACTIVE",
			},
		});

		logSuperAdminAction({
			adminId: context.user.id,
			action: "ACTIVATE_ORG",
			targetType: "organization",
			targetId: input.organizationId,
			targetOrgId: input.organizationId,
			details: { reason: input.reason },
		});

		return org;
	});

export const setFreeOverride = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/organizations/free-override",
		tags: ["Super Admin"],
		summary: "Set free override for organization",
	})
	.input(setFreeOverrideInput)
	.handler(async ({ input, context }) => {
		const org = await db.organization.update({
			where: { id: input.organizationId },
			data: {
				isFreeOverride: input.isFreeOverride,
				overrideReason: input.reason,
				overrideBy: context.user.id,
				overrideAt: new Date(),
			},
		});

		logSuperAdminAction({
			adminId: context.user.id,
			action: input.isFreeOverride
				? "ENABLE_FREE_OVERRIDE"
				: "DISABLE_FREE_OVERRIDE",
			targetType: "organization",
			targetId: input.organizationId,
			targetOrgId: input.organizationId,
			details: { reason: input.reason },
		});

		return org;
	});

export const updateLimits = adminProcedure
	.route({
		method: "POST",
		path: "/super-admin/organizations/update-limits",
		tags: ["Super Admin"],
		summary: "Update organization limits",
	})
	.input(updateLimitsInput)
	.handler(async ({ input, context }) => {
		const data: Record<string, number> = {};
		if (input.maxUsers !== undefined) data.maxUsers = input.maxUsers;
		if (input.maxProjects !== undefined)
			data.maxProjects = input.maxProjects;
		if (input.maxStorage !== undefined) data.maxStorage = input.maxStorage;

		const org = await db.organization.update({
			where: { id: input.organizationId },
			data,
		});

		logSuperAdminAction({
			adminId: context.user.id,
			action: "UPDATE_LIMITS",
			targetType: "organization",
			targetId: input.organizationId,
			targetOrgId: input.organizationId,
			details: data,
		});

		return org;
	});

export const getPaymentHistory = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/organizations/{organizationId}/payments",
		tags: ["Super Admin"],
		summary: "Get payment history for organization",
	})
	.input(orgIdInput)
	.handler(async ({ input }) => {
		return getOrgPaymentHistory(input.organizationId);
	});

export const getMembers = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/organizations/{organizationId}/members",
		tags: ["Super Admin"],
		summary: "Get organization members",
	})
	.input(orgIdInput)
	.handler(async ({ input }) => {
		return getSuperAdminOrgMembers(input.organizationId);
	});

export const getProjects = adminProcedure
	.route({
		method: "GET",
		path: "/super-admin/organizations/{organizationId}/projects",
		tags: ["Super Admin"],
		summary: "Get organization projects",
	})
	.input(orgIdInput)
	.handler(async ({ input }) => {
		return getSuperAdminOrgProjects(input.organizationId);
	});
