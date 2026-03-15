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
	HOLLOW_CORE_PANEL_PRICES,
	HOLLOW_CORE_DEFAULT_PRICE_PER_SQM,
} from '../constants/slabs';
import { optimizedCutting } from './cutting/cutting-optimizer';
import { REBAR_SPECIFICATIONS } from './cutting/saudi-rebar-specs';
import type { CuttingPiece, CuttingRequest, CuttingResult } from './cutting/types';
import { calculateColumn, calculateBeam, calculateStairs } from './calculations';
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

const STRIP_MESH_THRESHOLD = 0.8;

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
	leanConcreteVolume?: number;
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
 * حساب طول وصلة التراكب
 */
function calcLapLength(diameter: number, method: '40d' | '50d' | '60d' | 'custom', customLength?: number): number {
	if (method === 'custom' && customLength) return customLength;
	const d = diameter / 1000; // mm to m
	const multiplier = method === '40d' ? 40 : method === '50d' ? 50 : 60;
	return multiplier * d;
}

/**
 * حساب تفاصيل حديد اللبشة (مع دعم وصلات التراكب للأسياخ الطويلة)
 */
interface RaftRebarSpliceInfo {
	piecesPerBar: number;
	splicesPerBar: number;
	lapLength: number;
}

interface RaftRebarResult extends FoundationRebarCalculation {
	spliceInfo?: RaftRebarSpliceInfo;
}

function calcRaftRebar(
	direction: string,
	diameter: number,
	barLength: number,
	barCount: number,
	lapSpliceMethod: '40d' | '50d' | '60d' | 'custom' = '40d',
	customLapLength?: number,
): RaftRebarResult {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const weight = REBAR_WEIGHTS[diameter] || 1;

	// If bar fits in stock length, use simple calculation (no splices)
	if (barLength <= stockLength) {
		const base = calcFoundationRebar(direction, diameter, barLength, barCount, 1);
		return base;
	}

	// Bar exceeds stock length — lap splice needed
	const lapLength = calcLapLength(diameter, lapSpliceMethod, customLapLength);
	const usablePerStock = stockLength - lapLength;
	const piecesPerBar = Math.ceil(barLength / usablePerStock);
	const splicesPerBar = piecesPerBar - 1;

	// Waste: total stock purchased minus structural requirement minus overlap material
	const totalStocksPerBar = piecesPerBar;
	const totalStocks = barCount * totalStocksPerBar;

	// The last piece is shorter
	const usableLengthFromFirstPieces = (piecesPerBar - 1) * usablePerStock;
	const lastPieceLength = barLength - usableLengthFromFirstPieces + lapLength;

	// Total material purchased
	const grossLengthPerBar = (piecesPerBar - 1) * stockLength + lastPieceLength;
	const wastePerBar = grossLengthPerBar - barLength;

	const netLength = barCount * barLength;
	const grossLength = totalStocks * stockLength;
	// Correct: last piece cut from stock, waste is the remainder
	const wasteFromLastPiece = stockLength - lastPieceLength;
	const totalWaste = barCount * wasteFromLastPiece;

	const netWeight = netLength * weight;
	const grossWeight = grossLength * weight;
	const wasteWeight = totalWaste * weight;
	const wastePercentage = grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;

	return {
		direction,
		diameter,
		barLength: Number(barLength.toFixed(3)),
		barCount,
		totalBars: barCount,
		stockLength,
		cutsPerStock: 1, // Each stock is one piece in splice mode
		stocksNeeded: totalStocks,
		wastePerStock: Number((wasteFromLastPiece).toFixed(3)),
		totalWaste: Number(totalWaste.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		netWeight: Number(netWeight.toFixed(2)),
		grossWeight: Number(grossWeight.toFixed(2)),
		wasteWeight: Number(wasteWeight.toFixed(2)),
		spliceInfo: {
			piecesPerBar,
			splicesPerBar,
			lapLength: Number(lapLength.toFixed(3)),
		},
	};
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
		coverBottom,
		coverTop,
		coverSide,
		bottomShort = { barsPerMeter: 5, diameter: 16 },
		bottomLong = { barsPerMeter: 5, diameter: 16 },
		topShort,
		topLong,
		hasLeanConcrete = false,
		leanConcreteThickness = 0.10,
		hasColumnDowels = false,
		columnDowels,
		concreteType = 'C30',
	} = input;

	// أغطية فعلية
	const effectiveCoverSide = coverSide ?? cover;
	const effectiveHookLength = hookLength;

	// حجم الخرسانة
	const concreteVolume = length * width * height * quantity;
	const leanConcreteVolume = hasLeanConcrete
		? (length + 0.2) * (width + 0.2) * leanConcreteThickness * quantity
		: 0;
	const plainConcreteVolume = hasLeanConcrete
		? leanConcreteVolume
		: (length + 0.2) * (width + 0.2) * 0.1 * quantity;

	// مساحة الشدات
	const formworkArea = (2 * (length + width) * height + length * width) * quantity;

	// حسابات الحديد
	const rebarDetails: FoundationRebarCalculation[] = [];

	// فرش قصير (سفلي)
	const shortBarLength = calcFoundationBarLength(width, effectiveCoverSide, effectiveHookLength);
	const shortBarCount = calcFoundationBarCount(length, bottomShort.barsPerMeter, effectiveCoverSide);
	rebarDetails.push(
		calcFoundationRebar('فرش قصير', bottomShort.diameter, shortBarLength, shortBarCount, quantity)
	);

	// فرش طويل (سفلي)
	const longBarLength = calcFoundationBarLength(length, effectiveCoverSide, effectiveHookLength);
	const longBarCount = calcFoundationBarCount(width, bottomLong.barsPerMeter, effectiveCoverSide);
	rebarDetails.push(
		calcFoundationRebar('فرش طويل', bottomLong.diameter, longBarLength, longBarCount, quantity)
	);

	// غطاء قصير (علوي) — uses topShort's own barsPerMeter
	if (topShort) {
		const topShortBarCount = calcFoundationBarCount(length, topShort.barsPerMeter, effectiveCoverSide);
		rebarDetails.push(
			calcFoundationRebar('غطاء قصير', topShort.diameter, shortBarLength, topShortBarCount, quantity)
		);
	}

	// غطاء طويل (علوي) — uses topLong's own barsPerMeter
	if (topLong) {
		const topLongBarCount = calcFoundationBarCount(width, topLong.barsPerMeter, effectiveCoverSide);
		rebarDetails.push(
			calcFoundationRebar('غطاء طويل', topLong.diameter, longBarLength, topLongBarCount, quantity)
		);
	}

	// حديد انتظار العمود
	if (hasColumnDowels && columnDowels) {
		const columnCount = 1; // القاعدة المنفصلة — عمود واحد
		const totalDowels = columnCount * columnDowels.barsPerColumn;
		const dowelLength = columnDowels.developmentLength + effectiveHookLength;
		const dowelWeight = getRebarWeightPerMeter(columnDowels.diameter);
		const dowelResult = calcFoundationRebar(
			'انتظار أعمدة', columnDowels.diameter, dowelLength, totalDowels, quantity
		);
		rebarDetails.push(dowelResult);
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
		leanConcreteVolume: hasLeanConcrete ? Number(leanConcreteVolume.toFixed(3)) : undefined,
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
	const columnsCount = input.columnCount || input.columnsCount || 2;
	const columnsSpacing = input.columnSpacing || input.columnsSpacing || 3;

	// حساب الطول الكلي للقاعدة
	const totalLength = input.length || (columnsCount - 1) * columnsSpacing + 2 * 0.5;

	// بناء مدخلات القاعدة المنفصلة
	const isolatedInput: IsolatedFoundationInput = {
		quantity: input.quantity,
		length: totalLength,
		width: input.width,
		height: input.height,
		cover: input.cover,
		hookLength: input.hookLength,
		coverBottom: input.coverBottom,
		coverTop: input.coverTop,
		coverSide: input.coverSide,
		bottomShort: input.bottomShort,
		bottomLong: input.bottomLong,
		topShort: input.topShort,
		topLong: input.topLong,
		hasLeanConcrete: input.hasLeanConcrete,
		leanConcreteThickness: input.leanConcreteThickness,
		hasColumnDowels: input.hasColumnDowels,
		columnDowels: input.hasColumnDowels && input.columnDowels ? {
			barsPerColumn: input.columnDowels.barsPerColumn,
			diameter: input.columnDowels.diameter,
			developmentLength: input.columnDowels.developmentLength,
		} : undefined,
		concreteType: input.concreteType,
	};

	const baseResult = calculateIsolatedFoundation(isolatedInput);

	// إصلاح حديد الانتظار للمشتركة — عدد الأعمدة أكبر من 1
	if (input.hasColumnDowels && input.columnDowels && columnsCount > 1) {
		// حذف نتيجة الانتظار من المنفصلة (عمود واحد) وإعادة حسابها
		const dowelIdx = baseResult.rebarDetails.findIndex(r => r.direction === 'انتظار أعمدة');
		if (dowelIdx >= 0) {
			const hookLength = input.hookLength || 0.10;
			const totalDowels = columnsCount * input.columnDowels.barsPerColumn;
			const dowelLength = input.columnDowels.developmentLength + hookLength;
			const newDowelResult = calcFoundationRebar(
				'انتظار أعمدة', input.columnDowels.diameter, dowelLength, totalDowels, input.quantity
			);
			// طرح القديم وإضافة الجديد
			const oldResult = baseResult.rebarDetails[dowelIdx];
			baseResult.rebarDetails[dowelIdx] = newDowelResult;

			// تحديث الإجماليات
			const weightDiff = newDowelResult.grossWeight - oldResult.grossWeight;
			const netDiff = newDowelResult.netWeight - oldResult.netWeight;
			const wasteDiff = newDowelResult.wasteWeight - oldResult.wasteWeight;
			baseResult.totals.netWeight = Number((baseResult.totals.netWeight + netDiff).toFixed(2));
			baseResult.totals.grossWeight = Number((baseResult.totals.grossWeight + weightDiff).toFixed(2));
			baseResult.totals.wasteWeight = Number((baseResult.totals.wasteWeight + wasteDiff).toFixed(2));
			baseResult.totals.wastePercentage = baseResult.totals.grossWeight > 0
				? Number(((baseResult.totals.wasteWeight / baseResult.totals.grossWeight) * 100).toFixed(1))
				: 0;

			// تحديث stocksNeeded
			const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
			baseResult.rebarDetails.forEach((r) => {
				const existing = stocksMap.get(r.diameter);
				if (existing) {
					existing.count += r.stocksNeeded;
				} else {
					stocksMap.set(r.diameter, { diameter: r.diameter, count: r.stocksNeeded, length: r.stockLength });
				}
			});
			baseResult.totals.stocksNeeded = Array.from(stocksMap.values());
		}
	}

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
	rebarMode: 'stirrups' | 'mesh';
	totalLength: number;
	concreteVolume: number;
	leanConcreteVolume: number;
	intersectionDeduction: number;
	netConcreteVolume: number;
	totalConcreteVolume: number;
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
	waste: Array<{ diameter: number; length: number; count: number; suggestedUse: string }>;
	spliceDetails: Array<{ direction: string; diameter: number; piecesPerBar: number; splicesPerBar: number; lapLength: number; totalSplices: number }>;
	chairBarsDetail?: { diameter: number; count: number; length: number; weight: number; stocksNeeded: number };
	columnDowelsDetail?: { totalBars: number; diameter: number; length: number; weight: number; stocksNeeded: number };
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
		width,
		height,
		hookLength = 0.10,
		coverBottom = 0.075,
		coverTop = 0.05,
		coverSide = 0.05,
		hasLeanConcrete = false,
		leanConcreteThickness = 0.10,
		bottomMain,
		bottomSecondary,
		topMain,
		stirrups,
		bottomMeshX,
		bottomMeshY,
		topMeshX,
		topMeshY,
		lapSpliceMethod = '40d',
		customLapLength,
		hasChairBars = false,
		chairBars,
		hasColumnDowels = false,
		columnDowels,
		hasIntersectionDeduction = false,
		intersectionCount = 0,
		intersectingStripWidth = 0,
		concreteType = 'C30',
	} = input;

	const quantity = input.quantity || 1;

	// الطول الكلي — backward compat: fallback to segments
	const totalLength = input.length > 0
		? input.length
		: (input.segments ? input.segments.reduce((sum, seg) => sum + seg.length, 0) : 0);

	// وضع التسليح
	const rebarMode: 'stirrups' | 'mesh' = width <= STRIP_MESH_THRESHOLD ? 'stirrups' : 'mesh';

	// ─── الخرسانة ───
	const concreteVolume = totalLength * width * height * quantity;
	const leanConcreteVolume = hasLeanConcrete ? totalLength * (width + 0.2) * leanConcreteThickness * quantity : 0;
	const intersectionDeduction = hasIntersectionDeduction
		? intersectionCount * intersectingStripWidth * width * height * quantity
		: 0;
	const netConcreteVolume = concreteVolume - intersectionDeduction;
	const totalConcreteVolume = netConcreteVolume;
	const plainConcreteVolume = leanConcreteVolume;

	// مساحة الشدات (جوانب فقط)
	const formworkArea = 2 * totalLength * height * quantity;

	// ─── حسابات الحديد ───
	const rebarDetails: FoundationRebarCalculation[] = [];
	const raftRebarResults: RaftRebarResult[] = [];

	if (rebarMode === 'stirrups') {
		// ─── وضع الكانات ───

		// الحديد الطولي: bar length with covers and hooks
		const longBarLength = calcFoundationBarLength(totalLength, coverSide, hookLength);

		// السفلي الرئيسي
		const bottomResult = calcRaftRebar('طولي سفلي رئيسي', bottomMain.diameter, longBarLength, bottomMain.count * quantity, lapSpliceMethod, customLapLength);
		rebarDetails.push(bottomResult);
		raftRebarResults.push(bottomResult);

		// السفلي الثانوي
		if (bottomSecondary && bottomSecondary.count > 0) {
			const secResult = calcRaftRebar('طولي سفلي ثانوي', bottomSecondary.diameter, longBarLength, bottomSecondary.count * quantity, lapSpliceMethod, customLapLength);
			rebarDetails.push(secResult);
			raftRebarResults.push(secResult);
		}

		// العلوي
		if (topMain && topMain.count > 0) {
			const topResult = calcRaftRebar('طولي علوي', topMain.diameter, longBarLength, topMain.count * quantity, lapSpliceMethod, customLapLength);
			rebarDetails.push(topResult);
			raftRebarResults.push(topResult);
		}

		// الكانات — stirrup perimeter fix
		if (stirrups) {
			const stirrupPerimeter = 2 * ((width - 2 * coverSide) + (height - coverBottom - coverTop)) + 2 * hookLength;
			const stirrupCount = calculateBarCount(totalLength, stirrups.spacing) * quantity;
			rebarDetails.push(
				calcFoundationRebar('كانات', stirrups.diameter, stirrupPerimeter, stirrupCount, 1)
			);
		}
	} else {
		// ─── وضع الشبكة (mesh) — mirrors raft pattern ───

		// شبكة سفلية — اتجاه X (أسياخ بعرض الشريط، موزعة على الطول)
		if (bottomMeshX) {
			const bxBarLength = calcFoundationBarLength(width, coverSide, hookLength);
			const bxBarCount = calcFoundationBarCount(totalLength, bottomMeshX.barsPerMeter, coverSide) * quantity;
			const bxResult = calcRaftRebar('سفلي اتجاه X', bottomMeshX.diameter, bxBarLength, bxBarCount, lapSpliceMethod, customLapLength);
			rebarDetails.push(bxResult);
			raftRebarResults.push(bxResult);
		}

		// شبكة سفلية — اتجاه Y (أسياخ بطول الشريط، موزعة على العرض)
		if (bottomMeshY) {
			const byBarLength = calcFoundationBarLength(totalLength, coverSide, hookLength);
			const byBarCount = calcFoundationBarCount(width, bottomMeshY.barsPerMeter, coverSide) * quantity;
			const byResult = calcRaftRebar('سفلي اتجاه Y', bottomMeshY.diameter, byBarLength, byBarCount, lapSpliceMethod, customLapLength);
			rebarDetails.push(byResult);
			raftRebarResults.push(byResult);
		}

		// شبكة علوية — اتجاه X
		if (topMeshX) {
			const txBarLength = calcFoundationBarLength(width, coverSide, hookLength);
			const txBarCount = calcFoundationBarCount(totalLength, topMeshX.barsPerMeter, coverSide) * quantity;
			const txResult = calcRaftRebar('علوي اتجاه X', topMeshX.diameter, txBarLength, txBarCount, lapSpliceMethod, customLapLength);
			rebarDetails.push(txResult);
			raftRebarResults.push(txResult);
		}

		// شبكة علوية — اتجاه Y
		if (topMeshY) {
			const tyBarLength = calcFoundationBarLength(totalLength, coverSide, hookLength);
			const tyBarCount = calcFoundationBarCount(width, topMeshY.barsPerMeter, coverSide) * quantity;
			const tyResult = calcRaftRebar('علوي اتجاه Y', topMeshY.diameter, tyBarLength, tyBarCount, lapSpliceMethod, customLapLength);
			rebarDetails.push(tyResult);
			raftRebarResults.push(tyResult);
		}

		// كراسي حديد (mesh only)
		if (hasChairBars && chairBars) {
			const chairCountX = Math.floor(totalLength / chairBars.spacingX) + 1;
			const chairCountY = Math.floor(width / chairBars.spacingY) + 1;
			const chairCount = chairCountX * chairCountY * quantity;
			const avgBarDia = (
				(bottomMeshX?.diameter || 16) + (topMeshX?.diameter || bottomMeshX?.diameter || 16)
			) / 2 / 1000;
			const chairLength = height - coverBottom - coverTop - 2 * avgBarDia + 2 * hookLength;
			const chairWeight = chairCount * chairLength * (REBAR_WEIGHTS[chairBars.diameter] || 0.617);
			const chairStockLength = STOCK_LENGTHS[chairBars.diameter] || 12;
			const chairCutsPerStock = Math.floor(chairStockLength / chairLength) || 1;
			const chairStocksNeeded = Math.ceil(chairCount / chairCutsPerStock);

			(input as any)._chairBarsDetail = {
				diameter: chairBars.diameter,
				count: chairCount,
				length: Number(chairLength.toFixed(3)),
				weight: Number(chairWeight.toFixed(2)),
				stocksNeeded: chairStocksNeeded,
			};

			rebarDetails.push(
				calcFoundationRebar('كراسي حديد', chairBars.diameter, chairLength, chairCount, 1)
			);
		}
	}

	// أسياخ انتظار الأعمدة
	let columnDowelsDetail: StripFoundationResult['columnDowelsDetail'] | undefined;
	if (hasColumnDowels && columnDowels && columnDowels.count > 0) {
		const totalDowelBars = columnDowels.count * columnDowels.barsPerColumn;
		const dowelLength = columnDowels.developmentLength;
		const dowelWeight = totalDowelBars * dowelLength * (REBAR_WEIGHTS[columnDowels.diameter] || 1);
		const dowelStockLength = STOCK_LENGTHS[columnDowels.diameter] || 12;
		const dowelCutsPerStock = Math.floor(dowelStockLength / dowelLength) || 1;
		const dowelStocksNeeded = Math.ceil(totalDowelBars / dowelCutsPerStock);

		columnDowelsDetail = {
			totalBars: totalDowelBars,
			diameter: columnDowels.diameter,
			length: Number(dowelLength.toFixed(3)),
			weight: Number(dowelWeight.toFixed(2)),
			stocksNeeded: dowelStocksNeeded,
		};

		rebarDetails.push(
			calcFoundationRebar('أسياخ انتظار', columnDowels.diameter, dowelLength, totalDowelBars, 1)
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

	// تفاصيل الفضلات مع اقتراحات الاستخدام
	const waste: StripFoundationResult['waste'] = [];
	rebarDetails.forEach((r) => {
		if (r.wastePerStock > 0.01 && r.stocksNeeded > 0) {
			waste.push({
				diameter: r.diameter,
				length: r.wastePerStock,
				count: r.stocksNeeded,
				suggestedUse: suggestWasteUse(r.wastePerStock),
			});
		}
	});

	// تفاصيل الوصلات
	const spliceDetails: StripFoundationResult['spliceDetails'] = [];
	raftRebarResults.forEach((r) => {
		if (r.spliceInfo) {
			spliceDetails.push({
				direction: r.direction,
				diameter: r.diameter,
				piecesPerBar: r.spliceInfo.piecesPerBar,
				splicesPerBar: r.spliceInfo.splicesPerBar,
				lapLength: r.spliceInfo.lapLength,
				totalSplices: r.barCount * r.spliceInfo.splicesPerBar,
			});
		}
	});

	// Chair bars detail (extracted from temp)
	const chairBarsDetail: StripFoundationResult['chairBarsDetail'] = (input as any)._chairBarsDetail;

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const leanConcretePrice = STRUCTURAL_PRICES.concrete['C20'] || 250;
	const concreteCost = totalConcreteVolume * concretePrice + leanConcreteVolume * leanConcretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = totalConcreteVolume * STRUCTURAL_LABOR_PRICES.groundBeams;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		rebarMode,
		totalLength: Number(totalLength.toFixed(2)),
		concreteVolume: Number(netConcreteVolume.toFixed(3)),
		leanConcreteVolume: Number(leanConcreteVolume.toFixed(3)),
		intersectionDeduction: Number(intersectionDeduction.toFixed(3)),
		netConcreteVolume: Number(netConcreteVolume.toFixed(3)),
		totalConcreteVolume: Number(totalConcreteVolume.toFixed(3)),
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
		waste,
		spliceDetails,
		chairBarsDetail,
		columnDowelsDetail,
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
	leanConcreteVolume: number;
	edgeBeamConcreteVolume: number;
	totalConcreteVolume: number;
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
	waste: Array<{ diameter: number; length: number; count: number; suggestedUse: string }>;
	spliceDetails: Array<{ direction: string; diameter: number; piecesPerBar: number; splicesPerBar: number; lapLength: number; totalSplices: number }>;
	chairBarsDetail?: { diameter: number; count: number; length: number; weight: number; stocksNeeded: number };
	columnDowelsDetail?: { totalBars: number; diameter: number; length: number; weight: number; stocksNeeded: number };
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
		hookLength = 0.10,
		coverBottom = cover,
		coverTop = cover,
		coverSide = cover,
		hasLeanConcrete = true,
		leanConcreteThickness = 0.10,
		hasEdgeBeams = false,
		edgeBeamWidth = 0.3,
		edgeBeamDepth = 0.3,
		lapSpliceMethod = '40d',
		customLapLength,
		hasChairBars = false,
		chairBars,
		columnDowels,
		bottomX,
		bottomY,
		topX,
		topY,
		concreteType = 'C30',
	} = input;

	const area = length * width;
	const concreteVolume = area * thickness;

	// خرسانة النظافة
	const leanConcreteVolume = hasLeanConcrete ? area * leanConcreteThickness : 0;

	// تسميك الحواف (edge beams along perimeter)
	const perimeter = 2 * (length + width);
	const edgeBeamConcreteVolume = hasEdgeBeams ? perimeter * edgeBeamWidth * edgeBeamDepth : 0;

	const totalConcreteVolume = concreteVolume + edgeBeamConcreteVolume;
	const plainConcreteVolume = leanConcreteVolume;

	const formworkArea = 2 * (length + width) * thickness;

	// حسابات الحديد
	const rebarDetails: FoundationRebarCalculation[] = [];
	const raftRebarResults: RaftRebarResult[] = [];

	// شبكة سفلية - اتجاه X (bars run along width, spaced along length)
	const bottomXBarLength = calcFoundationBarLength(width, coverSide, hookLength);
	const bottomXBarCount = calcFoundationBarCount(length, bottomX.barsPerMeter, coverSide);
	const bottomXResult = calcRaftRebar('سفلي اتجاه X', bottomX.diameter, bottomXBarLength, bottomXBarCount, lapSpliceMethod, customLapLength);
	rebarDetails.push(bottomXResult);
	raftRebarResults.push(bottomXResult);

	// شبكة سفلية - اتجاه Y (bars run along length, spaced along width)
	const bottomYBarLength = calcFoundationBarLength(length, coverSide, hookLength);
	const bottomYBarCount = calcFoundationBarCount(width, bottomY.barsPerMeter, coverSide);
	const bottomYResult = calcRaftRebar('سفلي اتجاه Y', bottomY.diameter, bottomYBarLength, bottomYBarCount, lapSpliceMethod, customLapLength);
	rebarDetails.push(bottomYResult);
	raftRebarResults.push(bottomYResult);

	// شبكة علوية - اتجاه X (BUG FIX: uses topX's own barsPerMeter)
	if (topX) {
		const topXBarLength = calcFoundationBarLength(width, coverSide, hookLength);
		const topXBarCount = calcFoundationBarCount(length, topX.barsPerMeter, coverSide);
		const topXResult = calcRaftRebar('علوي اتجاه X', topX.diameter, topXBarLength, topXBarCount, lapSpliceMethod, customLapLength);
		rebarDetails.push(topXResult);
		raftRebarResults.push(topXResult);
	}

	// شبكة علوية - اتجاه Y (BUG FIX: uses topY's own barsPerMeter)
	if (topY) {
		const topYBarLength = calcFoundationBarLength(length, coverSide, hookLength);
		const topYBarCount = calcFoundationBarCount(width, topY.barsPerMeter, coverSide);
		const topYResult = calcRaftRebar('علوي اتجاه Y', topY.diameter, topYBarLength, topYBarCount, lapSpliceMethod, customLapLength);
		rebarDetails.push(topYResult);
		raftRebarResults.push(topYResult);
	}

	// كراسي حديد (chair bars / spacers)
	let chairBarsDetail: RaftFoundationResult['chairBarsDetail'] | undefined;
	if (hasChairBars && chairBars) {
		const chairCountX = Math.floor(length / chairBars.spacingX) + 1;
		const chairCountY = Math.floor(width / chairBars.spacingY) + 1;
		const chairCount = chairCountX * chairCountY;
		// Chair length = thickness minus covers minus bar diameters + hooks
		const avgBarDia = (bottomX.diameter + (topX?.diameter || bottomX.diameter)) / 2 / 1000;
		const chairLength = thickness - coverBottom - coverTop - 2 * avgBarDia + 2 * hookLength;
		const chairWeight = chairCount * chairLength * (REBAR_WEIGHTS[chairBars.diameter] || 0.617);
		const chairStockLength = STOCK_LENGTHS[chairBars.diameter] || 12;
		const chairCutsPerStock = Math.floor(chairStockLength / chairLength) || 1;
		const chairStocksNeeded = Math.ceil(chairCount / chairCutsPerStock);

		chairBarsDetail = {
			diameter: chairBars.diameter,
			count: chairCount,
			length: Number(chairLength.toFixed(3)),
			weight: Number(chairWeight.toFixed(2)),
			stocksNeeded: chairStocksNeeded,
		};

		// Add chair bars to rebar details
		const chairRebarDetail = calcFoundationRebar('كراسي حديد', chairBars.diameter, chairLength, chairCount, 1);
		rebarDetails.push(chairRebarDetail);
	}

	// أسياخ انتظار الأعمدة (column dowels)
	let columnDowelsDetail: RaftFoundationResult['columnDowelsDetail'] | undefined;
	if (columnDowels && columnDowels.count > 0) {
		const totalDowelBars = columnDowels.count * columnDowels.barsPerColumn;
		const dowelLength = columnDowels.developmentLength;
		const dowelWeight = totalDowelBars * dowelLength * (REBAR_WEIGHTS[columnDowels.diameter] || 1);
		const dowelStockLength = STOCK_LENGTHS[columnDowels.diameter] || 12;
		const dowelCutsPerStock = Math.floor(dowelStockLength / dowelLength) || 1;
		const dowelStocksNeeded = Math.ceil(totalDowelBars / dowelCutsPerStock);

		columnDowelsDetail = {
			totalBars: totalDowelBars,
			diameter: columnDowels.diameter,
			length: Number(dowelLength.toFixed(3)),
			weight: Number(dowelWeight.toFixed(2)),
			stocksNeeded: dowelStocksNeeded,
		};

		// Add dowels to rebar details
		const dowelRebarDetail = calcFoundationRebar('أسياخ انتظار', columnDowels.diameter, dowelLength, totalDowelBars, 1);
		rebarDetails.push(dowelRebarDetail);
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

	// تفاصيل الفضلات مع اقتراحات الاستخدام
	const waste: RaftFoundationResult['waste'] = [];
	rebarDetails.forEach((r) => {
		if (r.wastePerStock > 0.01 && r.stocksNeeded > 0) {
			waste.push({
				diameter: r.diameter,
				length: r.wastePerStock,
				count: r.stocksNeeded,
				suggestedUse: suggestWasteUse(r.wastePerStock),
			});
		}
	});

	// تفاصيل الوصلات
	const spliceDetails: RaftFoundationResult['spliceDetails'] = [];
	raftRebarResults.forEach((r) => {
		if (r.spliceInfo) {
			spliceDetails.push({
				direction: r.direction,
				diameter: r.diameter,
				piecesPerBar: r.spliceInfo.piecesPerBar,
				splicesPerBar: r.spliceInfo.splicesPerBar,
				lapLength: r.spliceInfo.lapLength,
				totalSplices: r.barCount * r.spliceInfo.splicesPerBar,
			});
		}
	});

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const leanConcretePrice = STRUCTURAL_PRICES.concrete['C20'] || 250; // lean concrete uses C20 or lower
	const concreteCost = totalConcreteVolume * concretePrice + leanConcreteVolume * leanConcretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = totalConcreteVolume * STRUCTURAL_LABOR_PRICES.foundations;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		area: Number(area.toFixed(2)),
		concreteVolume: Number(totalConcreteVolume.toFixed(3)),
		leanConcreteVolume: Number(leanConcreteVolume.toFixed(3)),
		edgeBeamConcreteVolume: Number(edgeBeamConcreteVolume.toFixed(3)),
		totalConcreteVolume: Number(totalConcreteVolume.toFixed(3)),
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
		waste,
		spliceDetails,
		chairBarsDetail,
		columnDowelsDetail,
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
	structuralType?: 'ONE_WAY' | 'TWO_WAY';
	shortSpan?: number;
	longSpan?: number;
	aspectRatio?: number;
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
	panelsCostBreakdown?: {
		panelPricePerSqm: number;
		panelsCost: number;
		panelsCount: number;
		concreteCost: number;
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
	const weightPerMeter = REBAR_WEIGHTS[diameter] || 0;
	const totalLength = barCount * barLength;
	const netWeight = totalLength * weightPerMeter;

	if (barLength <= stockLength) {
		// NORMAL PATH — bar fits in one stock bar
		const cutsPerStock = Math.floor(stockLength / barLength) || 1;
		const stocksNeeded = Math.ceil(barCount / cutsPerStock);
		const wastePerStock = stockLength - cutsPerStock * barLength;
		const totalWaste = stocksNeeded * wastePerStock;
		const grossLen = stocksNeeded * stockLength;
		const wastePercentage = grossLen > 0 ? (totalWaste / grossLen) * 100 : 0;
		const grossWt = grossLen * weightPerMeter;

		return {
			id: `${location}-${description}`,
			description,
			location,
			diameter,
			barLength: Number(barLength.toFixed(2)),
			barCount,
			totalLength: Number(totalLength.toFixed(2)),
			weight: Number(netWeight.toFixed(2)),
			stockLength,
			stocksNeeded,
			wastePercentage: Number(wastePercentage.toFixed(1)),
			grossWeight: Number(grossWt.toFixed(2)),
		};
	}

	// SPLICE PATH — barLength > stockLength, needs lap splices
	const lapLength = (diameter * SLAB_DEFAULTS.lapLengthFactor) / 1000;
	const effectiveStockLength = stockLength - lapLength;
	const stockBarsPerUnit = Math.ceil(barLength / effectiveStockLength);
	const splicesPerBar = stockBarsPerUnit - 1;
	const totalStockBars = stockBarsPerUnit * barCount;
	const totalGrossLength = totalStockBars * stockLength;
	const actualUsedPerBar = barLength + splicesPerBar * lapLength;
	const waste = totalGrossLength - barCount * actualUsedPerBar;
	const wastePercentage = totalGrossLength > 0 ? (waste / totalGrossLength) * 100 : 0;
	const grossWt = totalGrossLength * weightPerMeter;

	return {
		id: `${location}-${description}`,
		description,
		location,
		diameter,
		barLength: Number(barLength.toFixed(2)),
		barCount,
		totalLength: Number(totalLength.toFixed(2)),
		weight: Number(netWeight.toFixed(2)),
		stockLength,
		stocksNeeded: totalStockBars,
		wastePercentage: Number(Math.max(0, wastePercentage).toFixed(1)),
		stockBarsPerUnit,
		totalStockBars,
		lapSpliceLength: Number(lapLength.toFixed(3)),
		splicesPerBar,
		grossWeight: Number(grossWt.toFixed(2)),
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

	// Structural type detection
	const shortSpan = Math.min(dimensions.length, dimensions.width);
	const longSpan = Math.max(dimensions.length, dimensions.width);
	const aspectRatio = shortSpan > 0 ? longSpan / shortSpan : 1;
	const structuralType = aspectRatio >= 2 ? 'ONE_WAY' as const : 'TWO_WAY' as const;

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
		return sum + (r.grossWeight ?? (r.stocksNeeded * r.stockLength * (REBAR_WEIGHTS[r.diameter] || 0)));
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
		structuralType,
		shortSpan: Number(shortSpan.toFixed(2)),
		longSpan: Number(longSpan.toFixed(2)),
		aspectRatio: Number(aspectRatio.toFixed(2)),
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
	const ribsCount = Math.floor(dimensions.width / ribSpacingM + 1e-9) + 1;

	// حجم الخرسانة
	const ribVolume = ribsCount * dimensions.length * ribWidthM * blockHeightM;
	const toppingVolume = netArea * toppingM;
	const concreteVolume = ribVolume + toppingVolume;

	// عدد البلوكات
	const blockWidthM = system.block.width / 100; // 40سم = 0.4م — بُعد البلوكة في اتجاه العصب
	const blockGaps = ribsCount - 1;
	const blocksPerGap = Math.floor(dimensions.length / blockWidthM);
	const totalBlocks = blockGaps * blocksPerGap;
	const blocksCount = Math.ceil(totalBlocks * (1 + SLAB_DEFAULTS.blockWaste));

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

		// كانات الأعصاب
		if (reinforcement.ribs.stirrups) {
			const { diameter: stirrupDia, spacing: stirrupSpacing } = reinforcement.ribs.stirrups;
			const stirrupsPerRib = Math.floor(dimensions.length / stirrupSpacing) + 1;
			const stirrupPerimeter = 2 * (ribWidthM + blockHeightM)
				+ 2 * (10 * stirrupDia / 1000)
				+ SLAB_DEFAULTS.stirrupHook;
			const totalStirrups = ribsCount * stirrupsPerRib;
			rebarDetails.push(
				calculateRebarLayer(stirrupDia, stirrupPerimeter, totalStirrups, 'كانات أعصاب', 'الأعصاب')
			);
		}
	}

	// شبكة الطبقة العلوية
	if (reinforcement.topping?.mesh) {
		const { mesh } = reinforcement.topping;
		// اتجاه طولي (أسياخ تمتد على طول السقف)
		const meshXCount = Math.floor(dimensions.width / mesh.xDirection.spacing) + 1;
		const meshXLength = dimensions.length + 2 * cover;
		rebarDetails.push(
			calculateRebarLayer(mesh.xDirection.diameter, meshXLength, meshXCount, 'شبكة علوية - اتجاه طولي', 'الطبقة العلوية')
		);
		// اتجاه عرضي (أسياخ تمتد على عرض السقف)
		const meshYCount = Math.floor(dimensions.length / mesh.yDirection.spacing) + 1;
		const meshYLength = dimensions.width + 2 * cover;
		rebarDetails.push(
			calculateRebarLayer(mesh.yDirection.diameter, meshYLength, meshYCount, 'شبكة علوية - اتجاه عرضي', 'الطبقة العلوية')
		);
	}

	// إجماليات الحديد
	const netWeight = rebarDetails.reduce((sum, r) => sum + r.weight, 0);
	const grossWeight = rebarDetails.reduce((sum, r) => {
		if (r.stockLength === 0) return sum + r.weight;
		return sum + (r.grossWeight ?? (r.stocksNeeded * r.stockLength * (REBAR_WEIGHTS[r.diameter] || 0)));
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
	const blocksCost = blocksCount * (STRUCTURAL_PRICES.blocks[blockHeight] || STRUCTURAL_PRICES.blocks[20] || 4.5);
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

	// إضافة drop panels (fixed: length*width instead of width*width, user count with fallback)
	if (dropPanels) {
		const dpLength = dropPanels.length || dropPanels.width;
		const dpCount = dropPanels.count || Math.ceil(netArea / 36);
		const dropVolume = dpLength * dropPanels.width * dropPanels.extraThickness * dpCount;
		concreteVolume += dropVolume;
	}

	const formworkArea = netArea;

	// حسابات الحديد
	const rebarDetails: RebarDetail[] = [];
	const cover = SLAB_DEFAULTS.cover;

	if (reinforcement.inputMethod === 'grid' && reinforcement.grid) {
		const { grid } = reinforcement;

		// سفلي X (الاتجاه الرئيسي)
		const bottomXLength = dimensions.width - 2 * cover + 0.4;
		const bottomXCount = calculateBarCount(dimensions.length - 2 * cover, grid.bottom.xDirection.spacing);
		rebarDetails.push(
			calculateRebarLayer(
				grid.bottom.xDirection.diameter,
				bottomXLength,
				bottomXCount,
				'سفلي - اتجاه X',
				'الفلات سلاب'
			)
		);

		// سفلي Y (الاتجاه الثانوي)
		const bottomYLength = dimensions.length - 2 * cover + 0.4;
		const bottomYCount = calculateBarCount(dimensions.width - 2 * cover, grid.bottom.yDirection.spacing);
		rebarDetails.push(
			calculateRebarLayer(
				grid.bottom.yDirection.diameter,
				bottomYLength,
				bottomYCount,
				'سفلي - اتجاه Y',
				'الفلات سلاب'
			)
		);

		// علوي X (اختياري)
		if (grid.top?.xDirection) {
			rebarDetails.push(
				calculateRebarLayer(
					grid.top.xDirection.diameter,
					bottomXLength,
					bottomXCount,
					'علوي - اتجاه X',
					'الفلات سلاب'
				)
			);
		}
		// علوي Y (اختياري)
		if (grid.top?.yDirection) {
			rebarDetails.push(
				calculateRebarLayer(
					grid.top.yDirection.diameter,
					bottomYLength,
					bottomYCount,
					'علوي - اتجاه Y',
					'الفلات سلاب'
				)
			);
		}
	} else {
		// Fallback: 140 kg/m3 estimation
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
	}

	// إجماليات الحديد
	const netWeight = rebarDetails.reduce((sum, r) => sum + r.weight, 0);
	const grossWeight = rebarDetails.reduce((sum, r) => {
		if (r.stockLength === 0) return sum + r.weight * 1.15; // 15% waste for estimation rows
		return sum + (r.grossWeight ?? (r.stocksNeeded * r.stockLength * (REBAR_WEIGHTS[r.diameter] || 0)));
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
 * حساب الهولوكور التفصيلي (Detailed Hollow Core)
 * يستخدم أسعار الألواح حسب السماكة بدل السعر الثابت
 * ويحسب حديد الشبكة العلوية تفصيلياً (Φ8@200mm)
 */
export function calculateHollowCoreDetailed(slab: HollowCoreSlab, panelDepthCm?: number): EnhancedSlabResult {
	const {
		dimensions,
		openings = [],
		panels,
		topping,
		concreteType = 'C30',
	} = slab;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);

	// عدد الألواح
	const panelWidthM = panels.width;
	const panelsCount = Math.ceil(dimensions.width / panelWidthM);

	// سعر اللوح حسب السماكة
	const depth = panelDepthCm ?? panels.thickness;
	const panelPricePerSqm = HOLLOW_CORE_PANEL_PRICES[depth] ?? HOLLOW_CORE_DEFAULT_PRICE_PER_SQM;

	// حجم الخرسانة (الطبقة العلوية فقط)
	const toppingM = topping?.thickness || 0.05;
	const concreteVolume = netArea * toppingM;

	// حسابات حديد الشبكة العلوية — Φ8@200mm
	const meshDiameter = 8;
	const meshSpacing = 0.2; // م
	const rebarDetails: RebarDetail[] = [];

	const barsX = Math.ceil(dimensions.width / meshSpacing) + 1;
	const barsY = Math.ceil(dimensions.length / meshSpacing) + 1;
	const barLengthX = dimensions.length + 0.2; // رجوع
	const barLengthY = dimensions.width + 0.2;
	const weightPerMeter = getRebarWeightPerMeter(meshDiameter);

	const meshWeightX = barsX * barLengthX * weightPerMeter;
	const meshWeightY = barsY * barLengthY * weightPerMeter;
	const meshWeight = meshWeightX + meshWeightY;

	rebarDetails.push({
		id: 'hollow-core-mesh-x',
		description: `شبكة علوية X — Φ${meshDiameter}@${meshSpacing * 1000}mm`,
		location: 'الطبقة العلوية',
		diameter: meshDiameter,
		barLength: Number(barLengthX.toFixed(2)),
		barCount: barsX,
		totalLength: Number((barsX * barLengthX).toFixed(2)),
		weight: Number(meshWeightX.toFixed(2)),
		stockLength: STOCK_LENGTHS[meshDiameter] || 6,
		stocksNeeded: Math.ceil((barsX * barLengthX) / (STOCK_LENGTHS[meshDiameter] || 6)),
		wastePercentage: 0,
	});

	rebarDetails.push({
		id: 'hollow-core-mesh-y',
		description: `شبكة علوية Y — Φ${meshDiameter}@${meshSpacing * 1000}mm`,
		location: 'الطبقة العلوية',
		diameter: meshDiameter,
		barLength: Number(barLengthY.toFixed(2)),
		barCount: barsY,
		totalLength: Number((barsY * barLengthY).toFixed(2)),
		weight: Number(meshWeightY.toFixed(2)),
		stockLength: STOCK_LENGTHS[meshDiameter] || 6,
		stocksNeeded: Math.ceil((barsY * barLengthY) / (STOCK_LENGTHS[meshDiameter] || 6)),
		wastePercentage: 0,
	});

	const netWeight = meshWeight;
	const grossWeight = meshWeight * 1.10; // 10% هالك
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	// التكاليف
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = grossWeight * STRUCTURAL_PRICES.steelPerKg;
	const panelsCost = netArea * panelPricePerSqm;
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
		panelsCostBreakdown: {
			panelPricePerSqm,
			panelsCost: Number(panelsCost.toFixed(2)),
			panelsCount,
			concreteCost: Number(concreteCost.toFixed(2)),
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
		bands: bandedBeams = [],
		reinforcement,
		concreteType = 'C30',
	} = slab;
	const thickness = dimensions.thickness;
	const cover = SLAB_DEFAULTS.cover;

	const grossArea = dimensions.length * dimensions.width;
	const netArea = calculateNetArea(grossArea, openings);

	// حجم الخرسانة — bug fix: use additional depth only
	const slabVolume = netArea * thickness;
	const beamsAdditionalVolume = bandedBeams.reduce((sum, beam) => {
		const additionalDepth = Math.max(0, beam.dimensions.depth - thickness);
		return sum + beam.dimensions.width * additionalDepth * beam.dimensions.length * (beam.quantity || 1);
	}, 0);
	const concreteVolume = slabVolume + beamsAdditionalVolume;

	// الشدات — include beam side formwork
	const beamFormwork = bandedBeams.reduce((sum, beam) => {
		const additionalDepth = Math.max(0, beam.dimensions.depth - thickness);
		return sum + 2 * additionalDepth * beam.dimensions.length * (beam.quantity || 1);
	}, 0);
	const formworkArea = netArea + beamFormwork;

	// حسابات الحديد
	const rebarDetails: RebarDetail[] = [];
	const hasSlabReinforcement = reinforcement?.bottom?.xDirection?.spacing > 0;
	const hasBeamReinforcement = bandedBeams.length > 0 && bandedBeams.some(b => b.reinforcement?.bottom?.continuous?.count > 0);

	if (hasSlabReinforcement) {
		// ═══ Slab grid rebar — same pattern as calculateSolidSlab ═══
		const { bottom, top } = reinforcement;

		// سفلي X
		const bottomXLength = dimensions.width - 2 * cover + 0.4;
		const bottomXCount = calculateBarCount(dimensions.length - 2 * cover, bottom.xDirection.spacing);
		rebarDetails.push(
			calculateRebarLayer(
				bottom.xDirection.diameter,
				bottomXLength,
				bottomXCount,
				'سفلي - اتجاه X',
				'البلاطة'
			)
		);

		// سفلي Y
		const bottomYLength = dimensions.length - 2 * cover + 0.4;
		const bottomYCount = calculateBarCount(dimensions.width - 2 * cover, bottom.yDirection.spacing);
		rebarDetails.push(
			calculateRebarLayer(
				bottom.yDirection.diameter,
				bottomYLength,
				bottomYCount,
				'سفلي - اتجاه Y',
				'البلاطة'
			)
		);

		// علوي (إن وجد)
		if (top?.enabled && top.xDirection) {
			const topXCount = calculateBarCount(dimensions.length - 2 * cover, top.xDirection.spacing);
			rebarDetails.push(
				calculateRebarLayer(
					top.xDirection.diameter,
					bottomXLength,
					topXCount,
					'علوي - اتجاه X',
					'البلاطة'
				)
			);
		}
		if (top?.enabled && top.yDirection) {
			const topYCount = calculateBarCount(dimensions.width - 2 * cover, top.yDirection.spacing);
			rebarDetails.push(
				calculateRebarLayer(
					top.yDirection.diameter,
					bottomYLength,
					topYCount,
					'علوي - اتجاه Y',
					'البلاطة'
				)
			);
		}
	}

	if (hasBeamReinforcement) {
		// ═══ Beam rebar — per template ═══
		for (const beam of bandedBeams) {
			const qty = beam.quantity || 1;
			const beamLength = beam.dimensions.length;
			const beamWidth = beam.dimensions.width;
			const beamDepth = beam.dimensions.depth;
			const r = beam.reinforcement;
			const beamLabel = beam.name || 'كمرة';

			// Bottom continuous
			if (r.bottom.continuous.count > 0) {
				const barLen = beamLength + 0.80; // 0.40m anchorage each end
				rebarDetails.push(
					calculateRebarLayer(
						r.bottom.continuous.diameter,
						barLen,
						r.bottom.continuous.count * qty,
						`${beamLabel} - سفلي مستمر`,
						'الكمرات'
					)
				);
			}

			// Bottom additional (if present)
			if (r.bottom.additional && r.bottom.additional.count > 0) {
				const barLen = beamLength * 0.6 + 0.40;
				rebarDetails.push(
					calculateRebarLayer(
						r.bottom.additional.diameter,
						barLen,
						r.bottom.additional.count * qty,
						`${beamLabel} - سفلي إضافي`,
						'الكمرات'
					)
				);
			}

			// Top continuous
			if (r.top.continuous.count > 0) {
				const barLen = beamLength + 0.80;
				rebarDetails.push(
					calculateRebarLayer(
						r.top.continuous.diameter,
						barLen,
						r.top.continuous.count * qty,
						`${beamLabel} - علوي مستمر`,
						'الكمرات'
					)
				);
			}

			// Stirrups
			if (r.stirrups.diameter > 0) {
				const spacingQ = r.stirrups.spacingAtQuarter;
				const spacingM = r.stirrups.spacingAtMid;
				const stirrupsPerQuarter = spacingQ > 0 ? Math.ceil((beamLength / 4) / spacingQ) + 1 : 0;
				const stirrupsAtMid = spacingM > 0 ? Math.ceil((beamLength / 2) / spacingM) + 1 : 0;
				const totalStirrups = (stirrupsPerQuarter * 2 + stirrupsAtMid) * qty;

				// Stirrup perimeter length
				const d = r.stirrups.diameter;
				const hookAllowance = 2 * 10 * d / 1000 + 0.10;
				let stirrupLength: number;
				if (r.stirrups.legs <= 2) {
					stirrupLength = 2 * (beamWidth + beamDepth - 4 * cover) + hookAllowance;
				} else {
					// 4 legs: outer + inner stirrup
					const outerLen = 2 * (beamWidth + beamDepth - 4 * cover) + hookAllowance;
					const innerLen = 2 * (beamWidth / 2 + beamDepth - 4 * cover) + hookAllowance;
					stirrupLength = outerLen + innerLen;
				}

				rebarDetails.push(
					calculateRebarLayer(
						d,
						stirrupLength,
						totalStirrups,
						`${beamLabel} - كانات`,
						'الكمرات'
					)
				);
			}
		}
	}

	// If no rebar data provided, fall back to estimation
	if (rebarDetails.length === 0) {
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
	}

	// إجماليات الحديد — same pattern as solid slab
	const netWeight = rebarDetails.reduce((sum, r) => sum + r.weight, 0);
	const grossWeight = rebarDetails.reduce((sum, r) => {
		if (r.stockLength === 0) return sum + r.weight;
		return sum + (r.grossWeight ?? (r.stocksNeeded * r.stockLength * (REBAR_WEIGHTS[r.diameter] || 0)));
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
// حسابات تفصيلية للأعمدة مع القص (Column Rebar Details)
// ═══════════════════════════════════════════════════════════════════════════

interface CuttingDetailResult {
	description: string;
	diameter: number;
	barLength: number;
	barCount: number;
	stocksNeeded: number;
	wastePerStock: number;
	totalWaste: number;
	wastePercentage: number;
	weight: number;
	stockLength: number;
}

function calcCuttingDetails(
	barLength: number,
	barCount: number,
	diameter: number,
	description: string,
): CuttingDetailResult {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = Math.ceil(barCount / cutsPerStock);
	const wastePerStock = stockLength - cutsPerStock * barLength;
	const totalWaste = stocksNeeded * wastePerStock;
	const totalLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;
	const wastePercentage =
		grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;
	const weight = totalLength * getRebarWeightPerMeter(diameter);

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

function aggregateStocksFromDetails(details: CuttingDetailResult[]) {
	const stocksMap = new Map<
		number,
		{ diameter: number; count: number; length: number }
	>();
	details.forEach((d) => {
		const existing = stocksMap.get(d.diameter);
		if (existing) {
			existing.count += d.stocksNeeded;
		} else {
			stocksMap.set(d.diameter, {
				diameter: d.diameter,
				count: d.stocksNeeded,
				length: d.stockLength,
			});
		}
	});
	return Array.from(stocksMap.values());
}

function computeRebarTotals(details: CuttingDetailResult[]) {
	const netWeight = details.reduce((sum, d) => sum + d.weight, 0);
	const grossWeight = details.reduce(
		(sum, d) =>
			sum +
			d.stocksNeeded * d.stockLength * getRebarWeightPerMeter(d.diameter),
		0,
	);
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage =
		grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	return {
		netWeight: Number(netWeight.toFixed(2)),
		grossWeight: Number(grossWeight.toFixed(2)),
		wasteWeight: Number(wasteWeight.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		stocksNeeded: aggregateStocksFromDetails(details),
	};
}

export interface ColumnRebarInput {
	quantity: number;
	width: number;       // cm
	depth: number;       // cm
	height: number;      // m
	mainBarsCount: number;
	mainBarDiameter: number;
	stirrupDiameter: number;
	stirrupSpacing: number; // mm
	concreteType: string;
}

export interface ColumnRebarResult {
	concreteVolume: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	laborCost: number;
	totalCost: number;
	cuttingDetails: CuttingDetailResult[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
}

export function calculateColumnRebar(params: ColumnRebarInput): ColumnRebarResult {
	const baseCalc = calculateColumn(params);

	const mainBarLength = params.height + 0.8;
	const widthM = params.width / 100;
	const depthM = params.depth / 100;
	const stirrupPerimeter = 2 * (widthM + depthM - 0.08) + 0.3;
	const stirrupsCount =
		Math.ceil((params.height * 1000) / params.stirrupSpacing) + 1;

	const cuttingDetails = [
		calcCuttingDetails(
			mainBarLength,
			params.mainBarsCount * params.quantity,
			params.mainBarDiameter,
			"حديد رئيسي",
		),
		calcCuttingDetails(
			stirrupPerimeter,
			stirrupsCount * params.quantity,
			params.stirrupDiameter,
			"كانات",
		),
	];

	return {
		...baseCalc,
		cuttingDetails,
		totals: computeRebarTotals(cuttingDetails),
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات تفصيلية للكمرات مع القص (Beam Rebar Details)
// ═══════════════════════════════════════════════════════════════════════════

export interface BeamRebarInput {
	quantity: number;
	width: number;       // cm
	height: number;      // cm
	length: number;      // m
	topBarsCount: number;
	topBarDiameter: number;
	bottomBarsCount: number;
	bottomBarDiameter: number;
	stirrupDiameter: number;
	stirrupSpacing: number; // mm
	concreteType: string;
}

export interface BeamRebarResult {
	concreteVolume: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	laborCost: number;
	totalCost: number;
	cuttingDetails: CuttingDetailResult[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
}

export function calculateBeamRebar(params: BeamRebarInput): BeamRebarResult {
	const baseCalc = calculateBeam({
		quantity: params.quantity,
		width: params.width,
		height: params.height,
		length: params.length,
		topBarsCount: params.topBarsCount,
		topBarDiameter: params.topBarDiameter,
		bottomBarsCount: params.bottomBarsCount,
		bottomBarDiameter: params.bottomBarDiameter,
		stirrupDiameter: params.stirrupDiameter,
		stirrupSpacing: params.stirrupSpacing,
		concreteType: params.concreteType,
	});

	const barLength = params.length + 0.6;
	const widthM = params.width / 100;
	const heightM = params.height / 100;
	const stirrupPerimeter = 2 * (widthM + heightM - 0.08) + 0.3;
	const stirrupsCount =
		Math.ceil((params.length * 1000) / params.stirrupSpacing) + 1;

	const cuttingDetails = [
		calcCuttingDetails(
			barLength,
			params.topBarsCount * params.quantity,
			params.topBarDiameter,
			"حديد علوي",
		),
		calcCuttingDetails(
			barLength,
			params.bottomBarsCount * params.quantity,
			params.bottomBarDiameter,
			"حديد سفلي",
		),
		calcCuttingDetails(
			stirrupPerimeter,
			stirrupsCount * params.quantity,
			params.stirrupDiameter,
			"كانات",
		),
	];

	return {
		...baseCalc,
		cuttingDetails,
		totals: computeRebarTotals(cuttingDetails),
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// حسابات تفصيلية للسلالم مع القص (Staircase Rebar Details)
// ═══════════════════════════════════════════════════════════════════════════

const STAIR_REBAR_CONSTS = {
	DEV_LENGTH_MULTIPLIER: 40,
	HOOK_MULTIPLIER: 12,
	TOP_BAR_EXTENSION_RATIO: 0.25,
	CUT_LENGTH_ROUNDING: 0.05,
};

function stairRoundUpTo5cm(length: number): number {
	return Math.ceil(length / 0.05) * 0.05;
}

interface StairCuttingDetail {
	description: string;
	diameter: number;
	barLength: number;
	barCount: number;
	stockLength: number;
	stocksNeeded: number;
	cutsPerStock: number;
	wastePerStock: number;
	totalWaste: number;
	wastePercentage: number;
	netWeight: number;
	grossWeight: number;
}

function calcStairCuttingDetail(
	description: string,
	diameter: number,
	barLength: number,
	barCount: number,
): StairCuttingDetail {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const weight = REBAR_WEIGHTS[diameter] || diameter * diameter * 0.00617;

	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = Math.ceil(barCount / cutsPerStock);
	const wastePerStock = stockLength - cutsPerStock * barLength;
	const totalWaste = stocksNeeded * wastePerStock;

	const netLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;

	const netWeight = netLength * weight;
	const grossWeight = grossLength * weight;
	const wastePercentage = grossLength > 0 ? (totalWaste / grossLength) * 100 : 0;

	return {
		description,
		diameter,
		barLength: Number(barLength.toFixed(3)),
		barCount,
		stockLength,
		stocksNeeded,
		cutsPerStock,
		wastePerStock: Number(wastePerStock.toFixed(3)),
		totalWaste: Number(totalWaste.toFixed(2)),
		wastePercentage: Number(wastePercentage.toFixed(1)),
		netWeight: Number(netWeight.toFixed(2)),
		grossWeight: Number(grossWeight.toFixed(2)),
	};
}

export interface StaircaseRebarInput {
	width: number;
	flightLength: number;
	landingLength: number;
	landingWidth: number;
	thickness: number;
	risersCount: number;
	riserHeight: number;
	treadDepth: number;
	mainBarDiameter: number;
	mainBarsPerMeter: number;
	secondaryBarDiameter: number;
	secondaryBarsPerMeter: number;
	concreteType: string;
}

export interface StaircaseRebarResult {
	concreteVolume: number;
	concreteCost: number;
	rebarCost: number;
	laborCost: number;
	totalCost: number;
	cuttingDetails: StairCuttingDetail[];
	totals: {
		netWeight: number;
		grossWeight: number;
		wasteWeight: number;
		wastePercentage: number;
		stocksNeeded: Array<{ diameter: number; count: number; length: number }>;
	};
}

export function calculateStaircaseRebar(params: StaircaseRebarInput): StaircaseRebarResult {
	const mainBarSpacing = Math.round(1000 / params.mainBarsPerMeter);
	const secondaryBarSpacing = Math.round(1000 / params.secondaryBarsPerMeter);

	const baseResult = calculateStairs({
		width: params.width,
		flightLength: params.flightLength,
		landingLength: params.landingLength,
		landingWidth: params.landingWidth,
		thickness: params.thickness,
		risersCount: params.risersCount,
		riserHeight: params.riserHeight,
		treadDepth: params.treadDepth,
		mainBarDiameter: params.mainBarDiameter,
		mainBarSpacing,
		secondaryBarDiameter: params.secondaryBarDiameter,
		secondaryBarSpacing,
		concreteType: params.concreteType,
	});

	const {
		flightLength, landingLength, width,
		mainBarDiameter, mainBarsPerMeter,
		secondaryBarDiameter, secondaryBarsPerMeter,
	} = params;

	const totalLength = flightLength + landingLength;
	const mainBarsCount = Math.ceil(width * mainBarsPerMeter) + 1;
	const secondaryBarsCount = Math.ceil(totalLength * secondaryBarsPerMeter) + 1;

	const mainDevLength = STAIR_REBAR_CONSTS.DEV_LENGTH_MULTIPLIER * (mainBarDiameter / 1000);
	const mainHookLength = STAIR_REBAR_CONSTS.HOOK_MULTIPLIER * (mainBarDiameter / 1000);
	const secDevLength = STAIR_REBAR_CONSTS.DEV_LENGTH_MULTIPLIER * (secondaryBarDiameter / 1000);
	const secHookLength = STAIR_REBAR_CONSTS.HOOK_MULTIPLIER * (secondaryBarDiameter / 1000);

	const topExtension = STAIR_REBAR_CONSTS.TOP_BAR_EXTENSION_RATIO * flightLength;
	const secBarSpacing = Math.round(1000 / secondaryBarsPerMeter);

	// Layer 1: Bottom main (longitudinal)
	const bottomMainBarLength = stairRoundUpTo5cm(totalLength + 2 * mainDevLength + 2 * mainHookLength);
	const bottomMainCutting = calcStairCuttingDetail(
		"حديد سفلي رئيسي (طولي)",
		mainBarDiameter,
		bottomMainBarLength,
		mainBarsCount,
	);

	// Layer 2: Bottom secondary (transverse)
	const bottomSecBarLength = stairRoundUpTo5cm(width + 2 * secDevLength + 2 * secHookLength);
	const bottomSecCutting = calcStairCuttingDetail(
		"حديد سفلي ثانوي (عرضي)",
		secondaryBarDiameter,
		bottomSecBarLength,
		secondaryBarsCount,
	);

	// Layer 3: Top main (supports)
	const topMainPieceLength = stairRoundUpTo5cm(topExtension + mainDevLength + mainHookLength);
	const topMainCount = mainBarsCount * 2;
	const topMainCutting = calcStairCuttingDetail(
		"حديد علوي رئيسي (مساند)",
		mainBarDiameter,
		topMainPieceLength,
		topMainCount,
	);

	// Layer 4: Top secondary (support distribution)
	const topSecBarLength = bottomSecBarLength;
	const topSecCount = 2 * (Math.ceil((topExtension * 1000) / secBarSpacing) + 1);
	const topSecCutting = calcStairCuttingDetail(
		"حديد علوي ثانوي (توزيع مساند)",
		secondaryBarDiameter,
		topSecBarLength,
		topSecCount,
	);

	const cuttingDetails = [bottomMainCutting, bottomSecCutting, topMainCutting, topSecCutting];

	// Totals
	const netWeight = cuttingDetails.reduce((sum, d) => sum + d.netWeight, 0);
	const grossWeight = cuttingDetails.reduce((sum, d) => sum + d.grossWeight, 0);
	const wasteWeight = grossWeight - netWeight;
	const wastePercentage = grossWeight > 0 ? (wasteWeight / grossWeight) * 100 : 0;

	const stocksMap = new Map<number, { diameter: number; count: number; length: number }>();
	cuttingDetails.forEach((d) => {
		const existing = stocksMap.get(d.diameter);
		if (existing) {
			existing.count += d.stocksNeeded;
		} else {
			stocksMap.set(d.diameter, {
				diameter: d.diameter,
				count: d.stocksNeeded,
				length: d.stockLength,
			});
		}
	});

	return {
		...baseResult,
		cuttingDetails,
		totals: {
			netWeight: Number(netWeight.toFixed(2)),
			grossWeight: Number(grossWeight.toFixed(2)),
			wasteWeight: Number(wasteWeight.toFixed(2)),
			wastePercentage: Number(wastePercentage.toFixed(1)),
			stocksNeeded: Array.from(stocksMap.values()),
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
