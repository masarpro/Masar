import { describe, it, expect } from "vitest";
import {
	deriveHeights,
	getEffectiveHeights,
	SAUDI_DEFAULTS,
} from "../height-derivation-engine";
import type { StructuralBuildingConfig } from "../../types/structural-building-config";

function makeConfig(overrides?: Partial<StructuralBuildingConfig>): StructuralBuildingConfig {
	return {
		floors: [
			{ id: "ground", label: "أرضي", icon: "🏠", type: "ground", enabled: true, height: 3.2, slabArea: 200, isRepeated: false, repeatCount: 1, sortOrder: 0, finishLevel: 0 },
			{ id: "first", label: "أول", icon: "🏢", type: "typical", enabled: true, height: 3.2, slabArea: 200, isRepeated: false, repeatCount: 1, sortOrder: 1, finishLevel: 3.2 },
			{ id: "roof", label: "سطح", icon: "🏗️", type: "roof", enabled: true, height: 0, slabArea: 200, isRepeated: false, repeatCount: 1, sortOrder: 2, finishLevel: 6.4 },
		],
		heightProperties: { ...SAUDI_DEFAULTS, heightInputMode: "manual" },
		heightOverrides: {},
		...overrides,
	} as StructuralBuildingConfig;
}

describe("deriveHeights", () => {
	it("returns null if no heightProperties", () => {
		const result = deriveHeights({ floors: [], heightProperties: null } as any);
		expect(result).toBeNull();
	});

	it("computes neckHeight correctly with Saudi defaults", () => {
		const config = makeConfig();
		const result = deriveHeights(config);
		expect(result).not.toBeNull();

		// neckHeight = excavationDepth(2)*100 - plainConcreteThickness(10) - foundationDepth(60) - beamDepth(60) + buildingElevation(60)
		// = 200 - 10 - 60 - 60 + 60 = 130
		expect(result!.neckHeight).toBe(130);
	});

	it("derives floor-to-floor heights in manual mode", () => {
		const config = makeConfig();
		const result = deriveHeights(config)!;

		// Ground floor: height = 3.2m
		expect(result.floors["ground"].floorToFloorHeight).toBe(3.2);
	});

	it("derives column height = floorToFloor*100 - slabThickness - visibleBeam", () => {
		const config = makeConfig();
		const result = deriveHeights(config)!;

		// slabThickness = 20, beamDepth = 60, visibleBeam = max(0, 60-20) = 40
		// columnHeight = 3.2*100 - 20 - 40 = 260
		expect(result.floors["ground"].columnHeight).toBe(260);
	});

	it("derives block height = floorToFloor*100 - visibleBeam", () => {
		const config = makeConfig();
		const result = deriveHeights(config)!;

		// blockHeight = 3.2*100 - 40 = 280
		expect(result.floors["ground"].blockHeight).toBe(280);
	});

	it("derives parapet block height", () => {
		const config = makeConfig();
		const result = deriveHeights(config)!;

		// parapetHeight(100) - invertedBeamDepth(40) - roofWaterproofingThickness(15) = 45
		expect(result.parapet).not.toBeNull();
		expect(result.parapet!.blockHeight).toBe(45);
	});

	it("computes levels mode correctly", () => {
		const config = makeConfig({
			heightProperties: {
				...SAUDI_DEFAULTS,
				heightInputMode: "levels",
			},
		});
		const result = deriveHeights(config)!;

		// finishLevel: ground=0, first=3.2 → floor-to-floor = 3.2
		expect(result.floors["ground"].floorToFloorHeight).toBe(3.2);
	});
});

describe("getEffectiveHeights", () => {
	it("merges overrides into derived heights", () => {
		const config = makeConfig();
		const derived = deriveHeights(config)!;

		const merged = getEffectiveHeights(derived, {
			ground: { columnHeight: 300 },
		});

		expect(merged.floors["ground"].columnHeight).toBe(300);
		expect(merged.floors["ground"].isAutoCalculated).toBe(false);
		// First floor should remain auto-calculated
		expect(merged.floors["first"].isAutoCalculated).toBe(true);
	});

	it("returns derived as-is when no overrides", () => {
		const config = makeConfig();
		const derived = deriveHeights(config)!;
		const result = getEffectiveHeights(derived);
		expect(result).toBe(derived);
	});
});
