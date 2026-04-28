// ════════════════════════════════════════════════════════════════
// Openings deductor — حساب مساحة الفتحات المخصومة
// ════════════════════════════════════════════════════════════════

import type { ComputeContextOpening } from "../types";
import { num } from "../types";

/**
 * مجموع مساحات الفتحات الداخلية للخصم من جدران/سقف داخلي.
 * يفلتر الفتحات بـ deductFromInteriorFinishes = true.
 *
 * @returns sum(computedArea × count) للفتحات التي يُخصم منها
 */
export function calculateOpeningsArea(
	openings: ComputeContextOpening[] | null | undefined,
): number {
	if (!openings || openings.length === 0) return 0;
	return openings
		.filter((o) => o.deductFromInteriorFinishes !== false)
		.reduce((sum, o) => sum + num(o.computedArea) * (o.count ?? 1), 0);
}

/**
 * مجموع مساحات الفتحات الخارجية.
 * يستخدم في حساب الواجهات الخارجية (دهان خارجي، تكسية).
 */
export function calculateExteriorOpeningsArea(
	openings: ComputeContextOpening[] | null | undefined,
): number {
	if (!openings || openings.length === 0) return 0;
	return openings
		.filter((o) => o.isExterior === true)
		.reduce((sum, o) => sum + num(o.computedArea) * (o.count ?? 1), 0);
}
