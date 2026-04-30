/**
 * Markup بـ نسبة مئوية على التكلفة.
 *
 * @example applyPercentageMarkup(100, 30) === 130
 *
 * النسبة 0 = بيع بسعر التكلفة (لا ربح)
 * النسبة سالبة = خسارة (مسموحة للسماح بـ promo، لكن المتصل سيُحذِّر)
 */
export function applyPercentageMarkup(unitCost: number, percent: number): number {
	if (!Number.isFinite(unitCost) || unitCost < 0) return 0;
	if (!Number.isFinite(percent)) return unitCost;
	return unitCost * (1 + percent / 100);
}
