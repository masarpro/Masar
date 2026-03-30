import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════
// 1. GET SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const getSpecifications = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/specifications",
		tags: ["Quantities", "Specifications"],
		summary: "Get all items with their specifications",
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
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		const [finishingItems, mepItems, structuralItems] = await Promise.all([
			db.finishingItem.findMany({
				where: { costStudyId: input.studyId, isEnabled: true },
				orderBy: { sortOrder: "asc" },
				select: {
					id: true, category: true, subCategory: true, name: true,
					floorId: true, floorName: true, unit: true, area: true, quantity: true,
					qualityLevel: true, brand: true, specifications: true, specData: true,
				},
			}),
			db.mEPItem.findMany({
				where: { costStudyId: input.studyId, isEnabled: true },
				orderBy: { sortOrder: "asc" },
				select: {
					id: true, category: true, subCategory: true, name: true,
					floorId: true, floorName: true, unit: true, quantity: true,
					specifications: true, specData: true, qualityLevel: true,
				},
			}),
			db.structuralItem.findMany({
				where: { costStudyId: input.studyId },
				orderBy: { sortOrder: "asc" },
				select: {
					id: true, category: true, subCategory: true, name: true,
					unit: true, quantity: true, concreteType: true,
				},
			}),
		]);

		return { finishingItems, mepItems, structuralItems };
	});

// ═══════════════════════════════════════════════════════════════
// 2. UPDATE ITEM SPEC
// ═══════════════════════════════════════════════════════════════

const itemTypeEnum = z.enum(["finishing", "mep", "structural"]);

export const updateItemSpec = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/specifications/update-item",
		tags: ["Quantities", "Specifications"],
		summary: "Update specification data for a single item",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			itemId: z.string().trim().max(100),
			itemType: itemTypeEnum,
			specData: z.record(z.string(), z.unknown()),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		switch (input.itemType) {
			case "finishing": {
				const item = await db.finishingItem.findFirst({
					where: { id: input.itemId, costStudyId: input.studyId },
				});
				if (!item) throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.ITEM_NOT_FOUND });
				await db.finishingItem.update({
					where: { id: input.itemId },
					data: { specData: input.specData as Record<string, unknown> as any },
				});
				break;
			}
			case "mep": {
				const item = await db.mEPItem.findFirst({
					where: { id: input.itemId, costStudyId: input.studyId },
				});
				if (!item) throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.ITEM_NOT_FOUND });
				await db.mEPItem.update({
					where: { id: input.itemId },
					data: { specData: input.specData as Record<string, unknown> as any },
				});
				break;
			}
			case "structural": {
				const item = await db.structuralItem.findFirst({
					where: { id: input.itemId, costStudyId: input.studyId },
				});
				if (!item) throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.ITEM_NOT_FOUND });
				await db.structuralItem.update({
					where: { id: input.itemId },
					data: { dimensions: input.specData as Record<string, unknown> as any },
				});
				break;
			}
		}

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════
// 3. APPLY TEMPLATE TO ALL
// ═══════════════════════════════════════════════════════════════

const templateLevelEnum = z.enum(["economic", "medium", "luxury"]);

// System templates — categoryKey → specTypeKey + options for each quality level
const SYSTEM_TEMPLATE_SPECS: Record<string, Array<{
	categoryKey: string;
	specTypeKey: string;
	options: Record<string, unknown>;
	brand?: string;
}>> = {
	economic: [
		{ categoryKey: "FINISHING_WATERPROOFING", specTypeKey: "cement_flexible", options: { layers: 2, hasReinforcement: false } },
		{ categoryKey: "FINISHING_THERMAL_INSULATION", specTypeKey: "eps_50", options: { thickness: 50, hasVaporBarrier: false } },
		{ categoryKey: "FINISHING_INTERNAL_PLASTER", specTypeKey: "cement_manual", options: { thickness: 20, mixRatio: "1:4", meshType: "none" } },
		{ categoryKey: "FINISHING_EXTERNAL_PLASTER", specTypeKey: "cement_manual", options: { thickness: 20, mixRatio: "1:4" } },
		{ categoryKey: "FINISHING_INTERIOR_PAINT", specTypeKey: "plastic_matt", options: { preparation: "light_putty", coats: 2 }, brand: "National Paints" },
		{ categoryKey: "FINISHING_FACADE_PAINT", specTypeKey: "acrylic_exterior", options: { coats: 2 }, brand: "National Paints" },
		{ categoryKey: "FINISHING_BOUNDARY_PAINT", specTypeKey: "acrylic_exterior", options: { coats: 2 } },
		{ categoryKey: "FINISHING_FLOOR_TILES", specTypeKey: "ceramic_40x40", options: { installation: "adhesive", hasScreed: true, groutType: "normal" } },
		{ categoryKey: "FINISHING_WALL_TILES", specTypeKey: "ceramic_30x60", options: { installation: "adhesive", groutType: "normal" } },
		{ categoryKey: "FINISHING_FALSE_CEILING", specTypeKey: "suspended_tiles", options: {} },
		{ categoryKey: "FINISHING_INTERIOR_DOORS", specTypeKey: "hdf", options: {} },
		{ categoryKey: "FINISHING_EXTERIOR_DOORS", specTypeKey: "steel_security", options: {} },
		{ categoryKey: "FINISHING_WINDOWS", specTypeKey: "aluminum_standard", options: { hasInsectScreen: false } },
		{ categoryKey: "FINISHING_BATHROOMS", specTypeKey: "standard_set", options: {} },
		{ categoryKey: "FINISHING_MARBLE_VANITIES", specTypeKey: "marble_local", options: {} },
		{ categoryKey: "FINISHING_KITCHEN", specTypeKey: "pvc_membrane", options: { countertop: "local_granite" } },
		{ categoryKey: "FINISHING_INTERNAL_STAIRS", specTypeKey: "granite", options: { hasNosing: false } },
		{ categoryKey: "FINISHING_EXTERNAL_STAIRS", specTypeKey: "granite", options: {} },
		{ categoryKey: "FINISHING_RAILINGS", specTypeKey: "wrought_iron", options: {} },
		{ categoryKey: "FINISHING_STONE_FACADE", specTypeKey: "manufactured", options: {} },
		{ categoryKey: "FINISHING_FACADE_DECOR", specTypeKey: "gypsum_decor", options: {} },
		{ categoryKey: "FINISHING_YARD_PAVING", specTypeKey: "interlock_6cm", options: {} },
		{ categoryKey: "FINISHING_FENCE_GATES", specTypeKey: "iron_gate", options: { hasMotor: false } },
		{ categoryKey: "FINISHING_LANDSCAPING", specTypeKey: "artificial_grass", options: {} },
		{ categoryKey: "FINISHING_ROOF", specTypeKey: "waterproof_only", options: {} },
		{ categoryKey: "FINISHING_INTERIOR_DECOR", specTypeKey: "gypsum_decor", options: {} },
	],
	medium: [
		{ categoryKey: "FINISHING_WATERPROOFING", specTypeKey: "cement_flexible", options: { layers: 2, hasReinforcement: true }, brand: "Sika" },
		{ categoryKey: "FINISHING_THERMAL_INSULATION", specTypeKey: "xps_50", options: { thickness: 50, hasVaporBarrier: false }, brand: "SABIC" },
		{ categoryKey: "FINISHING_INTERNAL_PLASTER", specTypeKey: "cement_machine", options: { thickness: 15 } },
		{ categoryKey: "FINISHING_EXTERNAL_PLASTER", specTypeKey: "cement_manual", options: { thickness: 20, mixRatio: "1:3" } },
		{ categoryKey: "FINISHING_INTERIOR_PAINT", specTypeKey: "plastic_satin", options: { preparation: "full_putty", coats: 2 }, brand: "Jotun" },
		{ categoryKey: "FINISHING_FACADE_PAINT", specTypeKey: "acrylic_exterior", options: { coats: 2 }, brand: "Jotun" },
		{ categoryKey: "FINISHING_BOUNDARY_PAINT", specTypeKey: "acrylic_exterior", options: { coats: 2 }, brand: "Jotun" },
		{ categoryKey: "FINISHING_FLOOR_TILES", specTypeKey: "porcelain_60x60", options: { installation: "adhesive", hasScreed: true, groutType: "normal" } },
		{ categoryKey: "FINISHING_WALL_TILES", specTypeKey: "porcelain_60x60", options: { installation: "adhesive", groutType: "normal" } },
		{ categoryKey: "FINISHING_FALSE_CEILING", specTypeKey: "gypsum_board_flat", options: { boardType: "standard", includesPaint: true }, brand: "Knauf" },
		{ categoryKey: "FINISHING_INTERIOR_DOORS", specTypeKey: "wpc", options: {} },
		{ categoryKey: "FINISHING_EXTERIOR_DOORS", specTypeKey: "steel_security", options: {} },
		{ categoryKey: "FINISHING_WINDOWS", specTypeKey: "aluminum_thermal_break", options: { hasInsectScreen: true } },
		{ categoryKey: "FINISHING_BATHROOMS", specTypeKey: "standard_set", options: {} },
		{ categoryKey: "FINISHING_MARBLE_VANITIES", specTypeKey: "marble_local", options: {} },
		{ categoryKey: "FINISHING_KITCHEN", specTypeKey: "mdf_lacquer", options: { countertop: "local_granite" } },
		{ categoryKey: "FINISHING_INTERNAL_STAIRS", specTypeKey: "marble", options: { hasNosing: false } },
		{ categoryKey: "FINISHING_EXTERNAL_STAIRS", specTypeKey: "granite", options: {} },
		{ categoryKey: "FINISHING_RAILINGS", specTypeKey: "wrought_iron", options: {} },
		{ categoryKey: "FINISHING_STONE_FACADE", specTypeKey: "natural_riyadh", options: {} },
		{ categoryKey: "FINISHING_FACADE_DECOR", specTypeKey: "grc_decor", options: {} },
		{ categoryKey: "FINISHING_YARD_PAVING", specTypeKey: "interlock_8cm", options: {} },
		{ categoryKey: "FINISHING_FENCE_GATES", specTypeKey: "iron_gate", options: { hasMotor: true, hasRemote: true } },
		{ categoryKey: "FINISHING_LANDSCAPING", specTypeKey: "artificial_grass", options: {} },
		{ categoryKey: "FINISHING_ROOF", specTypeKey: "waterproof_tiles", options: {} },
		{ categoryKey: "FINISHING_INTERIOR_DECOR", specTypeKey: "gypsum_decor", options: {} },
	],
	luxury: [
		{ categoryKey: "FINISHING_WATERPROOFING", specTypeKey: "bitumen_rolls", options: { layers: 3, hasReinforcement: true, hasProtection: "plaster_3cm" }, brand: "Index" },
		{ categoryKey: "FINISHING_THERMAL_INSULATION", specTypeKey: "xps_50", options: { thickness: 75, hasVaporBarrier: true }, brand: "SABIC" },
		{ categoryKey: "FINISHING_INTERNAL_PLASTER", specTypeKey: "gypsum_machine", options: { thickness: 10 }, brand: "Knauf" },
		{ categoryKey: "FINISHING_EXTERNAL_PLASTER", specTypeKey: "cement_machine", options: { thickness: 20, mixRatio: "1:3" } },
		{ categoryKey: "FINISHING_INTERIOR_PAINT", specTypeKey: "acrylic", options: { preparation: "full_putty", coats: 3 }, brand: "Caparol" },
		{ categoryKey: "FINISHING_FACADE_PAINT", specTypeKey: "elastomeric", options: { coats: 2 }, brand: "Caparol" },
		{ categoryKey: "FINISHING_BOUNDARY_PAINT", specTypeKey: "texture_exterior", options: { coats: 1 }, brand: "Caparol" },
		{ categoryKey: "FINISHING_FLOOR_TILES", specTypeKey: "porcelain_120x120", options: { installation: "adhesive", hasScreed: true, groutType: "normal" } },
		{ categoryKey: "FINISHING_WALL_TILES", specTypeKey: "porcelain_80x80", options: { installation: "adhesive", groutType: "epoxy" } },
		{ categoryKey: "FINISHING_FALSE_CEILING", specTypeKey: "gypsum_board_design", options: { boardType: "standard", includesPaint: true }, brand: "Knauf" },
		{ categoryKey: "FINISHING_INTERIOR_DOORS", specTypeKey: "solid_wood", options: {} },
		{ categoryKey: "FINISHING_EXTERIOR_DOORS", specTypeKey: "solid_wood_exterior", options: {} },
		{ categoryKey: "FINISHING_WINDOWS", specTypeKey: "upvc", options: { hasInsectScreen: true }, brand: "Rehau" },
		{ categoryKey: "FINISHING_BATHROOMS", specTypeKey: "premium_set", options: { hasBathtub: true }, brand: "TOTO" },
		{ categoryKey: "FINISHING_MARBLE_VANITIES", specTypeKey: "quartz", options: {} },
		{ categoryKey: "FINISHING_KITCHEN", specTypeKey: "acrylic", options: { countertop: "quartz" } },
		{ categoryKey: "FINISHING_INTERNAL_STAIRS", specTypeKey: "marble", options: { hasNosing: true } },
		{ categoryKey: "FINISHING_EXTERNAL_STAIRS", specTypeKey: "granite", options: { hasNosing: true } },
		{ categoryKey: "FINISHING_RAILINGS", specTypeKey: "glass_stainless", options: {} },
		{ categoryKey: "FINISHING_STONE_FACADE", specTypeKey: "natural_imported", options: {} },
		{ categoryKey: "FINISHING_FACADE_DECOR", specTypeKey: "grc_decor", options: {} },
		{ categoryKey: "FINISHING_YARD_PAVING", specTypeKey: "stamped_concrete", options: {} },
		{ categoryKey: "FINISHING_FENCE_GATES", specTypeKey: "aluminum_gate", options: { hasMotor: true, hasRemote: true } },
		{ categoryKey: "FINISHING_LANDSCAPING", specTypeKey: "natural_grass", options: { hasIrrigation: true } },
		{ categoryKey: "FINISHING_ROOF", specTypeKey: "waterproof_tiles", options: {} },
		{ categoryKey: "FINISHING_INTERIOR_DECOR", specTypeKey: "wood_decor", options: {} },
	],
};

export const applyTemplateToAll = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/specifications/apply-template",
		tags: ["Quantities", "Specifications"],
		summary: "Apply a quality level template to all finishing items",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			templateLevel: templateLevelEnum,
			scope: z.enum(["all", "floor", "category"]).default("all"),
			floorId: z.string().trim().max(100).optional(),
			categoryKey: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		const templateSpecs = SYSTEM_TEMPLATE_SPECS[input.templateLevel] ?? [];

		// Build a map of categoryKey → spec for quick lookup
		const specByCategory = new Map(
			templateSpecs.map((s) => [s.categoryKey, s]),
		);

		// Build where clause based on scope
		const where: Record<string, unknown> = {
			costStudyId: input.studyId,
			isEnabled: true,
		};
		if (input.scope === "floor" && input.floorId) {
			where.floorId = input.floorId;
		}
		if (input.scope === "category" && input.categoryKey) {
			where.category = input.categoryKey;
		}

		// Fetch matching finishing items
		const items = await db.finishingItem.findMany({
			where,
			select: { id: true, category: true },
		});

		// Update each item with matching template spec
		let updated = 0;
		await db.$transaction(
			items.map((item) => {
				const templateSpec = specByCategory.get(item.category);
				return db.finishingItem.update({
					where: { id: item.id },
					data: {
						qualityLevel: input.templateLevel,
						...(templateSpec
							? {
									specData: {
										categoryKey: templateSpec.categoryKey,
										specTypeKey: templateSpec.specTypeKey,
										specTypeLabel: templateSpec.specTypeKey,
										options: {
											...templateSpec.options,
											...(templateSpec.brand ? { brand: templateSpec.brand } : {}),
										},
									},
								}
							: {}),
					},
				});
			}),
		);
		updated = items.length;

		return { success: true, updated };
	});

// ═══════════════════════════════════════════════════════════════
// 4. APPLY SPEC TO ALL FLOORS
// ═══════════════════════════════════════════════════════════════

export const applySpecToAllFloors = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/specifications/apply-to-floors",
		tags: ["Quantities", "Specifications"],
		summary: "Apply spec data to all finishing items in a category",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			category: z.string().trim().max(200),
			specData: z.record(z.string(), z.unknown()),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		const result = await db.finishingItem.updateMany({
			where: {
				costStudyId: input.studyId,
				category: input.category,
				isEnabled: true,
			},
			data: { specData: input.specData as Record<string, unknown> as any },
		});

		return { success: true, updated: result.count };
	});

// ═══════════════════════════════════════════════════════════════
// 5. GENERATE BOM
// ═══════════════════════════════════════════════════════════════

// Fallback material rates per category (used when specData has no subItems)
const CATEGORY_FALLBACK_MATERIALS: Record<string, Array<{
	name: string; nameEn: string; unit: string; ratePerUnit: number; wastage: number;
}>> = {
	FINISHING_WATERPROOFING: [
		{ name: "لفات عزل / مادة عزل", nameEn: "Waterproofing Material", unit: "م٢", ratePerUnit: 1.15, wastage: 10 },
		{ name: "برايمر بيتومين", nameEn: "Bitumen Primer", unit: "لتر", ratePerUnit: 0.3, wastage: 5 },
	],
	FINISHING_THERMAL_INSULATION: [
		{ name: "ألواح عزل حراري", nameEn: "Insulation Boards", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
	],
	FINISHING_INTERNAL_PLASTER: [
		{ name: "اسمنت", nameEn: "Cement", unit: "كجم", ratePerUnit: 10, wastage: 5 },
		{ name: "رمل", nameEn: "Sand", unit: "م٣", ratePerUnit: 0.02, wastage: 10 },
	],
	FINISHING_EXTERNAL_PLASTER: [
		{ name: "اسمنت", nameEn: "Cement", unit: "كجم", ratePerUnit: 10, wastage: 5 },
		{ name: "رمل", nameEn: "Sand", unit: "م٣", ratePerUnit: 0.02, wastage: 10 },
	],
	FINISHING_INTERIOR_PAINT: [
		{ name: "برايمر", nameEn: "Primer", unit: "لتر", ratePerUnit: 0.15, wastage: 5 },
		{ name: "دهان", nameEn: "Paint", unit: "لتر", ratePerUnit: 0.35, wastage: 5 },
		{ name: "معجون", nameEn: "Putty", unit: "كجم", ratePerUnit: 0.5, wastage: 5 },
	],
	FINISHING_FACADE_PAINT: [
		{ name: "برايمر خارجي", nameEn: "Exterior Primer", unit: "لتر", ratePerUnit: 0.15, wastage: 5 },
		{ name: "دهان خارجي", nameEn: "Exterior Paint", unit: "لتر", ratePerUnit: 0.4, wastage: 5 },
	],
	FINISHING_BOUNDARY_PAINT: [
		{ name: "برايمر خارجي", nameEn: "Exterior Primer", unit: "لتر", ratePerUnit: 0.15, wastage: 5 },
		{ name: "دهان خارجي", nameEn: "Exterior Paint", unit: "لتر", ratePerUnit: 0.4, wastage: 5 },
	],
	FINISHING_FLOOR_TILES: [
		{ name: "بلاط", nameEn: "Tiles", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
		{ name: "لاصق بلاط", nameEn: "Tile Adhesive", unit: "كجم", ratePerUnit: 5, wastage: 5 },
		{ name: "روبة", nameEn: "Grout", unit: "كجم", ratePerUnit: 0.5, wastage: 10 },
	],
	FINISHING_WALL_TILES: [
		{ name: "بلاط جدران", nameEn: "Wall Tiles", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
		{ name: "لاصق بلاط", nameEn: "Tile Adhesive", unit: "كجم", ratePerUnit: 5, wastage: 5 },
		{ name: "روبة", nameEn: "Grout", unit: "كجم", ratePerUnit: 0.5, wastage: 10 },
	],
	FINISHING_FALSE_CEILING: [
		{ name: "ألواح جبس / سقف مستعار", nameEn: "Gypsum Boards / Ceiling", unit: "م٢", ratePerUnit: 1.1, wastage: 5 },
		{ name: "هيكل معدني", nameEn: "Metal Framework", unit: "م.ط", ratePerUnit: 3, wastage: 5 },
	],
	FINISHING_INTERIOR_DOORS: [
		{ name: "باب داخلي بالحلق", nameEn: "Interior Door with Frame", unit: "عدد", ratePerUnit: 1, wastage: 0 },
	],
	FINISHING_EXTERIOR_DOORS: [
		{ name: "باب خارجي", nameEn: "Exterior Door", unit: "عدد", ratePerUnit: 1, wastage: 0 },
	],
	FINISHING_WINDOWS: [
		{ name: "نافذة", nameEn: "Window", unit: "م٢", ratePerUnit: 1, wastage: 0 },
	],
	FINISHING_BATHROOMS: [
		{ name: "طقم أدوات صحية", nameEn: "Sanitary Set", unit: "طقم", ratePerUnit: 1, wastage: 0 },
	],
	FINISHING_KITCHEN: [
		{ name: "مطبخ", nameEn: "Kitchen Cabinet", unit: "م.ط", ratePerUnit: 1, wastage: 0 },
	],
	FINISHING_STONE_FACADE: [
		{ name: "حجر واجهات", nameEn: "Facade Stone", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
		{ name: "اسمنت لاصق", nameEn: "Stone Adhesive", unit: "كجم", ratePerUnit: 8, wastage: 5 },
	],
	FINISHING_YARD_PAVING: [
		{ name: "انترلوك / بلاط خارجي", nameEn: "Interlock / Paving", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
		{ name: "رمل تحتي", nameEn: "Base Sand", unit: "م٣", ratePerUnit: 0.05, wastage: 10 },
	],
};

/** Get BOM materials for a spec — tries subItems, then fallback rates by category */
function extractBomMaterials(
	spec: Record<string, unknown>,
	category: string,
): Array<{ name: string; nameEn: string | null; code: string | null; unit: string; ratePerUnit: number; wastage: number }> {
	// Path 1: specData has pre-calculated subItems
	const subItems = (spec.subItems ?? spec.materials ?? []) as Array<Record<string, unknown>>;
	if (Array.isArray(subItems) && subItems.length > 0) {
		return subItems.map((mat) => ({
			name: String(mat.name ?? ""),
			nameEn: mat.nameEn ? String(mat.nameEn) : null,
			code: mat.code ? String(mat.code) : null,
			unit: String(mat.unit ?? ""),
			ratePerUnit: Number(mat.ratePerUnit ?? mat.consumptionRate ?? 1),
			wastage: Number(mat.wastagePercent ?? 5),
		}));
	}

	// Path 2: Use fallback rates based on category
	const fallback = CATEGORY_FALLBACK_MATERIALS[category];
	if (fallback) {
		return fallback.map((f) => ({
			name: f.name,
			nameEn: f.nameEn,
			code: null,
			unit: f.unit,
			ratePerUnit: f.ratePerUnit,
			wastage: f.wastage,
		}));
	}

	// Path 3: Single entry using the spec type label
	const specLabel = spec.specTypeLabel ?? spec.specTypeKey;
	if (specLabel) {
		return [{
			name: String(specLabel),
			nameEn: null,
			code: null,
			unit: "م٢",
			ratePerUnit: 1,
			wastage: 5,
		}];
	}

	return [];
}

export const generateBOM = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/specifications/generate-bom",
		tags: ["Quantities", "Specifications"],
		summary: "Generate Bill of Materials from item specifications",
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
			{ section: "pricing", action: "studies" },
		);

		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		// Fetch items with specData
		const [allFinishing, allMep] = await Promise.all([
			db.finishingItem.findMany({
				where: { costStudyId: input.studyId, isEnabled: true },
			}),
			db.mEPItem.findMany({
				where: { costStudyId: input.studyId, isEnabled: true },
			}),
		]);
		const finishingItems = allFinishing.filter((i) => i.specData != null);
		const mepItems = allMep.filter((i) => i.specData != null);

		// Build BOM entries from specData
		const bomEntries: Array<{
			costStudyId: string;
			parentItemId: string;
			parentItemType: "FINISHING" | "MEP";
			parentCategory: string;
			materialName: string;
			materialNameEn: string | null;
			materialCode: string | null;
			quantity: number;
			unit: string;
			consumptionRate: number | null;
			wastagePercent: number;
			effectiveQuantity: number;
			floorId: string | null;
			floorName: string | null;
			sortOrder: number;
		}> = [];

		let sortOrder = 0;

		for (const item of finishingItems) {
			const spec = item.specData as Record<string, unknown> | null;
			if (!spec) continue;

			const materials = extractBomMaterials(spec, item.category);
			const baseQty = Number(item.area ?? item.quantity ?? 0);

			for (const mat of materials) {
				const rawQty = baseQty * mat.ratePerUnit;
				const effectiveQty = rawQty * (1 + mat.wastage / 100);

				bomEntries.push({
					costStudyId: input.studyId,
					parentItemId: item.id,
					parentItemType: "FINISHING",
					parentCategory: item.category,
					materialName: mat.name || item.name,
					materialNameEn: mat.nameEn,
					materialCode: mat.code,
					quantity: rawQty,
					unit: mat.unit || item.unit,
					consumptionRate: mat.ratePerUnit,
					wastagePercent: mat.wastage,
					effectiveQuantity: effectiveQty,
					floorId: item.floorId,
					floorName: item.floorName,
					sortOrder: sortOrder++,
				});
			}
		}

		for (const item of mepItems) {
			const spec = item.specData as Record<string, unknown> | null;
			if (!spec) continue;

			const materials = extractBomMaterials(spec, item.category);
			const baseQty = Number(item.quantity);

			for (const mat of materials) {
				const rawQty = baseQty * mat.ratePerUnit;
				const effectiveQty = rawQty * (1 + mat.wastage / 100);

				bomEntries.push({
					costStudyId: input.studyId,
					parentItemId: item.id,
					parentItemType: "MEP",
					parentCategory: item.category,
					materialName: mat.name || item.name,
					materialNameEn: mat.nameEn,
					materialCode: mat.code,
					quantity: rawQty,
					unit: mat.unit || item.unit,
					consumptionRate: mat.ratePerUnit,
					wastagePercent: mat.wastage,
					effectiveQuantity: effectiveQty,
					floorId: item.floorId,
					floorName: item.floorName,
					sortOrder: sortOrder++,
				});
			}
		}

		// Clear existing BOM and regenerate in a transaction
		await db.$transaction([
			db.materialBOM.deleteMany({ where: { costStudyId: input.studyId } }),
			...(bomEntries.length > 0
				? [db.materialBOM.createMany({ data: bomEntries })]
				: []),
		]);

		return { success: true, generated: bomEntries.length };
	});

// ═══════════════════════════════════════════════════════════════
// 6. GET BOM
// ═══════════════════════════════════════════════════════════════

export const getBOM = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/specifications/bom",
		tags: ["Quantities", "Specifications"],
		summary: "Get Bill of Materials entries for a study",
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
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { id: true },
		});

		if (!study) {
			throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
		}

		const entries = await db.materialBOM.findMany({
			where: { costStudyId: input.studyId },
			orderBy: [{ parentItemType: "asc" }, { parentCategory: "asc" }, { sortOrder: "asc" }],
		});

		return entries;
	});
