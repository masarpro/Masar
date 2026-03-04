import { z } from "zod";

// ── Admin Inputs ──

export const createActivationCodeInput = z.object({
	description: z.string().optional(),
	durationDays: z.number().int().min(1).default(90),
	maxUses: z.number().int().min(1).default(1),
	maxUsers: z.number().int().min(1).default(50),
	maxProjects: z.number().int().min(1).default(100),
	maxStorageGB: z.number().int().min(1).default(50),
	expiresAt: z.string().datetime().optional(),
});

export const listActivationCodesInput = z.object({
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const codeIdInput = z.object({
	id: z.string(),
});

// ── User Inputs ──

export const codeInput = z.object({
	code: z.string().min(1).max(20).transform((v) => v.toUpperCase().trim()),
});
