// ════════════════════════════════════════════════════════════════
// Link resolver — اشتقاق الكمية من بند مرتبط
// ════════════════════════════════════════════════════════════════
//
// 3 صيغ:
// - SAME              → نفس كمية المصدر
// - MINUS_WET_AREAS   → كمية المصدر − مساحات جدران الغرف الرطبة
// - PLUS_PERCENT      → كمية المصدر × (1 + linkPercentValue/100)

import type {
	ComputeInput,
	ComputeOutput,
	ComputeContextSpace,
	ComputeLinkedItem,
} from "../types";
import { num, round } from "../types";
import { applyWastage } from "./wastage-applier";

function getSourceQuantity(linked: ComputeLinkedItem | null | undefined): number {
	if (!linked) return 0;
	const eff = num(linked.effectiveQuantity, NaN);
	if (Number.isFinite(eff) && eff >= 0) return eff;
	return num(linked.computedQuantity, 0);
}

function sumWetWallArea(spaces: ComputeContextSpace[] | undefined): number {
	if (!spaces || spaces.length === 0) return 0;
	return spaces
		.filter((s) => s.isWetArea === true)
		.reduce((sum, s) => sum + num(s.computedWallArea, 0), 0);
}

/**
 * يحسب الكمية المشتقّة من بند مصدر بإحدى 3 صيغ.
 * يطبّق الهدر بعد الاشتقاق.
 */
export function resolveLinkedQuantity(input: ComputeInput): ComputeOutput {
	const formula = (input.item.linkQuantityFormula ?? "SAME") as string;
	const sourceQuantity = getSourceQuantity(input.linkedFromItem);
	const wastage = num(input.item.wastagePercent, 0);
	const warnings: string[] = [];

	let derivedQuantity = 0;
	const steps: string[] = [`الكمية المصدر: ${round(sourceQuantity, 4)}`];

	switch (formula) {
		case "SAME":
			derivedQuantity = sourceQuantity;
			steps.push(`الصيغة SAME → الكمية = ${round(derivedQuantity, 4)}`);
			break;

		case "MINUS_WET_AREAS": {
			const wetArea = sumWetWallArea(input.context?.spaces);
			derivedQuantity = Math.max(0, sourceQuantity - wetArea);
			steps.push(`مجموع جدران الغرف الرطبة: ${round(wetArea, 4)}`);
			steps.push(`المصدر − الرطبة = ${round(derivedQuantity, 4)}`);
			if (sourceQuantity > 0 && wetArea > sourceQuantity) {
				warnings.push(
					"⚠️ مساحات الغرف الرطبة أكبر من كمية المصدر — أُرجعت الكمية إلى صفر",
				);
			}
			break;
		}

		case "PLUS_PERCENT": {
			const pct = num(input.item.linkPercentValue, 0);
			derivedQuantity = sourceQuantity * (1 + pct / 100);
			steps.push(`+${pct}% → ${round(derivedQuantity, 4)}`);
			break;
		}

		default:
			derivedQuantity = sourceQuantity;
			warnings.push(`صيغة ربط غير معروفة "${formula}" — استُخدمت SAME`);
			steps.push(`الصيغة غير معروفة → fallback إلى SAME`);
	}

	const computedQuantity = Math.max(0, derivedQuantity);
	const effectiveQuantity = applyWastage(computedQuantity, wastage);
	steps.push(
		`الكمية الفعلية بعد ${wastage}% هدر: ${round(effectiveQuantity, 4)}`,
	);

	return {
		computedQuantity: round(computedQuantity, 4),
		effectiveQuantity: round(effectiveQuantity, 4),
		openingsArea: 0,
		breakdown: {
			type: `linked:${formula}`,
			formula: `${formula} من بند مصدر (${round(sourceQuantity, 4)}) → ${round(effectiveQuantity, 4)}`,
			steps,
		},
		warnings,
	};
}
