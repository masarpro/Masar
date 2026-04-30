import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";
import { applyWastage } from "../helpers/wastage-applier";

/**
 * length_only — طول مباشر (primaryValue) × (1 + wastage/100)
 * يستخدم لـ: وزرة، كورنيش، كابلات، مواسير، سور بالمتر
 */
export function computeLengthOnly(input: ComputeInput): ComputeOutput {
	const length = num(input.item.primaryValue, 0);
	const wastage = num(input.item.wastagePercent, 0);

	const netLength = Math.max(0, length);
	const effectiveQuantity = applyWastage(netLength, wastage);

	return {
		computedQuantity: round(netLength, 4),
		effectiveQuantity: round(effectiveQuantity, 4),
		openingsArea: 0,
		breakdown: {
			type: "length_only",
			formula: `${length} × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`,
			steps: [
				`الطول المُدخل: ${length}`,
				`الكمية الفعّالة (هدر ${wastage}%): ${round(effectiveQuantity, 4)}`,
			],
		},
		warnings: [],
	};
}
