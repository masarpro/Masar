import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { updateGlobalMarkupSchema } from "../../schemas/pricing.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { calculatePricing } from "../../pricing/pricing-calculator";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

/**
 * POST /unified-quantities/pricing/update-global-markup
 *
 * applyMode:
 * - "non_custom_only" (الافتراضي الآمن): يُحدِّث globalMarkupPercent ويعيد
 *   حساب البنود التي hasCustomMarkup=false فقط. البنود المخصّصة تبقى.
 * - "all_items": ⚠️ يمسح كل التخصيصات ويُجبر كل البنود على Global الجديد.
 *   مدمّر — UI يجب يطلب confirmation قبل الاستدعاء.
 */
export const updateGlobalMarkup = subscriptionProcedure
	.input(updateGlobalMarkupSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		// 1. اختر البنود المتأثّرة
		const items = await db.quantityItem.findMany({
			where: {
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
				...(input.applyMode === "non_custom_only"
					? { hasCustomMarkup: false }
					: {}),
			},
		});

		// 2. جهّز تحديثات البنود
		const itemUpdateOps = items.map((item) => {
			const r = calculatePricing({
				effectiveQuantity: item.effectiveQuantity.toString(),
				materialUnitPrice: item.materialUnitPrice?.toString(),
				laborUnitPrice: item.laborUnitPrice?.toString(),
				markupMethod: "percentage",
				markupPercent: input.globalMarkupPercent,
				globalMarkupPercent: input.globalMarkupPercent,
				hasCustomMarkup: false, // نُجبر اتباع الـ Global
			});

			return db.quantityItem.update({
				where: { id: item.id },
				data: {
					markupMethod: "percentage",
					markupPercent: input.globalMarkupPercent,
					markupFixedAmount: null,
					manualUnitPrice: null,
					hasCustomMarkup: false,
					materialCost: r.materialCost,
					laborCost: r.laborCost,
					totalCost: r.totalCost,
					sellUnitPrice: r.sellUnitPrice,
					sellTotalAmount: r.sellTotalAmount,
					profitAmount: r.profitAmount,
					profitPercent: r.profitPercent,
					updatedById: context.user.id,
				},
			});
		});

		// 3. حدِّث الدراسة + كل البنود ذرّياً في transaction واحدة
		// (كان تحديث الدراسة ثم loop خارج transaction → حالة غير متّسقة عند الفشل).
		const [study] = await db.$transaction([
			db.costStudy.update({
				where: { id: input.costStudyId },
				data: { globalMarkupPercent: input.globalMarkupPercent },
			}),
			...itemUpdateOps,
		]);
		const updatedCount = itemUpdateOps.length;

		const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

		return {
			study,
			updatedCount,
			applyMode: input.applyMode,
			studyTotals: totals,
		};
	});
