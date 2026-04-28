import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { updatePricingSchema } from "../../schemas/pricing.schema";
import { loadItem, requireStudyAccess } from "../../lib/verify-access";
import { solvePricing } from "../../pricing/bi-directional-solver";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

/**
 * POST /unified-quantities/pricing/update
 * Bi-directional — يحلّ التسعير من أي حقل واحد عُدِّل.
 */
export const updatePricing = subscriptionProcedure
	.input(updatePricingSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const item = await loadItem(input.id, input.organizationId);

		const study = await db.costStudy.findFirstOrThrow({
			where: { id: item.costStudyId },
			select: { globalMarkupPercent: true },
		});

		const result = solvePricing({
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

		const updated = await db.quantityItem.update({
			where: { id: input.id },
			data: {
				materialUnitPrice: result.materialUnitPrice,
				laborUnitPrice: result.laborUnitPrice,
				materialCost: result.materialUnitPrice * Number(item.effectiveQuantity),
				laborCost: result.laborUnitPrice * Number(item.effectiveQuantity),
				totalCost:
					(result.materialUnitPrice + result.laborUnitPrice) *
					Number(item.effectiveQuantity),
				markupMethod: result.markupMethod,
				markupPercent: result.markupPercent,
				markupFixedAmount: result.markupFixedAmount,
				manualUnitPrice: result.manualUnitPrice,
				sellUnitPrice: result.sellUnitPrice,
				sellTotalAmount: result.sellTotalAmount,
				profitAmount: result.profitAmount,
				profitPercent: result.profitPercent,
				hasCustomMarkup: result.hasCustomMarkup,
				updatedById: context.user.id,
			},
		});

		const totals = await aggregateStudyTotals(item.costStudyId, input.organizationId);

		return {
			item: updated,
			warnings: result.warnings,
			studyTotals: totals,
		};
	});
