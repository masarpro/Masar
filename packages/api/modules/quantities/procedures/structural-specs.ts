import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════

const elementSpecSchema = z.object({
	concreteType: z.string().optional(),
	steelGrade: z.string().optional(),
});

const structuralSpecsSchema = z.object({
	// Per-element specs
	elements: z.record(z.string(), elementSpecSchema).optional(),
	// General specs
	externalBlockType: z.string().optional(),
	internalBlockType: z.string().optional(),
	waterproofType: z.string().optional(),
	thermalInsulationType: z.string().optional(),
	// Legacy fields (kept for backward compatibility)
	concreteGrade: z.string().optional(),
	steelGrade: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET STRUCTURAL SPECS
// ═══════════════════════════════════════════════════════════════

export const getStructuralSpecs = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/structural-specs",
		tags: ["Quantities", "Specs"],
		summary: "Get structural specifications for a study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
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
				structuralSpecs: true,
			},
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		return (study.structuralSpecs as Record<string, string> | null) ?? {};
	});

// ═══════════════════════════════════════════════════════════════
// SET STRUCTURAL SPECS
// ═══════════════════════════════════════════════════════════════

export const setStructuralSpecs = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{studyId}/structural-specs",
		tags: ["Quantities", "Specs"],
		summary: "Set structural specifications for a study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			specs: structuralSpecsSchema,
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
				structuralSpecs: input.specs,
			},
		});

		return { success: true };
	});
