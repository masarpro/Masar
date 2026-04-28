// ════════════════════════════════════════════════════════════════
// Bi-Directional Solver — يحل معادلة التسعير من أي اتجاه
// ════════════════════════════════════════════════════════════════
//
// User يعدّل حقلاً واحداً، الحلّ يحدّد بقية القيم بشكل متّسق.
//
// قواعد المصدر الأحادي (canonical-source rule):
// - markup_percent      → markupMethod="percentage",   markupPercent = newValue
// - markup_fixed_amount → markupMethod="fixed_amount", markupFixedAmount = newValue
// - manual_unit_price   → markupMethod="manual_price", manualUnitPrice = newValue
// - sell_unit_price     → markupMethod="manual_price", manualUnitPrice = newValue
//                         (implied markupPercent محسوب للعرض فقط)
// - sell_total_amount   → markupMethod="manual_price",
//                         manualUnitPrice = newValue / effectiveQuantity
// - material/labor unit price → keep current method, recompute sell

import type {
	BiDirectionalInput,
	BiDirectionalOutput,
	MarkupMethod,
} from "./types";
import { num, round } from "../compute/types";

function normalizeMethod(m: string): MarkupMethod {
	if (m === "percentage" || m === "fixed_amount" || m === "manual_price") return m;
	return "percentage";
}

function impliedPercentFromPrice(
	sellUnit: number,
	unitCost: number,
): number | null {
	if (unitCost <= 0) return null;
	return ((sellUnit - unitCost) / unitCost) * 100;
}

function computeSellFromMethod(
	method: MarkupMethod,
	unitCost: number,
	pct: number,
	fixed: number,
	manual: number,
): number {
	switch (method) {
		case "percentage":
			return unitCost <= 0 ? 0 : unitCost * (1 + pct / 100);
		case "fixed_amount":
			return Math.max(0, unitCost + fixed);
		case "manual_price":
			return Math.max(0, manual);
	}
}

/**
 * يحل المعادلة من أي اتجاه. يُرجع الحالة الكاملة لـ pricing البند.
 */
export function solvePricing(input: BiDirectionalInput): BiDirectionalOutput {
	const warnings: string[] = [];

	// Snapshot الـ inputs
	let materialUnitPrice = Math.max(0, num(input.materialUnitPrice, 0));
	let laborUnitPrice = Math.max(0, num(input.laborUnitPrice, 0));
	let hasCustomMarkup = input.hasCustomMarkup;
	let markupMethod = normalizeMethod(String(input.currentMarkupMethod));

	// القيم الحالية كنقطة بداية
	let markupPercent: number | null = num(
		input.currentMarkupPercent,
		num(input.globalMarkupPercent, 0),
	);
	let markupFixedAmount: number | null = num(input.currentMarkupFixedAmount, 0);
	let manualUnitPrice: number | null = num(input.currentManualUnitPrice, 0);

	const newValue = num(input.newValue, 0);
	const effectiveQuantity = Math.max(0, num(input.effectiveQuantity, 0));

	// تطبيق التغيير حسب الحقل
	switch (input.changedField) {
		case "material_unit_price":
			if (newValue < 0) warnings.push("سعر مادة سالب — استُخدم 0");
			materialUnitPrice = Math.max(0, newValue);
			break;

		case "labor_unit_price":
			if (newValue < 0) warnings.push("سعر عمالة سالب — استُخدم 0");
			laborUnitPrice = Math.max(0, newValue);
			break;

		case "markup_percent":
			markupMethod = "percentage";
			markupPercent = newValue;
			markupFixedAmount = null;
			manualUnitPrice = null;
			hasCustomMarkup = true;
			break;

		case "markup_fixed_amount":
			markupMethod = "fixed_amount";
			markupFixedAmount = newValue;
			markupPercent = null;
			manualUnitPrice = null;
			hasCustomMarkup = true;
			break;

		case "manual_unit_price":
			markupMethod = "manual_price";
			manualUnitPrice = Math.max(0, newValue);
			markupPercent = null;
			markupFixedAmount = null;
			hasCustomMarkup = true;
			break;

		case "sell_unit_price": {
			// المستخدم غيّر السعر مباشرة — احفظه كـ manual_price (مصدر أحادي)
			// واحسب markup_percent ضمنياً للعرض
			markupMethod = "manual_price";
			manualUnitPrice = Math.max(0, newValue);
			markupFixedAmount = null;
			hasCustomMarkup = true;
			const unitCost = materialUnitPrice + laborUnitPrice;
			markupPercent = impliedPercentFromPrice(manualUnitPrice, unitCost);
			break;
		}

		case "sell_total_amount": {
			// إجمالي → احسب سعر الوحدة، ثم نفس مسار sell_unit_price
			if (effectiveQuantity <= 0) {
				warnings.push("لا يمكن استنتاج سعر الوحدة من الإجمالي بكمية صفر");
				break;
			}
			const newSellUnit = Math.max(0, newValue / effectiveQuantity);
			markupMethod = "manual_price";
			manualUnitPrice = newSellUnit;
			markupFixedAmount = null;
			hasCustomMarkup = true;
			const unitCost = materialUnitPrice + laborUnitPrice;
			markupPercent = impliedPercentFromPrice(newSellUnit, unitCost);
			break;
		}
	}

	// إذا تغيّرت material/labor، أعد حساب السعر بنفس الـ markup الحالي
	const unitCost = materialUnitPrice + laborUnitPrice;
	let sellUnitPrice = computeSellFromMethod(
		markupMethod,
		unitCost,
		markupPercent ?? 0,
		markupFixedAmount ?? 0,
		manualUnitPrice ?? 0,
	);

	// تحذيرات
	if (unitCost === 0 && markupMethod !== "manual_price") {
		warnings.push("التكلفة صفر — markup% أو fixed_amount لا ينتج سعراً");
	}
	const sellTotalAmount = sellUnitPrice * effectiveQuantity;
	const totalCost = unitCost * effectiveQuantity;
	const profitAmount = sellTotalAmount - totalCost;
	if (sellUnitPrice > 0 && profitAmount < 0) {
		warnings.push("⚠️ السعر أقل من التكلفة — خسارة");
	}
	const profitPercent =
		sellTotalAmount > 0 ? (profitAmount / sellTotalAmount) * 100 : 0;

	// تنظيف نهائي
	sellUnitPrice = round(sellUnitPrice, 4);

	return {
		markupMethod,
		markupPercent: markupPercent === null ? null : round(markupPercent, 4),
		markupFixedAmount:
			markupFixedAmount === null ? null : round(markupFixedAmount, 4),
		manualUnitPrice:
			manualUnitPrice === null ? null : round(manualUnitPrice, 4),
		materialUnitPrice: round(materialUnitPrice, 4),
		laborUnitPrice: round(laborUnitPrice, 4),
		sellUnitPrice,
		sellTotalAmount: round(sellTotalAmount, 2),
		profitAmount: round(profitAmount, 2),
		profitPercent: round(profitPercent, 4),
		hasCustomMarkup,
		warnings,
	};
}
