import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { db } from "@repo/database";
import { z } from "zod";
import { toNum, convertCostingItemDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { dedupeCostingItems, summarizeCostingItems } from "../lib/costing-aggregation";
import { isUnifiedStudyServer } from "../../unified-quantities/lib/classify";

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

	// نسبة التخزين على المواد فقط — تبويب المواد في الواجهة يعرضها كذلك،
	// وإدراج المصنعيات هنا كان يجعل الملخص أكبر من مجموع التبويبين
	const storageTotal =
		materialTotal * ((data.storageCostPercent ?? 0) / 100) +
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

		return db.$transaction(async (tx) => {
			// قفل صف الدراسة لمنع التوليد المتزامن — طلبان متوازيان كانا يريان
			// كلاهما count == 0 فيُدرج كل منهما مجموعة كاملة (تضاعف تكلفة المواد)
			await tx.$queryRawUnsafe(
				"SELECT id FROM cost_studies WHERE id = $1 FOR UPDATE",
				input.studyId,
			);

			const study = await tx.costStudy.findFirst({
				where: { id: input.studyId, organizationId: input.organizationId },
				select: { id: true, workScopes: true, studyType: true },
			});
			if (!study) {
				throw new ORPCError("NOT_FOUND", { message: STUDY_ERRORS.NOT_FOUND });
			}

			// الدراسات الموحّدة تُسعِّر التشطيبات وMEP داخل مساحة العمل الموحدة
			// (QuantityItem) — توليدها هنا أيضاً يعني ازدواج تكلفتها. مرحلة
			// تسعير التكلفة تبقى للأعمال الإنشائية/اليدوية/العمالة فقط.
			const unifiedStudy = isUnifiedStudyServer({
				workScopes: study.workScopes,
				studyType: study.studyType,
			});

			// البنود الموجودة مسبقاً تُزامَن (كانت تُترك كما هي فتبقى الكميات
			// قديمة بعد تعديل مرحلة الكميات — عرض السعر يتسعّر بكميات بائتة)
			const existingRows = await tx.costingItem.findMany({
				where: { costStudyId: input.studyId },
				select: {
					id: true,
					sourceItemId: true,
					sourceItemType: true,
					quantity: true,
					updatedAt: true,
					materialUnitCost: true,
					laborType: true,
					laborUnitCost: true,
					laborQuantity: true,
					laborWorkers: true,
					laborSalary: true,
					laborMonths: true,
					storageCostPercent: true,
					storageCostFixed: true,
					otherCosts: true,
				},
			});

			// Fetch all source items
			const [structuralItems, finishingItems, mepItems, laborItems, manualItems] =
				await Promise.all([
					tx.structuralItem.findMany({
						where: { costStudyId: input.studyId },
						orderBy: { sortOrder: "asc" },
					}),
					tx.finishingItem.findMany({
						where: { costStudyId: input.studyId, isEnabled: true },
						orderBy: { sortOrder: "asc" },
					}),
					tx.mEPItem.findMany({
						where: { costStudyId: input.studyId, isEnabled: true },
						orderBy: { sortOrder: "asc" },
					}),
					tx.laborItem.findMany({
						where: { costStudyId: input.studyId },
					}),
					tx.manualItem.findMany({
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
			// — تُتخطى للدراسات الموحّدة (تُسعَّر في مساحة العمل الموحدة)
			for (const item of unifiedStudy ? [] : finishingItems) {
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

			// MEP items — تُتخطى للدراسات الموحّدة كذلك
			for (const item of unifiedStudy ? [] : mepItems) {
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

			if (existingRows.length === 0) {
				// توليد أولي
				if (items.length > 0) {
					await tx.costingItem.createMany({ data: items });
				}
				return { generated: items.length, existing: 0 };
			}

			// ─── مزامنة: تحديث الكميات المتغيرة، إدراج الجديد، حذف اليتيم ───
			// أسعار المستخدم (مواد/مصنعيات/تخزين) لا تُمس — الكمية فقط تُحدَّث
			const existingBySource = new Map<string, (typeof existingRows)[number]>();
			for (const row of existingRows) {
				if (!row.sourceItemId) continue; // البنود اليدوية المضافة مباشرة لا تُزامَن
				const key = `${row.sourceItemType ?? ""}:${row.sourceItemId}`;
				const prev = existingBySource.get(key);
				// عند وجود تكرارات تاريخية نزامن الأحدث فقط
				if (!prev || row.updatedAt > prev.updatedAt) {
					existingBySource.set(key, row);
				}
			}

			let created = 0;
			let updated = 0;
			const seenKeys = new Set<string>();
			const toCreate: typeof items = [];

			for (const item of items) {
				const key = `${item.sourceItemType}:${item.sourceItemId}`;
				seenKeys.add(key);
				const existing = existingBySource.get(key);
				if (!existing) {
					toCreate.push(item);
					created++;
				} else if (Math.abs(Number(existing.quantity) - item.quantity) > 0.001) {
					// إعادة حساب الإجماليات بالكمية الجديدة مع أسعار المستخدم المخزنة
					const totals = calculateItemTotals({
						quantity: item.quantity,
						materialUnitCost:
							existing.materialUnitCost != null
								? Number(existing.materialUnitCost)
								: null,
						laborType: existing.laborType,
						laborUnitCost:
							existing.laborUnitCost != null
								? Number(existing.laborUnitCost)
								: null,
						laborQuantity:
							existing.laborQuantity != null
								? Number(existing.laborQuantity)
								: null,
						laborWorkers: existing.laborWorkers,
						laborSalary:
							existing.laborSalary != null ? Number(existing.laborSalary) : null,
						laborMonths: existing.laborMonths,
						storageCostPercent:
							existing.storageCostPercent != null
								? Number(existing.storageCostPercent)
								: null,
						storageCostFixed:
							existing.storageCostFixed != null
								? Number(existing.storageCostFixed)
								: null,
						otherCosts:
							existing.otherCosts != null ? Number(existing.otherCosts) : null,
					});
					await tx.costingItem.update({
						where: { id: existing.id },
						data: {
							quantity: item.quantity,
							description: item.description,
							unit: item.unit,
							materialTotal: totals.materialTotal,
							laborTotal: totals.laborTotal,
							storageTotal: totals.storageTotal,
							totalCost: totals.totalCost,
						},
					});
					updated++;
				}
			}

			// حذف: صفوف auto اليتيمة (بندها المصدري حُذف من مرحلة الكميات)
			// + الصفوف المكررة التاريخية لنفس البند المصدري (علة تضاعف المواد ×2)
			const orphanIds = existingRows
				.filter((row) => {
					if (!row.sourceItemId) return false;
					const key = `${row.sourceItemType ?? ""}:${row.sourceItemId}`;
					if (!seenKeys.has(key)) return true; // يتيم
					return existingBySource.get(key)?.id !== row.id; // نسخة مكررة أقدم
				})
				.map((row) => row.id);
			if (orphanIds.length > 0) {
				await tx.costingItem.deleteMany({ where: { id: { in: orphanIds } } });
			}

			return {
				generated: created,
				existing: existingRows.length,
				updated,
				removed: orphanIds.length,
			};
		});
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
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			section: z.string().trim().max(100).optional(),
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

		// dedupe مع الحفاظ على ترتيب العرض — يحمي من صفوف مكررة تاريخية لنفس البند المصدري
		const winners = new Set(dedupeCostingItems(items));
		return items
			.filter((item) => winners.has(item))
			.map((item) => convertCostingItemDecimals(item));
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
			organizationId: z.string().trim().max(100),
			itemId: z.string().trim().max(100),
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
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			items: z.array(
				z.object({
					id: z.string().trim().max(100),
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

				// تخزين القيم المدموجة نفسها التي حُسبت منها الإجماليات —
				// تخزين null الخام كان يجعل totalCost لا يطابق أعمدة الوحدة
				return db.costingItem.update({
					where: { id: update.id },
					data: {
						materialUnitCost: merged.materialUnitCost,
						laborType: merged.laborType,
						laborUnitCost: merged.laborUnitCost,
						laborQuantity: merged.laborQuantity,
						storageCostPercent: merged.storageCostPercent,
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
			organizationId: z.string().trim().max(100),
			studyId: z.string().trim().max(100),
			section: z.string().trim().max(200),
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

		const items = await db.costingItem.findMany({
			where: {
				costStudyId: input.studyId,
				organizationId: input.organizationId,
			},
		});

		const study = await db.costStudy.findFirst({
			where: { id: input.studyId, organizationId: input.organizationId },
			select: { overheadPercent: true },
		});

		// إزالة الصفوف المكررة (توليد متزامن تاريخي) قبل التجميع —
		// كانت تُضاعف تكلفة المواد دون المصنعيات (lump sum على صف واحد)
		const uniqueItems = dedupeCostingItems(items);

		const overheadPercent = toNum(study?.overheadPercent) || 5;
		return summarizeCostingItems(uniqueItems, overheadPercent);
	});
