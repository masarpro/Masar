// ════════════════════════════════════════════════════════════════
// Wastage applier — تطبيق نسبة الهدر
// ════════════════════════════════════════════════════════════════

/**
 * يطبّق نسبة هدر على كمية. النسبة 0-100.
 *
 * @throws Error لو النسبة خارج النطاق
 * @example applyWastage(100, 10) === 110
 */
export function applyWastage(quantity: number, wastagePercent: number): number {
	if (!Number.isFinite(wastagePercent) || wastagePercent < 0 || wastagePercent > 100) {
		throw new Error(
			`نسبة الهدر يجب أن تكون بين 0 و 100. القيمة المُمرَّرة: ${wastagePercent}`,
		);
	}
	if (!Number.isFinite(quantity) || quantity < 0) {
		// كمية سالبة أو NaN — أعد 0 لتجنب نشر الخطأ
		return 0;
	}
	return quantity * (1 + wastagePercent / 100);
}
