// BOM Engine — generates and aggregates Bills of Materials

import type { SpecSubItem } from "./specs/spec-types";
import { calculateSubItems } from "./specs/spec-calculator";

export interface BOMInput {
	itemId: string;
	itemType: "STRUCTURAL" | "FINISHING" | "MEP";
	category: string;
	quantity: number;
	unit: string;
	specData: Record<string, any>;
	floorId?: string;
	floorName?: string;
	roomId?: string;
	roomName?: string;
}

export interface BOMOutput {
	materialName: string;
	materialNameEn?: string;
	quantity: number;
	unit: string;
	consumptionRate: number;
	wastagePercent: number;
	effectiveQuantity: number;
}

interface FallbackRate {
	name: string;
	nameEn: string;
	unit: string;
	ratePerUnit: number;
	wastage: number;
}

const FALLBACK_RATES: Record<string, FallbackRate[]> = {
	PLASTER: [
		{ name: "اسمنت", nameEn: "Cement", unit: "كجم", ratePerUnit: 10, wastage: 5 },
		{ name: "رمل", nameEn: "Sand", unit: "م٣", ratePerUnit: 0.02, wastage: 10 },
		{ name: "شبك تسليح", nameEn: "Reinforcement Mesh", unit: "م٢", ratePerUnit: 1.1, wastage: 5 },
	],
	PAINT: [
		{ name: "برايمر", nameEn: "Primer", unit: "لتر", ratePerUnit: 0.15, wastage: 5 },
		{ name: "دهان", nameEn: "Paint", unit: "لتر", ratePerUnit: 0.35, wastage: 5 },
		{ name: "معجون", nameEn: "Putty", unit: "كجم", ratePerUnit: 0.5, wastage: 5 },
	],
	FLOORING: [
		{ name: "بلاط", nameEn: "Tiles", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
		{ name: "لاصق", nameEn: "Adhesive", unit: "كجم", ratePerUnit: 5, wastage: 5 },
		{ name: "روبة", nameEn: "Grout", unit: "كجم", ratePerUnit: 0.5, wastage: 10 },
	],
	WATERPROOFING: [
		{ name: "لفات عزل", nameEn: "Waterproofing Rolls", unit: "م٢", ratePerUnit: 1.15, wastage: 10 },
		{ name: "برايمر بيتومين", nameEn: "Bitumen Primer", unit: "لتر", ratePerUnit: 0.3, wastage: 5 },
	],
	THERMAL_INSULATION: [
		{ name: "ألواح عزل", nameEn: "Insulation Boards", unit: "م٢", ratePerUnit: 1.05, wastage: 5 },
	],
};

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/** Default wastage percentage for a sub-item category. */
function defaultWastage(subCategory: SpecSubItem["category"]): number {
	switch (subCategory) {
		case "main":
			return 5;
		case "adhesive":
			return 5;
		case "primer":
			return 5;
		case "filler":
			return 5;
		case "accessory":
			return 3;
		case "protection":
			return 3;
		case "tool":
			return 0;
		default:
			return 5;
	}
}

/** Match category string (e.g. "FINISHING_INTERNAL_PLASTER") to fallback key. */
function matchFallbackKey(category: string): string | undefined {
	const upper = category.toUpperCase();
	const keys = Object.keys(FALLBACK_RATES);
	return keys.find((k) => upper.includes(k));
}

/** Converts SpecSubItem[] (from the spec-calculator) into BOMOutput[]. */
function subItemsToBOM(
	subItems: SpecSubItem[],
	baseQuantity: number,
): BOMOutput[] {
	return subItems.map((sub) => {
		const wastage = defaultWastage(sub.category);
		const effective = roundTo(sub.quantity * (1 + wastage / 100), 2);
		return {
			materialName: sub.name,
			materialNameEn: sub.nameEn,
			quantity: sub.quantity,
			unit: sub.unit,
			consumptionRate: sub.ratePerUnit,
			wastagePercent: wastage,
			effectiveQuantity: effective,
		};
	});
}

/**
 * Generates a BOM from a single item. Uses precomputed subItems if present,
 * falls back to calculateSubItems from the catalog, or hardcoded rates.
 */
export function generateBOM(input: BOMInput): BOMOutput[] {
	const { category, quantity, unit, specData } = input;

	// Path 1: specData is a full ItemSpecification with precomputed subItems
	if (specData.subItems && Array.isArray(specData.subItems) && specData.subItems.length > 0) {
		return subItemsToBOM(specData.subItems as SpecSubItem[], quantity);
	}

	// Path 2: specData has keys needed to calculate via the catalog
	const categoryKey = specData.categoryKey ?? category;
	const specTypeKey = specData.specTypeKey as string | undefined;

	if (specTypeKey) {
		const options = (specData.options as Record<string, unknown>) ?? {};
		const subItems = calculateSubItems(
			categoryKey,
			specTypeKey,
			options,
			quantity,
			unit,
		);
		if (subItems.length > 0) {
			return subItemsToBOM(subItems, quantity);
		}
	}

	// Path 3: fallback to hardcoded rates
	const fallbackKey = matchFallbackKey(categoryKey);
	if (!fallbackKey) return [];

	const rates = FALLBACK_RATES[fallbackKey];
	return rates.map((rate) => {
		const rawQty = roundTo(rate.ratePerUnit * quantity, 2);
		const effective = roundTo(rawQty * (1 + rate.wastage / 100), 2);
		return {
			materialName: rate.name,
			materialNameEn: rate.nameEn,
			quantity: rawQty,
			unit: rate.unit,
			consumptionRate: rate.ratePerUnit,
			wastagePercent: rate.wastage,
			effectiveQuantity: effective,
		};
	});
}

/**
 * Aggregates multiple BOM outputs, merging by (materialName + unit).
 * Quantities are summed; wastage and rate are quantity-weighted averages.
 */
export function aggregateBOM(bomLists: BOMOutput[][]): BOMOutput[] {
	const map = new Map<
		string,
		{
			materialName: string;
			materialNameEn?: string;
			unit: string;
			totalQuantity: number;
			totalEffective: number;
			totalWastageWeighted: number;
			totalRateWeighted: number;
			count: number;
		}
	>();

	for (const list of bomLists) {
		for (const item of list) {
			const key = `${item.materialName}|${item.unit}`;
			const existing = map.get(key);
			if (existing) {
				existing.totalQuantity += item.quantity;
				existing.totalEffective += item.effectiveQuantity;
				existing.totalWastageWeighted += item.wastagePercent * item.quantity;
				existing.totalRateWeighted += item.consumptionRate * item.quantity;
				existing.count += 1;
			} else {
				map.set(key, {
					materialName: item.materialName,
					materialNameEn: item.materialNameEn,
					unit: item.unit,
					totalQuantity: item.quantity,
					totalEffective: item.effectiveQuantity,
					totalWastageWeighted: item.wastagePercent * item.quantity,
					totalRateWeighted: item.consumptionRate * item.quantity,
					count: 1,
				});
			}
		}
	}

	return Array.from(map.values()).map((m) => {
		const avgWastage =
			m.totalQuantity > 0
				? roundTo(m.totalWastageWeighted / m.totalQuantity, 2)
				: 0;
		const avgRate =
			m.totalQuantity > 0
				? roundTo(m.totalRateWeighted / m.totalQuantity, 4)
				: 0;
		return {
			materialName: m.materialName,
			materialNameEn: m.materialNameEn,
			quantity: roundTo(m.totalQuantity, 2),
			unit: m.unit,
			consumptionRate: avgRate,
			wastagePercent: avgWastage,
			effectiveQuantity: roundTo(m.totalEffective, 2),
		};
	});
}
