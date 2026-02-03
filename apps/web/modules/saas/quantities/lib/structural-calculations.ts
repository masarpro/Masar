// ═══════════════════════════════════════════════════════════════════════════
// دوال الحساب المتقدمة للعناصر الإنشائية
// Enhanced Structural Calculations
// ═══════════════════════════════════════════════════════════════════════════

import {
	STRUCTURAL_PRICES,
	STRUCTURAL_LABOR_PRICES,
	REBAR_WEIGHTS,
	STOCK_LENGTHS,
} from '../constants/prices';
import {
	BLOCK_SIZES,
	BLOCK_TYPES,
	WASTE_PERCENTAGES,
	MORTAR_FACTORS,
} from '../constants/blocks';
import {
	SLAB_DEFAULTS,
	COMMON_THICKNESSES,
	HORDI_BLOCK_SIZES,
	REBAR_RATIOS,
} from '../constants/slabs';
import { optimizedCutting } from './cutting/cutting-optimizer';
import { REBAR_SPECIFICATIONS } from './cutting/saudi-rebar-specs';
import type { CuttingPiece, CuttingRequest, CuttingResult } from './cutting/types';
import type {
	IsolatedFoundationInput,
	CombinedFoundationInput,
	StripFoundationInput,
	RaftFoundationInput,
	FoundationRebarCalculation,
	FoundationSummary,
} from '../types/foundations';
import type {
	SolidSlab,
	FlatSlab,
	RibbedSlab,
	HollowCoreSlab,
	BandedBeamSlab,
	SlabCalculation,
	RebarDetail,
	SlabOpening,
} from '../types/slabs';
import type {
	Wall,
	WallOpening,
	WallCalculation,
	BlocksSummary,
	BlockType,
} from '../types/blocks';

// ─────────────────────────────────────────────────────────────────────────────
// دوال مساعدة عامة
// ─────────────────────────────────────────────────────────────────────────────

/**
 * وزن الحديد لكل متر طولي
 */
export function getRebarWeightPerMeter(diameter: number): number {
	return REBAR_WEIGHTS[diameter] || diameter * diameter * 0.00617;
}

/**
 * حساب عدد الأسياخ من التباعد
 */
export function calculateBarCount(length: number, spacing: number): number {
	if (spacing <= 0) return 0;
	return Math.ceil(length / spacing) + 1;
}

/**
 * حساب طول السيخ مع الإضافات
 */
export function calculateBarLength(
	dimension: number,
	anchorage = 0,
	lap = 0,
	hooks = 0,
): number {
	return dimension + anchorage + lap + hooks;
}

/**
 * حساب المساحة الصافية بعد الفتحات
 */
export function calculateNetArea(
	grossArea: number,
	openings: SlabOpening[] = [],
): number {
	const openingsArea = openings.reduce((sum, o) => sum + (o.area || ((o.dimensions.width || 0) * (o.dimensions.length || 0))), 0);
	return Math.max(0, grossArea - openingsArea);
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات القواعد المعزولة (Isolated Foundations)
// ═══════════════════════════════════════════════════════════════════════════

export interface IsolatedFoundationResult {
	// الكميات
	concreteVolume: number;
	plainConcreteVolume: number;
	formworkArea: number;

	// تفاصيل الحديد
	rebarDetails: FoundationRebarCalculation[];

	// إجماليات الحديد
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};

	// الفضلات
	waste: Array<{
		diameter: number;
		length: number;
		count: number;
		suggestedUse: string;
	}>;

	// التكاليف
	costs: {
		concrete: number;
		rebar: number;
		formwork: number;
		labor: number;
		total: number;
	};
}

/**
 * حساب طول السيخ المقطوع
 */
function calcFoundationBarLength(
	dimension: number,
	cover: number,
	hookLength: number,
): number {
	return dimension - 2 * cover + 2 * hookLength;
}

/**
 * حساب عدد الأسياخ للقاعدة
 */
function calcFoundationBarCount(
	dimension: number,
	barsPerMeter: number,
	cover: number,
): number {
	const effective = dimension - 2 * cover;
	return Math.ceil(effective * barsPerMeter) + 1;
}

/**
 * حساب تفاصيل حديد القاعدة
 */
function calcFoundationRebar(
	direction: string,
	diameter: number,
	barLength: number,
	barCount: number,
	quantity: number,
): FoundationRebarCalculation {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const weight = REBAR_WEIGHTS[diameter] || 1;

	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const totalBars = barCount * quantity;
	const stocksNeeded = Math.ceil(totalBars / cutsPerStock);
	const wastePerStock = stockLength - cutsPerStock * barLength;
	const totalWaste = stocksNeeded * wastePerStock;

	const netLength = totalBars * barLength;
	const grossLength = stocksNeeded * stockLength;

	const netWeight = netLength * weight;
	const grossWeight = grossLength * weight;
	const wasteWeight = totalWaste * weight;
	const wastePercentage = grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;

	return {
		direction,
		diameter,
		barLength: Number(barLength.toFixed(3)),
		barCount,
		totalBars,
		stockLength,
		cutsPerStock,
		stocksNeeded,
		wastePerStock: Number(wastePerStock.toFixed(3)),
		totalWaste: Number(totalWaste.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		netWeight: Number(netWeight.toFixed(2)),
		grossWeight: Number(grossWeight.toFixed(2)),
		wasteWeight: Number(wasteWeight.toFixed(2)),
	};
}

/**
 * اقتراح استخدام الفضلة
 */
function suggestWasteUse(length: number): string {
	if (length >= 1.5) return 'حديد انتظار للرقاب';
	if (length >= 1.0) return 'وصلات أعمدة';
	if (length >= 0.5) return 'كراسي حديد';
	if (length >= 0.3) return 'فواصل/بسكويت';
	return 'هالك';
}

/**
 * حساب القاعدة المعزولة
 */
export function calculateIsolatedFoundation(
	input: IsolatedFoundationInput,
): IsolatedFoundationResult {
	const {
		quantity,
		length,
		width,
		height,
		cover = 0.075,
		hookLength = 0.10,
		bottomShort = { barsPerMeter: 5, diameter: 16 },
		bottomLong = { barsPerMeter: 5, diameter: 16 },
		topShort,
		topLong,
		concreteType = 'C30',
	} = input;

	// حجم الخرسانة
	const concreteVolume = length * width * height * quantity;
	const plainConcreteVolume = (length + 0.2) * (width + 0.2) * 0.1 * quantity;

	// مساحة الشدات
	const formworkArea = (2 * (length + width) * height + length * width) * quantity;

	// حسابات الحديد
	const rebarDetails: FoundationRebarCalculation[] = [];

	// فرش قصير (سفلي)
	const shortBarLength = calcFoundationBarLength(width, cover, hookLength);
	const shortBarCount = calcFoundationBarCount(length, bottomShort.barsPerMeter, cover);
	rebarDetails.push(
		calcFoundationRebar('فرش قصير', bottomShort.diameter, shortBarLength, shortBarCount, quantity)
	);

	// فرش طويل (سفلي)
	const longBarLength = calcFoundationBarLength(length, cover, hookLength);
	const longBarCount = calcFoundationBarCount(width, bottomLong.barsPerMeter, cover);
	rebarDetails.push(
		calcFoundationRebar('فرش طويل', bottomLong.diameter, longBarLength, longBarCount, quantity)
	);

	// غطاء قصير (علوي)
	if (topShort) {
		rebarDetails.push(
			calcFoundationRebar('غطاء قصير', topShort.diameter, shortBarLength, shortBarCount, quantity)
		);
	}

	// غطاء طويل (علوي)
	if (topLong) {
		rebarDetails.push(
			calcFoundationRebar('غطاء طويل', topLong.diameter, longBarLength, longBarCount, quantity)
		);
	}

	// حساب الإجماليات
	const netWeight = rebarDetails.reduce((s, r) => s + r.netWeight, 0);
	const grossWeight = rebarDetails.reduce((s, r) => s + r.grossWeight, 0);
	const wasteWeight = rebarDetails.reduce((s, r) => s + r.wasteWeight, 0);
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// تجميع الأسياخ حسب القطر
	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	rebarDetails.forEach((r) => {
		const existing = stocksMap.get(r.diameter);
		if (existing) {
			existing.count += r.stocksNeeded;
		} else {
			stocksMap.set(r.diameter, {
				diameter: r.diameter,
				count: r.stocksNeeded,
				length: r.stockLength,
			});
		}
	});

	// تجميع الفضلات
	const wasteMap = new Map<string, any>();
	rebarDetails.forEach((r) => {
		if (r.wastePerStock >= 0.3) {
			const key = `${r.diameter}-${r.wastePerStock.toFixed(2)}`;
			const existing = wasteMap.get(key);
			if (existing) {
				existing.count += r.stocksNeeded;
			} else {
				wasteMap.set(key, {
					diameter: r.diameter,
					length: r.wastePerStock,
					count: r.stocksNeeded,
					suggestedUse: suggestWasteUse(r.wastePerStock),
				});
			}
		}
	});

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.foundations;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		concreteVolume: Number(concreteVolume.toFixed(3)),
		plainConcreteVolume: Number(plainConcreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
		waste: Array.from(wasteMap.values()),
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات القواعد المشتركة (Combined Footings)
// ═══════════════════════════════════════════════════════════════════════════

export interface CombinedFootingResult extends IsolatedFoundationResult {
	columnsCount: number;
	columnsSpacing: number;
}

/**
 * حساب القاعدة المشتركة (عدة أعمدة على قاعدة واحدة)
 */
export function calculateCombinedFoundation(
	input: CombinedFoundationInput,
): CombinedFootingResult {
	const columnsCount = input.columnsCount || 2;
	const columnsSpacing = input.columnsSpacing || 3;

	// حساب الطول الكلي للقاعدة
	const totalLength = input.length || (columnsCount - 1) * columnsSpacing + 2 * 0.5;

	// استخدام حساب القاعدة المعزولة مع الطول المحسوب
	const baseResult = calculateIsolatedFoundation({
		...input,
		length: totalLength,
	});

	return {
		...baseResult,
		columnsCount,
		columnsSpacing,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات القواعد الشريطية (Strip Foundations)
// ═══════════════════════════════════════════════════════════════════════════

export interface StripFoundationResult {
	totalLength: number;
	concreteVolume: number;
	plainConcreteVolume: number;
	formworkArea: number;
	rebarDetails: FoundationRebarCalculation[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
	costs: {
		concrete: number;
		rebar: number;
		formwork: number;
		labor: number;
		total: number;
	};
}

/**
 * حساب القاعدة الشريطية
 */
export function calculateStripFoundation(
	input: StripFoundationInput,
): StripFoundationResult {
	const {
		segments,
		width,
		height,
		cover = 0.075,
		hookLength = 0.10,
		bottomMain,
		bottomSecondary,
		topMain,
		stirrups,
		concreteType = 'C30',
	} = input;

	// حساب الطول الكلي
	const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);

	// حجم الخرسانة
	const concreteVolume = totalLength * width * height;
	const plainConcreteVolume = totalLength * (width + 0.2) * 0.1;

	// مساحة الشدات
	const formworkArea = totalLength * 2 * height + totalLength * width;

	// حسابات الحديد
	const rebarDetails: FoundationRebarCalculation[] = [];

	// الحديد الطولي السفلي الرئيسي
	const mainBarLength = totalLength + 0.8;
	rebarDetails.push(
		calcFoundationRebar('طولي سفلي رئيسي', bottomMain.diameter, mainBarLength, bottomMain.count, 1)
	);

	// الحديد الطولي السفلي الثانوي
	if (bottomSecondary) {
		rebarDetails.push(
			calcFoundationRebar('طولي سفلي ثانوي', bottomSecondary.diameter, mainBarLength, bottomSecondary.count, 1)
		);
	}

	// الحديد العلوي
	if (topMain) {
		rebarDetails.push(
			calcFoundationRebar('طولي علوي', topMain.diameter, mainBarLength, topMain.count, 1)
		);
	}

	// الكانات
	if (stirrups) {
		const stirrupLength = 2 * (width + height) - 8 * cover + 0.2;
		const stirrupCount = calculateBarCount(totalLength, stirrups.spacing);
		rebarDetails.push(
			calcFoundationRebar('كانات', stirrups.diameter, stirrupLength, stirrupCount, 1)
		);
	}

	// حساب الإجماليات
	const netWeight = rebarDetails.reduce((s, r) => s + r.netWeight, 0);
	const grossWeight = rebarDetails.reduce((s, r) => s + r.grossWeight, 0);
	const wasteWeight = rebarDetails.reduce((s, r) => s + r.wasteWeight, 0);
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// تجميع الأسياخ
	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	rebarDetails.forEach((r) => {
		const existing = stocksMap.get(r.diameter);
		if (existing) {
			existing.count += r.stocksNeeded;
		} else {
			stocksMap.set(r.diameter, {
				diameter: r.diameter,
				count: r.stocksNeeded,
				length: r.stockLength,
			});
		}
	});

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.groundBeams;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		totalLength: Number(totalLength.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		plainConcreteVolume: Number(plainConcreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات اللبشة (Raft Foundation)
// ═══════════════════════════════════════════════════════════════════════════

export interface RaftFoundationResult {
	area: number;
	concreteVolume: number;
	plainConcreteVolume: number;
	formworkArea: number;
	rebarDetails: FoundationRebarCalculation[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
	costs: {
		concrete: number;
		rebar: number;
		formwork: number;
		labor: number;
		total: number;
	};
}

/**
 * حساب اللبشة (قاعدة حصيرية)
 */
export function calculateRaftFoundation(
	input: RaftFoundationInput,
): RaftFoundationResult {
	const {
		length,
		width,
		thickness,
		cover = 0.075,
		bottomX,
		bottomY,
		topX,
		topY,
		concreteType = 'C30',
	} = input;

	const area = length * width;
	const concreteVolume = area * thickness;
	const plainConcreteVolume = area * 0.1;
	const formworkArea = 2 * (length + width) * thickness;

	// حسابات الحديد
	const rebarDetails: FoundationRebarCalculation[] = [];

	// شبكة سفلية - اتجاه X
	const bottomXBarLength = calcFoundationBarLength(width, cover, 0.10);
	const bottomXBarCount = calcFoundationBarCount(length, bottomX.barsPerMeter, cover);
	rebarDetails.push(
		calcFoundationRebar('سفلي اتجاه X', bottomX.diameter, bottomXBarLength, bottomXBarCount, 1)
	);

	// شبكة سفلية - اتجاه Y
	const bottomYBarLength = calcFoundationBarLength(length, cover, 0.10);
	const bottomYBarCount = calcFoundationBarCount(width, bottomY.barsPerMeter, cover);
	rebarDetails.push(
		calcFoundationRebar('سفلي اتجاه Y', bottomY.diameter, bottomYBarLength, bottomYBarCount, 1)
	);

	// شبكة علوية - اتجاه X
	if (topX) {
		rebarDetails.push(
			calcFoundationRebar('علوي اتجاه X', topX.diameter, bottomXBarLength, bottomXBarCount, 1)
		);
	}

	// شبكة علوية - اتجاه Y
	if (topY) {
		rebarDetails.push(
			calcFoundationRebar('علوي اتجاه Y', topY.diameter, bottomYBarLength, bottomYBarCount, 1)
		);
	}

	// حساب الإجماليات
	const netWeight = rebarDetails.reduce((s, r) => s + r.netWeight, 0);
	const grossWeight = rebarDetails.reduce((s, r) => s + r.grossWeight, 0);
	const wasteWeight = rebarDetails.reduce((s, r) => s + r.wasteWeight, 0);
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// تجميع الأسياخ
	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	rebarDetails.forEach((r) => {
		const existing = stocksMap.get(r.diameter);
		if (existing) {
			existing.count += r.stocksNeeded;
		} else {
			stocksMap.set(r.diameter, {
				diameter: r.diameter,
				count: r.stocksNeeded,
				length: r.stockLength,
			});
		}
	});

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.foundations;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		area: Number(area.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		plainConcreteVolume: Number(plainConcreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات البلوك والجدران المتقدمة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب مساحة الفتحة
 */
export function calculateOpeningArea(opening: WallOpening): number {
	return opening.width * opening.height * (opening.quantity || 1);
}

/**
 * حساب إجمالي مساحة الفتحات
 */
export function calculateTotalOpeningsArea(openings: WallOpening[]): number {
	return openings.reduce((sum, opening) => sum + calculateOpeningArea(opening), 0);
}

/**
 * حساب عدد البلوك في المتر المربع
 */
export function getBlocksPerSqm(
	blockLength: number = 40,
	blockHeight: number = 20,
): number {
	const blockAreaSqm = (blockLength / 100) * (blockHeight / 100);
	return Number((1 / blockAreaSqm).toFixed(2));
}

/**
 * حساب عدد البلوك
 */
export function calculateBlockCount(
	netArea: number,
	blocksPerSqm: number = 12.5,
	wastePercentage: number = WASTE_PERCENTAGES.blocks.standard,
): {
	netCount: number;
	wasteCount: number;
	grossCount: number;
	wastePercentage: number;
} {
	const netCount = Math.ceil(netArea * blocksPerSqm);
	const wasteCount = Math.ceil(netCount * (wastePercentage / 100));
	const grossCount = netCount + wasteCount;

	return {
		netCount,
		wasteCount,
		grossCount,
		wastePercentage,
	};
}

/**
 * حساب المونة
 */
export function calculateMortar(
	netArea: number,
	volumePerSqm: number = MORTAR_FACTORS.volumePerSqm,
): {
	totalVolume: number;
	cementBags: number;
	sandVolume: number;
} {
	const totalVolume = netArea * volumePerSqm;

	const { cement, sand } = MORTAR_FACTORS.mixRatio;
	const totalParts = cement + sand;

	const cementVolume = totalVolume * (cement / totalParts);
	const cementWeight = cementVolume * MORTAR_FACTORS.cementDensity;
	const cementBags = Math.ceil(cementWeight / MORTAR_FACTORS.cementBagWeight);

	const sandVolume = totalVolume * (sand / totalParts);

	return {
		totalVolume: Number(totalVolume.toFixed(3)),
		cementBags,
		sandVolume: Number(sandVolume.toFixed(3)),
	};
}

/**
 * حساب الأعتاب فوق الفتحات
 */
export function calculateLintels(
	openings: WallOpening[],
	lintelHeight: number = 0.20,
	blockThickness: number = 20,
): {
	count: number;
	totalLength: number;
	concreteVolume: number;
	rebarWeight: number;
} | null {
	if (openings.length === 0) return null;

	let count = 0;
	let totalLength = 0;

	openings.forEach((opening) => {
		const lintelLength = opening.width + 0.30;
		const qty = opening.quantity || 1;
		count += qty;
		totalLength += lintelLength * qty;
	});

	const lintelWidth = blockThickness / 100;
	const concreteVolume = totalLength * lintelWidth * lintelHeight;
	const rebarWeight = concreteVolume * 100;

	return {
		count,
		totalLength: Number(totalLength.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		rebarWeight: Number(rebarWeight.toFixed(2)),
	};
}

/**
 * حساب جدار واحد
 */
export function calculateWall(wall: Wall): WallCalculation {
	const { dimensions, openings = [], block, options, quantity = 1 } = wall;

	// حساب المساحات
	const grossArea = dimensions.length * dimensions.height * quantity;
	const openingsArea = calculateTotalOpeningsArea(openings) * quantity;
	const netArea = Math.max(0, grossArea - openingsArea);

	// حساب البلوك
	const blockSize = BLOCK_SIZES.find((b) => b.thickness === block.thickness) || BLOCK_SIZES[2];
	const blocksPerSqm = blockSize.blocksPerSqm;
	const blockCalc = calculateBlockCount(netArea, blocksPerSqm);

	// حساب المونة
	const mortarCalc = calculateMortar(netArea);

	// حساب الأعتاب
	let lintelsCalc = null;
	if (options?.hasLintel && openings.length > 0) {
		lintelsCalc = calculateLintels(openings, options.lintelHeight, block.thickness);
	}

	return {
		wallId: wall.id,
		wallName: wall.name,

		areas: {
			gross: Number(grossArea.toFixed(2)),
			openings: Number(openingsArea.toFixed(2)),
			net: Number(netArea.toFixed(2)),
		},

		blocks: {
			type: BLOCK_TYPES[block.type]?.nameAr || 'مفرغ عادي',
			thickness: block.thickness,
			blocksPerSqm,
			...blockCalc,
		},

		mortar: {
			volumePerSqm: MORTAR_FACTORS.volumePerSqm,
			...mortarCalc,
		},

		lintels: lintelsCalc || undefined,
	};
}

/**
 * حساب ملخص البلوك
 */
export function calculateBlocksSummary(walls: Wall[]): BlocksSummary {
	const calculations = walls.map(calculateWall);

	// تجميع حسب السماكة
	const byThicknessMap = new Map<string, any>();

	walls.forEach((wall, idx) => {
		const calc = calculations[idx];
		const key = `${wall.block.thickness}-${wall.block.type}`;

		if (byThicknessMap.has(key)) {
			const existing = byThicknessMap.get(key);
			existing.totalArea += calc.areas.net;
			existing.totalBlocks += calc.blocks.grossCount;
		} else {
			byThicknessMap.set(key, {
				thickness: wall.block.thickness,
				type: wall.block.type,
				totalArea: calc.areas.net,
				totalBlocks: calc.blocks.grossCount,
				category: wall.category,
			});
		}
	});

	// تجميع حسب التصنيف
	const byCategoryMap = new Map<string, any>();

	walls.forEach((wall, idx) => {
		const calc = calculations[idx];
		const key = wall.category;

		if (byCategoryMap.has(key)) {
			const existing = byCategoryMap.get(key);
			existing.totalArea += calc.areas.net;
			existing.totalBlocks += calc.blocks.grossCount;
		} else {
			byCategoryMap.set(key, {
				category: wall.category,
				totalArea: calc.areas.net,
				totalBlocks: calc.blocks.grossCount,
			});
		}
	});

	// تجميع حسب الدور
	const byFloorMap = new Map<string, any>();

	walls.forEach((wall, idx) => {
		const calc = calculations[idx];
		const key = wall.floorName || 'غير محدد';

		if (byFloorMap.has(key)) {
			const existing = byFloorMap.get(key);
			existing.totalArea += calc.areas.net;
			existing.totalBlocks += calc.blocks.grossCount;
		} else {
			byFloorMap.set(key, {
				floorName: key,
				totalArea: calc.areas.net,
				totalBlocks: calc.blocks.grossCount,
			});
		}
	});

	// الإجماليات
	const totals = calculations.reduce(
		(acc, calc) => ({
			wallsCount: acc.wallsCount + 1,
			grossArea: acc.grossArea + calc.areas.gross,
			openingsArea: acc.openingsArea + calc.areas.openings,
			netArea: acc.netArea + calc.areas.net,
			totalBlocks: acc.totalBlocks + calc.blocks.netCount,
			totalBlocksWithWaste: acc.totalBlocksWithWaste + calc.blocks.grossCount,
			mortarVolume: acc.mortarVolume + calc.mortar.totalVolume,
			cementBags: acc.cementBags + calc.mortar.cementBags,
			sandVolume: acc.sandVolume + calc.mortar.sandVolume,
		}),
		{
			wallsCount: 0,
			grossArea: 0,
			openingsArea: 0,
			netArea: 0,
			totalBlocks: 0,
			totalBlocksWithWaste: 0,
			mortarVolume: 0,
			cementBags: 0,
			sandVolume: 0,
		}
	);

	return {
		byThickness: Array.from(byThicknessMap.values()),
		byCategory: Array.from(byCategoryMap.values()),
		byFloor: Array.from(byFloorMap.values()),
		totals: {
			...totals,
			grossArea: Number(totals.grossArea.toFixed(2)),
			openingsArea: Number(totals.openingsArea.toFixed(2)),
			netArea: Number(totals.netArea.toFixed(2)),
			mortarVolume: Number(totals.mortarVolume.toFixed(3)),
			sandVolume: Number(totals.sandVolume.toFixed(3)),
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات الأسقف المتقدمة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نتيجة حساب السقف
 */
export interface EnhancedSlabResult {
	slabType: string;
	area: number;
	netArea: number;
	concreteVolume: number;
	formworkArea: number;
	blocksCount?: number;
	rebarDetails: RebarDetail[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
	costs: {
		concrete: number;
		rebar: number;
		formwork: number;
		blocks?: number;
		labor: number;
		total: number;
	};
}

/**
 * حساب طبقة تسليح واحدة مع القص
 */
export function calculateRebarLayer(
	diameter: number,
	barLength: number,
	barCount: number,
	description: string,
	location: string,
): RebarDetail {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = Math.ceil(barCount / cutsPerStock);
	const totalLength = barCount * barLength;
	const weight = totalLength * (REBAR_WEIGHTS[diameter] || 0);
	const wastePerStock = stockLength - cutsPerStock * barLength;
	const totalWaste = stocksNeeded * wastePerStock;
	const wastePercentage = (stocksNeeded * stockLength) > 0
		? (totalWaste / (stocksNeeded * stockLength)) * 100
		: 0;

	return {
		id: `${location}-${description}`,
		description,
		location,
		diameter,
		barLength: Number(barLength.toFixed(2)),
		barCount,
		totalLength: Number(totalLength.toFixed(2)),
		weight: Number(weight.toFixed(2)),
		stockLength,
		stocksNeeded,
		wastePercentage: Number(wastePercentage.toFixed(1)),
	};
}

/**
 * حساب السقف الصلب (Solid Slab)
 */
export function calculateSolidSlab(slab: SolidSlab): EnhancedSlabResult {
	const {
		dimensions,
		openings = [],
		thickness,
		reinforcement,
		concreteType = 'C30',
	} = slab;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);
	const concreteVolume = netArea * thickness;
	const formworkArea = netArea;

	// حسابات الحديد
	const rebarDetails: RebarDetail[] = [];
	const cover = SLAB_DEFAULTS.cover;

	if (reinforcement.inputMethod === 'grid' && reinforcement.grid) {
		const { grid } = reinforcement;

		// سفلي X
		const bottomXLength = dimensions.width - 2 * cover + 0.4;
		const bottomXCount = calculateBarCount(dimensions.length - 2 * cover, grid.bottom.xDirection.spacing);
		rebarDetails.push(
			calculateRebarLayer(
				grid.bottom.xDirection.diameter,
				bottomXLength,
				bottomXCount,
				'سفلي - اتجاه X',
				'البلاطة'
			)
		);

		// سفلي Y
		const bottomYLength = dimensions.length - 2 * cover + 0.4;
		const bottomYCount = calculateBarCount(dimensions.width - 2 * cover, grid.bottom.yDirection.spacing);
		rebarDetails.push(
			calculateRebarLayer(
				grid.bottom.yDirection.diameter,
				bottomYLength,
				bottomYCount,
				'سفلي - اتجاه Y',
				'البلاطة'
			)
		);

		// علوي (إن وجد)
		if (grid.top?.xDirection) {
			rebarDetails.push(
				calculateRebarLayer(
					grid.top.xDirection.diameter,
					bottomXLength,
					bottomXCount,
					'علوي - اتجاه X',
					'البلاطة'
				)
			);
		}
		if (grid.top?.yDirection) {
			rebarDetails.push(
				calculateRebarLayer(
					grid.top.yDirection.diameter,
					bottomYLength,
					bottomYCount,
					'علوي - اتجاه Y',
					'البلاطة'
				)
			);
		}
	} else if (reinforcement.inputMethod === 'ratio' && reinforcement.ratio) {
		const estimatedWeight = concreteVolume * reinforcement.ratio;
		rebarDetails.push({
			id: 'estimated',
			description: 'تقديري (نسبة)',
			location: 'البلاطة',
			diameter: 0,
			barLength: 0,
			barCount: 0,
			totalLength: 0,
			weight: Number(estimatedWeight.toFixed(2)),
			stockLength: 0,
			stocksNeeded: 0,
			wastePercentage: 0,
		});
	}

	// إجماليات الحديد
	const netWeight = rebarDetails.reduce((sum, r) => sum + r.weight, 0);
	const grossWeight = rebarDetails.reduce((sum, r) => {
		if (r.stockLength === 0) return sum + r.weight;
		return sum + r.stocksNeeded * r.stockLength * (REBAR_WEIGHTS[r.diameter] || 0);
	}, 0);
	const wasteWeight = Math.max(0, grossWeight - netWeight);
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// تجميع الأسياخ
	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	rebarDetails.forEach((r) => {
		if (r.diameter > 0) {
			const existing = stocksMap.get(r.diameter);
			if (existing) {
				existing.count += r.stocksNeeded;
			} else {
				stocksMap.set(r.diameter, {
					diameter: r.diameter,
					count: r.stocksNeeded,
					length: r.stockLength,
				});
			}
		}
	});

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = netArea * STRUCTURAL_LABOR_PRICES.slabs;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		slabType: 'solid',
		area: Number(grossArea.toFixed(2)),
		netArea: Number(netArea.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

/**
 * حساب السقف الهوردي (Ribbed Slab)
 */
export function calculateRibbedSlab(slab: RibbedSlab): EnhancedSlabResult {
	const {
		dimensions,
		openings = [],
		system,
		reinforcement,
		concreteType = 'C30',
	} = slab;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);

	// حسابات الهوردي
	const { ribWidth, ribSpacing, ribDepth: blockHeight, toppingThickness } = system;
	const ribWidthM = ribWidth / 100;
	const ribSpacingM = ribSpacing / 100;
	const blockHeightM = blockHeight / 100;
	const toppingM = toppingThickness / 100;

	// عدد الأعصاب
	const ribsCount = Math.ceil(dimensions.width / ribSpacingM);

	// حجم الخرسانة
	const ribVolume = ribsCount * dimensions.length * ribWidthM * (blockHeightM + toppingM);
	const toppingVolume = netArea * toppingM;
	const concreteVolume = ribVolume + toppingVolume;

	// عدد البلوكات
	const blockWidth = 0.4; // م
	const blockLength = 0.2; // م
	const blocksCount = Math.ceil(netArea / (ribSpacingM * blockLength)) * 2.5;

	const formworkArea = netArea;

	// حسابات الحديد
	const rebarDetails: RebarDetail[] = [];
	const cover = SLAB_DEFAULTS.cover;

	// حديد الأعصاب من reinforcement.ribs
	if (reinforcement.ribs) {
		const { ribs } = reinforcement;

		// حديد الأعصاب السفلي
		const ribBarLength = dimensions.length + 0.8;
		const ribBarsCount = ribsCount * ribs.bottom.count;
		rebarDetails.push(
			calculateRebarLayer(
				ribs.bottom.diameter,
				ribBarLength,
				ribBarsCount,
				'حديد أعصاب سفلي',
				'الأعصاب'
			)
		);

		// حديد الأعصاب العلوي
		if (ribs.top?.enabled) {
			const topRibBarsCount = ribsCount * ribs.top.count;
			rebarDetails.push(
				calculateRebarLayer(
					ribs.top.diameter,
					ribBarLength,
					topRibBarsCount,
					'حديد أعصاب علوي',
					'الأعصاب'
				)
			);
		}
	}

	// إجماليات الحديد
	const netWeight = rebarDetails.reduce((sum, r) => sum + r.weight, 0);
	const grossWeight = rebarDetails.reduce((sum, r) => {
		if (r.stockLength === 0) return sum + r.weight;
		return sum + r.stocksNeeded * r.stockLength * (REBAR_WEIGHTS[r.diameter] || 0);
	}, 0);
	const wasteWeight = Math.max(0, grossWeight - netWeight);
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// تجميع الأسياخ
	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	rebarDetails.forEach((r) => {
		if (r.diameter > 0) {
			const existing = stocksMap.get(r.diameter);
			if (existing) {
				existing.count += r.stocksNeeded;
			} else {
				stocksMap.set(r.diameter, {
					diameter: r.diameter,
					count: r.stocksNeeded,
					length: r.stockLength,
				});
			}
		}
	});

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const blocksCost = blocksCount * (STRUCTURAL_PRICES.blocks[20] || 4.5);
	const laborCost = netArea * STRUCTURAL_LABOR_PRICES.slabs * 1.2;
	const totalCost = concreteCost + rebarCost + formworkCost + blocksCost + laborCost;

	return {
		slabType: 'ribbed',
		area: Number(grossArea.toFixed(2)),
		netArea: Number(netArea.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		blocksCount: Math.ceil(blocksCount),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			blocks: Number(blocksCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

/**
 * حساب الفلات سلاب (Flat Slab)
 */
export function calculateFlatSlab(slab: FlatSlab): EnhancedSlabResult {
	const {
		dimensions,
		openings = [],
		thickness,
		dropPanels,
		reinforcement,
		concreteType = 'C30',
	} = slab;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);

	// حجم الخرسانة
	let concreteVolume = netArea * thickness;

	// إضافة drop panels
	if (dropPanels) {
		// Estimate number of drop panels based on area (one per ~36 sqm)
		const estimatedCount = Math.ceil(netArea / 36);
		const dropVolume = dropPanels.width * dropPanels.width * dropPanels.extraThickness * estimatedCount;
		concreteVolume += dropVolume;
	}

	const formworkArea = netArea;

	// حسابات الحديد (تقديري بناءً على نسبة الحديد للفلات سلاب)
	const rebarDetails: RebarDetail[] = [];
	const estimatedRatio = REBAR_RATIOS.flat_slab.typical;
	const estimatedWeight = concreteVolume * estimatedRatio;

	rebarDetails.push({
		id: 'flat-slab-estimate',
		description: `تقديري (${estimatedRatio} كجم/م³)`,
		location: 'الفلات سلاب',
		diameter: 0,
		barLength: 0,
		barCount: 0,
		totalLength: 0,
		weight: Number(estimatedWeight.toFixed(2)),
		stockLength: 0,
		stocksNeeded: 0,
		wastePercentage: 0,
	});

	const netWeight = estimatedWeight;
	const grossWeight = estimatedWeight * 1.15; // 15% هالك
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = netArea * STRUCTURAL_LABOR_PRICES.slabs * 1.3;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		slabType: 'flat',
		area: Number(grossArea.toFixed(2)),
		netArea: Number(netArea.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: [],
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

/**
 * حساب الهولوكور (Hollow Core Slab)
 */
export function calculateHollowCoreSlab(slab: HollowCoreSlab): EnhancedSlabResult {
	const {
		dimensions,
		openings = [],
		panels,
		topping,
		concreteType = 'C30',
	} = slab;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);

	// حسابات البانيل
	const panelWidthM = panels.width;

	// عدد الألواح
	const panelsCount = Math.ceil(dimensions.width / panelWidthM);

	// حجم الخرسانة (الطبقة العلوية فقط)
	const toppingM = topping?.thickness || 0.05;
	const concreteVolume = netArea * toppingM;

	const formworkArea = 0; // لا يوجد شدات للهولوكور

	// حسابات الحديد (شبكة للطبقة العلوية فقط)
	const rebarDetails: RebarDetail[] = [];
	const estimatedRatio = REBAR_RATIOS.hollow_core_topping.typical;
	const estimatedWeight = concreteVolume * estimatedRatio;

	rebarDetails.push({
		id: 'hollow-core-topping',
		description: 'شبكة الطبقة العلوية',
		location: 'الطبقة العلوية',
		diameter: 0,
		barLength: 0,
		barCount: 0,
		totalLength: 0,
		weight: Number(estimatedWeight.toFixed(2)),
		stockLength: 0,
		stocksNeeded: 0,
		wastePercentage: 0,
	});

	const netWeight = estimatedWeight;
	const grossWeight = estimatedWeight * 1.10;
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const panelsCost = panelsCount * dimensions.length * 350; // تقدير سعر البانيل
	const laborCost = netArea * 50;
	const totalCost = concreteCost + rebarCost + panelsCost + laborCost;

	return {
		slabType: 'hollow_core',
		area: Number(grossArea.toFixed(2)),
		netArea: Number(netArea.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		formworkArea: 0,
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: [],
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: 0,
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

/**
 * حساب سقف الكمرات العريضة (Banded Beam Slab)
 */
export function calculateBandedBeamSlab(slab: BandedBeamSlab): EnhancedSlabResult {
	const {
		dimensions,
		openings = [],
		thickness,
		bandedBeams,
		reinforcement,
		concreteType = 'C30',
	} = slab;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);

	// حجم الخرسانة
	const slabVolume = netArea * thickness;

	// حجم الكمرات العريضة
	const beamsVolume = bandedBeams.reduce((sum, beam) => {
		return sum + beam.width * beam.depth * beam.length * (beam.quantity || 1);
	}, 0);

	const concreteVolume = slabVolume + beamsVolume;
	const formworkArea = netArea;

	// حسابات الحديد (تقديري)
	const rebarDetails: RebarDetail[] = [];
	const estimatedRatio = (REBAR_RATIOS.solid_two_way.typical + REBAR_RATIOS.flat_slab.typical) / 2;
	const estimatedWeight = concreteVolume * estimatedRatio;

	rebarDetails.push({
		id: 'banded-beam-estimate',
		description: `تقديري (${estimatedRatio} كجم/م³)`,
		location: 'البلاطة والكمرات',
		diameter: 0,
		barLength: 0,
		barCount: 0,
		totalLength: 0,
		weight: Number(estimatedWeight.toFixed(2)),
		stockLength: 0,
		stocksNeeded: 0,
		wastePercentage: 0,
	});

	const netWeight = estimatedWeight;
	const grossWeight = estimatedWeight * 1.15;
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * 1.2;
	const laborCost = netArea * STRUCTURAL_LABOR_PRICES.slabs * 1.25;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		slabType: 'banded_beam',
		area: Number(grossArea.toFixed(2)),
		netArea: Number(netArea.toFixed(2)),
		concreteVolume: Number(concreteVolume.toFixed(3)),
		formworkArea: Number(formworkArea.toFixed(2)),
		rebarDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: [],
		},
		costs: {
			concrete: Number(concreteCost.toFixed(2)),
			rebar: Number(rebarCost.toFixed(2)),
			formwork: Number(formworkCost.toFixed(2)),
			labor: Number(laborCost.toFixed(2)),
			total: Number(totalCost.toFixed(2)),
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير جميع الدوال
// ═══════════════════════════════════════════════════════════════════════════

export {
	// الدوال المساعدة - re-export
	getRebarWeightPerMeter as rebarWeight,
	calculateBarCount as barCount,
	calculateBarLength as barLength,
};
