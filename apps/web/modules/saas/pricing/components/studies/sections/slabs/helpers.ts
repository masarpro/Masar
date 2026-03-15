import { getRebarWeightPerMeter } from "../../../../lib/structural-calculations";
import { calculateBeam } from "../../../../lib/calculations";
import { STOCK_LENGTHS } from "../../../../constants/prices";
import type { SlabBeamDef } from "./types";

// ═══════════════════════════════════════════════════════════════
// حساب تفاصيل القص للكمرات
// ═══════════════════════════════════════════════════════════════

export function calculateCuttingDetails(
	barLength: number,
	barCount: number,
	diameter: number,
	description: string,
) {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const totalLength = barCount * barLength;
	const weight = totalLength * getRebarWeightPerMeter(diameter);

	if (barLength <= stockLength) {
		// NORMAL PATH — bar fits in one stock bar
		const cutsPerStock = Math.floor(stockLength / barLength) || 1;
		const stocksNeeded = Math.ceil(barCount / cutsPerStock);
		const wastePerStock = stockLength - cutsPerStock * barLength;
		const totalWaste = stocksNeeded * wastePerStock;
		const grossLength = stocksNeeded * stockLength;
		const wastePercentage =
			grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;

		return {
			description,
			diameter,
			barLength: Number(barLength.toFixed(2)),
			barCount,
			stocksNeeded,
			wastePerStock: Number(wastePerStock.toFixed(2)),
			totalWaste: Number(totalWaste.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			weight: Number(weight.toFixed(2)),
			stockLength,
		};
	}

	// SPLICE PATH — barLength > stockLength, needs lap splices
	const lapLength = (diameter * 40) / 1000;
	const effectiveStockLength = stockLength - lapLength;
	const stockBarsPerUnit = Math.ceil(barLength / effectiveStockLength);
	const splicesPerBar = stockBarsPerUnit - 1;
	const totalStockBars = stockBarsPerUnit * barCount;
	const totalGrossLength = totalStockBars * stockLength;
	const actualUsedPerBar = barLength + splicesPerBar * lapLength;
	const waste = totalGrossLength - barCount * actualUsedPerBar;
	const wastePercentage = totalGrossLength > 0 ? (waste / totalGrossLength) * 100 : 0;

	return {
		description,
		diameter,
		barLength: Number(barLength.toFixed(2)),
		barCount,
		stocksNeeded: totalStockBars,
		wastePerStock: 0,
		totalWaste: Number(waste.toFixed(2)),
		wastePercentage: Number(Math.max(0, wastePercentage).toFixed(1)),
		weight: Number(weight.toFixed(2)),
		stockLength,
		stockBarsPerUnit,
		splicesPerBar,
		lapSpliceLength: Number(lapLength.toFixed(3)),
	};
}

export function computeBeamCalc(beam: SlabBeamDef, concreteType: string) {
	const baseCalc = calculateBeam({
		quantity: beam.quantity,
		width: beam.width,
		height: beam.height,
		length: beam.length,
		topBarsCount: beam.topBarsCount,
		topBarDiameter: beam.topBarDiameter,
		bottomBarsCount: beam.bottomBarsCount,
		bottomBarDiameter: beam.bottomBarDiameter,
		stirrupDiameter: beam.stirrupDiameter,
		stirrupSpacing: beam.stirrupSpacing,
		concreteType,
	});

	const barLength = beam.length + 0.6;
	const widthM = beam.width / 100;
	const heightM = beam.height / 100;
	const stirrupPerimeter = 2 * (widthM + heightM - 0.08) + 0.3;
	const stirrupsCount =
		Math.ceil((beam.length * 1000) / beam.stirrupSpacing) + 1;

	const cuttingDetails = [
		calculateCuttingDetails(
			barLength,
			beam.topBarsCount * beam.quantity,
			beam.topBarDiameter,
			`${beam.name} - حديد علوي`,
		),
		calculateCuttingDetails(
			barLength,
			beam.bottomBarsCount * beam.quantity,
			beam.bottomBarDiameter,
			`${beam.name} - حديد سفلي`,
		),
		calculateCuttingDetails(
			stirrupPerimeter,
			stirrupsCount * beam.quantity,
			beam.stirrupDiameter,
			`${beam.name} - كانات`,
		),
	];

	const netWeight = cuttingDetails.reduce((sum, d) => sum + d.weight, 0);
	const grossWeight = cuttingDetails.reduce(
		(sum, d) =>
			sum +
			d.stocksNeeded * d.stockLength * getRebarWeightPerMeter(d.diameter),
		0,
	);

	return {
		...baseCalc,
		cuttingDetails,
		netWeight,
		grossWeight,
	};
}
