// ═══════════════════════════════════════════════════════════════════════════
// تحليل الهدر وتوليد التوصيات
// ═══════════════════════════════════════════════════════════════════════════

import type { WasteReport, Recommendation, CuttingResult, CuttingPattern } from './types';
import { getRebarPrice, getRebarWeight, INDUSTRY_BENCHMARKS } from './saudi-rebar-specs';

/**
 * توليد تقرير الهدر
 */
export function generateWasteReport(
	results: Map<number, CuttingResult>,
	projectId: string
): WasteReport {
	const byDiameter: WasteReport['byDiameter'] = {};
	let totalNetWeight = 0;
	let totalGrossWeight = 0;
	let totalWasteWeight = 0;
	let totalReusableWeight = 0;
	let totalEstimatedCost = 0;

	results.forEach((result, diameter) => {
		const weightPerMeter = getRebarWeight(diameter, 1);
		const netWeight = result.totalNetLength * weightPerMeter;
		const grossWeight = result.totalGrossLength * weightPerMeter;
		const wasteWeight = result.wasteLength * weightPerMeter;
		const reusableWeight = result.reusableRemnants.reduce((sum, r) =>
			sum + (r.length * r.quantity * weightPerMeter), 0);

		totalNetWeight += netWeight;
		totalGrossWeight += grossWeight;
		totalWasteWeight += wasteWeight;
		totalReusableWeight += reusableWeight;
		totalEstimatedCost += grossWeight * getRebarPrice(diameter);

		byDiameter[diameter] = {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: result.wastePercentage,
			barCount: result.totalBars,
			patterns: result.patterns,
		};
	});

	const actualWasteWeight = totalWasteWeight - totalReusableWeight;
	const actualWastePercentage = totalGrossWeight > 0
		? (actualWasteWeight / totalGrossWeight) * 100
		: 0;

	const overallWastePercentage = totalGrossWeight > 0
		? (totalWasteWeight / totalGrossWeight) * 100
		: 0;

	// حساب التوفير المحتمل
	const potentialSavings = calculatePotentialSavings(results, totalGrossWeight);

	// تحديد التصنيف
	const rating = getWasteRating(overallWastePercentage);

	// توليد التوصيات
	const recommendations = generateRecommendations(byDiameter, totalReusableWeight, totalWasteWeight);

	return {
		summary: {
			totalNetWeight: Number(totalNetWeight.toFixed(2)),
			totalGrossWeight: Number(totalGrossWeight.toFixed(2)),
			wasteWeight: Number(totalWasteWeight.toFixed(2)),
			wastePercentage: Number(overallWastePercentage.toFixed(1)),
			reusableWeight: Number(totalReusableWeight.toFixed(2)),
			actualWasteWeight: Number(actualWasteWeight.toFixed(2)),
			actualWastePercentage: Number(actualWastePercentage.toFixed(1)),
			estimatedCost: Number(totalEstimatedCost.toFixed(2)),
			potentialSavings: Number(potentialSavings.toFixed(2)),
		},
		byDiameter,
		recommendations,
		benchmarks: {
			industryAverage: INDUSTRY_BENCHMARKS.industryAverage,
			bestPractice: INDUSTRY_BENCHMARKS.bestPractice,
			current: Number(overallWastePercentage.toFixed(1)),
			rating,
		},
	};
}

/**
 * حساب التوفير المحتمل
 */
function calculatePotentialSavings(
	results: Map<number, CuttingResult>,
	currentGrossWeight: number
): number {
	let potentialSavings = 0;

	results.forEach((result, diameter) => {
		const weightPerMeter = getRebarWeight(diameter, 1);
		const price = getRebarPrice(diameter);

		// إذا كانت نسبة الهدر عالية (> 10%)، يمكن توفير 30% من الهدر
		if (result.wastePercentage > 10) {
			const reducibleWaste = result.wasteLength * 0.3; // 30% من الهدر قابل للتقليل
			potentialSavings += reducibleWaste * weightPerMeter * price;
		}
	});

	return potentialSavings;
}

/**
 * تحديد تصنيف الهدر
 */
function getWasteRating(percentage: number): 'excellent' | 'good' | 'average' | 'poor' {
	if (percentage < INDUSTRY_BENCHMARKS.excellent) return 'excellent';
	if (percentage < INDUSTRY_BENCHMARKS.good) return 'good';
	if (percentage < INDUSTRY_BENCHMARKS.average) return 'average';
	return 'poor';
}

/**
 * توليد التوصيات
 */
function generateRecommendations(
	byDiameter: WasteReport['byDiameter'],
	reusableWeight: number,
	totalWasteWeight: number
): Recommendation[] {
	const recommendations: Recommendation[] = [];

	// توصيات حسب القطر
	for (const [diameterStr, data] of Object.entries(byDiameter)) {
		const diameter = Number(diameterStr);

		if (data.wastePercentage > 10) {
			recommendations.push({
				type: 'design',
				priority: 'high',
				description: `نسبة هدر عالية (${data.wastePercentage.toFixed(1)}%) في قطر Φ${diameter}`,
				potentialSaving: data.wasteWeight * getRebarPrice(diameter),
				implementation: 'مراجعة أطوال القطع وتوحيدها قدر الإمكان. النظر في استخدام أطوال قضبان متعددة (6، 9، 12 متر)',
			});
		}

		// إذا كان هناك أنماط كثيرة (أكثر من 10)، يمكن تحسينها
		if (data.patterns.length > 10) {
			recommendations.push({
				type: 'execution',
				priority: 'medium',
				description: `عدد كبير من أنماط القص (${data.patterns.length}) لقطر Φ${diameter}`,
				potentialSaving: data.wasteWeight * 0.1 * getRebarPrice(diameter),
				implementation: 'محاولة توحيد أطوال القطع لتقليل عدد الأنماط',
			});
		}
	}

	// إذا كانت هناك فضلات كثيرة قابلة للاستخدام
	if (reusableWeight > totalWasteWeight * 0.3) {
		recommendations.push({
			type: 'execution',
			priority: 'medium',
			description: 'يمكن إعادة استخدام جزء كبير من الفضلات',
			potentialSaving: reusableWeight * 2.5, // متوسط سعر الكيلو
			implementation: 'تنظيم مخزن للفضلات وتصنيفها حسب القطر والطول. استخدام نظام تتبع للفضلات',
		});
	}

	// توصية عامة إذا كان الهدر أعلى من المتوسط
	const overallWaste = Object.values(byDiameter).reduce((sum, d) => sum + d.wastePercentage, 0) / Object.keys(byDiameter).length;
	if (overallWaste > INDUSTRY_BENCHMARKS.industryAverage) {
		recommendations.push({
			type: 'procurement',
			priority: 'high',
			description: `نسبة الهدر الإجمالية (${overallWaste.toFixed(1)}%) أعلى من متوسط الصناعة`,
			potentialSaving: 0,
			implementation: 'مراجعة خطة الشراء. النظر في طلب أطوال مخصصة من المصنع للقطع الكبيرة',
		});
	}

	return recommendations.sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		return priorityOrder[b.priority] - priorityOrder[a.priority];
	});
}

/**
 * تحليل كفاءة الأنماط
 */
export function analyzePatternEfficiency(patterns: CuttingPattern[]): {
	averageEfficiency: number;
	bestPattern: CuttingPattern | null;
	worstPattern: CuttingPattern | null;
} {
	if (patterns.length === 0) {
		return {
			averageEfficiency: 0,
			bestPattern: null,
			worstPattern: null,
		};
	}

	const averageEfficiency = patterns.reduce((sum, p) => sum + p.efficiency, 0) / patterns.length;
	const bestPattern = patterns.reduce((best, p) => p.efficiency > best.efficiency ? p : best, patterns[0]);
	const worstPattern = patterns.reduce((worst, p) => p.efficiency < worst.efficiency ? p : worst, patterns[0]);

	return {
		averageEfficiency: Number(averageEfficiency.toFixed(1)),
		bestPattern,
		worstPattern,
	};
}
