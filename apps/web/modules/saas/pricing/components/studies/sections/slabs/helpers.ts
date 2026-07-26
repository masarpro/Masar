import { STOCK_LENGTHS } from "../../../../constants/prices";
import { calculateBeam } from "../../../../lib/calculations";
import { getRebarWeightPerMeter } from "../../../../lib/structural-calculations";
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
		const grossLength = stocksNeeded * stockLength;
		// الهالك الحقيقي = المشترى − المستخدم (توحيد التعريف مع بقية الأقسام)
		const totalWaste = grossLength - totalLength;
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
	// n أسياخ مع (n−1) وصلة تغطي n×stock − (n−1)×lap — نفس صيغة المحرك
	let stockBarsPerUnit = Math.max(
		2,
		Math.ceil((barLength - lapLength) / effectiveStockLength),
	);
	if (
		stockBarsPerUnit * stockLength - (stockBarsPerUnit - 1) * lapLength <
		barLength
	) {
		stockBarsPerUnit += 1;
	}
	const splicesPerBar = stockBarsPerUnit - 1;
	const totalStockBars = stockBarsPerUnit * barCount;
	const totalGrossLength = totalStockBars * stockLength;
	const actualUsedPerBar = barLength + splicesPerBar * lapLength;
	const waste = totalGrossLength - barCount * actualUsedPerBar;
	const wastePercentage =
		totalGrossLength > 0 ? (waste / totalGrossLength) * 100 : 0;

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

/**
 * الارتفاع الصافي للكمرة الذي يُضيف خرسانة فوق خرسانة البلاطة.
 *
 * الكمرة المخفية مدفونة داخل سماكة البلاطة، وخرسانتها محسوبة أصلاً ضمن حجم
 * البلاطة (الطول × العرض × السماكة). إضافتها كاملةً تُحتسب الخرسانة مرتين.
 * لذلك نحتسب فقط الجزء الساقط أسفل البلاطة إن وُجد.
 * التسليح يبقى محسوباً بالارتفاع الكامل لأن الأسياخ والكانات فعلية.
 */
export function getBeamNetHeight(
	beam: SlabBeamDef,
	slabThickness?: number,
): number {
	if (!beam.isHidden) return beam.height;
	return Math.max(0, beam.height - (slabThickness ?? 0));
}

export function computeBeamCalc(
	beam: SlabBeamDef,
	concreteType: string,
	slabThickness?: number,
) {
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

	// ═══ تصحيح خرسانة/شدات الكمرات المخفية ═══
	const netHeight = getBeamNetHeight(beam, slabThickness);
	const heightRatio = beam.height > 0 ? netHeight / beam.height : 0;
	const netVolumePerUnit =
		(beam.width / 100) * (netHeight / 100) * beam.length;
	const netConcreteVolume = netVolumePerUnit * beam.quantity;
	// الشدات: الكمرة المخفية لا تحتاج قاعاً ولا جوانب (شدة البلاطة تغطيها)،
	// والكمرة الساقطة جزئياً تحتاج شدة الجزء الساقط فقط
	const netFormworkArea = beam.isHidden
		? 2 * (netHeight / 100) * beam.length * beam.quantity
		: baseCalc.formworkArea;
	const concreteDelta = baseCalc.concreteVolume - netConcreteVolume;
	const concreteCostRatio =
		baseCalc.concreteVolume > 0
			? netConcreteVolume / baseCalc.concreteVolume
			: 0;
	const formworkCostRatio =
		baseCalc.formworkArea > 0 ? netFormworkArea / baseCalc.formworkArea : 0;

	const adjusted = {
		volumePerUnit: netVolumePerUnit,
		concreteVolume: netConcreteVolume,
		formworkArea: netFormworkArea,
		concreteCost: baseCalc.concreteCost * concreteCostRatio,
		formworkCost: baseCalc.formworkCost * formworkCostRatio,
		laborCost: baseCalc.laborCost * concreteCostRatio,
	};
	const adjustedTotalCost =
		adjusted.concreteCost +
		baseCalc.rebarCost +
		adjusted.formworkCost +
		adjusted.laborCost;

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
		...adjusted,
		totalCost: adjustedTotalCost,
		/** الحجم الإجمالي للكمرة قبل خصم الجزء المدفون داخل البلاطة */
		grossConcreteVolume: baseCalc.concreteVolume,
		/** الخرسانة المخصومة لأنها محسوبة ضمن البلاطة */
		hiddenConcreteDeduction: concreteDelta,
		netHeight,
		heightRatio,
		cuttingDetails,
		netWeight,
		grossWeight,
	};
}
