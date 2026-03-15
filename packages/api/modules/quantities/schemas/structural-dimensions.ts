import { z } from "zod";

// ─── Base dimension fields (shared across most categories) ───

const baseDimensionFields = {
	length: z.number().nonnegative().optional(),
	width: z.number().nonnegative().optional(),
	height: z.number().nonnegative().optional(),
};

// ─── Plain Concrete dimensions ───

export const plainConcreteDimensionsSchema = z
	.object({
		length: z.number().nonnegative(),
		width: z.number().nonnegative(),
		area: z.number().nonnegative().optional(),
		thickness: z.number().nonnegative(),
	})
	.passthrough();

// ─── Column dimensions ───

export const columnDimensionsSchema = z
	.object({
		width: z.number().nonnegative(),
		depth: z.number().nonnegative(),
		height: z.number().nonnegative(),
		mainBarsCount: z.number().nonnegative().optional(),
		mainBarDiameter: z.number().nonnegative().optional(),
		stirrupDiameter: z.number().nonnegative().optional(),
		stirrupSpacing: z.number().nonnegative().optional(),
	})
	.passthrough();

// ─── Beam dimensions ───

export const beamDimensionsSchema = z
	.object({
		width: z.number().nonnegative(),
		height: z.number().nonnegative(),
		length: z.number().nonnegative(),
		topBarsCount: z.number().nonnegative().optional(),
		topBarDiameter: z.number().nonnegative().optional(),
		bottomBarsCount: z.number().nonnegative().optional(),
		bottomBarDiameter: z.number().nonnegative().optional(),
		stirrupDiameter: z.number().nonnegative().optional(),
		stirrupSpacing: z.number().nonnegative().optional(),
	})
	.passthrough();

// ─── Slab dimensions ───

export const slabDimensionsSchema = z
	.object({
		length: z.number().nonnegative(),
		width: z.number().nonnegative(),
		thickness: z.number().nonnegative().optional(),
		floor: z.union([z.string(), z.number()]).optional(),
		cover: z.number().nonnegative().optional(),
		// Bottom mesh
		bottomMainDiameter: z.number().nonnegative().optional(),
		bottomMainBarsPerMeter: z.number().nonnegative().optional(),
		bottomSecondaryDiameter: z.number().nonnegative().optional(),
		bottomSecondaryBarsPerMeter: z.number().nonnegative().optional(),
		// Top mesh
		hasTopMesh: z.number().optional(),
		topMainDiameter: z.number().nonnegative().optional(),
		topMainBarsPerMeter: z.number().nonnegative().optional(),
		topSecondaryDiameter: z.number().nonnegative().optional(),
		topSecondaryBarsPerMeter: z.number().nonnegative().optional(),
		// Ribbed slab extras
		ribWidth: z.number().nonnegative().optional(),
		ribSpacing: z.number().nonnegative().optional(),
		blockHeight: z.number().nonnegative().optional(),
		toppingThickness: z.number().nonnegative().optional(),
		ribBottomBars: z.number().nonnegative().optional(),
		ribBarDiameter: z.number().nonnegative().optional(),
		ribTopBars: z.number().nonnegative().optional(),
		ribTopBarDiameter: z.number().nonnegative().optional(),
		hasRibStirrup: z.number().optional(),
		ribStirrupDiameter: z.number().nonnegative().optional(),
		ribStirrupSpacing: z.number().nonnegative().optional(),
		// Solid slab beam data
		beamsCount: z.number().nonnegative().optional(),
		beamsConcrete: z.number().nonnegative().optional(),
		beamsSteel: z.number().nonnegative().optional(),
		// Banded beam templates (stored as JSON string)
		bandedBeamTemplates: z.string().optional(),
		// Area fields
		grossArea: z.number().nonnegative().optional(),
		inputMethod: z.string().optional(),
	})
	.passthrough();

// ─── Foundation dimensions ───

export const foundationDimensionsSchema = z
	.object({
		length: z.number().nonnegative(),
		width: z.number().nonnegative(),
		height: z.number().nonnegative(),
		cover: z.number().nonnegative().optional(),
		hookLength: z.number().nonnegative().optional(),
		foundationType: z.string().optional(),
		// Isolated / Combined foundations
		bottomShortDiameter: z.number().nonnegative().optional(),
		bottomShortBarsPerMeter: z.number().nonnegative().optional(),
		bottomLongDiameter: z.number().nonnegative().optional(),
		bottomLongBarsPerMeter: z.number().nonnegative().optional(),
		hasTopShort: z.number().optional(),
		topShortDiameter: z.number().nonnegative().optional(),
		topShortBarsPerMeter: z.number().nonnegative().optional(),
		hasTopLong: z.number().optional(),
		topLongDiameter: z.number().nonnegative().optional(),
		topLongBarsPerMeter: z.number().nonnegative().optional(),
		foundationCoverBottom: z.number().nonnegative().optional(),
		foundationCoverTop: z.number().nonnegative().optional(),
		foundationCoverSide: z.number().nonnegative().optional(),
		foundationHasLeanConcrete: z.number().optional(),
		foundationLeanConcreteThickness: z.number().nonnegative().optional(),
		foundationHasColumnDowels: z.number().optional(),
		foundationDowelBarsPerColumn: z.number().nonnegative().optional(),
		foundationDowelDiameter: z.number().nonnegative().optional(),
		foundationDowelDevLength: z.number().nonnegative().optional(),
		// Combined specific
		combinedColumnCount: z.number().nonnegative().optional(),
		combinedColumnSpacing: z.number().nonnegative().optional(),
		// Strip foundation
		stripLength: z.number().nonnegative().optional(),
		segmentLength: z.number().nonnegative().optional(),
		bottomMainCount: z.number().nonnegative().optional(),
		bottomMainDiameter: z.number().nonnegative().optional(),
		hasBottomSecondary: z.number().optional(),
		bottomSecondaryCount: z.number().nonnegative().optional(),
		bottomSecondaryDiameter: z.number().nonnegative().optional(),
		hasTopMain: z.number().optional(),
		topMainCount: z.number().nonnegative().optional(),
		topMainDiameter: z.number().nonnegative().optional(),
		hasStirrup: z.number().optional(),
		stirrupDiameter: z.number().nonnegative().optional(),
		stirrupSpacing: z.number().nonnegative().optional(),
		stripBottomMeshXDiameter: z.number().nonnegative().optional(),
		stripBottomMeshXBarsPerMeter: z.number().nonnegative().optional(),
		stripBottomMeshYDiameter: z.number().nonnegative().optional(),
		stripBottomMeshYBarsPerMeter: z.number().nonnegative().optional(),
		stripHasTopMesh: z.number().optional(),
		stripTopMeshXDiameter: z.number().nonnegative().optional(),
		stripTopMeshXBarsPerMeter: z.number().nonnegative().optional(),
		stripTopMeshYDiameter: z.number().nonnegative().optional(),
		stripTopMeshYBarsPerMeter: z.number().nonnegative().optional(),
		stripCoverBottom: z.number().nonnegative().optional(),
		stripCoverTop: z.number().nonnegative().optional(),
		stripCoverSide: z.number().nonnegative().optional(),
		stripHasLeanConcrete: z.number().optional(),
		stripLeanConcreteThickness: z.number().nonnegative().optional(),
		stripHasColumnDowels: z.number().optional(),
		stripColumnDowelCount: z.number().nonnegative().optional(),
		stripColumnDowelBarsPerColumn: z.number().nonnegative().optional(),
		stripColumnDowelDiameter: z.number().nonnegative().optional(),
		stripColumnDowelDevLength: z.number().nonnegative().optional(),
		stripHasIntersectionDeduction: z.number().optional(),
		stripIntersectionCount: z.number().nonnegative().optional(),
		stripIntersectingStripWidth: z.number().nonnegative().optional(),
		stripHasChairBars: z.number().optional(),
		stripChairBarsDiameter: z.number().nonnegative().optional(),
		stripChairBarsSpacingX: z.number().nonnegative().optional(),
		stripChairBarsSpacingY: z.number().nonnegative().optional(),
		stripLapSpliceMethod: z.string().optional(),
		stripCustomLapLength: z.number().nonnegative().optional(),
		// Raft foundation
		thickness: z.number().nonnegative().optional(),
		bottomXDiameter: z.number().nonnegative().optional(),
		bottomXBarsPerMeter: z.number().nonnegative().optional(),
		bottomYDiameter: z.number().nonnegative().optional(),
		bottomYBarsPerMeter: z.number().nonnegative().optional(),
		hasTopMesh: z.number().optional(),
		topXDiameter: z.number().nonnegative().optional(),
		topXBarsPerMeter: z.number().nonnegative().optional(),
		topYDiameter: z.number().nonnegative().optional(),
		topYBarsPerMeter: z.number().nonnegative().optional(),
		coverBottom: z.number().nonnegative().optional(),
		coverTop: z.number().nonnegative().optional(),
		coverSide: z.number().nonnegative().optional(),
		hasLeanConcrete: z.number().optional(),
		leanConcreteThickness: z.number().nonnegative().optional(),
		hasEdgeBeams: z.number().optional(),
		edgeBeamWidth: z.number().nonnegative().optional(),
		edgeBeamDepth: z.number().nonnegative().optional(),
		lapSpliceMethod: z.string().optional(),
		customLapLength: z.number().nonnegative().optional(),
		hasChairBars: z.number().optional(),
		chairBarsDiameter: z.number().nonnegative().optional(),
		chairBarsSpacingX: z.number().nonnegative().optional(),
		chairBarsSpacingY: z.number().nonnegative().optional(),
		columnDowelMode: z.string().optional(),
		columnDowelCount: z.number().nonnegative().optional(),
		columnDowelBarsPerColumn: z.number().nonnegative().optional(),
		columnDowelDiameter: z.number().nonnegative().optional(),
		columnDowelDevLength: z.number().nonnegative().optional(),
	})
	.passthrough();

// ─── Stairs dimensions ───

export const stairsDimensionsSchema = z
	.object({
		width: z.number().nonnegative(),
		flightLength: z.number().nonnegative(),
		landingLength: z.number().nonnegative().optional(),
		landingWidth: z.number().nonnegative().optional(),
		thickness: z.number().nonnegative(),
		risersCount: z.number().nonnegative().optional(),
		mainDiameter: z.number().nonnegative().optional(),
		mainBarsPerMeter: z.number().nonnegative().optional(),
		secondaryDiameter: z.number().nonnegative().optional(),
		secondaryBarsPerMeter: z.number().nonnegative().optional(),
	})
	.passthrough();

// ─── Blocks dimensions ───

export const blocksDimensionsSchema = z
	.object({
		length: z.number().nonnegative(),
		height: z.number().nonnegative(),
		thickness: z.number().nonnegative(),
		floor: z.union([z.string(), z.number()]).optional(),
		blockType: z.string().optional(),
		wallCategory: z.string().optional(),
	})
	.passthrough();

// ─── Union of all structural dimensions ───

export const structuralDimensionsUnion = z.union([
	plainConcreteDimensionsSchema,
	columnDimensionsSchema,
	beamDimensionsSchema,
	slabDimensionsSchema,
	foundationDimensionsSchema,
	stairsDimensionsSchema,
	blocksDimensionsSchema,
]);
