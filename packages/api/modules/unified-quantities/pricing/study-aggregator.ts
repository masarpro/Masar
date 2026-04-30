// ════════════════════════════════════════════════════════════════
// Study Aggregator — يحسب إجماليات الدراسة من مجموعة بنود.
//
// تصميم بطبقتين:
// 1. aggregateItems(items, globalMarkupPercent, vatPercent, vatIncluded)
//    دالة pure — تأخذ snapshot لبنود وتُرجع StudyTotals (للاختبار بدون DB).
// 2. aggregateStudyTotals(costStudyId, organizationId)
//    wrapper يجلب من Prisma، يستدعي aggregateItems، ويُحدِّث الـ cache.
// ════════════════════════════════════════════════════════════════

import { db } from "@repo/database";
import type { PricedItemSnapshot, StudyTotals } from "./types";
import { num, round } from "../compute/types";
import { calculatePricing } from "./pricing-calculator";
import { applyVAT } from "./vat-applier";

/**
 * يحسب الإجماليات من بنود في الذاكرة (pure — قابل للاختبار).
 * يتجاهل البنود المعطّلة (isEnabled=false).
 *
 * Performance: استدعاء واحد لـ calculatePricing لكل بند نشط.
 * لا يلمس الـ DB.
 */
export function aggregateItems(
	items: PricedItemSnapshot[],
	globalMarkupPercent: number,
	vatPercent = 15,
	vatIncluded = false,
): StudyTotals {
	let totalMaterialCost = 0;
	let totalLaborCost = 0;
	let totalSellAmount = 0;
	let enabledItemCount = 0;

	for (const item of items) {
		if (item.isEnabled === false) continue;
		enabledItemCount++;

		const r = calculatePricing({
			effectiveQuantity: item.effectiveQuantity,
			materialUnitPrice: item.materialUnitPrice,
			laborUnitPrice: item.laborUnitPrice,
			markupMethod: item.markupMethod,
			markupPercent: item.markupPercent,
			markupFixedAmount: item.markupFixedAmount,
			manualUnitPrice: item.manualUnitPrice,
			globalMarkupPercent,
			hasCustomMarkup: item.hasCustomMarkup,
		});

		totalMaterialCost += r.materialCost;
		totalLaborCost += r.laborCost;
		totalSellAmount += r.sellTotalAmount;
	}

	const totalGrossCost = totalMaterialCost + totalLaborCost;
	const totalProfitAmount = totalSellAmount - totalGrossCost;
	const totalProfitPercent =
		totalSellAmount > 0 ? (totalProfitAmount / totalSellAmount) * 100 : 0;

	const vat = applyVAT(totalSellAmount, vatPercent, vatIncluded);

	return {
		totalMaterialCost: round(totalMaterialCost, 2),
		totalLaborCost: round(totalLaborCost, 2),
		totalGrossCost: round(totalGrossCost, 2),
		totalSellAmount: round(totalSellAmount, 2),
		totalProfitAmount: round(totalProfitAmount, 2),
		totalProfitPercent: round(totalProfitPercent, 4),
		itemCount: items.length,
		enabledItemCount,
		vat: {
			netAmount: round(vat.netAmount, 2),
			vatAmount: round(vat.vatAmount, 2),
			grossAmount: round(vat.grossAmount, 2),
		},
	};
}

/**
 * Wrapper يجلب من DB ويُحدِّث الـ cache في CostStudy.
 * — يُستدعى بعد كل تعديل بند للحفاظ على الإجماليات متّسقة.
 */
export async function aggregateStudyTotals(
	costStudyId: string,
	organizationId: string,
): Promise<StudyTotals> {
	const study = await db.costStudy.findFirst({
		where: { id: costStudyId, organizationId },
		include: { quantityItems: true },
	});

	if (!study) {
		throw new Error(`Study not found: ${costStudyId}`);
	}

	const snapshots: PricedItemSnapshot[] = study.quantityItems.map((it) => ({
		id: it.id,
		isEnabled: it.isEnabled,
		effectiveQuantity: it.effectiveQuantity as never,
		materialUnitPrice: it.materialUnitPrice as never,
		laborUnitPrice: it.laborUnitPrice as never,
		markupMethod: it.markupMethod,
		markupPercent: it.markupPercent as never,
		markupFixedAmount: it.markupFixedAmount as never,
		manualUnitPrice: it.manualUnitPrice as never,
		hasCustomMarkup: it.hasCustomMarkup,
	}));

	const totals = aggregateItems(
		snapshots,
		num(study.globalMarkupPercent.toString(), 0),
		num(study.vatPercent.toString(), 15),
		study.vatIncludedInPrices,
	);

	await db.costStudy.update({
		where: { id: costStudyId },
		data: {
			totalMaterialCost: totals.totalMaterialCost,
			totalLaborCost: totals.totalLaborCost,
			totalGrossCost: totals.totalGrossCost,
			totalSellAmount: totals.totalSellAmount,
			totalProfitAmount: totals.totalProfitAmount,
			totalProfitPercent: totals.totalProfitPercent,
		},
	});

	return totals;
}
