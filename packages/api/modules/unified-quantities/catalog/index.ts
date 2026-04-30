// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Catalog Barrel
// المحرك الموحَّد — مدخل الكتالوج الموحَّد
// ════════════════════════════════════════════════════════════════

import type { CatalogEntry, PresetEntry } from "./types";

// Finishing
import { PAINT_CATALOG } from "./finishing/paint";
import { PLASTER_CATALOG } from "./finishing/plaster";
import { FLOORING_CATALOG } from "./finishing/flooring";
import { WALLS_CATALOG } from "./finishing/walls";
import { CEILING_CATALOG } from "./finishing/ceiling";
import { DOORS_CATALOG } from "./finishing/doors";
import { WINDOWS_CATALOG } from "./finishing/windows";
import { INSULATION_CATALOG } from "./finishing/insulation";
import { CLADDING_CATALOG } from "./finishing/cladding";
import { TRIM_CATALOG } from "./finishing/trim";
import { KITCHEN_CATALOG } from "./finishing/kitchen";

// MEP
import { ELECTRICAL_CATALOG } from "./mep/electrical";
import { PLUMBING_CATALOG } from "./mep/plumbing";
import { HVAC_CATALOG } from "./mep/hvac";
import { FIREFIGHTING_CATALOG } from "./mep/firefighting";
import { LOW_CURRENT_CATALOG } from "./mep/low-current";

// Exterior + Special
import { EXTERIOR_CATALOG } from "./exterior";
import { SPECIAL_CATALOG } from "./special";

// Presets
import { PRESETS as PRESETS_LIST } from "./presets";

export const FULL_CATALOG: CatalogEntry[] = [
	...PLASTER_CATALOG,
	...PAINT_CATALOG,
	...FLOORING_CATALOG,
	...WALLS_CATALOG,
	...CEILING_CATALOG,
	...DOORS_CATALOG,
	...WINDOWS_CATALOG,
	...INSULATION_CATALOG,
	...CLADDING_CATALOG,
	...TRIM_CATALOG,
	...KITCHEN_CATALOG,
	...ELECTRICAL_CATALOG,
	...PLUMBING_CATALOG,
	...HVAC_CATALOG,
	...FIREFIGHTING_CATALOG,
	...LOW_CURRENT_CATALOG,
	...EXTERIOR_CATALOG,
	...SPECIAL_CATALOG,
];

export const PRESETS: PresetEntry[] = PRESETS_LIST;

export type { CatalogEntry, PresetEntry } from "./types";

// ── Helpers ──────────────────────────────────────────────────────

export function getCatalogEntry(itemKey: string): CatalogEntry | undefined {
	return FULL_CATALOG.find((e) => e.itemKey === itemKey);
}

export function getCatalogByDomain(domain: string): CatalogEntry[] {
	return FULL_CATALOG.filter((e) => e.domain === domain);
}

export function getCatalogByCategory(categoryKey: string): CatalogEntry[] {
	return FULL_CATALOG.filter((e) => e.categoryKey === categoryKey);
}

export function getPreset(key: string): PresetEntry | undefined {
	return PRESETS.find((p) => p.key === key);
}
