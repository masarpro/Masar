import type { ComputeInput, ComputeOutput } from "../types";

/**
 * lump_sum — مقطوعية. الكمية دائماً 1، التسعير يتم بالسعر الإجمالي.
 * مدخلات المستخدم تُتجاهل.
 */
export function computeLumpSum(_input: ComputeInput): ComputeOutput {
	return {
		computedQuantity: 1,
		effectiveQuantity: 1,
		openingsArea: 0,
		breakdown: {
			type: "lump_sum",
			formula: "مقطوعية — الكمية = 1",
			steps: ["مقطوعية: الكمية ثابتة 1، التسعير بالإجمالي"],
		},
		warnings: [],
	};
}
