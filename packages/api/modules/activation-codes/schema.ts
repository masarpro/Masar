import { z } from "zod";
import {
	optionalTrimmed,
	idString,
	paginationLimit,
	paginationOffset,
	MAX_DAYS,
	MAX_QUANTITY,
} from "../../lib/validation-constants";

// ── Admin Inputs ──

export const createActivationCodeInput = z.object({
	description: optionalTrimmed(500),
	durationDays: z.number().int().min(1).max(MAX_DAYS).default(90),
	maxUses: z.number().int().min(1).max(MAX_QUANTITY).default(1),
	maxUsers: z.number().int().min(1).max(MAX_QUANTITY).default(50),
	maxProjects: z.number().int().min(1).max(MAX_QUANTITY).default(100),
	maxStorageGB: z.number().int().min(1).max(MAX_QUANTITY).default(50),
	expiresAt: z.string().datetime().optional(),
});

export const listActivationCodesInput = z.object({
	limit: paginationLimit(),
	offset: paginationOffset(),
});

export const codeIdInput = z.object({
	id: idString(),
});

// ── User Inputs ──

export const codeInput = z.object({
	code: z.string().min(1).max(20).transform((v) => v.toUpperCase().trim()),
});
