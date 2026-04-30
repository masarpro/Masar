import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";
import { applyWastage } from "../helpers/wastage-applier";
import { calculateOpeningsArea } from "../helpers/openings-deductor";
import {
	shoelaceArea,
	validatePolygon,
} from "../helpers/polygon-helper";

/**
 * polygon — مساحة شكل غير منتظم باستخدام Shoelace + خصم فتحات + هدر
 * يستخدم لـ غرف بأشكال غريبة (L-shape، T-shape).
 */
export function computePolygon(input: ComputeInput): ComputeOutput {
	const wastage = num(input.item.wastagePercent, 0);
	const warnings: string[] = [];

	let area = 0;
	if (validatePolygon(input.item.polygonPoints)) {
		area = shoelaceArea(input.item.polygonPoints);
	} else {
		warnings.push(
			"polygonPoints غير صالحة — يجب 3 نقاط على الأقل بإحداثيات (x, y) منتهية",
		);
	}

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
			type: "polygon",
			formula: openingsArea > 0
				? `Shoelace(${round(area, 4)}) − ${round(openingsArea, 4)} × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`
				: `Shoelace(${round(area, 4)}) × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`,
			steps: [
				`المساحة (Shoelace): ${round(area, 4)} م²`,
				`الفتحات المخصومة: ${round(openingsArea, 4)} م²`,
				`المساحة الصافية: ${round(netArea, 4)} م²`,
				`الكمية الفعّالة (هدر ${wastage}%): ${round(effectiveQuantity, 4)} م²`,
			],
		},
		warnings,
	};
}
