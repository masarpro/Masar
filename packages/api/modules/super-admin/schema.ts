import { z } from "zod";

export const listOrganizationsInput = z.object({
	query: z.string().optional(),
	limit: z.number().min(1).max(100).default(10),
	offset: z.number().min(0).default(0),
	status: z
		.enum(["ACTIVE", "TRIALING", "SUSPENDED", "CANCELLED", "PAST_DUE"])
		.optional(),
	plan: z
		.enum(["FREE", "PRO"])
		.optional(),
	sortBy: z.enum(["createdAt", "name", "plan"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const changePlanInput = z.object({
	organizationId: z.string(),
	plan: z.enum(["FREE", "PRO"]),
	reason: z.string().optional(),
});

export const suspendOrgInput = z.object({
	organizationId: z.string(),
	reason: z.string().min(1),
});

export const activateOrgInput = z.object({
	organizationId: z.string(),
	reason: z.string().optional(),
});

export const setFreeOverrideInput = z.object({
	organizationId: z.string(),
	isFreeOverride: z.boolean(),
	reason: z.string().min(1),
});

export const updateLimitsInput = z.object({
	organizationId: z.string(),
	maxUsers: z.number().min(1).optional(),
	maxProjects: z.number().min(1).optional(),
	maxStorage: z.number().min(1).optional(),
});

export const orgIdInput = z.object({
	organizationId: z.string(),
});

export const trendInput = z.object({
	months: z.number().min(1).max(24).default(6),
});

export const listLogsInput = z.object({
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
	adminId: z.string().optional(),
	action: z.string().optional(),
	targetOrgId: z.string().optional(),
});
