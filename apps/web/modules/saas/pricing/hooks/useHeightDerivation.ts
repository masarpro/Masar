"use client";

import { useMemo } from "react";
import type { StructuralBuildingConfig } from "../types/structural-building-config";
import {
	deriveHeights,
	getEffectiveHeights,
	type DerivedBuildingHeights,
} from "../lib/height-derivation-engine";

export function useHeightDerivation(
	buildingConfig: StructuralBuildingConfig | null,
) {
	const derivedHeights = useMemo<DerivedBuildingHeights | null>(() => {
		if (!buildingConfig?.heightProperties) return null;

		const raw = deriveHeights(buildingConfig);
		if (!raw) return null;

		return getEffectiveHeights(raw, buildingConfig.heightOverrides);
	}, [buildingConfig]);

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
