// ═══════════════════════════════════════════════════════════════
// BOQ Recalculator - إعادة حساب تفاصيل القص من الأبعاد المخزنة
// ═══════════════════════════════════════════════════════════════

import { getRebarWeightPerMeter } from "./structural-calculations";
import { STOCK_LENGTHS, REBAR_WEIGHTS } from "../constants/prices";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CuttingDetailRow {
	element: string;
	description: string;
	diameter: number;
	barLength: number;
	barCount: number;
	stockLength: number;
	stocksNeeded: number;
	wastePerStock: number;
	totalWaste: number;
	wastePercentage: number;
	netWeight: number;
	grossWeight: number;
}

export interface RecalcResult {
	cuttingDetails: CuttingDetailRow[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
	hasRebarParams: boolean;
}

// ─────────────────────────────────────────────────────────────
// Core cutting calculation
// ─────────────────────────────────────────────────────────────

function calcCutting(
	element: string,
	description: string,
	diameter: number,
	barLength: number,
	barCount: number,
): CuttingDetailRow {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const weight = REBAR_WEIGHTS[diameter] || diameter * diameter * 0.00617;

	let stocksNeeded: number;
	let wastePerStock: number;
	let totalWaste: number;

	if (barLength > stockLength) {
		// Bar longer than stock — needs lap splices (SBC 304: 40d)
		const lapLength = (diameter * 40) / 1000;
		const effectiveStockLength = stockLength - lapLength;

		// How many stock bars per piece
		let barsPerPiece = Math.ceil((barLength - lapLength) / effectiveStockLength);
		if (barsPerPiece < 2) barsPerPiece = 2;

		// Verify: n bars with (n-1) lap joints must cover barLength
		const lapJoints = barsPerPiece - 1;
		const availableLength = barsPerPiece * stockLength - lapJoints * lapLength;
		if (availableLength < barLength) {
			barsPerPiece += 1;
		}

		stocksNeeded = barsPerPiece * barCount;

		// Waste per assembled piece
		const actualLapJoints = barsPerPiece - 1;
		const usedPerPiece = barLength + actualLapJoints * lapLength;
		const boughtPerPiece = barsPerPiece * stockLength;
		wastePerStock = boughtPerPiece - usedPerPiece;
		totalWaste = wastePerStock * barCount;
	} else {
		// Normal case: bar fits within stock
		const cutsPerStock = Math.floor(stockLength / barLength) || 1;
		stocksNeeded = Math.ceil(barCount / cutsPerStock);
		wastePerStock = stockLength - cutsPerStock * barLength;
		totalWaste = stocksNeeded * wastePerStock;
	}

	const netLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;

	const netWeight = netLength * weight;
	const grossWeight = grossLength * weight;
	const wastePercentage = grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;

	return {
		element,
		description,
		diameter,
		barLength: Number(barLength.toFixed(3)),
		barCount,
		stockLength,
		stocksNeeded,
		wastePerStock: Number(wastePerStock.toFixed(3)),
		totalWaste: Number(totalWaste.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		netWeight: Number(netWeight.toFixed(2)),
		grossWeight: Number(grossWeight.toFixed(2)),
	};
}

function aggregateResult(element: string, details: CuttingDetailRow[]): RecalcResult {
	const netWeight = details.reduce((s, d) => s + d.netWeight, 0);
	const grossWeight = details.reduce((s, d) => s + d.grossWeight, 0);
	const wastePercentage = grossWeight > 0 ? ((grossWeight - netWeight) / grossWeight) * 100 : 0;

	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	details.forEach((d) => {
		const existing = stocksMap.get(d.diameter);
		if (existing) {
			existing.count += d.stocksNeeded;
		} else {
			stocksMap.set(d.diameter, { diameter: d.diameter, count: d.stocksNeeded, length: d.stockLength });
		}
	});

	return {
		cuttingDetails: details,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
		hasRebarParams: true,
	};
}

// ─────────────────────────────────────────────────────────────
// Per-category recalculators
// ─────────────────────────────────────────────────────────────

export function recalculateColumnCutting(
	dims: Record<string, number>,
	quantity: number,
	itemName: string,
): RecalcResult {
	const mainBarsCount = dims.mainBarsCount;
	const mainBarDiameter = dims.mainBarDiameter;
	const stirrupDiameter = dims.stirrupDiameter;
	const stirrupSpacing = dims.stirrupSpacing;
	const height = dims.height || 3;
	const width = dims.width || 30;
	const depth = dims.depth || 30;

	if (!mainBarsCount || !mainBarDiameter) {
		return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
	}

	const barLength = height + 0.6; // lap/anchorage
	const widthM = width / 100;
	const depthM = depth / 100;
	const stirrupPerimeter = 2 * (widthM + depthM - 0.08) + 0.3;
	const stirrupsCount = Math.ceil((height * 1000) / stirrupSpacing) + 1;

	const details = [
		calcCutting(itemName, "حديد رئيسي", mainBarDiameter, barLength, mainBarsCount * quantity),
		calcCutting(itemName, "كانات", stirrupDiameter, stirrupPerimeter, stirrupsCount * quantity),
	];

	return aggregateResult(itemName, details);
}

export function recalculateBeamCutting(
	dims: Record<string, number>,
	quantity: number,
	itemName: string,
): RecalcResult {
	const topBarsCount = dims.topBarsCount;
	const topBarDiameter = dims.topBarDiameter;
	const bottomBarsCount = dims.bottomBarsCount;
	const bottomBarDiameter = dims.bottomBarDiameter;
	const stirrupDiameter = dims.stirrupDiameter;
	const stirrupSpacing = dims.stirrupSpacing;
	const length = dims.length || 5;
	const width = dims.width || 30;
	const height = dims.height || 60;

	if (!topBarsCount || !bottomBarsCount) {
		return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
	}

	const barLength = length + 0.6;
	const widthM = width / 100;
	const heightM = height / 100;
	const stirrupPerimeter = 2 * (widthM + heightM - 0.08) + 0.3;
	const stirrupsCount = Math.ceil((length * 1000) / stirrupSpacing) + 1;

	const details = [
		calcCutting(itemName, "حديد علوي", topBarDiameter, barLength, topBarsCount * quantity),
		calcCutting(itemName, "حديد سفلي", bottomBarDiameter, barLength, bottomBarsCount * quantity),
		calcCutting(itemName, "كانات", stirrupDiameter, stirrupPerimeter, stirrupsCount * quantity),
	];

	return aggregateResult(itemName, details);
}

export function recalculateFoundationCutting(
	dims: Record<string, number>,
	quantity: number,
	itemName: string,
	subCategory: string,
): RecalcResult {
	const cover = dims.cover || 0.075;
	const hookLength = dims.hookLength || 0.1;
	const details: CuttingDetailRow[] = [];

	if (subCategory === "isolated" || subCategory === "combined") {
		const length = dims.length || 0;
		const width = dims.width || 0;
		if (!dims.bottomShortDiameter) {
			return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
		}

		// Bottom short direction
		const bottomShortBarLength = width - 2 * cover + 2 * hookLength;
		const bottomShortCount = Math.ceil(length * (dims.bottomShortBarsPerMeter || 5));
		details.push(calcCutting(itemName, "فرش سفلي - قصير", dims.bottomShortDiameter, bottomShortBarLength, bottomShortCount * quantity));

		// Bottom long direction
		const bottomLongBarLength = length - 2 * cover + 2 * hookLength;
		const bottomLongCount = Math.ceil(width * (dims.bottomLongBarsPerMeter || 5));
		details.push(calcCutting(itemName, "فرش سفلي - طويل", dims.bottomLongDiameter || dims.bottomShortDiameter, bottomLongBarLength, bottomLongCount * quantity));

		// Top short
		if (dims.hasTopShort) {
			const topShortBarLength = width - 2 * cover + 2 * hookLength;
			const topShortCount = Math.ceil(length * (dims.topShortBarsPerMeter || 4));
			details.push(calcCutting(itemName, "غطاء علوي - قصير", dims.topShortDiameter || 12, topShortBarLength, topShortCount * quantity));
		}

		// Top long
		if (dims.hasTopLong) {
			const topLongBarLength = length - 2 * cover + 2 * hookLength;
			const topLongCount = Math.ceil(width * (dims.topLongBarsPerMeter || 4));
			details.push(calcCutting(itemName, "غطاء علوي - طويل", dims.topLongDiameter || 12, topLongBarLength, topLongCount * quantity));
		}
	} else if (subCategory === "strip") {
		if (!dims.bottomMainCount) {
			return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
		}
		const segmentLength = dims.segmentLength || dims.length || 10;
		const barLength = segmentLength + 0.6;

		details.push(calcCutting(itemName, "حديد طولي رئيسي", dims.bottomMainDiameter || 16, barLength, (dims.bottomMainCount || 6)));

		if (dims.hasStirrup && dims.stirrupDiameter) {
			const widthM = (dims.width || 0.6);
			const heightM = (dims.height || 0.6);
			const stirrupPerimeter = 2 * (widthM + heightM - 0.08) + 0.3;
			const stirrupsCount = Math.ceil((segmentLength * 1000) / (dims.stirrupSpacing || 200)) + 1;
			details.push(calcCutting(itemName, "كانات", dims.stirrupDiameter, stirrupPerimeter, stirrupsCount));
		}
	} else if (subCategory === "raft") {
		if (!dims.bottomXDiameter) {
			return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
		}
		const length = dims.length || 0;
		const width = dims.width || 0;
		const thickness = dims.thickness || 0.6;

		// Bottom X bars
		const bxBarLength = length - 2 * cover;
		const bxCount = Math.ceil(width * (dims.bottomXBarsPerMeter || 5));
		details.push(calcCutting(itemName, "شبكة سفلية - X", dims.bottomXDiameter, bxBarLength, bxCount));

		// Bottom Y bars
		const byBarLength = width - 2 * cover;
		const byCount = Math.ceil(length * (dims.bottomYBarsPerMeter || 5));
		details.push(calcCutting(itemName, "شبكة سفلية - Y", dims.bottomYDiameter || dims.bottomXDiameter, byBarLength, byCount));

		// Top mesh
		if (dims.hasTopMesh) {
			const txBarLength = length - 2 * cover;
			const txCount = Math.ceil(width * (dims.topXBarsPerMeter || 4));
			details.push(calcCutting(itemName, "شبكة علوية - X", dims.topXDiameter || 12, txBarLength, txCount));

			const tyBarLength = width - 2 * cover;
			const tyCount = Math.ceil(length * (dims.topYBarsPerMeter || 4));
			details.push(calcCutting(itemName, "شبكة علوية - Y", dims.topYDiameter || 12, tyBarLength, tyCount));
		}
	} else {
		return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
	}

	return aggregateResult(itemName, details);
}

export function recalculateStairsCutting(
	dims: Record<string, number>,
	quantity: number,
	itemName: string,
): RecalcResult {
	const mainDiameter = dims.mainDiameter;
	const mainBarsPerMeter = dims.mainBarsPerMeter;
	const secondaryDiameter = dims.secondaryDiameter;
	const secondaryBarsPerMeter = dims.secondaryBarsPerMeter;
	const flightLength = dims.flightLength || 3;
	const landingLength = dims.landingLength || 1.5;
	const width = dims.width || 1.2;

	if (!mainDiameter || !mainBarsPerMeter) {
		return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
	}

	const totalLength = flightLength + landingLength;
	const mainBarLength = totalLength + 0.5;
	const mainBarsCount = Math.ceil(width * mainBarsPerMeter) + 1;

	const secondaryBarLength = width + 0.3;
	const secondaryBarsCount = Math.ceil(totalLength * (secondaryBarsPerMeter || 5)) + 1;

	const details = [
		calcCutting(itemName, "حديد رئيسي (طولي)", mainDiameter, mainBarLength, mainBarsCount * quantity),
		calcCutting(itemName, "حديد ثانوي (عرضي)", secondaryDiameter || 10, secondaryBarLength, secondaryBarsCount * quantity),
	];

	return aggregateResult(itemName, details);
}

export function recalculateSlabCutting(
	dims: Record<string, number>,
	quantity: number,
	itemName: string,
): RecalcResult {
	const bottomMainDiameter = dims.bottomMainDiameter;
	const bottomMainBarsPerMeter = dims.bottomMainBarsPerMeter;
	const length = dims.length || 0;
	const width = dims.width || 0;
	const cover = dims.cover || 0.025;

	if (!bottomMainDiameter || !bottomMainBarsPerMeter || length <= 0 || width <= 0) {
		return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
	}

	const details: CuttingDetailRow[] = [];
	const area = length * width * quantity;

	// Bottom main bars (long direction)
	const bmBarLength = length - 2 * cover + 0.2;
	const bmCount = Math.ceil(width * bottomMainBarsPerMeter) * quantity;
	details.push(calcCutting(itemName, "شبكة سفلية - رئيسي", bottomMainDiameter, bmBarLength, bmCount));

	// Bottom secondary bars (short direction)
	const bsDiameter = dims.bottomSecondaryDiameter || 10;
	const bsBarsPerMeter = dims.bottomSecondaryBarsPerMeter || 5;
	const bsBarLength = width - 2 * cover + 0.2;
	const bsCount = Math.ceil(length * bsBarsPerMeter) * quantity;
	details.push(calcCutting(itemName, "شبكة سفلية - ثانوي", bsDiameter, bsBarLength, bsCount));

	// Top mesh
	if (dims.hasTopMesh) {
		const tmDiameter = dims.topMainDiameter || 10;
		const tmBarsPerMeter = dims.topMainBarsPerMeter || 5;
		const tmBarLength = length - 2 * cover + 0.2;
		const tmCount = Math.ceil(width * tmBarsPerMeter) * quantity;
		details.push(calcCutting(itemName, "شبكة علوية - رئيسي", tmDiameter, tmBarLength, tmCount));

		const tsDiameter = dims.topSecondaryDiameter || 8;
		const tsBarsPerMeter = dims.topSecondaryBarsPerMeter || 4;
		const tsBarLength = width - 2 * cover + 0.2;
		const tsCount = Math.ceil(length * tsBarsPerMeter) * quantity;
		details.push(calcCutting(itemName, "شبكة علوية - ثانوي", tsDiameter, tsBarLength, tsCount));
	}

	// Ribbed slab ribs
	if (dims.ribBarDiameter && dims.ribBottomBars) {
		const ribSpacing = (dims.ribSpacing || 52) / 100; // cm to m
		const ribCount = Math.floor(width / ribSpacing);
		const ribLength = length;

		details.push(calcCutting(itemName, "أعصاب - حديد سفلي", dims.ribBarDiameter, ribLength + 0.3, (dims.ribBottomBars || 2) * ribCount * quantity));

		if (dims.ribTopBars && dims.ribTopBarDiameter) {
			details.push(calcCutting(itemName, "أعصاب - حديد علوي", dims.ribTopBarDiameter, ribLength + 0.3, (dims.ribTopBars || 2) * ribCount * quantity));
		}

		if (dims.hasRibStirrup && dims.ribStirrupDiameter) {
			const ribWidth = (dims.ribWidth || 15) / 100;
			const ribHeight = ((dims.blockHeight || 20) + (dims.toppingThickness || 5)) / 100;
			const stirrupPerimeter = 2 * (ribWidth + ribHeight - 0.04) + 0.2;
			const stirrupsPerRib = Math.ceil((ribLength * 1000) / (dims.ribStirrupSpacing || 200)) + 1;
			details.push(calcCutting(itemName, "أعصاب - كانات", dims.ribStirrupDiameter, stirrupPerimeter, stirrupsPerRib * ribCount * quantity));
		}
	}

	return aggregateResult(itemName, details);
}

// ─────────────────────────────────────────────────────────────
// Universal recalculator
// ─────────────────────────────────────────────────────────────

export function recalculateItem(
	category: string,
	subCategory: string | null | undefined,
	dims: Record<string, number>,
	quantity: number,
	itemName: string,
): RecalcResult {
	switch (category) {
		case "columns":
			return recalculateColumnCutting(dims, quantity, itemName);
		case "beams":
			return recalculateBeamCutting(dims, quantity, itemName);
		case "foundations":
			return recalculateFoundationCutting(dims, quantity, itemName, subCategory || "isolated");
		case "stairs":
			return recalculateStairsCutting(dims, quantity, itemName);
		case "slabs":
			return recalculateSlabCutting(dims, quantity, itemName);
		default:
			return { cuttingDetails: [], totals: { netWeight: 0, grossWeight: 0, wastePercentage: 0, stocksNeeded: [] }, hasRebarParams: false };
	}
}

// ─────────────────────────────────────────────────────────────
// Cross-operation remnant reuse optimizer
// ─────────────────────────────────────────────────────────────

const MIN_USABLE_REMNANT = 0.3; // metres

/**
 * Computes factory order with cross-operation remnant reuse.
 * Groups all cutting details by diameter, sorts longest-first,
 * and tracks remnants from each operation for reuse by later ones.
 * Returns optimized stock counts per diameter.
 */
export function computeOptimizedFactoryOrder(
	details: CuttingDetailRow[],
): { diameter: number; stockLength: number; count: number }[] {
	// Group by diameter + stockLength
	const groups = new Map<string, CuttingDetailRow[]>();
	for (const d of details) {
		const key = `${d.diameter}-${d.stockLength}`;
		const list = groups.get(key) || [];
		list.push(d);
		groups.set(key, list);
	}

	const result: { diameter: number; stockLength: number; count: number }[] = [];

	for (const [, group] of groups) {
		const diameter = group[0].diameter;
		const stockLen = group[0].stockLength;

		// Sort by barLength descending — longest first uses new stock, shorter may reuse remnants
		const sorted = [...group].sort((a, b) => b.barLength - a.barLength);

		const remnants: number[] = [];
		let totalStocks = 0;

		for (const row of sorted) {
			if (row.barLength > stockLen) {
				// Long bars already computed with lap splices — no remnant reuse possible
				totalStocks += row.stocksNeeded;
				continue;
			}

			let remaining = row.barCount;

			// Try to cut from available remnants first (largest remnants first)
			remnants.sort((a, b) => b - a);
			for (let i = 0; i < remnants.length && remaining > 0; i++) {
				const piecesFromRemnant = Math.floor(remnants[i] / row.barLength);
				if (piecesFromRemnant > 0) {
					const used = Math.min(piecesFromRemnant, remaining);
					remaining -= used;
					const leftover = remnants[i] - used * row.barLength;
					remnants[i] = leftover;
				}
			}
			// Remove exhausted remnants
			for (let i = remnants.length - 1; i >= 0; i--) {
				if (remnants[i] < MIN_USABLE_REMNANT) remnants.splice(i, 1);
			}

			// Cut remaining pieces from new stock bars
			if (remaining > 0) {
				const cutsPerStock = Math.floor(stockLen / row.barLength) || 1;
				const newStocks = Math.ceil(remaining / cutsPerStock);
				totalStocks += newStocks;

				// Track remnants from new stocks
				const fullStocks = Math.floor(remaining / cutsPerStock);
				const lastStockCuts = remaining - fullStocks * cutsPerStock;

				const remnantPerFull = stockLen - cutsPerStock * row.barLength;
				for (let s = 0; s < fullStocks; s++) {
					if (remnantPerFull >= MIN_USABLE_REMNANT) remnants.push(remnantPerFull);
				}
				if (lastStockCuts > 0) {
					const lastRemnant = stockLen - lastStockCuts * row.barLength;
					if (lastRemnant >= MIN_USABLE_REMNANT) remnants.push(lastRemnant);
				}
			}
		}

		result.push({ diameter, stockLength: stockLen, count: totalStocks });
	}

	return result;
}
