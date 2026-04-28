// ════════════════════════════════════════════════════════════════
// Item Computer — المنسِّق الرئيسي لحساب كمية بند
// يختار الـ method الصحيح حسب calculationMethod، ويعالج linked items.
// ════════════════════════════════════════════════════════════════

import type { ComputeInput, ComputeOutput } from "./types";
import { computeDirectArea } from "./methods/direct-area";
import { computeLengthXHeight } from "./methods/length-x-height";
import { computeLengthOnly } from "./methods/length-only";
import { computePerUnit } from "./methods/per-unit";
import { computePerRoom } from "./methods/per-room";
import { computePolygon } from "./methods/polygon";
import { computeManual } from "./methods/manual";
import { computeLumpSum } from "./methods/lump-sum";
import { resolveLinkedQuantity } from "./helpers/link-resolver";

/**
 * يحسب كمية بند بناءً على calculationMethod أو رابط (linkedFromItem).
 *
 * أولوية الفحص:
 * 1. لو البند مرتبط بمصدر (linkedFromItemId + linkedFromItem) → استخدم
 *    resolveLinkedQuantity مع الصيغة (SAME / MINUS_WET_AREAS / PLUS_PERCENT)
 * 2. وإلا، استخدم الـ method المحدّد في calculationMethod
 *
 * @throws Error لو calculationMethod غير معروفة (فقط حين لا يوجد linked item)
 */
export function compute(input: ComputeInput): ComputeOutput {
	if (input.item.linkedFromItemId && input.linkedFromItem) {
		return resolveLinkedQuantity(input);
	}

	switch (input.item.calculationMethod) {
		case "direct_area":
			return computeDirectArea(input);
		case "length_x_height":
			return computeLengthXHeight(input);
		case "length_only":
			return computeLengthOnly(input);
		case "per_unit":
			return computePerUnit(input);
		case "per_room":
			return computePerRoom(input);
		case "polygon":
			return computePolygon(input);
		case "manual":
			return computeManual(input);
		case "lump_sum":
			return computeLumpSum(input);
		default:
			throw new Error(
				`طريقة حساب غير معروفة: "${input.item.calculationMethod}"`,
			);
	}
}
