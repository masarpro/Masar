import { z } from "zod";
import { idString, decimalInput, studyScope } from "./common";

export const updatePricingSchema = z.object({
	organizationId: idString(),
	id: idString(),
	changedField: z.enum([
		"material_unit_price",
		"labor_unit_price",
		"markup_percent",
		"markup_fixed_amount",
		"manual_unit_price",
		"sell_unit_price",
		"sell_total_amount",
	]),
	newValue: decimalInput,
});

export const updateGlobalMarkupSchema = studyScope.extend({
	globalMarkupPercent: decimalInput.refine(
		(v) => v >= 0 && v <= 1000,
		"نسبة الربح يجب أن تكون بين 0 و 1000",
	),
	applyMode: z.enum(["all_items", "non_custom_only"]),
});

export const getStudyTotalsSchema = studyScope;

export const bulkUpdatePricingSchema = z.object({
	organizationId: idString(),
	costStudyId: idString(),
	itemIds: z.array(idString()).min(1).max(500),
	changedField: z.enum([
		"material_unit_price",
		"labor_unit_price",
		"markup_percent",
		"markup_fixed_amount",
	]),
	newValue: decimalInput,
});

export const updateStudySettingsSchema = studyScope.extend({
	vatPercent: decimalInput
		.refine((v) => v >= 0 && v <= 100, "نسبة VAT يجب أن تكون بين 0 و 100")
		.optional(),
	vatIncludedInPrices: z.boolean().optional(),
	globalMarkupMethod: z.enum(["percentage"]).optional(), // فقط percentage مدعوم على مستوى الدراسة حالياً
});
