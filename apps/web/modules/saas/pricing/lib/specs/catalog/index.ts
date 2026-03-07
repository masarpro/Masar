// ══════════════════════════════════════════════════════════════
// Spec Catalog — aggregates all category catalogs
// ══════════════════════════════════════════════════════════════

import type { CategorySpecConfig } from "../spec-types";
import { INSULATION_CATALOG } from "./insulation-catalog";
import { PLASTER_CATALOG } from "./plaster-catalog";
import { PAINT_CATALOG } from "./paint-catalog";
import { FLOORING_CATALOG } from "./flooring-catalog";
import { WALLS_CEILING_CATALOG } from "./walls-ceiling-catalog";
import { DOORS_WINDOWS_CATALOG } from "./doors-windows-catalog";
import { SANITARY_KITCHEN_CATALOG } from "./sanitary-kitchen-catalog";
import { EXTERIOR_CATALOG } from "./exterior-catalog";

export const SPEC_CATALOG: Record<string, CategorySpecConfig> = {
	...INSULATION_CATALOG,
	...PLASTER_CATALOG,
	...PAINT_CATALOG,
	...FLOORING_CATALOG,
	...WALLS_CEILING_CATALOG,
	...DOORS_WINDOWS_CATALOG,
	...SANITARY_KITCHEN_CATALOG,
	...EXTERIOR_CATALOG,
};

export function getSpecConfig(
	categoryKey: string,
): CategorySpecConfig | undefined {
	return SPEC_CATALOG[categoryKey];
}

export function getAllSpecConfigs(): CategorySpecConfig[] {
	return Object.values(SPEC_CATALOG);
}
