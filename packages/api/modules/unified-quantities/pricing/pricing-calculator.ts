// ════════════════════════════════════════════════════════════════
// Pricing Calculator (forward) — يحسب السعر والإجماليات والربح
// من الكمية والتكلفة وطريقة الـ markup.
// ════════════════════════════════════════════════════════════════

import type {
	MarkupMethod,
	PricingCalculationInput,
	PricingCalculationOutput,
} from "./types";
import { num, round } from "../compute/types";
import { applyPercentageMarkup } from "./markup-methods/percentage";
import { applyFixedAmountMarkup } from "./markup-methods/fixed-amount";
import { applyManualPriceMarkup } from "./markup-methods/manual-price";

/**
 * يحسب التكلفة + سعر البيع + الربح + الإجماليات لبند واحد.
 *
 * منطق Global vs Custom:
 * - hasCustomMarkup=false → يُستخدم globalMarkupPercent بطريقة "percentage"،
 *   ويُتجاهل markupMethod / markupPercent / markupFixedAmount / manualUnitPrice
 *   المُمرَّرة من البند نفسه.
 * - hasCustomMarkup=true → يُستخدم markupMethod للبند مع القيمة المناسبة.
 */
export function calculatePricing(
	input: PricingCalculationInput,
): PricingCalculationOutput {
	const effectiveQty = num(input.effectiveQuantity, 0);
	const matUnit = Math.max(0, num(input.materialUnitPrice, 0));
	const labUnit = Math.max(0, num(input.laborUnitPrice, 0));
	const warnings: string[] = [];

	// 1. التكلفة
	const materialCost = matUnit * effectiveQty;
	const laborCost = labUnit * effectiveQty;
	const totalCost = materialCost + laborCost;
	const unitCost = matUnit + labUnit;

	if (unitCost === 0) {
		warnings.push("التكلفة صفر — لم يتم إدخال أسعار المادة أو العمالة");
	}

	// 2. تحديد الـ markup الفعلي (Global vs Custom)
	let effectiveMethod: MarkupMethod = (input.markupMethod as MarkupMethod) ?? "percentage";
	let effectivePercent = num(input.markupPercent, 0);
	const effectiveFixed = num(input.markupFixedAmount, 0);
	const effectiveManual = num(input.manualUnitPrice, 0);

	if (!input.hasCustomMarkup) {
		effectiveMethod = "percentage";
		effectivePercent = num(input.globalMarkupPercent, 0);
	}

	// 3. حساب سعر الوحدة حسب الطريقة
	let sellUnitPrice = 0;
	switch (effectiveMethod) {
		case "percentage":
			sellUnitPrice = applyPercentageMarkup(unitCost, effectivePercent);
			break;
		case "fixed_amount":
			sellUnitPrice = applyFixedAmountMarkup(unitCost, effectiveFixed);
			break;
		case "manual_price":
			sellUnitPrice = applyManualPriceMarkup(effectiveManual);
			if (sellUnitPrice === 0 && effectiveQty > 0) {
				warnings.push("سعر يدوي صفر — لم يتم إدخال السعر");
			}
			break;
		default:
			warnings.push(`طريقة markup غير معروفة "${effectiveMethod}" — fallback إلى percentage`);
			sellUnitPrice = applyPercentageMarkup(unitCost, effectivePercent);
	}

	// 4. الإجماليات
	const sellTotalAmount = sellUnitPrice * effectiveQty;
	const profitAmount = sellTotalAmount - totalCost;
	const profitPercent =
		sellTotalAmount > 0 ? (profitAmount / sellTotalAmount) * 100 : 0;
	const actualMarkupPercent = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0;

	if (profitAmount < 0) {
		warnings.push("⚠️ خسارة — السعر أقل من التكلفة");
	}

	// 5. Breakdown للعرض
	const breakdown: string[] = [
		`تكلفة المادة: ${round(matUnit, 4)} × ${round(effectiveQty, 4)} = ${round(materialCost, 2)} ر.س`,
		`تكلفة العمالة: ${round(labUnit, 4)} × ${round(effectiveQty, 4)} = ${round(laborCost, 2)} ر.س`,
		`إجمالي التكلفة: ${round(totalCost, 2)} ر.س (${round(unitCost, 4)} ر.س/وحدة)`,
	];

	if (effectiveMethod === "percentage") {
		const sourceLabel = input.hasCustomMarkup ? "هامش خاص" : "Global Markup";
		breakdown.push(
			`${sourceLabel} ${effectivePercent}% → سعر الوحدة: ${round(unitCost, 4)} × (1 + ${effectivePercent}/100) = ${round(sellUnitPrice, 4)} ر.س`,
		);
	} else if (effectiveMethod === "fixed_amount") {
		breakdown.push(
			`ربح ثابت: ${round(effectiveFixed, 4)} ر.س → سعر الوحدة: ${round(sellUnitPrice, 4)} ر.س`,
		);
	} else {
		breakdown.push(`سعر يدوي: ${round(sellUnitPrice, 4)} ر.س/وحدة`);
	}

	breakdown.push(`إجمالي البيع: ${round(sellTotalAmount, 2)} ر.س`);
	breakdown.push(
		`صافي الربح: ${round(profitAmount, 2)} ر.س (${round(profitPercent, 2)}% هامش، ${round(actualMarkupPercent, 2)}% markup)`,
	);

	return {
		materialCost: round(materialCost, 2),
		laborCost: round(laborCost, 2),
		totalCost: round(totalCost, 2),
		unitCost: round(unitCost, 4),
		sellUnitPrice: round(sellUnitPrice, 4),
		sellTotalAmount: round(sellTotalAmount, 2),
		profitAmount: round(profitAmount, 2),
		profitPercent: round(profitPercent, 4),
		actualMarkupPercent: round(actualMarkupPercent, 4),
		effectiveMarkupMethod: effectiveMethod,
		breakdown,
		warnings,
	};
}
