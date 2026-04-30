// ════════════════════════════════════════════════════════════════
// VAT applier — تطبيق ضريبة القيمة المضافة (15% في السعودية افتراضياً)
// ════════════════════════════════════════════════════════════════

export interface VATResult {
	/** المبلغ بدون VAT */
	netAmount: number;
	/** قيمة VAT المضافة/المُستخرَجة */
	vatAmount: number;
	/** المبلغ شامل VAT */
	grossAmount: number;
}

/**
 * يطبّق VAT على مبلغ. وضعان:
 * - vatIncluded=false (افتراضي): المبلغ بدون VAT → يُضاف
 *   gross = net × (1 + vat/100)
 * - vatIncluded=true: المبلغ شامل VAT → يُستخرج
 *   net = gross / (1 + vat/100)
 *
 * الحسابات بدقة كاملة (لا تقريب داخلي). المتصل يقرّر التقريب.
 *
 * @throws Error لو vatPercent خارج النطاق [0, 100]
 */
export function applyVAT(
	amount: number,
	vatPercent = 15,
	vatIncluded = false,
): VATResult {
	if (!Number.isFinite(vatPercent) || vatPercent < 0 || vatPercent > 100) {
		throw new Error(`نسبة VAT يجب أن تكون بين 0 و 100. القيمة المُمرَّرة: ${vatPercent}`);
	}
	if (!Number.isFinite(amount)) {
		return { netAmount: 0, vatAmount: 0, grossAmount: 0 };
	}

	const factor = vatPercent / 100;

	if (vatIncluded) {
		const netAmount = amount / (1 + factor);
		const vatAmount = amount - netAmount;
		return { netAmount, vatAmount, grossAmount: amount };
	}

	const vatAmount = amount * factor;
	return {
		netAmount: amount,
		vatAmount,
		grossAmount: amount + vatAmount,
	};
}
