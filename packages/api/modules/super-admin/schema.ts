import { z } from "zod";
import {
	idString,
	searchQuery,
	paginationLimit,
	paginationOffset,
	trimmedString,
	optionalTrimmed,
	MAX_QUANTITY,
} from "../../lib/validation-constants";

export const listOrganizationsInput = z.object({
	query: searchQuery(),
	limit: paginationLimit(),
	offset: paginationOffset(),
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
	organizationId: idString(),
	plan: z.enum(["FREE", "PRO"]),
	reason: optionalTrimmed(2000),
});

export const suspendOrgInput = z.object({
	organizationId: idString(),
	reason: trimmedString(2000),
});

export const activateOrgInput = z.object({
	organizationId: idString(),
	reason: optionalTrimmed(2000),
});

export const setFreeOverrideInput = z.object({
	organizationId: idString(),
	isFreeOverride: z.boolean(),
	reason: trimmedString(2000),
});

export const updateLimitsInput = z.object({
	organizationId: idString(),
	maxUsers: z.number().int().min(1).max(MAX_QUANTITY).optional(),
	maxProjects: z.number().int().min(1).max(MAX_QUANTITY).optional(),
	maxStorage: z.number().int().min(1).max(MAX_QUANTITY).optional(),
});

export const orgIdInput = z.object({
	organizationId: idString(),
});

export const trendInput = z.object({
	months: z.number().int().min(1).max(24).default(6),
});

export const listLogsInput = z.object({
	limit: paginationLimit(),
	offset: paginationOffset(),
	adminId: z.string().trim().max(100).optional(),
	action: z.string().trim().max(100).optional(),
	targetOrgId: z.string().trim().max(100).optional(),
});
