// ═══════════════════════════════════════════════════════════════════════════
// محرك حسابات العناصر الإنشائية الإضافية
// Other Structural Elements Calculation Engine
// ═══════════════════════════════════════════════════════════════════════════

import {
	STEEL_RATIOS,
	STEEL_WASTE_PERCENT,
	LEAN_CONCRETE_THICKNESS,
	BLOCK_DIMENSIONS,
	GRC_WEIGHT_PER_SQM,
	GRC_WEIGHT_PER_LM_CORNICE,
} from '../constants/other-structural';
import type {
	OtherStructuralInput,
	OtherStructuralResult,
	ComponentBreakdown,
	SepticTankInput,
	GroundWaterTankInput,
	ElevatedWaterTankInput,
	ElevatorPitInput,
	RetainingWallInput,
	BoundaryWallInput,
	RampInput,
	DomeInput,
	MinaretInput,
	ConcreteDecorInput,
	CustomElementInput,
} from '../types/other-structural';

// ─────────────────────────────────────────────────────────────────────────
// دوال مساعدة
// ─────────────────────────────────────────────────────────────────────────

/** حساب وزن الحديد من نسبة التسليح مع هدر */
function steelFromRatio(concreteVolume: number, ratio: number): number {
	return concreteVolume * ratio * (1 + STEEL_WASTE_PERCENT / 100);
}

/** تقريب لرقمين عشريين */
function r2(n: number): number {
	return Math.round(n * 100) / 100;
}

/** بناء النتيجة الموحدة */
function buildResult(
	elementType: OtherStructuralInput['elementType'],
	name: string,
	quantity: number,
	breakdown: ComponentBreakdown[],
	extras: {
		concreteVolumePlain?: number;
		waterproofingArea?: number;
		excavationVolume?: number;
		blockCount?: number;
		mortarVolume?: number;
	} = {},
): OtherStructuralResult {
	const concreteVolumeRC = r2(breakdown.reduce((s, b) => s + b.concreteVolume, 0));
	const steelWeight = r2(breakdown.reduce((s, b) => s + b.steelWeight, 0));
	const formworkArea = r2(breakdown.reduce((s, b) => s + b.formworkArea, 0));
	const grcWeight = r2(breakdown.reduce((s, b) => s + (b.grcWeight ?? 0), 0));
	const concreteVolumePlain = r2(extras.concreteVolumePlain ?? 0);

	return {
		elementType,
		name,
		quantity,
		concreteVolumeRC,
		concreteVolumePlain,
		steelWeight,
		formworkArea,
		waterproofingArea: r2(extras.waterproofingArea ?? 0),
		excavationVolume: r2(extras.excavationVolume ?? 0),
		blockCount: extras.blockCount ?? 0,
		mortarVolume: r2(extras.mortarVolume ?? 0),
		grcWeight,
		totalConcreteRC: r2(concreteVolumeRC * quantity),
		totalConcretePlain: r2(concreteVolumePlain * quantity),
		totalSteelWeight: r2(steelWeight * quantity),
		totalFormwork: r2(formworkArea * quantity),
		totalGrcWeight: r2(grcWeight * quantity),
		breakdown,
	};
}

// ─────────────────────────────────────────────────────────────────────────
// حساب هياكل صندوقية / أسطوانية مشتركة
// ─────────────────────────────────────────────────────────────────────────

interface BoxResult {
	base: { volume: number; steel: number; formwork: number };
	walls: { volume: number; steel: number; formwork: number };
	slab: { volume: number; steel: number; formwork: number };
	leanConcrete: number;
	excavation: number;
	waterproofInner: number;
	waterproofOuter: number;
}

function calculateBoxStructure(
	innerL: number,
	innerW: number,
	depth: number,
	wallThickM: number,
	baseThickM: number,
	slabThickM: number,
	steelRatios: { base: number; walls: number; slab: number },
): BoxResult {
	const outerL = innerL + 2 * wallThickM;
	const outerW = innerW + 2 * wallThickM;

	// صبة نظافة
	const leanConcrete = outerL * outerW * LEAN_CONCRETE_THICKNESS;

	// القاعدة
	const baseVol = outerL * outerW * baseThickM;
	const baseFormwork = 2 * (outerL + outerW) * baseThickM;

	// الجدران — حجم خارجي - حجم داخلي (لتجنب تداخل الزوايا)
	const wallOuterVol = outerL * outerW * depth;
	const wallInnerVol = innerL * innerW * depth;
	const wallVol = wallOuterVol - wallInnerVol;
	const wallFormworkOuter = 2 * (outerL + outerW) * depth;
	const wallFormworkInner = 2 * (innerL + innerW) * depth;
	const wallFormwork = wallFormworkOuter + wallFormworkInner;

	// السقف
	const slabVol = outerL * outerW * slabThickM;
	const slabFormwork = outerL * outerW; // وجه واحد

	// الحفر: أبعاد خارجية + 0.5م من كل جهة
	const excL = outerL + 1.0;
	const excW = outerW + 1.0;
	const excDepth = LEAN_CONCRETE_THICKNESS + baseThickM + depth;
	const excavation = excL * excW * excDepth;

	// العزل
	const waterproofInner = innerL * innerW + 2 * (innerL + innerW) * depth; // أرضية + جدران داخلية
	const waterproofOuter = wallFormworkOuter + outerL * outerW; // جدران خارجية + سقف

	return {
		base: {
			volume: baseVol,
			steel: steelFromRatio(baseVol, steelRatios.base),
			formwork: baseFormwork,
		},
		walls: {
			volume: wallVol,
			steel: steelFromRatio(wallVol, steelRatios.walls),
			formwork: wallFormwork,
		},
		slab: {
			volume: slabVol,
			steel: steelFromRatio(slabVol, steelRatios.slab),
			formwork: slabFormwork,
		},
		leanConcrete,
		excavation,
		waterproofInner,
		waterproofOuter,
	};
}

function calculateCylindricalStructure(
	innerDiameter: number,
	depth: number,
	wallThickM: number,
	baseThickM: number,
	slabThickM: number,
	steelRatios: { base: number; walls: number; slab: number },
): BoxResult {
	const R_inner = innerDiameter / 2;
	const R_outer = R_inner + wallThickM;
	const outerDiameter = innerDiameter + 2 * wallThickM;

	// صبة نظافة
	const leanConcrete = Math.PI * R_outer * R_outer * LEAN_CONCRETE_THICKNESS;

	// القاعدة
	const baseVol = Math.PI * R_outer * R_outer * baseThickM;
	const baseFormwork = Math.PI * outerDiameter * baseThickM;

	// الجدران
	const wallVol = Math.PI * (R_outer * R_outer - R_inner * R_inner) * depth;
	const wallFormworkOuter = Math.PI * outerDiameter * depth;
	const wallFormworkInner = Math.PI * innerDiameter * depth;
	const wallFormwork = wallFormworkOuter + wallFormworkInner;

	// السقف
	const slabVol = Math.PI * R_outer * R_outer * slabThickM;
	const slabFormwork = Math.PI * R_outer * R_outer;

	// الحفر
	const excR = R_outer + 0.5;
	const excDepth = LEAN_CONCRETE_THICKNESS + baseThickM + depth;
	const excavation = Math.PI * excR * excR * excDepth;

	// العزل
	const waterproofInner = Math.PI * R_inner * R_inner + Math.PI * innerDiameter * depth;
	const waterproofOuter = wallFormworkOuter + Math.PI * R_outer * R_outer;

	return {
		base: {
			volume: baseVol,
			steel: steelFromRatio(baseVol, steelRatios.base),
			formwork: baseFormwork,
		},
		walls: {
			volume: wallVol,
			steel: steelFromRatio(wallVol, steelRatios.walls),
			formwork: wallFormwork,
		},
		slab: {
			volume: slabVol,
			steel: steelFromRatio(slabVol, steelRatios.slab),
			formwork: slabFormwork,
		},
		leanConcrete,
		excavation,
		waterproofInner,
		waterproofOuter,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// الدالة الرئيسية — Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

export function calculateOtherStructural(input: OtherStructuralInput): OtherStructuralResult {
	switch (input.elementType) {
		case 'SEPTIC_TANK':
			return calculateSepticTank(input);
		case 'WATER_TANK_GROUND':
			return calculateGroundWaterTank(input);
		case 'WATER_TANK_ELEVATED':
			return calculateElevatedWaterTank(input);
		case 'ELEVATOR_PIT':
			return calculateElevatorPit(input);
		case 'RETAINING_WALL':
			return calculateRetainingWall(input);
		case 'BOUNDARY_WALL':
			return calculateBoundaryWall(input);
		case 'RAMP':
			return calculateRamp(input);
		case 'DOME':
			return calculateDome(input);
		case 'MINARET':
			return calculateMinaret(input);
		case 'CONCRETE_DECOR':
			return calculateConcreteDecor(input);
		case 'CUSTOM_ELEMENT':
			return calculateCustomElement(input);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. البيارة
// ═══════════════════════════════════════════════════════════════════════════

function calculateSepticTank(input: SepticTankInput): OtherStructuralResult {
	const wallThickM = input.wallThickness / 100;
	const baseThickM = input.baseThickness / 100;
	const slabThickM = (input.slabThickness ?? 0) / 100;
	// البيارة المفتوحة بلا سقف علوي (لا خرسانة ولا شدات ولا عزل للسقف)
	const hasTopSlab = input.tankType !== 'OPEN';

	const ratios = { base: STEEL_RATIOS.TANK_BASE, walls: STEEL_RATIOS.TANK_WALLS, slab: STEEL_RATIOS.TANK_SLAB };

	if (input.wallType === 'RC') {
		const box = calculateBoxStructure(
			input.length, input.width, input.depth,
			wallThickM, baseThickM, slabThickM, ratios,
		);
		const outerL = input.length + 2 * wallThickM;
		const outerW = input.width + 2 * wallThickM;

		const breakdown: ComponentBreakdown[] = [
			{ component: 'القاعدة', componentEn: 'Base Slab', concreteVolume: r2(box.base.volume), steelWeight: r2(box.base.steel), formworkArea: r2(box.base.formwork) },
			{ component: 'الجدران', componentEn: 'Walls', concreteVolume: r2(box.walls.volume), steelWeight: r2(box.walls.steel), formworkArea: r2(box.walls.formwork) },
		];
		if (hasTopSlab) {
			breakdown.push({ component: 'السقف', componentEn: 'Top Slab', concreteVolume: r2(box.slab.volume), steelWeight: r2(box.slab.steel), formworkArea: r2(box.slab.formwork) });
		}

		// حاجز وسطي لبيارة ذات غرفتين
		if (input.tankType === 'TWO_CHAMBER') {
			const dividerVol = input.width * input.depth * wallThickM;
			const dividerSteel = steelFromRatio(dividerVol, STEEL_RATIOS.TANK_DIVIDER);
			const dividerFormwork = 2 * input.width * input.depth;
			breakdown.push({
				component: 'حاجز وسطي', componentEn: 'Divider Wall',
				concreteVolume: r2(dividerVol), steelWeight: r2(dividerSteel), formworkArea: r2(dividerFormwork),
			});
		}

		return buildResult(input.elementType, input.name, input.quantity, breakdown, {
			concreteVolumePlain: box.leanConcrete,
			// بيارة مفتوحة: لا عزل لسطح السقف (غير موجود)
			waterproofingArea: box.waterproofInner + box.waterproofOuter - (hasTopSlab ? 0 : outerL * outerW),
			excavationVolume: box.excavation,
		});
	}

	// جدران بلوك
	const blockType = input.wallType === 'BLOCK_20' ? 'BLOCK_20' : 'BLOCK_15';
	const blockDim = BLOCK_DIMENSIONS[blockType];
	const wallArea = 2 * (input.length + input.width) * input.depth;
	const blockCount = Math.ceil(wallArea / (blockDim.length * blockDim.height));
	const mortarVolume = blockCount * blockDim.mortarPerBlock;

	// القاعدة والسقف لا تزال RC
	const outerL = input.length + 2 * wallThickM;
	const outerW = input.width + 2 * wallThickM;

	const baseVol = outerL * outerW * baseThickM;
	const slabVol = outerL * outerW * slabThickM;
	const leanConcrete = outerL * outerW * LEAN_CONCRETE_THICKNESS;

	const breakdown: ComponentBreakdown[] = [
		{ component: 'القاعدة', componentEn: 'Base Slab', concreteVolume: r2(baseVol), steelWeight: r2(steelFromRatio(baseVol, ratios.base)), formworkArea: r2(2 * (outerL + outerW) * baseThickM) },
		{ component: 'الجدران (بلوك)', componentEn: 'Walls (Block)', concreteVolume: 0, steelWeight: 0, formworkArea: 0 },
	];
	if (hasTopSlab) {
		breakdown.push({ component: 'السقف', componentEn: 'Top Slab', concreteVolume: r2(slabVol), steelWeight: r2(steelFromRatio(slabVol, ratios.slab)), formworkArea: r2(outerL * outerW) });
	}

	const excL = outerL + 1.0;
	const excW = outerW + 1.0;
	const excDepth = LEAN_CONCRETE_THICKNESS + baseThickM + input.depth;

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
		// بيارة مفتوحة: لا عزل لسطح السقف (غير موجود)
		waterproofingArea: wallArea + input.length * input.width + 2 * (outerL + outerW) * input.depth + (hasTopSlab ? outerL * outerW : 0),
		excavationVolume: excL * excW * excDepth,
		blockCount,
		mortarVolume,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. خزان مياه أرضي
// ═══════════════════════════════════════════════════════════════════════════

function calculateGroundWaterTank(input: GroundWaterTankInput): OtherStructuralResult {
	const wallThickM = input.wallThickness / 100;
	const baseThickM = input.baseThickness / 100;
	const slabThickM = input.slabThickness / 100;

	const ratios = { base: STEEL_RATIOS.TANK_BASE, walls: STEEL_RATIOS.TANK_WALLS, slab: STEEL_RATIOS.TANK_SLAB };

	let box: BoxResult;
	if (input.shape === 'CYLINDRICAL' && input.diameter) {
		box = calculateCylindricalStructure(input.diameter, input.depth, wallThickM, baseThickM, slabThickM, ratios);
	} else {
		const L = input.length ?? 3;
		const W = input.width ?? 2;
		box = calculateBoxStructure(L, W, input.depth, wallThickM, baseThickM, slabThickM, ratios);
	}

	const breakdown: ComponentBreakdown[] = [
		{ component: 'القاعدة', componentEn: 'Base Slab', concreteVolume: r2(box.base.volume), steelWeight: r2(box.base.steel), formworkArea: r2(box.base.formwork) },
		{ component: 'الجدران', componentEn: 'Walls', concreteVolume: r2(box.walls.volume), steelWeight: r2(box.walls.steel), formworkArea: r2(box.walls.formwork) },
		{ component: 'السقف', componentEn: 'Top Slab', concreteVolume: r2(box.slab.volume), steelWeight: r2(box.slab.steel), formworkArea: r2(box.slab.formwork) },
	];

	// حاجز وسطي
	if (input.isDivided) {
		let dividerVol: number;
		let dividerFormwork: number;
		if (input.shape === 'CYLINDRICAL' && input.diameter) {
			dividerVol = input.diameter * input.depth * wallThickM;
			dividerFormwork = 2 * input.diameter * input.depth;
		} else {
			const W = input.width ?? 2;
			dividerVol = W * input.depth * wallThickM;
			dividerFormwork = 2 * W * input.depth;
		}
		breakdown.push({
			component: 'حاجز وسطي', componentEn: 'Divider Wall',
			concreteVolume: r2(dividerVol), steelWeight: r2(steelFromRatio(dividerVol, STEEL_RATIOS.TANK_DIVIDER)),
			formworkArea: r2(dividerFormwork),
		});
	}

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: box.leanConcrete,
		waterproofingArea: box.waterproofInner + box.waterproofOuter,
		excavationVolume: box.excavation,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. خزان مياه علوي
// ═══════════════════════════════════════════════════════════════════════════

function calculateElevatedWaterTank(input: ElevatedWaterTankInput): OtherStructuralResult {
	const wallThickM = input.wallThickness / 100;
	const baseThickM = input.baseThickness / 100;
	const slabThickM = input.slabThickness / 100;

	const ratios = { base: STEEL_RATIOS.TANK_BASE, walls: STEEL_RATIOS.TANK_WALLS, slab: STEEL_RATIOS.TANK_SLAB };

	let box: BoxResult;
	if (input.shape === 'CYLINDRICAL' && input.diameter) {
		box = calculateCylindricalStructure(input.diameter, input.depth, wallThickM, baseThickM, slabThickM, ratios);
	} else {
		const L = input.length ?? 2;
		const W = input.width ?? 2;
		box = calculateBoxStructure(L, W, input.depth, wallThickM, baseThickM, slabThickM, ratios);
	}

	const breakdown: ComponentBreakdown[] = [
		{ component: 'القاعدة', componentEn: 'Base Slab', concreteVolume: r2(box.base.volume), steelWeight: r2(box.base.steel), formworkArea: r2(box.base.formwork) },
		{ component: 'الجدران', componentEn: 'Walls', concreteVolume: r2(box.walls.volume), steelWeight: r2(box.walls.steel), formworkArea: r2(box.walls.formwork) },
		{ component: 'السقف', componentEn: 'Top Slab', concreteVolume: r2(box.slab.volume), steelWeight: r2(box.slab.steel), formworkArea: r2(box.slab.formwork) },
	];

	// خزان علوي: لا حفر ولا صبة نظافة ولكن عزل داخلي فقط
	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: 0,
		waterproofingArea: box.waterproofInner,
		excavationVolume: 0,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. بئر المصعد
// ═══════════════════════════════════════════════════════════════════════════

function calculateElevatorPit(input: ElevatorPitInput): OtherStructuralResult {
	const wallThickM = input.wallThickness / 100;
	const pitSlabM = input.pitSlabThickness / 100;
	const breakdown: ComponentBreakdown[] = [];

	const outerW = input.pitWidth + 2 * wallThickM;
	const outerL = input.pitLength + 2 * wallThickM;

	// 1. بلاطة الحفرة (أسفل البئر)
	const pitSlabVol = outerW * outerL * pitSlabM;
	const pitSlabSteel = steelFromRatio(pitSlabVol, STEEL_RATIOS.ELEVATOR_PIT_SLAB);
	const pitSlabFormwork = outerW * outerL;
	breakdown.push({
		component: 'بلاطة الحفرة', componentEn: 'Pit Slab',
		concreteVolume: r2(pitSlabVol), steelWeight: r2(pitSlabSteel), formworkArea: r2(pitSlabFormwork),
	});

	// 2. جدران البئر — من أسفل الحفرة حتى آخر وقفة + overTravel
	const shaftHeight = input.pitHoleDepth + (input.numberOfStops - 1) * input.floorHeight + input.overTravel;
	const wallPerimeter = 2 * (outerW + outerL);
	const wallInnerPerimeter = 2 * (input.pitWidth + input.pitLength);
	const wallVol = (wallPerimeter * wallThickM - 4 * wallThickM * wallThickM) * shaftHeight;
	// تقدير أدق: استخدام الفرق بين الخارجي والداخلي
	const wallVolExact = (outerW * outerL - input.pitWidth * input.pitLength) * shaftHeight;
	const wallSteel = steelFromRatio(wallVolExact, STEEL_RATIOS.ELEVATOR_WALLS);
	const wallFormwork = (wallPerimeter + wallInnerPerimeter) * shaftHeight;
	breakdown.push({
		component: 'جدران البئر', componentEn: 'Shaft Walls',
		concreteVolume: r2(wallVolExact), steelWeight: r2(wallSteel), formworkArea: r2(wallFormwork),
	});

	// 3. غرفة الماكينة (اختياري)
	if (input.hasMachineRoom && input.machineRoomHeight) {
		const machineSlabVol = outerW * outerL * 0.20; // سمك افتراضي 20سم
		const machineSteel = steelFromRatio(machineSlabVol, STEEL_RATIOS.ELEVATOR_MACHINE_SLAB);
		const machineFormwork = outerW * outerL;
		breakdown.push({
			component: 'سقف غرفة الماكينة', componentEn: 'Machine Room Slab',
			concreteVolume: r2(machineSlabVol), steelWeight: r2(machineSteel), formworkArea: r2(machineFormwork),
		});
	}

	// صبة نظافة
	const leanConcrete = outerW * outerL * LEAN_CONCRETE_THICKNESS;

	// الحفر: حفرة البئر فقط
	const excW = outerW + 1.0;
	const excL = outerL + 1.0;
	const excDepth = LEAN_CONCRETE_THICKNESS + pitSlabM + input.pitHoleDepth;
	const excavation = excW * excL * excDepth;

	// العزل: حفرة المصعد فقط (أسفل مستوى الأرض)
	const waterproofing = input.pitWidth * input.pitLength + wallInnerPerimeter * input.pitHoleDepth;

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
		waterproofingArea: waterproofing,
		excavationVolume: excavation,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. جدار استنادي
// ═══════════════════════════════════════════════════════════════════════════

function calculateRetainingWall(input: RetainingWallInput): OtherStructuralResult {
	const stemThickM = input.stemThickness / 100;
	const baseThickM = input.baseThickness / 100;
	const baseWidth = input.baseWidth > 0 ? input.baseWidth : input.height * 0.6;

	// ارتفاع الجذع = الارتفاع الكلي - سمك القاعدة
	const stemHeight = input.height - baseThickM;

	const breakdown: ComponentBreakdown[] = [];

	// 1. القاعدة
	const baseVol = baseWidth * baseThickM * input.length;
	const baseFormwork = 2 * (baseWidth + input.length) * baseThickM;
	breakdown.push({
		component: 'القاعدة', componentEn: 'Base Footing',
		concreteVolume: r2(baseVol), steelWeight: r2(steelFromRatio(baseVol, STEEL_RATIOS.RETAINING_BASE)),
		formworkArea: r2(baseFormwork),
	});

	// 2. الجذع
	const stemVol = stemThickM * stemHeight * input.length;
	const stemFormwork = 2 * stemHeight * input.length; // وجهين
	breakdown.push({
		component: 'الجذع', componentEn: 'Stem Wall',
		concreteVolume: r2(stemVol), steelWeight: r2(steelFromRatio(stemVol, STEEL_RATIOS.RETAINING_STEM)),
		formworkArea: r2(stemFormwork),
	});

	// 3. أضلاع مقاومة (Counterfort)
	if (input.wallType === 'COUNTERFORT') {
		const spacing = 3.0; // كل 3 أمتار
		const count = Math.floor(input.length / spacing) + 1;
		const cfHeight = stemHeight;
		const cfWidth = baseWidth * 0.8; // 80% من عرض القاعدة
		const cfThick = 0.25; // 25 سم
		// المقطع الرأسي للضلع مثلثي (وليس منشوراً كاملاً) → القسمة على 2
		const cfVol = count * (cfHeight * cfWidth / 2) * cfThick;
		const cfFormwork = count * 2 * (cfHeight * cfWidth / 2);
		breakdown.push({
			component: 'أضلاع مقاومة', componentEn: 'Counterforts',
			concreteVolume: r2(cfVol), steelWeight: r2(steelFromRatio(cfVol, STEEL_RATIOS.RETAINING_COUNTERFORT)),
			formworkArea: r2(cfFormwork),
		});
	}

	// صبة نظافة
	const leanConcrete = baseWidth * input.length * LEAN_CONCRETE_THICKNESS;

	// الحفر — بعمق التأسيس فقط (وليس الارتفاع الكلي للجدار الظاهر فوق الأرض)
	const embedmentDepth = input.embedmentDepth && input.embedmentDepth > 0
		? input.embedmentDepth
		: LEAN_CONCRETE_THICKNESS + baseThickM + 0.3;
	const excWidth = baseWidth + 1.0;
	const excLength = input.length + 1.0;
	const excavation = excWidth * excLength * embedmentDepth;

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
		excavationVolume: excavation,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. سور خارجي
// ═══════════════════════════════════════════════════════════════════════════

function calculateBoundaryWall(input: BoundaryWallInput): OtherStructuralResult {
	const thickM = input.thickness / 100;
	const foundW = (input.foundationWidth ?? 0) / 100;
	const foundD = (input.foundationDepth ?? 0) / 100;
	const breakdown: ComponentBreakdown[] = [];

	let blockCount = 0;
	let mortarVolume = 0;

	// 1. القاعدة الشريطية
	if (input.hasFoundation) {
		const foundVol = foundW * foundD * input.length;
		const foundFormwork = 2 * input.length * foundD;
		breakdown.push({
			component: 'قاعدة شريطية', componentEn: 'Strip Foundation',
			concreteVolume: r2(foundVol), steelWeight: r2(steelFromRatio(foundVol, STEEL_RATIOS.BOUNDARY_FOUNDATION)),
			formworkArea: r2(foundFormwork),
		});
	}

	// 2. الأعمدة الخرسانية
	if (input.hasRCColumns) {
		const colCount = Math.floor(input.length / input.columnSpacing) + 1;
		const colSize = 0.20; // 20×20 سم
		const colHeight = input.height;
		const colVol = colCount * colSize * colSize * colHeight;
		const colFormwork = colCount * 4 * colSize * colHeight;
		breakdown.push({
			component: `أعمدة (${colCount} عمود)`, componentEn: `Columns (${colCount})`,
			concreteVolume: r2(colVol), steelWeight: r2(steelFromRatio(colVol, STEEL_RATIOS.BOUNDARY_COLUMN)),
			formworkArea: r2(colFormwork),
		});
	}

	// 3. كمرة ربط علوية
	if (input.hasRCColumns) {
		const beamWidth = thickM;
		const beamDepth = 0.20;
		const beamVol = beamWidth * beamDepth * input.length;
		const beamFormwork = (2 * beamDepth + beamWidth) * input.length;
		breakdown.push({
			component: 'كمرة ربط', componentEn: 'Tie Beam',
			concreteVolume: r2(beamVol), steelWeight: r2(steelFromRatio(beamVol, STEEL_RATIOS.BOUNDARY_BEAM)),
			formworkArea: r2(beamFormwork),
		});
	}

	// 4. جدران بلوك أو RC
	if (input.wallType === 'BLOCK_WALL') {
		// خصم مساحة الأعمدة
		const colCount = input.hasRCColumns ? Math.floor(input.length / input.columnSpacing) + 1 : 0;
		const colArea = colCount * 0.20 * input.height;
		const wallArea = input.length * input.height - colArea;
		const blockDim = BLOCK_DIMENSIONS.BLOCK_20;
		blockCount = Math.ceil(wallArea / (blockDim.length * blockDim.height));
		mortarVolume = blockCount * blockDim.mortarPerBlock;
		breakdown.push({
			component: 'جدران بلوك', componentEn: 'Block Walls',
			concreteVolume: 0, steelWeight: 0, formworkArea: 0,
		});
	} else if (input.wallType === 'RC_WALL') {
		const wallVol = input.length * input.height * thickM;
		const wallFormwork = 2 * input.length * input.height;
		breakdown.push({
			component: 'جدران خرسانية', componentEn: 'RC Walls',
			concreteVolume: r2(wallVol), steelWeight: r2(steelFromRatio(wallVol, STEEL_RATIOS.RETAINING_STEM)),
			formworkArea: r2(wallFormwork),
		});
	} else if (input.wallType === 'PRECAST') {
		// ألواح مسبقة الصب: خرسانة وحديد بنفس نسبة الجدار الخرساني، بلا شدات
		const panelVol = input.length * input.height * thickM;
		breakdown.push({
			component: 'ألواح مسبقة الصب', componentEn: 'Precast Panels',
			concreteVolume: r2(panelVol), steelWeight: r2(steelFromRatio(panelVol, STEEL_RATIOS.RETAINING_STEM)),
			formworkArea: 0,
		});
	}

	// صبة نظافة
	const leanConcrete = input.hasFoundation ? foundW * input.length * LEAN_CONCRETE_THICKNESS : 0;

	// الحفر
	const excavation = input.hasFoundation ? (foundW + 0.5) * (input.length + 0.5) * (foundD + LEAN_CONCRETE_THICKNESS) : 0;

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
		excavationVolume: excavation,
		blockCount,
		mortarVolume,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. رامب
// ═══════════════════════════════════════════════════════════════════════════

function calculateRamp(input: RampInput): OtherStructuralResult {
	const thickM = input.thickness / 100;
	const wallHM = (input.wallHeight ?? 0) / 100;
	const wallThickM = (input.wallThickness ?? 0) / 100;
	const breakdown: ComponentBreakdown[] = [];

	// 1. بلاطة الرامب
	const slabVol = input.length * input.width * thickM;
	const slabFormwork = input.length * input.width; // وجه واحد سفلي
	breakdown.push({
		component: 'بلاطة الرامب', componentEn: 'Ramp Slab',
		concreteVolume: r2(slabVol), steelWeight: r2(steelFromRatio(slabVol, STEEL_RATIOS.RAMP_SLAB)),
		formworkArea: r2(slabFormwork),
	});

	// 2. جدران جانبية
	if (input.hasWalls) {
		const wallVol = 2 * input.length * wallHM * wallThickM;
		const wallFormwork = 2 * 2 * input.length * wallHM; // وجهين × جدارين
		breakdown.push({
			component: 'جدران جانبية', componentEn: 'Side Walls',
			concreteVolume: r2(wallVol), steelWeight: r2(steelFromRatio(wallVol, STEEL_RATIOS.RAMP_WALLS)),
			formworkArea: r2(wallFormwork),
		});
	}

	return buildResult(input.elementType, input.name, input.quantity, breakdown);
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. القبة
// ═══════════════════════════════════════════════════════════════════════════

function calculateDome(input: DomeInput): OtherStructuralResult {
	const R = input.diameter / 2;
	const avgThickM = (input.shellThicknessTop + input.shellThicknessBottom) / 2 / 100;
	const breakdown: ComponentBreakdown[] = [];

	// 1. بلاطة القبة القشرية — قطاع كروي (Spherical Cap)
	// a = نصف قطر القاعدة، h = ارتفاع القبة (الافتراضي = a أي نصف كرة)
	// نصف قطر الكرة الأم Rs = (a² + h²) / 2h ← مساحة القطاع = 2π·Rs·h
	// (الصيغة القديمة 2πR² كانت تفترض نصف كرة دائماً وتضخّم القباب الضحلة:
	// D=8م، h=2م → 62.83م² وليس 100.53م² — تضخيم 60%)
	const a = R;
	const h = input.riseHeight > 0 ? input.riseHeight : a;
	const Rs = (a * a + h * h) / (2 * h);
	const shellSurfaceArea = 2 * Math.PI * Rs * h;

	if (input.domeType === 'GRC_PRECAST') {
		// قشرة GRC مسبقة الصنع — لا خرسانة ولا حديد ولا شدات للقشرة
		breakdown.push({
			component: 'قشرة القبة (GRC)', componentEn: 'Dome Shell (GRC)',
			concreteVolume: 0, steelWeight: 0, formworkArea: 0,
			grcWeight: r2(shellSurfaceArea * GRC_WEIGHT_PER_SQM),
		});
	} else {
		const shellVol = shellSurfaceArea * avgThickM;
		breakdown.push({
			component: 'بلاطة القبة', componentEn: 'Dome Shell',
			concreteVolume: r2(shellVol), steelWeight: r2(steelFromRatio(shellVol, STEEL_RATIOS.DOME_SHELL)),
			formworkArea: r2(2 * shellSurfaceArea), // وجه داخلي + خارجي
		});
	}

	// 2. الكمرة الدائرية
	if (input.hasRingBeam) {
		const ringW = (input.ringBeamWidth ?? 0) / 100;
		const ringD = (input.ringBeamDepth ?? 0) / 100;
		const ringLength = Math.PI * input.diameter;
		const ringVol = ringW * ringD * ringLength;
		const ringFormwork = (2 * ringD + ringW) * ringLength;
		breakdown.push({
			component: 'كمرة دائرية', componentEn: 'Ring Beam',
			concreteVolume: r2(ringVol), steelWeight: r2(steelFromRatio(ringVol, STEEL_RATIOS.DOME_RING_BEAM)),
			formworkArea: r2(ringFormwork),
		});
	}

	// 3. الرقبة (Drum)
	if (input.hasDrum && input.drumHeight && input.drumThickness) {
		const drumThickM = input.drumThickness / 100;
		const drumR_outer = R;
		const drumR_inner = R - drumThickM;
		const drumVol = Math.PI * (drumR_outer * drumR_outer - drumR_inner * drumR_inner) * input.drumHeight;
		const drumFormwork = Math.PI * (2 * drumR_outer + 2 * drumR_inner) * input.drumHeight;
		breakdown.push({
			component: 'الرقبة', componentEn: 'Drum',
			concreteVolume: r2(drumVol), steelWeight: r2(steelFromRatio(drumVol, STEEL_RATIOS.DOME_DRUM)),
			formworkArea: r2(drumFormwork),
		});
	}

	// 4. أعمدة الحمل (شمعات)
	if (input.hasSupportColumns && input.supportColumnCount && input.supportColumnHeight && input.supportColumnSize) {
		const colSizeM = input.supportColumnSize / 100;
		const colVol = input.supportColumnCount * colSizeM * colSizeM * input.supportColumnHeight;
		const colFormwork = input.supportColumnCount * 4 * colSizeM * input.supportColumnHeight;
		breakdown.push({
			component: `أعمدة (${input.supportColumnCount})`, componentEn: `Columns (${input.supportColumnCount})`,
			concreteVolume: r2(colVol), steelWeight: r2(steelFromRatio(colVol, STEEL_RATIOS.DOME_COLUMN)),
			formworkArea: r2(colFormwork),
		});
	}

	return buildResult(input.elementType, input.name, input.quantity, breakdown);
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. المأذنة
// ═══════════════════════════════════════════════════════════════════════════

function calculateMinaret(input: MinaretInput): OtherStructuralResult {
	const wallThickM = input.wallThickness / 100;
	const breakdown: ComponentBreakdown[] = [];

	let shaftOuterPerimeter: number;
	let shaftInnerPerimeter: number;
	let shaftOuterArea: number;
	let shaftInnerArea: number;
	let shaftOuterRadius: number; // نصف القطر الخارجي المكافئ (لقمة المأذنة)
	let baseDim: number; // البعد الخارجي المرجعي (لقاعدة المأذنة)

	if (input.shape === 'CYLINDRICAL') {
		const outerD = input.outerDiameter ?? 2.0;
		const R_outer = outerD / 2;
		const R_inner = R_outer - wallThickM;
		shaftOuterPerimeter = Math.PI * outerD;
		shaftInnerPerimeter = Math.PI * 2 * R_inner;
		shaftOuterArea = Math.PI * R_outer * R_outer;
		shaftInnerArea = Math.PI * R_inner * R_inner;
		shaftOuterRadius = R_outer;
		baseDim = outerD;
	} else if (input.shape === 'SQUARE') {
		const side = input.sideLength ?? input.outerDiameter ?? 2.0;
		const innerSide = side - 2 * wallThickM;
		shaftOuterPerimeter = 4 * side;
		shaftInnerPerimeter = 4 * innerSide;
		shaftOuterArea = side * side;
		shaftInnerArea = innerSide * innerSide;
		shaftOuterRadius = side / 2;
		baseDim = side;
	} else {
		// مثمن
		const outerD = input.outerDiameter ?? input.sideLength ?? 2.0;
		const outerSide = outerD * 0.383;
		const innerD = outerD - 2 * wallThickM;
		const innerSide = innerD * 0.383;
		shaftOuterPerimeter = 8 * outerSide;
		shaftInnerPerimeter = 8 * innerSide;
		shaftOuterArea = 2 * (1 + Math.SQRT2) * outerSide * outerSide;
		shaftInnerArea = 2 * (1 + Math.SQRT2) * innerSide * innerSide;
		shaftOuterRadius = outerD / 2;
		baseDim = outerD;
	}

	// 1. الجذع
	const shaftVol = (shaftOuterArea - shaftInnerArea) * input.totalHeight;
	const shaftFormwork = (shaftOuterPerimeter + shaftInnerPerimeter) * input.totalHeight;
	breakdown.push({
		component: 'الجذع', componentEn: 'Shaft',
		concreteVolume: r2(shaftVol), steelWeight: r2(steelFromRatio(shaftVol, STEEL_RATIOS.MINARET_SHAFT)),
		formworkArea: r2(shaftFormwork),
	});

	// 2. الشرفات
	if (input.hasBalcony && input.balconyCount > 0) {
		const balconyProj = (input.balconyProjection ?? 0) / 100;
		const balconyThick = 0.15; // 15 سم
		// بروز دائري/مربع حول الجذع
		const balconyOuterPerimeter = shaftOuterPerimeter + 2 * Math.PI * balconyProj;
		// مساحة الحلقة = متوسط المحيطين × البروز = P×p + πp²
		// (الصيغة القديمة P_outer×p/2 كانت تنقص ~35%: جذع D=2م ببروز 0.8م
		// تعطي 4.52م² بينما الدقيقة π(1.8²−1²)=7.04م²)
		const balconyArea =
			((shaftOuterPerimeter + balconyOuterPerimeter) / 2) * balconyProj;
		const balconyVol = input.balconyCount * balconyArea * balconyThick;
		const balconyFormwork = input.balconyCount * (balconyArea + balconyOuterPerimeter * balconyThick);
		breakdown.push({
			component: `شرفات (${input.balconyCount})`, componentEn: `Balconies (${input.balconyCount})`,
			concreteVolume: r2(balconyVol), steelWeight: r2(steelFromRatio(balconyVol, STEEL_RATIOS.MINARET_BALCONY)),
			formworkArea: r2(balconyFormwork),
		});
	}

	// 3. القمة (حسب نوعها) — نصف القطر = نصف القطر الخارجي للجذع
	const capThickM = 0.10; // سمك القشرة 10 سم
	const capR = shaftOuterRadius;
	if (input.topType === 'CONE') {
		// مخروط: الارتفاع الافتراضي = 1.5×نصف القطر، المساحة الجانبية = π·r·slant
		const capHeight = 1.5 * capR;
		const slant = Math.sqrt(capR * capR + capHeight * capHeight);
		const coneArea = Math.PI * capR * slant;
		const coneVol = coneArea * capThickM;
		breakdown.push({
			component: 'القمة المخروطية', componentEn: 'Cone Cap',
			concreteVolume: r2(coneVol), steelWeight: r2(steelFromRatio(coneVol, STEEL_RATIOS.DOME_SHELL)),
			formworkArea: r2(2 * coneArea), // وجه داخلي + خارجي
		});
	} else if (input.topType === 'DOME_SMALL') {
		// قبة صغيرة: نصف كرة 2πr²
		const smallDomeArea = 2 * Math.PI * capR * capR;
		const smallDomeVol = smallDomeArea * capThickM;
		breakdown.push({
			component: 'قبة صغيرة', componentEn: 'Small Dome Cap',
			concreteVolume: r2(smallDomeVol), steelWeight: r2(steelFromRatio(smallDomeVol, STEEL_RATIOS.DOME_SHELL)),
			formworkArea: r2(2 * smallDomeArea),
		});
	} else {
		// قمة GRC مسبقة الصنع — وزن فقط بلا خرسانة أو شدات
		const capHeight = 1.5 * capR;
		const slant = Math.sqrt(capR * capR + capHeight * capHeight);
		const coneArea = Math.PI * capR * slant;
		breakdown.push({
			component: 'القمة (GRC)', componentEn: 'Top Cap (GRC)',
			concreteVolume: 0, steelWeight: 0, formworkArea: 0,
			grcWeight: r2(coneArea * GRC_WEIGHT_PER_SQM),
		});
	}

	// 4. قاعدة المأذنة (RC Footing): البعد الخارجي + 1.0م من كل جهة، سماكة 0.8م
	const footSide = baseDim + 2.0;
	const footThick = 0.8;
	const footVol = footSide * footSide * footThick;
	breakdown.push({
		component: 'القاعدة', componentEn: 'Foundation',
		concreteVolume: r2(footVol), steelWeight: r2(steelFromRatio(footVol, STEEL_RATIOS.MINARET_FOUNDATION)),
		formworkArea: r2(4 * footSide * footThick),
	});

	// صبة نظافة تحت القاعدة
	const leanConcrete = footSide * footSide * LEAN_CONCRETE_THICKNESS;

	// الحفر: 0.5م مساحة عمل من كل جهة + 0.3م عمق عمل
	const excSide = footSide + 1.0;
	const excavation = excSide * excSide * (footThick + 0.3);

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
		excavationVolume: excavation,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. كرانيش وديكورات
// ═══════════════════════════════════════════════════════════════════════════

function calculateConcreteDecor(input: ConcreteDecorInput): OtherStructuralResult {
	const breakdown: ComponentBreakdown[] = [];
	let totalWeight = 0;

	for (const item of input.items) {
		let weight = 0;
		let area = 0;

		// ثوابت الوزن (GRC_WEIGHT_*) تخص عناصر GRC/GRP فقط —
		// عناصر RC/STONE تُسجَّل كبند كمية/مساحة واضح بلا وزن مُختلق
		const isGrcLike = item.material === 'GRC' || item.material === 'GRP';

		if (item.unit === 'LINEAR_METER' && item.length) {
			if (isGrcLike) weight = item.length * item.quantity * GRC_WEIGHT_PER_LM_CORNICE;
			area = item.length * (item.height ?? 30) / 100 * item.quantity;
		} else if (item.unit === 'SQM' && item.area) {
			if (isGrcLike) weight = item.area * item.quantity * GRC_WEIGHT_PER_SQM;
			area = item.area * item.quantity;
		} else if (item.unit === 'PIECE') {
			const pieceArea = ((item.height ?? 30) / 100) * ((item.width ?? 30) / 100);
			if (isGrcLike) weight = pieceArea * item.quantity * GRC_WEIGHT_PER_SQM;
			area = pieceArea * item.quantity;
		}

		totalWeight += weight;
		breakdown.push({
			component: item.description ?? item.type,
			componentEn: item.type,
			concreteVolume: 0,
			steelWeight: 0,
			grcWeight: r2(weight), // كجم — وزن GRC منفصل عن حديد التسليح
			formworkArea: r2(area),
		});
	}

	// GRC/GRP لا تُحسب كخرسانة تقليدية — الوزن يُسجل فقط
	return buildResult(input.elementType, input.name, input.quantity, breakdown);
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. عنصر مخصص
// ═══════════════════════════════════════════════════════════════════════════

function calculateCustomElement(input: CustomElementInput): OtherStructuralResult {
	const breakdown: ComponentBreakdown[] = [{
		component: input.name,
		componentEn: input.name,
		concreteVolume: input.concreteVolumeRC ?? 0,
		steelWeight: input.steelWeight ?? 0,
		formworkArea: input.formworkArea ?? 0,
	}];

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: input.concreteVolumePlain ?? 0,
		waterproofingArea: input.waterproofingArea ?? 0,
		excavationVolume: input.excavationVolume ?? 0,
		blockCount: input.blockCount ?? 0,
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// التحقق من اكتمال المدخلات — الأبعاد الصفرية/الفارغة لا تُحسب بصمت
// ═══════════════════════════════════════════════════════════════════════════

// حدود منطقية متسقة مع validateStructuralBounds على الخادم
const THICKNESS_MIN_CM = 5;
const THICKNESS_MAX_CM = 200;
const DIM_MIN_M = 0.1;
const DIM_MAX_M = 200;
const HEIGHT_MAX_M = 100;
const DEPTH_MAX_M = 50;

function isBetween(v: number | undefined, min: number, max: number): boolean {
	return v !== undefined && Number.isFinite(v) && v >= min && v <= max;
}

/**
 * يرجع قائمة أسماء الحقول الناقصة/غير الصالحة لعنصر إنشائي إضافي.
 * قائمة فارغة = المدخلات مكتملة ويمكن الحساب والحفظ.
 */
export function getOtherStructuralInputErrors(input: OtherStructuralInput): string[] {
	const errors: string[] = [];
	const need = (ok: boolean, field: string) => { if (!ok) errors.push(field); };
	const dim = (v: number | undefined, field: string, max: number = DIM_MAX_M) =>
		need(isBetween(v, DIM_MIN_M, max), field);
	const thick = (v: number | undefined, field: string) =>
		need(isBetween(v, THICKNESS_MIN_CM, THICKNESS_MAX_CM), field);

	need((input.quantity ?? 0) >= 1, 'quantity');

	switch (input.elementType) {
		case 'SEPTIC_TANK':
			dim(input.length, 'length');
			dim(input.width, 'width');
			dim(input.depth, 'depth', DEPTH_MAX_M);
			thick(input.wallThickness, 'wallThickness');
			thick(input.baseThickness, 'baseThickness');
			if (input.tankType !== 'OPEN') thick(input.slabThickness, 'slabThickness');
			break;
		case 'WATER_TANK_GROUND':
		case 'WATER_TANK_ELEVATED':
			if (input.shape === 'CYLINDRICAL') dim(input.diameter, 'diameter');
			else { dim(input.length, 'length'); dim(input.width, 'width'); }
			dim(input.depth, 'depth', DEPTH_MAX_M);
			thick(input.wallThickness, 'wallThickness');
			thick(input.baseThickness, 'baseThickness');
			thick(input.slabThickness, 'slabThickness');
			break;
		case 'ELEVATOR_PIT':
			dim(input.pitWidth, 'pitWidth', 20);
			dim(input.pitLength, 'pitLength', 20);
			dim(input.pitHoleDepth, 'pitHoleDepth', 10);
			need((input.numberOfStops ?? 0) >= 1, 'numberOfStops');
			dim(input.floorHeight, 'floorHeight', 20);
			thick(input.wallThickness, 'wallThickness');
			thick(input.pitSlabThickness, 'pitSlabThickness');
			need(isBetween(input.overTravel, 0, 20), 'overTravel');
			break;
		case 'RETAINING_WALL':
			dim(input.length, 'length');
			dim(input.height, 'height', HEIGHT_MAX_M);
			thick(input.stemThickness, 'stemThickness');
			thick(input.baseThickness, 'baseThickness');
			break;
		case 'BOUNDARY_WALL':
			dim(input.length, 'length', 1000);
			dim(input.height, 'height', HEIGHT_MAX_M);
			thick(input.thickness, 'thickness');
			if (input.hasRCColumns) dim(input.columnSpacing, 'columnSpacing', 20);
			if (input.hasFoundation) {
				thick(input.foundationWidth, 'foundationWidth');
				thick(input.foundationDepth, 'foundationDepth');
			}
			break;
		case 'RAMP':
			dim(input.length, 'length');
			dim(input.width, 'width');
			thick(input.thickness, 'thickness');
			if (input.hasWalls) {
				need(isBetween(input.wallHeight, 10, 500), 'wallHeight'); // سم
				thick(input.wallThickness, 'wallThickness');
			}
			break;
		case 'DOME':
			dim(input.diameter, 'diameter', 50);
			thick(input.shellThicknessTop, 'shellThicknessTop');
			thick(input.shellThicknessBottom, 'shellThicknessBottom');
			if (input.hasRingBeam) {
				thick(input.ringBeamWidth, 'ringBeamWidth');
				thick(input.ringBeamDepth, 'ringBeamDepth');
			}
			break;
		case 'MINARET':
			dim(input.totalHeight, 'totalHeight', HEIGHT_MAX_M);
			need(((input.outerDiameter ?? input.sideLength) ?? 0) > 0, 'outerDiameter');
			thick(input.wallThickness, 'wallThickness');
			if (input.hasBalcony) {
				need((input.balconyCount ?? 0) >= 1, 'balconyCount');
				need(isBetween(input.balconyProjection, 10, 300), 'balconyProjection'); // سم
			}
			break;
		case 'CONCRETE_DECOR':
			need(input.items.length > 0, 'items');
			for (const item of input.items) {
				if (item.unit === 'LINEAR_METER') need((item.length ?? 0) > 0, 'length');
				else if (item.unit === 'SQM') need((item.area ?? 0) > 0, 'area');
				// PIECE: الارتفاع/العرض لهما افتراضي 30سم في المحرك
			}
			break;
		case 'CUSTOM_ELEMENT': {
			const hasAnyValue = [
				input.concreteVolumeRC, input.concreteVolumePlain, input.steelWeight,
				input.formworkArea, input.waterproofingArea, input.excavationVolume, input.blockCount,
			].some((v) => (v ?? 0) > 0);
			need(hasAnyValue, 'values');
			break;
		}
	}

	return errors;
}
