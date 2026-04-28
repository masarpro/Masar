import type { ComputeInput, ComputeOutput } from "../types";
import { num, round } from "../types";
import { applyWastage } from "../helpers/wastage-applier";

/**
 * per_room — عدد قطع لكل غرفة × عدد الغرف
 * primaryValue   = countPerRoom (مثلاً 4 مقابس/غرفة)
 * secondaryValue = roomsCount   (مثلاً 5 غرف)
 *
 * إذا لم يُمرَّر roomsCount صراحةً، يُحسب من context.spaces.length.
 */
export function computePerRoom(input: ComputeInput): ComputeOutput {
	const countPerRoom = Math.max(0, num(input.item.primaryValue, 0));
	const explicitRooms = num(input.item.secondaryValue, NaN);
	const fallbackRooms = input.context?.spaces?.length ?? 0;
	const roomsCount = Math.max(
		0,
		Number.isFinite(explicitRooms) && explicitRooms >= 0
			? explicitRooms
			: fallbackRooms,
	);
	const wastage = num(input.item.wastagePercent, 0);

	const total = countPerRoom * roomsCount;
	const effectiveQuantity = applyWastage(total, wastage);

	return {
		computedQuantity: round(total, 4),
		effectiveQuantity: round(effectiveQuantity, 4),
		openingsArea: 0,
		breakdown: {
			type: "per_room",
			formula: `${countPerRoom} × ${roomsCount} غرفة = ${total}${wastage > 0 ? ` × (1 + ${wastage}/100) = ${round(effectiveQuantity, 4)}` : ""}`,
			steps: [
				`عدد القطع لكل غرفة: ${countPerRoom}`,
				`عدد الغرف: ${roomsCount}${
					Number.isFinite(explicitRooms) ? "" : " (مأخوذ من السياق)"
				}`,
				`الإجمالي: ${total}`,
				wastage > 0
					? `بهدر ${wastage}%: ${round(effectiveQuantity, 4)}`
					: "بدون هدر",
			],
		},
		warnings: [],
	};
}
