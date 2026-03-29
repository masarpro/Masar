import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { toNum, convertCostingItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

function calculateItemTotals(data: {
	quantity: number;
	materialUnitCost?: number | null;
	laborType?: string | null;
	laborUnitCost?: number | null;
	laborQuantity?: number | null;
	laborWorkers?: number | null;
	laborSalary?: number | null;
	laborMonths?: number | null;
	storageCostPercent?: number | null;
	storageCostFixed?: number | null;
	otherCosts?: number | null;
}) {
	const materialTotal = (data.materialUnitCost ?? 0) * data.quantity;

	let laborTotal = 0;
	switch (data.laborType) {
		case "PER_SQM":
		case "PER_CBM":
		case "PER_UNIT":
		case "PER_LM":
			laborTotal = (data.laborUnitCost ?? 0) * (data.laborQuantity ?? data.quantity);
			break;
		case "LUMP_SUM":
			laborTotal = data.laborUnitCost ?? 0;
			break;
		case "SALARY":
			laborTotal = (data.laborWorkers ?? 0) * (data.laborSalary ?? 0) * (data.laborMonths ?? 0);
			break;
	}

	const storageTotal =
		(materialTotal + laborTotal) * ((data.storageCostPercent ?? 0) / 100) +
		(data.storageCostFixed ?? 0);

	const totalCost = materialTotal + laborTotal + storageTotal + (data.otherCosts ?? 0);

	return { materialTotal, laborTotal, storageTotal, totalCost };
}

// ═══════════════════════════════════════════════════════════════
// 1. GENERATE ITEMS
// ═══════════════════════════════════════════════════════════════

export const costingGenerateItems = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{studyId}/costing/generate",
		tags: ["Quantities", "Costing"],
		summary: "Generate costing items from study quantities",
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

		// Check if items already exist (idempotent)
		const existingCount = await db.costingItem.count({
			where: { costStudyId: input.studyId },
		});

		if (existingCount > 0) {
			return { generated: 0, existing: existingCount, message: "البنود موجودة مسبقاً" };
		}

		// Fetch all source items
		const [structuralItems, finishingItems, mepItems, laborItems, manualItems] =
			await Promise.all([
				db.structuralItem.findMany({
					where: { costStudyId: input.studyId },
					orderBy: { sortOrder: "asc" },
				}),
				db.finishingItem.findMany({
					where: { costStudyId: input.studyId, isEnabled: true },
					orderBy: { sortOrder: "asc" },
				}),
				db.mEPItem.findMany({
					where: { costStudyId: input.studyId, isEnabled: true },
					orderBy: { sortOrder: "asc" },
				}),
				db.laborItem.findMany({
					where: { costStudyId: input.studyId },
				}),
				db.manualItem.findMany({
					where: { costStudyId: input.studyId, organizationId: input.organizationId },
					orderBy: { sortOrder: "asc" },
				}),
			]);

		let sortOrder = 0;
		const items: Array<{
			costStudyId: string;
			organizationId: string;
			section: string;
			sourceItemId: string;
			sourceItemType: string;
			description: string;
			unit: string;
			quantity: number;
			sortOrder: number;
		}> = [];

		// Structural items
		for (const item of structuralItems) {
			items.push({
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				section: "STRUCTURAL",
				sourceItemId: item.id,
				sourceItemType: "StructuralItem",
				description: `${item.category} — ${item.name}`,
				unit: item.unit,
				quantity: Number(item.quantity),
				sortOrder: sortOrder++,
			});
		}

		// Finishing items (aggregated materials from specs)
		for (const item of finishingItems) {
			items.push({
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				section: "FINISHING",
				sourceItemId: item.id,
				sourceItemType: "FinishingItem",
				description: `${item.category} — ${item.name}`,
				unit: item.unit,
				quantity: Number(item.area ?? item.quantity ?? 0),
				sortOrder: sortOrder++,
			});
		}

		// MEP items
		for (const item of mepItems) {
			items.push({
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				section: "MEP",
				sourceItemId: item.id,
				sourceItemType: "MEPItem",
				description: `${item.category} — ${item.name}`,
				unit: item.unit,
				quantity: Number(item.quantity),
				sortOrder: sortOrder++,
			});
		}

		// Labor items
		for (const item of laborItems) {
			items.push({
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				section: "LABOR",
				sourceItemId: item.id,
				sourceItemType: "LaborItem",
				description: `${item.laborType} — ${item.name}`,
				unit: "يوم عمل",
				quantity: item.quantity * item.durationDays,
				sortOrder: sortOrder++,
			});
		}

		// Manual items
		for (const item of manualItems) {
			items.push({
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				section: "MANUAL",
				sourceItemId: item.id,
				sourceItemType: "ManualItem",
				description: item.description,
				unit: item.unit,
				quantity: Number(item.quantity),
				sortOrder: sortOrder++,
			});
		}

		if (items.length > 0) {
			await db.costingItem.createMany({ data: items });
		}

		return { generated: items.length, existing: 0 };
	});

// ═══════════════════════════════════════════════════════════════
// 2. GET ITEMS
// ═══════════════════════════════════════════════════════════════

export const costingGetItems = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/costing",
		tags: ["Quantities", "Costing"],
		summary: "Get costing items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			section: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const where: Record<string, unknown> = {
			costStudyId: input.studyId,
			organizationId: input.organizationId,
		};

		if (input.section) {
			where.section = input.section;
		}

		const items = await db.costingItem.findMany({
			where,
			orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
		});

		return items.map((item) => convertCostingItemDecimals(item));
	});

// ═══════════════════════════════════════════════════════════════
// 3. UPDATE ITEM
// ═══════════════════════════════════════════════════════════════

export const costingUpdateItem = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/costing/{itemId}",
		tags: ["Quantities", "Costing"],
		summary: "Update a costing item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			itemId: z.string(),
			materialUnitCost: z.number().nonnegative().nullable().optional(),
			laborType: z.enum(["PER_SQM", "PER_CBM", "PER_UNIT", "PER_LM", "LUMP_SUM", "SALARY"]).nullable().optional(),
			laborUnitCost: z.number().nonnegative().nullable().optional(),
			laborQuantity: z.number().nonnegative().nullable().optional(),
			laborWorkers: z.number().int().nonnegative().nullable().optional(),
			laborSalary: z.number().nonnegative().nullable().optional(),
			laborMonths: z.number().int().nonnegative().nullable().optional(),
			storageCostPercent: z.number().min(0).max(100).nullable().optional(),
			storageCostFixed: z.number().nonnegative().nullable().optional(),
			otherCosts: z.number().nonnegative().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const existing = await db.costingItem.findFirst({
			where: {
				id: input.itemId,
				organizationId: input.organizationId,
			},
		});

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.ITEM_NOT_FOUND,
			});
		}

		// Merge existing values with updates
		const merged = {
			quantity: Number(existing.quantity),
			materialUnitCost: input.materialUnitCost !== undefined ? input.materialUnitCost : (existing.materialUnitCost != null ? Number(existing.materialUnitCost) : null),
			laborType: input.laborType !== undefined ? input.laborType : existing.laborType,
			laborUnitCost: input.laborUnitCost !== undefined ? input.laborUnitCost : (existing.laborUnitCost != null ? Number(existing.laborUnitCost) : null),
			laborQuantity: input.laborQuantity !== undefined ? input.laborQuantity : (existing.laborQuantity != null ? Number(existing.laborQuantity) : null),
			laborWorkers: input.laborWorkers !== undefined ? input.laborWorkers : existing.laborWorkers,
			laborSalary: input.laborSalary !== undefined ? input.laborSalary : (existing.laborSalary != null ? Number(existing.laborSalary) : null),
			laborMonths: input.laborMonths !== undefined ? input.laborMonths : existing.laborMonths,
			storageCostPercent: input.storageCostPercent !== undefined ? input.storageCostPercent : (existing.storageCostPercent != null ? Number(existing.storageCostPercent) : null),
			storageCostFixed: input.storageCostFixed !== undefined ? input.storageCostFixed : (existing.storageCostFixed != null ? Number(existing.storageCostFixed) : null),
			otherCosts: input.otherCosts !== undefined ? input.otherCosts : (existing.otherCosts != null ? Number(existing.otherCosts) : null),
		};

		const totals = calculateItemTotals(merged);

		const { organizationId, itemId, ...updateFields } = input;
		const item = await db.costingItem.update({
			where: { id: itemId },
			data: {
				...updateFields,
				materialTotal: totals.materialTotal,
				laborTotal: totals.laborTotal,
				storageTotal: totals.storageTotal,
				totalCost: totals.totalCost,
			},
		});

		return convertCostingItemDecimals(item);
	});

// ═══════════════════════════════════════════════════════════════
// 4. BULK UPDATE PRICES
// ═══════════════════════════════════════════════════════════════

export const costingBulkUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{studyId}/costing/bulk",
		tags: ["Quantities", "Costing"],
		summary: "Bulk update costing item prices",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			items: z.array(
				z.object({
					id: z.string(),
					materialUnitCost: z.number().nonnegative().nullable().optional(),
					laborType: z.enum(["PER_SQM", "PER_CBM", "PER_UNIT", "PER_LM", "LUMP_SUM", "SALARY"]).nullable().optional(),
					laborUnitCost: z.number().nonnegative().nullable().optional(),
					laborQuantity: z.number().nonnegative().nullable().optional(),
					storageCostPercent: z.number().min(0).max(100).nullable().optional(),
				}),
			),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		// Fetch all existing items
		const existingItems = await db.costingItem.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				id: { in: input.items.map((i) => i.id) },
			},
		});

		const existingMap = new Map(existingItems.map((i) => [i.id, i]));

		await db.$transaction(
			input.items.map((update) => {
				const existing = existingMap.get(update.id);
				if (!existing) return db.costingItem.findFirst({ where: { id: "never" } });

				const merged = {
					quantity: Number(existing.quantity),
					materialUnitCost: update.materialUnitCost ?? (existing.materialUnitCost != null ? Number(existing.materialUnitCost) : null),
					laborType: update.laborType ?? existing.laborType,
					laborUnitCost: update.laborUnitCost ?? (existing.laborUnitCost != null ? Number(existing.laborUnitCost) : null),
					laborQuantity: update.laborQuantity ?? (existing.laborQuantity != null ? Number(existing.laborQuantity) : null),
					laborWorkers: existing.laborWorkers,
					laborSalary: existing.laborSalary != null ? Number(existing.laborSalary) : null,
					laborMonths: existing.laborMonths,
					storageCostPercent: update.storageCostPercent !== undefined ? update.storageCostPercent : (existing.storageCostPercent != null ? Number(existing.storageCostPercent) : null),
					storageCostFixed: existing.storageCostFixed != null ? Number(existing.storageCostFixed) : null,
					otherCosts: existing.otherCosts != null ? Number(existing.otherCosts) : null,
				};

				const totals = calculateItemTotals(merged);

				return db.costingItem.update({
					where: { id: update.id },
					data: {
						materialUnitCost: update.materialUnitCost,
						laborType: update.laborType,
						laborUnitCost: update.laborUnitCost,
						laborQuantity: update.laborQuantity,
						storageCostPercent: update.storageCostPercent,
						materialTotal: totals.materialTotal,
						laborTotal: totals.laborTotal,
						storageTotal: totals.storageTotal,
						totalCost: totals.totalCost,
					},
				});
			}),
		);

		return { success: true, updated: input.items.length };
	});

// ═══════════════════════════════════════════════════════════════
// 5. SET SECTION LABOR
// ═══════════════════════════════════════════════════════════════

export const costingSetSectionLabor = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/{studyId}/costing/section-labor",
		tags: ["Quantities", "Costing"],
		summary: "Apply labor cost to all items in a section",
	})
	.input(
		z.object({
			organizationId: z.string(),
			studyId: z.string(),
			section: z.string(),
			laborType: z.enum(["PER_SQM", "PER_CBM", "PER_UNIT", "PER_LM", "LUMP_SUM", "SALARY"]),
			laborUnitCost: z.number().nonnegative(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "studies" },
		);

		const items = await db.costingItem.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
				section: input.section,
			},
		});

		// The caller sends the TOTAL labor cost for the section (not a per-unit
		// rate).  Assign the full amount as a LUMP_SUM on the first item and
		// zero-out labor on the remaining items so that getSummary totals match.
		await db.$transaction(
			items.map((item, index) => {
				const isFirst = index === 0;
				const merged = {
					quantity: Number(item.quantity),
					materialUnitCost: item.materialUnitCost != null ? Number(item.materialUnitCost) : null,
					laborType: isFirst ? "LUMP_SUM" as const : null,
					laborUnitCost: isFirst ? input.laborUnitCost : null,
					laborQuantity: null,
					laborWorkers: null,
					laborSalary: null,
					laborMonths: null,
					storageCostPercent: item.storageCostPercent != null ? Number(item.storageCostPercent) : null,
					storageCostFixed: item.storageCostFixed != null ? Number(item.storageCostFixed) : null,
					otherCosts: item.otherCosts != null ? Number(item.otherCosts) : null,
				};

				const totals = calculateItemTotals(merged);

				return db.costingItem.update({
					where: { id: item.id },
					data: {
						laborType: isFirst ? "LUMP_SUM" : null,
						laborUnitCost: isFirst ? input.laborUnitCost : null,
						laborQuantity: null,
						materialTotal: totals.materialTotal,
						laborTotal: totals.laborTotal,
						storageTotal: totals.storageTotal,
						totalCost: totals.totalCost,
					},
				});
			}),
		);

		return { success: true, updated: items.length };
	});

// ═══════════════════════════════════════════════════════════════
// 6. GET SUMMARY
// ═══════════════════════════════════════════════════════════════

export const costingGetSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{studyId}/costing/summary",
		tags: ["Quantities", "Costing"],
		summary: "Get costing summary by section",
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

		const items = await db.costingItem.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
		});

		const study = await db.costStudy.findFirst({
			where: { id: input.studyId },
			select: { overheadPercent: true },
		});

		// Group by section
		const sectionMap = new Map<string, { materialTotal: number; laborTotal: number; storageTotal: number; otherTotal: number; total: number; itemCount: number }>();

		for (const item of items) {
			const s = item.section;
			const current = sectionMap.get(s) || { materialTotal: 0, laborTotal: 0, storageTotal: 0, otherTotal: 0, total: 0, itemCount: 0 };
			current.materialTotal += toNum(item.materialTotal);
			current.laborTotal += toNum(item.laborTotal);
			current.storageTotal += toNum(item.storageTotal);
			current.otherTotal += toNum(item.otherCosts);
			current.total += toNum(item.totalCost);
			current.itemCount += 1;
			sectionMap.set(s, current);
		}

		const sections = Array.from(sectionMap.entries()).map(([section, data]) => ({
			section,
			...data,
		}));

		const grandMaterial = sections.reduce((s, sec) => s + sec.materialTotal, 0);
		const grandLabor = sections.reduce((s, sec) => s + sec.laborTotal, 0);
		const grandStorage = sections.reduce((s, sec) => s + sec.storageTotal, 0);
		const grandOther = sections.reduce((s, sec) => s + sec.otherTotal, 0);
		const grandTotal = sections.reduce((s, sec) => s + sec.total, 0);

		const overheadPercent = toNum(study?.overheadPercent) || 5;
		const overheadAmount = grandTotal * (overheadPercent / 100);
		const costWithOverhead = grandTotal + overheadAmount;

		return {
			sections,
			grandTotal: {
				material: grandMaterial,
				labor: grandLabor,
				storage: grandStorage,
				other: grandOther,
				total: grandTotal,
			},
			overheadPercent,
			overheadAmount,
			costWithOverhead,
		};
	});
