import { z } from "zod";

// ── أنواع مشتركة ─────────────────────────────────────────────────

export const idString = () => z.string().min(1).max(100);

/** Decimal من Prisma قد يأتي رقماً أو نصاً (Decimal serialization) */
export const decimalInput = z.union([z.string(), z.number()]).transform(Number);

export const optionalDecimal = z
	.union([z.string(), z.number(), z.null()])
	.optional()
	.transform((v) => (v === null || v === undefined ? null : Number(v)));

export const calculationMethodEnum = z.enum([
	"direct_area",
	"length_x_height",
	"length_only",
	"per_unit",
	"per_room",
	"polygon",
	"manual",
	"lump_sum",
]);

export const domainEnum = z.enum(["FINISHING", "MEP", "EXTERIOR", "SPECIAL"]);

export const markupMethodEnum = z.enum([
	"percentage",
	"fixed_amount",
	"manual_price",
]);

export const linkFormulaEnum = z.enum(["SAME", "MINUS_WET_AREAS", "PLUS_PERCENT"]);

export const contextScopeEnum = z.enum([
	"whole_building",
	"per_floor",
	"per_room",
	"standalone",
]);

export const polygonPointsSchema = z
	.array(z.object({ x: z.number().finite(), y: z.number().finite() }))
	.min(3)
	.nullable()
	.optional();

// قاعدة كل write
export const studyScope = z.object({
	organizationId: idString(),
	costStudyId: idString(),
});
