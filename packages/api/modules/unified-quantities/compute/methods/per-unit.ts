import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";
import { applyWastage } from "../helpers/wastage-applier";

/**
 * per_unit — عدد قطع (مقابس، أبواب، مصاعد). يدعم هدر اختياري للقطع الصغيرة
 * (مثلاً مقابس بنسبة 5% احتياط للكسر).
 */
export function computePerUnit(input: ComputeInput): ComputeOutput {
	const count = Math.max(0, num(input.item.primaryValue, 0));
	const wastage = num(input.item.wastagePercent, 0);

	const effectiveQuantity = applyWastage(count, wastage);

	return {
		computedQuantity: round(count, 4),
		effectiveQuantity: round(effectiveQuantity, 4),
		openingsArea: 0,
		breakdown: {
			type: "per_unit",
			formula: wastage > 0
				? `${count} × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}`
				: `العدد = ${count}`,
			steps: [
				`العدد المُدخل: ${count}`,
				wastage > 0
					? `بهدر ${wastage}%: ${round(effectiveQuantity, 4)}`
					: "بدون هدر",
			],
		},
		warnings: [],
	};
}
