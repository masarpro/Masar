import type {
	AggregatedMaterial,
	ItemSpecification,
	SpecSubItem,
	SpecificationTemplate,
	SubItemRate,
} from "./spec-types";
import { getSpecConfig } from "./catalog";

/**
 * Calculates sub-items for a single finishing item based on its spec and quantity.
 */
export function calculateSubItems(
	categoryKey: string,
	specTypeKey: string,
	options: Record<string, unknown>,
	effectiveQuantity: number,
	_unit: string,
): SpecSubItem[] {
	const config = getSpecConfig(categoryKey);
	if (!config) return [];

	const specType = config.specTypes.find((s) => s.key === specTypeKey);
	if (!specType) return [];

	const subItems: SpecSubItem[] = [];

	for (const rate of specType.subItemRates) {
		// Skip optional items whose condition is not met
		if (rate.isOptional && rate.conditionalOn) {
			const conditionValue = options[rate.conditionalOn];
			if (
				!conditionValue ||
				conditionValue === false ||
				conditionValue === "none" ||
				conditionValue === "no"
			) {
				continue;
			}
		}

		const adjustedRate = applyRateModifiers(rate, options, categoryKey);
		const quantity = roundTo(adjustedRate * effectiveQuantity, 2);

		subItems.push({
			id: rate.subItemKey,
			name: rate.name,
			nameEn: rate.nameEn,
			unit: rate.unit,
			ratePerUnit: adjustedRate,
			quantity,
			category: rate.category,
			isOptional: rate.isOptional,
			brand: (options.brand as string) ?? undefined,
		});
	}

	return subItems;
}

/**
 * Applies option-based rate modifiers.
 * E.g. thickness scaling for insulation, layer count for paint/waterproofing.
 */
function applyRateModifiers(
	rate: SubItemRate,
	options: Record<string, unknown>,
	categoryKey: string,
): number {
	let adjustedRate = rate.ratePerUnit;

	// Thermal insulation: scale main material by thickness/50
	if (
		categoryKey === "FINISHING_THERMAL_INSULATION" &&
		rate.category === "main" &&
		options.thickness
	) {
		const thickness = Number(options.thickness);
		if (thickness > 0 && thickness !== 50) {
			adjustedRate = adjustedRate * (thickness / 50);
		}
	}

	// Waterproofing: multiply main + primer by layer count
	if (
		categoryKey === "FINISHING_WATERPROOFING" &&
		(rate.category === "main" || rate.category === "primer") &&
		options.layers
	) {
		const layers = Number(options.layers);
		if (layers > 1) {
			adjustedRate = adjustedRate * (layers / 2);
		}
	}

	// Paint: adjust for number of coats (base is 2 coats)
	if (
		(categoryKey === "FINISHING_INTERIOR_PAINT" ||
			categoryKey === "FINISHING_FACADE_PAINT" ||
			categoryKey === "FINISHING_BOUNDARY_PAINT") &&
		rate.category === "main" &&
		options.coats
	) {
		const coats = Number(options.coats);
		if (coats > 0 && coats !== 2) {
			adjustedRate = adjustedRate * (coats / 2);
		}
	}

	// Paint: reduce putty for light_putty or no_putty
	if (
		categoryKey === "FINISHING_INTERIOR_PAINT" &&
		rate.category === "filler"
	) {
		if (options.preparation === "light_putty") {
			adjustedRate = adjustedRate * 0.5;
		} else if (options.preparation === "no_putty") {
			adjustedRate = 0;
		}
	}

	// Plaster: scale by thickness/20 (base is 20mm for manual, varies)
	if (
		(categoryKey === "FINISHING_INTERNAL_PLASTER" ||
			categoryKey === "FINISHING_EXTERNAL_PLASTER") &&
		rate.category === "main" &&
		options.thickness
	) {
		const thickness = Number(options.thickness);
		const baseThickness =
			categoryKey === "FINISHING_INTERNAL_PLASTER" ? 20 : 20;
		if (thickness > 0 && thickness !== baseThickness) {
			adjustedRate = adjustedRate * (thickness / baseThickness);
		}
	}

	// Internal plaster: adjust mesh for full vs joints_only
	if (
		categoryKey === "FINISHING_INTERNAL_PLASTER" &&
		rate.subItemKey === "reinforcement_mesh"
	) {
		if (options.meshType === "full") {
			adjustedRate = 1.1; // full coverage
		} else if (options.meshType === "joints_only") {
			adjustedRate = 0.3; // default
		}
	}

	return roundTo(adjustedRate, 4);
}

/**
 * Creates an ItemSpecification from a template entry and effective quantity.
 */
export function buildItemSpec(
	categoryKey: string,
	specTypeKey: string,
	options: Record<string, unknown>,
	effectiveQuantity: number,
	unit: string,
): ItemSpecification {
	const config = getSpecConfig(categoryKey);
	const specType = config?.specTypes.find((s) => s.key === specTypeKey);

	return {
		categoryKey,
		specTypeKey,
		specTypeLabel: specType?.label ?? specTypeKey,
		options,
		subItems: calculateSubItems(
			categoryKey,
			specTypeKey,
			options,
			effectiveQuantity,
			unit,
		),
	};
}

/**
 * Applies a specification template to a list of items, returning ItemSpecification[].
 */
export function applyTemplate(
	template: Pick<SpecificationTemplate, "specs">,
	items: Array<{
		categoryKey: string;
		effectiveQuantity: number;
		unit: string;
	}>,
): ItemSpecification[] {
	const specs: ItemSpecification[] = [];

	for (const item of items) {
		const templateSpec = template.specs.find(
			(s) => s.categoryKey === item.categoryKey,
		);
		if (!templateSpec) continue;

		specs.push(
			buildItemSpec(
				item.categoryKey,
				templateSpec.specTypeKey,
				templateSpec.options,
				item.effectiveQuantity,
				item.unit,
			),
		);
	}

	return specs;
}

/**
 * Aggregates all sub-items from all specs into a unified material list.
 * Merges items with the same name + unit.
 */
export function aggregateAllSubItems(
	specs: ItemSpecification[],
): AggregatedMaterial[] {
	const map = new Map<
		string,
		{
			name: string;
			nameEn: string;
			unit: string;
			totalQuantity: number;
			usedInItems: Set<string>;
		}
	>();

	for (const spec of specs) {
		for (const sub of spec.subItems) {
			const key = `${sub.name}|${sub.unit}`;
			const existing = map.get(key);
			if (existing) {
				existing.totalQuantity += sub.quantity;
				existing.usedInItems.add(spec.specTypeLabel);
			} else {
				map.set(key, {
					name: sub.name,
					nameEn: sub.nameEn,
					unit: sub.unit,
					totalQuantity: sub.quantity,
					usedInItems: new Set([spec.specTypeLabel]),
				});
			}
		}
	}

	return Array.from(map.values()).map((m) => ({
		name: m.name,
		nameEn: m.nameEn,
		unit: m.unit,
		totalQuantity: roundTo(m.totalQuantity, 2),
		usedInItems: Array.from(m.usedInItems),
	}));
}

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}
