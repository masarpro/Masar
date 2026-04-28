import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";

/**
 * manual — كمية يدوية (primaryValue كما هي، بلا هدر، بلا تحويل)
 * يستخدم حين يريد المستخدم إدخال الكمية مباشرة (متعلّم/غير متعلّم).
 */
export function computeManual(input: ComputeInput): ComputeOutput {
	const quantity = Math.max(0, num(input.item.primaryValue, 0));

	return {
		computedQuantity: round(quantity, 4),
		effectiveQuantity: round(quantity, 4),
		openingsArea: 0,
		breakdown: {
			type: "manual",
			formula: `كمية يدوية = ${round(quantity, 4)}`,
			steps: [`الكمية المُدخلة يدوياً: ${round(quantity, 4)} (بدون هدر)`],
		},
		warnings: [],
	};
}
