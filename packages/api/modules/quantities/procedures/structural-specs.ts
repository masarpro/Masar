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
	concreteType: z.string().trim().max(100).optional(),
	steelGrade: z.string().trim().max(100).optional(),
});

const blockSpecSchema = z.object({
	blockType: z.string().trim().max(100),
	thickness: z.number().optional(),
});

const heightPropertiesSchema = z.object({
	heightInputMode: z.enum(["manual", "levels"]),
	includeFinishInLevels: z.boolean(),
	finishThickness: z.number().nonnegative(),
	streetLevel: z.number().max(999999),
	excavationDepth: z.number().nonnegative(),
	plainConcreteThickness: z.number().nonnegative(),
	foundationDepth: z.number().nonnegative(),
	beamDepth: z.number().nonnegative(),
	buildingElevationAboveStreet: z.number().nonnegative(),
	defaultSlabThickness: z.number().nonnegative(),
	defaultBeamDepth: z.number().nonnegative(),
	hasParapet: z.boolean(),
	parapetHeight: z.number().nonnegative(),
	parapetLevel: z.number().optional(),
	invertedBeamDepth: z.number().nonnegative(),
	roofWaterproofingThickness: z.number().nonnegative(),
}).optional();

const derivedFloorHeightsSchema = z.object({
	floorToFloorHeight: z.number().nullable().optional(),
	columnHeight: z.number().nullable().optional(),
	blockHeight: z.number().nullable().optional(),
	neckHeight: z.number().nullable().optional(),
	isAutoCalculated: z.boolean().optional(),
}).partial();

const buildingConfigSchema = z.object({
	floors: z.array(z.object({
		id: z.string().trim().max(100),
		type: z.string().trim().max(100),
		label: z.string().trim().max(200),
		icon: z.string().trim().max(100),
		height: z.number().nonnegative(),
		slabArea: z.number().nonnegative(),
		sortOrder: z.number().int().min(0).max(999999),
		isRepeated: z.boolean(),
		repeatCount: z.number().nonnegative(),
		enabled: z.boolean(),
		hasNeckColumns: z.boolean().optional(),
		finishLevel: z.number().optional(),
	})),
	isComplete: z.boolean(),
	heightProperties: heightPropertiesSchema,
	heightOverrides: z.record(z.string().trim().max(100), derivedFloorHeightsSchema).optional(),
});

const structuralSpecsSchema = z.object({
	// Per-element specs
	elements: z.record(z.string().trim().max(100), elementSpecSchema).optional(),
	// Steel brand (project-wide)
	steelBrand: z.string().trim().max(100).optional(),
	hasIsolatedSteel: z.boolean().optional(),
	// Block specs per wall category
	blockSpecs: z.record(z.string().trim().max(100), blockSpecSchema).optional(),
	// General specs
	externalBlockType: z.string().trim().max(100).optional(),
	internalBlockType: z.string().trim().max(100).optional(),
	waterproofType: z.string().trim().max(100).optional(),
	thermalInsulationType: z.string().trim().max(100).optional(),
	// Legacy fields (kept for backward compatibility)
	concreteGrade: z.string().trim().max(100).optional(),
	steelGrade: z.string().trim().max(100).optional(),
	// Building config (structural wizard)
	buildingConfig: buildingConfigSchema.optional(),
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
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
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
