import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";
import { applyWastage } from "../helpers/wastage-applier";
import { calculateOpeningsArea } from "../helpers/openings-deductor";

/**
 * direct_area — مساحة مباشرة (primaryValue) مع خصم فتحات اختياري + هدر
 *
 * الصيغة: max(0, area − openings) × (1 + wastage/100)
 */
export function computeDirectArea(input: ComputeInput): ComputeOutput {
	const area = num(input.item.primaryValue, 0);
	const wastage = num(input.item.wastagePercent, 0);
	const warnings: string[] = [];

	let openingsArea = 0;
	if (input.item.deductOpenings) {
		if (input.openings && input.openings.length > 0) {
			openingsArea = calculateOpeningsArea(input.openings);
		} else {
			warnings.push(
				"طُلب خصم الفتحات لكن لم تُعرَّف فتحات في السياق المشترك",
			);
		}
	}

	const netArea = Math.max(0, area - openingsArea);
	const effectiveQuantity = applyWastage(netArea, wastage);

	return {
		computedQuantity: round(netArea, 4),
		effectiveQuantity: round(effectiveQuantity, 4),
		openingsArea: round(openingsArea, 4),
		breakdown: {
			type: "direct_area",
			formula: openingsArea > 0
				? `(${area} − ${round(openingsArea, 4)}) × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`
				: `${area} × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`,
			steps: [
				`المساحة المُدخلة: ${area}`,
				openingsArea > 0
					? `الفتحات المخصومة: ${round(openingsArea, 4)}`
					: "بدون خصم فتحات",
				`المساحة الصافية: ${round(netArea, 4)}`,
				`الكمية الفعّالة (هدر ${wastage}%): ${round(effectiveQuantity, 4)}`,
			],
		},
		warnings,
	};
}
