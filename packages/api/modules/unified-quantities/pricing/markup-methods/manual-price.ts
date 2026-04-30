/**
 * سعر يدوي — يُتجاهل التكلفة كلياً ويُستخدم السعر المُدخَل مباشرة.
 *
 * @example applyManualPriceMarkup(150) === 150
 *
 * يُستخدم حين المستخدم يعرف السعر مسبقاً ولا يريد حساب markup.
 * لا يُسمح بـ سعر سالب — يُرجع 0.
 */
export function applyManualPriceMarkup(manualUnitPrice: number): number {
	if (!Number.isFinite(manualUnitPrice) || manualUnitPrice < 0) return 0;
	return manualUnitPrice;
}
