import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";

interface StructuralBoundsInput {
	category?: string;
	quantity?: number;
	concreteVolume?: number;
	steelWeight?: number;
	dimensions?: Record<string, number | string> | undefined;
}

const MAX_QUANTITY = 100_000;
const MAX_CONCRETE_VOLUME = 50_000;  // م³
const MAX_STEEL_WEIGHT = 500_000;    // كجم
const MAX_STEEL_RATIO = 8;           // %

const DIMENSION_LIMITS: Record<string, { max: number; label: string }> = {
	length: { max: 200, label: "الطول" },
	width: { max: 200, label: "العرض" },
	height: { max: 50, label: "الارتفاع" },
	depth: { max: 50, label: "العمق" },
	thickness: { max: 5, label: "السماكة" },
};

/**
 * يتحقق من الحدود المنطقية للبنود الإنشائية.
 * يرمي ORPCError عند وجود قيم مستحيلة.
 * يسجل تحذيرات في السجل عند وجود قيم غير اعتيادية.
 */
export function validateStructuralBounds(input: StructuralBoundsInput): void {
	const errors: string[] = [];

	// --- حدود صلبة (ترفض) ---

	if (input.quantity !== undefined && input.quantity <= 0) {
		errors.push("quantity must be > 0 | الكمية يجب أن تكون أكبر من صفر");
	}

	if (input.concreteVolume !== undefined) {
		if (input.concreteVolume < 0) {
			errors.push("concreteVolume cannot be negative | حجم الخرسانة لا يمكن أن يكون سالباً");
		}
		if (input.concreteVolume > MAX_CONCRETE_VOLUME) {
			errors.push(`concreteVolume exceeds ${MAX_CONCRETE_VOLUME} m³ | حجم الخرسانة يتجاوز ${MAX_CONCRETE_VOLUME} م³`);
		}
	}

	if (input.steelWeight !== undefined) {
		if (input.steelWeight < 0) {
			errors.push("steelWeight cannot be negative | وزن الحديد لا يمكن أن يكون سالباً");
		}
		if (input.steelWeight > MAX_STEEL_WEIGHT) {
			errors.push(`steelWeight exceeds ${MAX_STEEL_WEIGHT} kg | وزن الحديد يتجاوز ${MAX_STEEL_WEIGHT} كجم`);
		}
	}

	// أبعاد سالبة
	if (input.dimensions) {
		for (const [key, value] of Object.entries(input.dimensions)) {
			if (typeof value === "number" && value < 0 && key in DIMENSION_LIMITS) {
				errors.push(`${DIMENSION_LIMITS[key]!.label} cannot be negative | ${key} لا يمكن أن يكون سالباً`);
			}
		}
	}

	if (errors.length > 0) {
		throw new ORPCError("BAD_REQUEST", {
			message: `${STUDY_ERRORS.BOUNDS_EXCEEDED}: ${errors.join("; ")}`,
		});
	}

	// --- تحذيرات (لا ترفض) ---

	if (input.quantity !== undefined && input.quantity > MAX_QUANTITY) {
		console.warn(`[structural-bounds] High quantity: ${input.quantity} (category: ${input.category})`);
	}

	if (
		input.steelWeight !== undefined &&
		input.concreteVolume !== undefined &&
		input.concreteVolume > 0
	) {
		const ratio = (input.steelWeight / (input.concreteVolume * 7850)) * 100;
		if (ratio > MAX_STEEL_RATIO) {
			console.warn(`[structural-bounds] High steel ratio: ${ratio.toFixed(1)}% (category: ${input.category})`);
		}
	}

	if (input.dimensions) {
		for (const [key, value] of Object.entries(input.dimensions)) {
			const limit = DIMENSION_LIMITS[key];
			if (limit && typeof value === "number" && value > limit.max) {
				console.warn(`[structural-bounds] ${key}=${value} exceeds typical max ${limit.max} (category: ${input.category})`);
			}
		}
	}
}
