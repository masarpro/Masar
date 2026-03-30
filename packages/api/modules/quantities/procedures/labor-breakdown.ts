import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════

const laborBreakdownSchema = z.object({
	laborMode: z.enum(["per_sqm", "per_cbm_ton", "lump_sum", "salary"]).optional(),
	// Per-SQM
	floorRows: z.array(z.object({
		id: z.string().trim().max(100),
		label: z.string().trim().max(200),
		area: z.string().trim().max(200),
		pricePerSqm: z.string().trim().max(200),
		isAuto: z.boolean().optional(),
		floorKey: z.string().trim().max(100).optional(),
	})).optional(),
	extraRows: z.array(z.object({
		id: z.string().trim().max(100),
		label: z.string().trim().max(200),
		quantity: z.string().trim().max(200),
		unit: z.string().trim().max(200),
		pricePerUnit: z.string().trim().max(200),
	})).optional(),
	// Per-CBM+Ton
	cbmRows: z.array(z.object({
		id: z.string().trim().max(100),
		label: z.string().trim().max(200),
		quantity: z.string().trim().max(200),
		unit: z.string().trim().max(200),
		pricePerUnit: z.string().trim().max(200),
	})).optional(),
	// Lump sum
	lumpSumAmount: z.number().optional(),
	// Salary
	salaryWorkers: z.array(z.object({
		id: z.string().trim().max(100),
		craft: z.string().trim().max(200),
		count: z.string().trim().max(200),
		salary: z.string().trim().max(200),
		months: z.string().trim().max(200),
	})).optional(),
	salaryInsurance: z.number().optional(),
	salaryHousing: z.number().optional(),
	// Material prices (shared with structural tab)
	concretePrice: z.number().optional(),
	steelPrice: z.number().optional(),
	storagePercent: z.number().optional(),
	// Per-grade concrete prices: { "C15": 250, "C30": 350, "C35": 400 }
	concretePrices: z.record(z.string().trim().max(100), z.number().nonnegative().max(999999999.99)).optional(),
	steelPriceD6: z.number().optional(),
	steelPriceD8: z.number().optional(),
	steelPriceMain: z.number().optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET LABOR BREAKDOWN
// ═══════════════════════════════════════════════════════════════

export const getLaborBreakdown = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/labor-breakdown",
		tags: ["Quantities", "Costing"],
		summary: "Get labor breakdown for a study",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: {
				laborBreakdown: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		return (study.laborBreakdown as Record<string, unknown> | null) ?? {};
	});

// ═══════════════════════════════════════════════════════════════
// SET LABOR BREAKDOWN
// ═══════════════════════════════════════════════════════════════

export const setLaborBreakdown = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{studyId}/labor-breakdown",
		tags: ["Quantities", "Costing"],
		summary: "Set labor breakdown for a study",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			breakdown: laborBreakdownSchema,
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await db.costStudy.findFirst({
			where: {
				id: input.studyId,
				organizationId: input.organizationId,
			},
			select: { id: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		await db.costStudy.update({
			where: { id: input.studyId },
			data: {
				laborBreakdown: input.breakdown as any,
			},
		});

		return { success: true };
	});
