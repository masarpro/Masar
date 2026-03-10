import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════

const structuralSpecsSchema = z.object({
	concreteGrade: z.string().optional(),
	steelGrade: z.string().optional(),
	externalBlockType: z.string().optional(),
	internalBlockType: z.string().optional(),
	waterproofType: z.string().optional(),
	thermalInsulationType: z.string().optional(),
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
				message: "الدراسة غير موجودة",
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
				message: "الدراسة غير موجودة",
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
