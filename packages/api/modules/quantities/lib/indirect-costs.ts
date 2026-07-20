import { toNum } from "../../../lib/decimal-helpers";

/**
 * المصاريف غير المباشرة للدراسة — سلك التربيط والمسامير، الإشراف الهندسي
 * والميداني، ومصاريف التشغيل (سكن العمال، الإعاشة، النثريات، ...).
 *
 * تُخزَّن الإعدادات داخل CostStudy.laborBreakdown.indirectCosts (JSON —
 * بدون تعديل Schema)، ويُعاد حساب الإجمالي هنا على السيرفر من المكوّنات
 * الخام حتى لا يُعتمد على قيمة total محسوبة في المتصفح.
 *
 * هذه المصاريف جزء من التكلفة: تدخل في totalCost قبل هامش الربح
 * والمصاريف الإدارية، وقبل ضريبة القيمة المضافة — الضريبة لا تدخل في
 * الربح إطلاقاً.
 */

export interface SupervisionRow {
	id: string;
	role: string;
	count: number;
	monthlySalary: number;
	months: number;
}

export interface OperatingRow {
	id: string;
	label: string;
	amount: number;
}

export interface IndirectCostsBreakdown {
	tieWireTotal: number;
	nailsTotal: number;
	consumablesTotal: number;
	supervisionTotal: number;
	operatingTotal: number;
	total: number;
}

const EMPTY: IndirectCostsBreakdown = {
	tieWireTotal: 0,
	nailsTotal: 0,
	consumablesTotal: 0,
	supervisionTotal: 0,
	operatingTotal: 0,
	total: 0,
};

/**
 * يحسب إجمالي المصاريف غير المباشرة من laborBreakdown.indirectCosts.
 * يقبل قيمة laborBreakdown الخام (Json من Prisma) ويتسامح مع الغياب.
 */
export function computeIndirectCosts(
	laborBreakdown: unknown,
): IndirectCostsBreakdown {
	const breakdown = laborBreakdown as Record<string, unknown> | null;
	const raw = breakdown?.indirectCosts as Record<string, unknown> | undefined;
	if (!raw) return { ...EMPTY };

	// سلك التربيط: كجم لكل طن حديد × أطنان الحديد × سعر الكجم
	const steelTons = toNum(raw.steelTons);
	const tieWireTotal =
		raw.tieWireEnabled === false
			? 0
			: steelTons * toNum(raw.tieWireKgPerTon) * toNum(raw.tieWirePricePerKg);

	// المسامير: كجم لكل م² شدات × مساحة الشدات × سعر الكجم
	const formworkArea = toNum(raw.formworkArea);
	const nailsTotal =
		raw.nailsEnabled === false
			? 0
			: formworkArea * toNum(raw.nailsKgPerSqm) * toNum(raw.nailsPricePerKg);

	// الإشراف: عدد × راتب شهري × أشهر لكل دور (مهندس مشرف، مشرف ميداني، ...)
	const supervisionRows = Array.isArray(raw.supervision)
		? (raw.supervision as Array<Record<string, unknown>>)
		: [];
	const supervisionTotal = supervisionRows.reduce(
		(sum, row) =>
			sum + toNum(row.count) * toNum(row.monthlySalary) * toNum(row.months),
		0,
	);

	// مصاريف التشغيل: مبالغ مقطوعة (سكن، إعاشة، كهرباء وماء، نقل، ...)
	const operatingRows = Array.isArray(raw.operating)
		? (raw.operating as Array<Record<string, unknown>>)
		: [];
	const operatingTotal = operatingRows.reduce(
		(sum, row) => sum + toNum(row.amount),
		0,
	);

	const consumablesTotal = tieWireTotal + nailsTotal;
	return {
		tieWireTotal,
		nailsTotal,
		consumablesTotal,
		supervisionTotal,
		operatingTotal,
		total: consumablesTotal + supervisionTotal + operatingTotal,
	};
}
