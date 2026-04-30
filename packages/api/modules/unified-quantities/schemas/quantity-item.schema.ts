import { z } from "zod";
import {
	idString,
	decimalInput,
	optionalDecimal,
	calculationMethodEnum,
	domainEnum,
	markupMethodEnum,
	linkFormulaEnum,
	contextScopeEnum,
	polygonPointsSchema,
	studyScope,
} from "./common";

// ── upsertItem (الأهم — الأكثر تعقيداً) ─────────────────────────

export const upsertQuantityItemSchema = studyScope.extend({
	id: idString().optional(),

	// التصنيف
	domain: domainEnum,
	categoryKey: z.string().min(1).max(100),
	catalogItemKey: z.string().min(1).max(200),

	// العرض
	displayName: z.string().min(1).max(300),
	sortOrder: z.number().int().nonnegative().default(0),
	isEnabled: z.boolean().default(true),

	// الأبعاد المرنة
	primaryValue: optionalDecimal,
	secondaryValue: optionalDecimal,
	tertiaryValue: optionalDecimal,

	// طريقة الحساب
	calculationMethod: calculationMethodEnum,
	unit: z.string().min(1).max(20),
	wastagePercent: decimalInput
		.refine((v) => v >= 0 && v <= 100, "نسبة الهدر يجب أن تكون بين 0 و 100")
		.default(10),

	// السياق المشترك
	contextSpaceId: idString().nullable().optional(),
	contextScope: contextScopeEnum.nullable().optional(),

	// الفتحات
	deductOpenings: z.boolean().default(false),
	polygonPoints: polygonPointsSchema,

	// الربط
	linkedFromItemId: idString().nullable().optional(),
	linkQuantityFormula: linkFormulaEnum.nullable().optional(),
	linkPercentValue: optionalDecimal,

	// المواصفات
	specMaterialName: z.string().max(200).nullable().optional(),
	specMaterialBrand: z.string().max(100).nullable().optional(),
	specMaterialGrade: z.string().max(50).nullable().optional(),
	specColor: z.string().max(50).nullable().optional(),
	specSource: z.enum(["local", "imported"]).nullable().optional(),
	specNotes: z.string().max(2000).nullable().optional(),

	// التسعير
	materialUnitPrice: optionalDecimal,
	laborUnitPrice: optionalDecimal,
	markupMethod: markupMethodEnum.default("percentage"),
	markupPercent: optionalDecimal,
	markupFixedAmount: optionalDecimal,
	manualUnitPrice: optionalDecimal,
	hasCustomMarkup: z.boolean().default(false),

	notes: z.string().max(2000).nullable().optional(),
});

export type UpsertQuantityItemInput = z.infer<typeof upsertQuantityItemSchema>;

// ── باقي عمليات البنود ──────────────────────────────────────────

export const getItemsSchema = studyScope;

export const deleteItemSchema = z.object({
	organizationId: idString(),
	id: idString(),
});

export const reorderItemsSchema = studyScope.extend({
	itemIds: z.array(idString()).min(1).max(500),
});

export const duplicateItemSchema = z.object({
	organizationId: idString(),
	id: idString(),
});

export const linkItemsSchema = z.object({
	organizationId: idString(),
	itemId: idString(),
	linkedFromItemId: idString().nullable(),
	linkQuantityFormula: linkFormulaEnum.default("SAME"),
	linkPercentValue: optionalDecimal,
});
