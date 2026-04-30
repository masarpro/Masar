import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { upsertQuantityItemSchema } from "../../schemas/quantity-item.schema";
import {
	loadItem,
	loadStudy,
	requireStudyAccess,
} from "../../lib/verify-access";
import { compute } from "../../compute/item-computer";
import { calculatePricing } from "../../pricing/pricing-calculator";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";
import { num } from "../../compute/types";
import type {
	ComputeContext,
	ComputeContextOpening,
	ComputeContextSpace,
} from "../../compute/types";

/**
 * POST /unified-quantities/items/upsert
 *
 * يحفظ بنداً جديداً أو يُحدِّث موجوداً، مع:
 * 1. حساب الكمية (compute) — يستخدم السياق + الفتحات + الربط
 * 2. حساب التسعير (calculatePricing) — مع Global vs Custom routing
 * 3. حفظ كل القيم cached
 * 4. تحديث إجماليات الدراسة (aggregateStudyTotals)
 */
export const upsertItem = subscriptionProcedure
	.input(upsertQuantityItemSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const study = await loadStudy(input.costStudyId, input.organizationId);

		// 1. اجلب السياق (لو موجود) — للـ openings & spaces
		const ctx = await db.quantityItemContext.findUnique({
			where: { costStudyId: input.costStudyId },
			include: { spaces: true, openings: true },
		});
		const computeContext: ComputeContext | null = ctx
			? {
					totalFloorArea: ctx.totalFloorArea?.toString(),
					totalWallArea: ctx.totalWallArea?.toString(),
					totalExteriorWallArea: ctx.totalExteriorWallArea?.toString(),
					totalRoofArea: ctx.totalRoofArea?.toString(),
					totalPerimeter: ctx.totalPerimeter?.toString(),
					averageFloorHeight: ctx.averageFloorHeight?.toString(),
					yardArea: ctx.yardArea?.toString(),
					fenceLength: ctx.fenceLength?.toString(),
					spaces: ctx.spaces.map<ComputeContextSpace>((s) => ({
						isWetArea: s.isWetArea,
						computedFloorArea: s.computedFloorArea?.toString(),
						computedWallArea: s.computedWallArea?.toString(),
						floorArea: s.floorArea?.toString(),
						wallPerimeter: s.wallPerimeter?.toString(),
					})),
					openings: ctx.openings.map<ComputeContextOpening>((o) => ({
						computedArea: o.computedArea.toString(),
						count: o.count,
						isExterior: o.isExterior,
						deductFromInteriorFinishes: o.deductFromInteriorFinishes,
					})),
				}
			: null;

		// 2. اجلب البند المصدر إذا مرتبط
		let linkedFromItem = null;
		if (input.linkedFromItemId) {
			linkedFromItem = await db.quantityItem.findFirst({
				where: {
					id: input.linkedFromItemId,
					organizationId: input.organizationId,
					costStudyId: input.costStudyId,
				},
				select: {
					effectiveQuantity: true,
					computedQuantity: true,
					unit: true,
				},
			});
			if (!linkedFromItem) {
				// المصدر إما لا يوجد أو في دراسة أخرى — تجاهل الربط
				input.linkedFromItemId = null;
			}
		}

		// 3. احسب الكمية
		const quantityResult = compute({
			item: {
				calculationMethod: input.calculationMethod,
				unit: input.unit,
				primaryValue: input.primaryValue,
				secondaryValue: input.secondaryValue,
				tertiaryValue: input.tertiaryValue,
				wastagePercent: input.wastagePercent,
				deductOpenings: input.deductOpenings,
				polygonPoints: input.polygonPoints,
				linkedFromItemId: input.linkedFromItemId,
				linkQuantityFormula: input.linkQuantityFormula,
				linkPercentValue: input.linkPercentValue,
			},
			context: computeContext,
			openings: computeContext?.openings,
			linkedFromItem: linkedFromItem
				? {
						effectiveQuantity: linkedFromItem.effectiveQuantity.toString(),
						computedQuantity: linkedFromItem.computedQuantity.toString(),
						unit: linkedFromItem.unit,
					}
				: null,
		});

		// 4. احسب التسعير
		const pricingResult = calculatePricing({
			effectiveQuantity: quantityResult.effectiveQuantity,
			materialUnitPrice: input.materialUnitPrice,
			laborUnitPrice: input.laborUnitPrice,
			markupMethod: input.markupMethod,
			markupPercent: input.markupPercent,
			markupFixedAmount: input.markupFixedAmount,
			manualUnitPrice: input.manualUnitPrice,
			globalMarkupPercent: num(study.globalMarkupPercent.toString(), 0),
			hasCustomMarkup: input.hasCustomMarkup,
		});

		// 5. ابنِ data للحفظ
		const data = {
			costStudyId: input.costStudyId,
			organizationId: input.organizationId,
			domain: input.domain,
			categoryKey: input.categoryKey,
			catalogItemKey: input.catalogItemKey,
			displayName: input.displayName,
			sortOrder: input.sortOrder,
			isEnabled: input.isEnabled,
			primaryValue: input.primaryValue,
			secondaryValue: input.secondaryValue,
			tertiaryValue: input.tertiaryValue,
			calculationMethod: input.calculationMethod,
			unit: input.unit,
			wastagePercent: input.wastagePercent,
			contextSpaceId: input.contextSpaceId ?? null,
			contextScope: input.contextScope ?? null,
			deductOpenings: input.deductOpenings,
			polygonPoints: input.polygonPoints ?? undefined,
			linkedFromItemId: input.linkedFromItemId ?? null,
			linkQuantityFormula: input.linkQuantityFormula ?? null,
			linkPercentValue: input.linkPercentValue,
			specMaterialName: input.specMaterialName ?? null,
			specMaterialBrand: input.specMaterialBrand ?? null,
			specMaterialGrade: input.specMaterialGrade ?? null,
			specColor: input.specColor ?? null,
			specSource: input.specSource ?? null,
			specNotes: input.specNotes ?? null,
			materialUnitPrice: input.materialUnitPrice,
			laborUnitPrice: input.laborUnitPrice,
			markupMethod: pricingResult.effectiveMarkupMethod,
			markupPercent: input.markupPercent,
			markupFixedAmount: input.markupFixedAmount,
			manualUnitPrice: input.manualUnitPrice,
			hasCustomMarkup: input.hasCustomMarkup,
			notes: input.notes ?? null,
			// computed
			computedQuantity: quantityResult.computedQuantity,
			effectiveQuantity: quantityResult.effectiveQuantity,
			openingsArea: quantityResult.openingsArea,
			materialCost: pricingResult.materialCost,
			laborCost: pricingResult.laborCost,
			totalCost: pricingResult.totalCost,
			sellUnitPrice: pricingResult.sellUnitPrice,
			sellTotalAmount: pricingResult.sellTotalAmount,
			profitAmount: pricingResult.profitAmount,
			profitPercent: pricingResult.profitPercent,
		};

		let savedItem;
		if (input.id) {
			await loadItem(input.id, input.organizationId, input.costStudyId);
			savedItem = await db.quantityItem.update({
				where: { id: input.id },
				data: { ...data, updatedById: context.user.id },
			});
		} else {
			savedItem = await db.quantityItem.create({
				data: { ...data, createdById: context.user.id },
			});
		}

		// 6. حدِّث إجماليات الدراسة (cached)
		const totals = await aggregateStudyTotals(
			input.costStudyId,
			input.organizationId,
		);

		return {
			item: savedItem,
			quantityBreakdown: quantityResult.breakdown,
			pricingBreakdown: pricingResult.breakdown,
			warnings: [...quantityResult.warnings, ...pricingResult.warnings],
			studyTotals: totals,
		};
	});
