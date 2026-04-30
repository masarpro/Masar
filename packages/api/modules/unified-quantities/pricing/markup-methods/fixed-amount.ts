/**
 * Markup بـ مبلغ ثابت يُضاف على التكلفة.
 *
 * @example applyFixedAmountMarkup(25, 10) === 35  (سعر بيع = تكلفة + 10 ر.س)
 *
 * المبلغ السالب = خسارة (مسموح، يُحذِّر المتصل).
 */
export function applyFixedAmountMarkup(unitCost: number, fixedAmount: number): number {
	if (!Number.isFinite(unitCost) || unitCost < 0) return Math.max(0, fixedAmount);
	if (!Number.isFinite(fixedAmount)) return unitCost;
	return unitCost + fixedAmount;
}
