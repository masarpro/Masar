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
			organizationId: z.string(),
			studyId: z.string(),
			itemId: z.string(),
			itemType: itemTypeEnum,
			specData: z.any(),
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
					data: { specData: input.specData },
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
					data: { specData: input.specData },
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
					data: { dimensions: input.specData },
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

export const applyTemplateToAll = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/specifications/apply-template",
		tags: ["Quantities", "Specifications"],
		summary: "Apply a quality level template to all finishing items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			templateLevel: templateLevelEnum,
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
			where: { costStudyId: input.studyId, isEnabled: true },
			data: { qualityLevel: input.templateLevel },
		});

		return { success: true, updated: result.count };
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
			organizationId: z.string(),
			studyId: z.string(),
			category: z.string(),
			specData: z.any(),
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
			data: { specData: input.specData },
		});

		return { success: true, updated: result.count };
	});

// ═══════════════════════════════════════════════════════════════
// 5. GENERATE BOM
// ═══════════════════════════════════════════════════════════════

export const generateBOM = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/specifications/generate-bom",
		tags: ["Quantities", "Specifications"],
		summary: "Generate Bill of Materials from item specifications",
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

			const materials = (spec.materials ?? []) as Array<Record<string, unknown>>;
			const baseQty = Number(item.area ?? item.quantity ?? 0);

			for (const mat of materials) {
				const rate = Number(mat.consumptionRate ?? 1);
				const wastage = Number(mat.wastagePercent ?? Number(item.wastagePercent ?? 0));
				const rawQty = baseQty * rate;
				const effectiveQty = rawQty * (1 + wastage / 100);

				bomEntries.push({
					costStudyId: input.studyId,
					parentItemId: item.id,
					parentItemType: "FINISHING",
					parentCategory: item.category,
					materialName: String(mat.name ?? item.name),
					materialNameEn: mat.nameEn ? String(mat.nameEn) : null,
					materialCode: mat.code ? String(mat.code) : null,
					quantity: rawQty,
					unit: String(mat.unit ?? item.unit),
					consumptionRate: rate,
					wastagePercent: wastage,
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

			const materials = (spec.materials ?? []) as Array<Record<string, unknown>>;
			const baseQty = Number(item.quantity);

			for (const mat of materials) {
				const rate = Number(mat.consumptionRate ?? 1);
				const wastage = Number(mat.wastagePercent ?? Number(item.wastagePercent ?? 0));
				const rawQty = baseQty * rate;
				const effectiveQty = rawQty * (1 + wastage / 100);

				bomEntries.push({
					costStudyId: input.studyId,
					parentItemId: item.id,
					parentItemType: "MEP",
					parentCategory: item.category,
					materialName: String(mat.name ?? item.name),
					materialNameEn: mat.nameEn ? String(mat.nameEn) : null,
					materialCode: mat.code ? String(mat.code) : null,
					quantity: rawQty,
					unit: String(mat.unit ?? item.unit),
					consumptionRate: rate,
					wastagePercent: wastage,
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
