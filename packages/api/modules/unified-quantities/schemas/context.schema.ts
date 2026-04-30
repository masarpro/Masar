import { z } from "zod";
import {
	idString,
	optionalDecimal,
	polygonPointsSchema,
	studyScope,
} from "./common";

// ── Context (1:1 مع CostStudy) ──────────────────────────────────

export const getContextSchema = studyScope;

export const updateContextSchema = studyScope.extend({
	totalFloorArea: optionalDecimal,
	totalWallArea: optionalDecimal,
	totalExteriorWallArea: optionalDecimal,
	totalRoofArea: optionalDecimal,
	totalPerimeter: optionalDecimal,
	averageFloorHeight: optionalDecimal,
	hasBasement: z.boolean().optional(),
	hasRoof: z.boolean().optional(),
	hasYard: z.boolean().optional(),
	yardArea: optionalDecimal,
	fenceLength: optionalDecimal,
	generalNotes: z.string().max(5000).nullable().optional(),
});

// ── Spaces (غرف اختيارية) ───────────────────────────────────────

export const upsertSpaceSchema = studyScope.extend({
	id: idString().optional(),
	name: z.string().min(1).max(200),
	spaceType: z.enum([
		"room",
		"corridor",
		"stairs",
		"balcony",
		"exterior",
		"custom",
	]),
	floorLabel: z.string().max(100).nullable().optional(),
	length: optionalDecimal,
	width: optionalDecimal,
	height: optionalDecimal,
	floorArea: optionalDecimal,
	wallPerimeter: optionalDecimal,
	polygonPoints: polygonPointsSchema,
	isWetArea: z.boolean().default(false),
	isExterior: z.boolean().default(false),
	sortOrder: z.number().int().nonnegative().default(0),
});

export const deleteSpaceSchema = z.object({
	organizationId: idString(),
	id: idString(),
});

// ── Openings (أبواب/شبابيك) ─────────────────────────────────────

export const upsertOpeningSchema = studyScope.extend({
	id: idString().optional(),
	name: z.string().min(1).max(200),
	openingType: z.enum(["door", "window", "arch", "skylight", "custom"]),
	width: z.number().positive().max(50),
	height: z.number().positive().max(50),
	count: z.number().int().min(1).max(10000).default(1),
	isExterior: z.boolean().default(false),
	deductFromInteriorFinishes: z.boolean().default(true),
	spaceId: idString().nullable().optional(),
});

export const deleteOpeningSchema = z.object({
	organizationId: idString(),
	id: idString(),
});
