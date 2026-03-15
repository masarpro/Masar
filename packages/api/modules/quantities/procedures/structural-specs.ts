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

const blockSpecSchema = z.object({
	blockType: z.string(),
	thickness: z.number().optional(),
});

const heightPropertiesSchema = z.object({
	heightInputMode: z.enum(["manual", "levels"]),
	includeFinishInLevels: z.boolean(),
	finishThickness: z.number().nonnegative(),
	streetLevel: z.number(),
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
		id: z.string(),
		type: z.string(),
		label: z.string(),
		icon: z.string(),
		height: z.number().nonnegative(),
		slabArea: z.number().nonnegative(),
		sortOrder: z.number(),
		isRepeated: z.boolean(),
		repeatCount: z.number().nonnegative(),
		enabled: z.boolean(),
		hasNeckColumns: z.boolean().optional(),
		finishLevel: z.number().optional(),
	})),
	isComplete: z.boolean(),
	heightProperties: heightPropertiesSchema,
	heightOverrides: z.record(z.string(), derivedFloorHeightsSchema).optional(),
});

const structuralSpecsSchema = z.object({
	// Per-element specs
	elements: z.record(z.string(), elementSpecSchema).optional(),
	// Steel brand (project-wide)
	steelBrand: z.string().optional(),
	hasIsolatedSteel: z.boolean().optional(),
	// Block specs per wall category
	blockSpecs: z.record(z.string(), blockSpecSchema).optional(),
	// General specs
	externalBlockType: z.string().optional(),
	internalBlockType: z.string().optional(),
	waterproofType: z.string().optional(),
	thermalInsulationType: z.string().optional(),
	// Legacy fields (kept for backward compatibility)
	concreteGrade: z.string().optional(),
	steelGrade: z.string().optional(),
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
