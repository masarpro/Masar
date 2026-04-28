import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { bulkUpdatePricingSchema } from "../../schemas/pricing.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { solvePricing } from "../../pricing/bi-directional-solver";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

/**
 * POST /unified-quantities/pricing/bulk-update
 * يُطبّق نفس التغيير على عدة بنود دفعة واحدة (مثلاً: تعديل سعر مادة في
 * 5 بنود سيراميك مرة واحدة).
 *
 * يقبل فقط الحقول الآمنة بدون استنتاج (لا sell_unit_price / sell_total).
 */
export const bulkUpdatePricing = subscriptionProcedure
	.input(bulkUpdatePricingSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const study = await loadStudy(input.costStudyId, input.organizationId);

		const items = await db.quantityItem.findMany({
			where: {
				id: { in: input.itemIds },
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
			},
		});

		if (items.length !== input.itemIds.length) {
			throw new Error("بعض البنود لا تنتمي للدراسة المحدّدة");
		}

		let updatedCount = 0;
		for (const item of items) {
			const r = solvePricing({
				changedField: input.changedField,
				newValue: input.newValue,
				effectiveQuantity: item.effectiveQuantity.toString(),
				materialUnitPrice: item.materialUnitPrice?.toString() ?? 0,
				laborUnitPrice: item.laborUnitPrice?.toString() ?? 0,
				currentMarkupMethod: item.markupMethod,
				currentMarkupPercent: item.markupPercent?.toString() ?? undefined,
				currentMarkupFixedAmount: item.markupFixedAmount?.toString() ?? undefined,
				currentManualUnitPrice: item.manualUnitPrice?.toString() ?? undefined,
				hasCustomMarkup: item.hasCustomMarkup,
				globalMarkupPercent: study.globalMarkupPercent.toString(),
			});

			await db.quantityItem.update({
				where: { id: item.id },
				data: {
					materialUnitPrice: r.materialUnitPrice,
					laborUnitPrice: r.laborUnitPrice,
					materialCost: r.materialUnitPrice * Number(item.effectiveQuantity),
					laborCost: r.laborUnitPrice * Number(item.effectiveQuantity),
					totalCost:
						(r.materialUnitPrice + r.laborUnitPrice) *
						Number(item.effectiveQuantity),
					markupMethod: r.markupMethod,
					markupPercent: r.markupPercent,
					markupFixedAmount: r.markupFixedAmount,
					manualUnitPrice: r.manualUnitPrice,
					sellUnitPrice: r.sellUnitPrice,
					sellTotalAmount: r.sellTotalAmount,
					profitAmount: r.profitAmount,
					profitPercent: r.profitPercent,
					hasCustomMarkup: r.hasCustomMarkup,
					updatedById: context.user.id,
				},
			});
			updatedCount++;
		}

		const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

		return { updatedCount, studyTotals: totals };
	});
