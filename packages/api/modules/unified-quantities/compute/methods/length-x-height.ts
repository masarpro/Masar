import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";
import { applyWastage } from "../helpers/wastage-applier";
import { calculateOpeningsArea } from "../helpers/openings-deductor";

/**
 * length_x_height — مساحة جدار = طول × ارتفاع، مع خصم فتحات اختياري + هدر
 * يستخدم لـ: سيراميك مطبخ/حمام، جدار جبس بورد، طلاء جدار محدد
 */
export function computeLengthXHeight(input: ComputeInput): ComputeOutput {
	const length = num(input.item.primaryValue, 0);
	const height = num(input.item.secondaryValue, 0);
	const wastage = num(input.item.wastagePercent, 0);
	const warnings: string[] = [];

	const grossArea = Math.max(0, length) * Math.max(0, height);

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

	const netArea = Math.max(0, grossArea - openingsArea);
	const effectiveQuantity = applyWastage(netArea, wastage);

	return {
		computedQuantity: round(netArea, 4),
		effectiveQuantity: round(effectiveQuantity, 4),
		openingsArea: round(openingsArea, 4),
		breakdown: {
			type: "length_x_height",
			formula: openingsArea > 0
				? `(${length} × ${height} − ${round(openingsArea, 4)}) × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`
				: `${length} × ${height} × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`,
			steps: [
				`الطول: ${length} م`,
				`الارتفاع: ${height} م`,
				`المساحة الإجمالية: ${round(grossArea, 4)} م²`,
				`الفتحات المخصومة: ${round(openingsArea, 4)} م²`,
				`المساحة الصافية: ${round(netArea, 4)} م²`,
				`الكمية الفعّالة (هدر ${wastage}%): ${round(effectiveQuantity, 4)} م²`,
			],
		},
		warnings,
	};
}
