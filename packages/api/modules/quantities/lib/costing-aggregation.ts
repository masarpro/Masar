import { toNum } from "../../../lib/decimal-helpers";

/**
 * تجميع ملخص تسعير التكلفة — منطق نقي قابل للاختبار.
 *
 * السياق: التوليد المتزامن التاريخي كان قادراً على إنشاء صفوف CostingItem
 * مكررة لنفس البند المصدري (لا يوجد unique constraint في الـschema).
 * `dedupeCostingItems` يحمي طبقة القراءة من هذا التكرار.
 */

interface DedupeShape {
	sourceItemId: string | null;
	sourceItemType: string | null;
	updatedAt: Date;
}

/**
 * يزيل الصفوف المكررة لنفس البند المصدري (نفس sourceItemType + sourceItemId)
 * مبقياً الصف الأحدث تعديلاً — البنود اليدوية (sourceItemId = null) تمر كما هي.
 */
export function dedupeCostingItems<T extends DedupeShape>(items: T[]): T[] {
	const bySource = new Map<string, T>();
	const manualItems: T[] = [];

	for (const item of items) {
		if (!item.sourceItemId) {
			manualItems.push(item);
			continue;
		}
		const key = `${item.sourceItemType ?? ""}:${item.sourceItemId}`;
		const existing = bySource.get(key);
		if (!existing || item.updatedAt > existing.updatedAt) {
			bySource.set(key, item);
		}
	}

	return [...bySource.values(), ...manualItems];
}

interface SummaryItemShape {
	section: string;
	materialTotal: unknown;
	laborTotal: unknown;
	storageTotal: unknown;
	otherCosts: unknown;
	totalCost: unknown;
}

export interface CostingSectionSummary {
	section: string;
	materialTotal: number;
	laborTotal: number;
	storageTotal: number;
	otherTotal: number;
	total: number;
	itemCount: number;
}

/** يجمع البنود حسب القسم ويحسب الإجماليات + المصاريف الإدارية. */
export function summarizeCostingItems(
	items: SummaryItemShape[],
	overheadPercent: number,
) {
	const sectionMap = new Map<string, Omit<CostingSectionSummary, "section">>();

	for (const item of items) {
		const s = item.section;
		const current = sectionMap.get(s) || {
			materialTotal: 0,
			laborTotal: 0,
			storageTotal: 0,
			otherTotal: 0,
			total: 0,
			itemCount: 0,
		};
		current.materialTotal += toNum(item.materialTotal);
		current.laborTotal += toNum(item.laborTotal);
		current.storageTotal += toNum(item.storageTotal);
		current.otherTotal += toNum(item.otherCosts);
		current.total += toNum(item.totalCost);
		current.itemCount += 1;
		sectionMap.set(s, current);
	}

	const sections: CostingSectionSummary[] = Array.from(
		sectionMap.entries(),
	).map(([section, data]) => ({
		section,
		...data,
	}));

	const grandMaterial = sections.reduce((s, sec) => s + sec.materialTotal, 0);
	const grandLabor = sections.reduce((s, sec) => s + sec.laborTotal, 0);
	const grandStorage = sections.reduce((s, sec) => s + sec.storageTotal, 0);
	const grandOther = sections.reduce((s, sec) => s + sec.otherTotal, 0);
	const grandTotal = sections.reduce((s, sec) => s + sec.total, 0);

	const overheadAmount = grandTotal * (overheadPercent / 100);
	const costWithOverhead = grandTotal + overheadAmount;

	return {
		sections,
		grandTotal: {
			material: grandMaterial,
			labor: grandLabor,
			storage: grandStorage,
			other: grandOther,
			total: grandTotal,
		},
		overheadPercent,
		overheadAmount,
		costWithOverhead,
	};
}
