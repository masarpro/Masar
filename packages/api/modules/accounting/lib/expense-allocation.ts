/**
 * توزيع مصروفات الشركة على مراكز التكلفة (طبقة القراءة فقط — لا قيود محاسبية).
 *
 * القاعدة: مجموع الموزَّع يساوي أصل المبلغ الموزَّع بالضبط —
 * كسور التقريب تُسند لآخر مركز تكلفة (نمط largest remainder).
 */

function round2(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface AllocationShare {
	key: string;
	percentage: number;
}

/**
 * يوزّع مبلغاً على مفاتيح (مراكز تكلفة/مشاريع) وفق نسب مئوية.
 * - النسب قد لا تصل مجموعها إلى 100% (الجزء غير الموزَّع يبقى عاماً).
 * - الأجزاء تُقرَّب لخانتين، والفرق يُسند للمفتاح الأخير بحيث:
 *   مجموع الأجزاء === round2(المبلغ × مجموع النسب / 100) بالضبط.
 */
export function allocateByPercentages(
	amount: number,
	shares: AllocationShare[],
): Array<{ key: string; amount: number }> {
	if (shares.length === 0 || amount === 0) {
		return shares.map((s) => ({ key: s.key, amount: 0 }));
	}

	const totalPercent = shares.reduce((sum, s) => sum + s.percentage, 0);
	const exactTotal = round2((amount * totalPercent) / 100);

	const parts: Array<{ key: string; amount: number }> = [];
	let allocatedSoFar = 0;

	for (let i = 0; i < shares.length; i++) {
		if (i < shares.length - 1) {
			const part = round2((amount * shares[i].percentage) / 100);
			parts.push({ key: shares[i].key, amount: part });
			allocatedSoFar = round2(allocatedSoFar + part);
		} else {
			// آخر مركز يستلم الفرق — يضمن مجموعاً مطابقاً للأصل الموزَّع
			parts.push({
				key: shares[i].key,
				amount: round2(exactTotal - allocatedSoFar),
			});
		}
	}

	return parts;
}
