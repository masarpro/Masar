"use client";

import { useMemo } from "react";
import type { StructuralBuildingConfig } from "../types/structural-building-config";
import {
	deriveHeights,
	getEffectiveHeights,
	type DerivedBuildingHeights,
	type FloorSlabData,
} from "../lib/height-derivation-engine";

interface StructuralItemForHeight {
	category: string;
	dimensions: Record<string, any>;
	subCategory?: string | null;
}

export function useHeightDerivation(
	buildingConfig: StructuralBuildingConfig | null,
	structuralItems?: StructuralItemForHeight[],
) {
	// Extract actual slab data from structural items
	const slabData = useMemo<FloorSlabData[] | undefined>(() => {
		if (!structuralItems) return undefined;

		const slabItems = structuralItems.filter(
			(item) => item.category === "slabs",
		);
		if (slabItems.length === 0) return undefined;

		// Group by floor, picking the first slab per floor for thickness
		const byFloor = new Map<string, FloorSlabData>();
		for (const item of slabItems) {
			const floorLabel = String(item.dimensions?.floor || "");
			if (!floorLabel) continue;

			// Find matching floor id from config
			const matchingFloor = buildingConfig?.floors.find(
				(f) => f.label === floorLabel,
			);
			const floorId = matchingFloor?.id || floorLabel;

			if (!byFloor.has(floorId)) {
				const thickness = item.dimensions?.thickness || 0;
				// Slab thickness could be in cm or m depending on type
				// If < 1, it's in meters → convert to cm
				const slabThicknessCm = thickness < 1 ? thickness * 100 : thickness;

				byFloor.set(floorId, {
					floorId,
					slabThickness: slabThicknessCm,
					// Beam depth: check for embedded beams data, otherwise use default
					beamDepth: item.dimensions?.beamDepth || 0,
				});
			}
		}

		const result = Array.from(byFloor.values());
		// Only return if we found some valid slab thickness data
		return result.some((sd) => sd.slabThickness > 0) ? result : undefined;
	}, [structuralItems, buildingConfig?.floors]);

	const derivedHeights = useMemo<DerivedBuildingHeights | null>(() => {
		if (!buildingConfig?.heightProperties) return null;

		const raw = deriveHeights(buildingConfig, slabData);
		if (!raw) return null;

		return getEffectiveHeights(raw, buildingConfig.heightOverrides);
	}, [buildingConfig, slabData]);

	const getColumnHeight = (floorId: string): number | null => {
		return derivedHeights?.floors[floorId]?.columnHeight ?? null;
	};

	const getBlockHeight = (floorId: string): number | null => {
		return derivedHeights?.floors[floorId]?.blockHeight ?? null;
	};

	const getNeckHeight = (): number | null => {
		return derivedHeights?.neckHeight ?? null;
	};

	const getParapetBlockHeight = (): number | null => {
		return derivedHeights?.parapet?.blockHeight ?? null;
	};

	return {
		derivedHeights,
		getColumnHeight,
		getBlockHeight,
		getNeckHeight,
		getParapetBlockHeight,
	};
}
