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
		totalConcreteRC: r2(concreteVolumeRC * quantity),
		totalConcretePlain: r2(concreteVolumePlain * quantity),
		totalSteelWeight: r2(steelWeight * quantity),
		totalFormwork: r2(formworkArea * quantity),
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
	const slabThickM = input.slabThickness / 100;

	const ratios = { base: STEEL_RATIOS.TANK_BASE, walls: STEEL_RATIOS.TANK_WALLS, slab: STEEL_RATIOS.TANK_SLAB };

	if (input.wallType === 'RC') {
		const box = calculateBoxStructure(
			input.length, input.width, input.depth,
			wallThickM, baseThickM, slabThickM, ratios,
		);

		const breakdown: ComponentBreakdown[] = [
			{ component: 'القاعدة', componentEn: 'Base Slab', concreteVolume: r2(box.base.volume), steelWeight: r2(box.base.steel), formworkArea: r2(box.base.formwork) },
			{ component: 'الجدران', componentEn: 'Walls', concreteVolume: r2(box.walls.volume), steelWeight: r2(box.walls.steel), formworkArea: r2(box.walls.formwork) },
			{ component: 'السقف', componentEn: 'Top Slab', concreteVolume: r2(box.slab.volume), steelWeight: r2(box.slab.steel), formworkArea: r2(box.slab.formwork) },
		];

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
			waterproofingArea: box.waterproofInner + box.waterproofOuter,
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
		{ component: 'السقف', componentEn: 'Top Slab', concreteVolume: r2(slabVol), steelWeight: r2(steelFromRatio(slabVol, ratios.slab)), formworkArea: r2(outerL * outerW) },
	];

	const excL = outerL + 1.0;
	const excW = outerW + 1.0;
	const excDepth = LEAN_CONCRETE_THICKNESS + baseThickM + input.depth;

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
		waterproofingArea: wallArea + input.length * input.width + 2 * (outerL + outerW) * input.depth + outerL * outerW,
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
		const cfVol = count * cfHeight * cfWidth * cfThick;
		const cfFormwork = count * 2 * cfHeight * cfWidth;
		breakdown.push({
			component: 'أضلاع مقاومة', componentEn: 'Counterforts',
			concreteVolume: r2(cfVol), steelWeight: r2(steelFromRatio(cfVol, STEEL_RATIOS.RETAINING_COUNTERFORT)),
			formworkArea: r2(cfFormwork),
		});
	}

	// صبة نظافة
	const leanConcrete = baseWidth * input.length * LEAN_CONCRETE_THICKNESS;

	// الحفر
	const excWidth = baseWidth + 1.0;
	const excLength = input.length + 1.0;
	const excavation = excWidth * excLength * input.height;

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
	const foundW = input.foundationWidth / 100;
	const foundD = input.foundationDepth / 100;
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
	const wallHM = input.wallHeight / 100;
	const wallThickM = input.wallThickness / 100;
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

	// 1. بلاطة القبة القشرية (نصف كرة تقريبي)
	// مساحة نصف الكرة = 2πR²
	const shellSurfaceArea = 2 * Math.PI * R * R;
	const shellVol = shellSurfaceArea * avgThickM;
	breakdown.push({
		component: 'بلاطة القبة', componentEn: 'Dome Shell',
		concreteVolume: r2(shellVol), steelWeight: r2(steelFromRatio(shellVol, STEEL_RATIOS.DOME_SHELL)),
		formworkArea: r2(shellSurfaceArea),
	});

	// 2. الكمرة الدائرية
	if (input.hasRingBeam) {
		const ringW = input.ringBeamWidth / 100;
		const ringD = input.ringBeamDepth / 100;
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

	if (input.shape === 'CYLINDRICAL') {
		const outerD = input.outerDiameter ?? 2.0;
		const R_outer = outerD / 2;
		const R_inner = R_outer - wallThickM;
		shaftOuterPerimeter = Math.PI * outerD;
		shaftInnerPerimeter = Math.PI * 2 * R_inner;
		shaftOuterArea = Math.PI * R_outer * R_outer;
		shaftInnerArea = Math.PI * R_inner * R_inner;
	} else if (input.shape === 'SQUARE') {
		const side = input.sideLength ?? input.outerDiameter ?? 2.0;
		const innerSide = side - 2 * wallThickM;
		shaftOuterPerimeter = 4 * side;
		shaftInnerPerimeter = 4 * innerSide;
		shaftOuterArea = side * side;
		shaftInnerArea = innerSide * innerSide;
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
		const balconyProj = input.balconyProjection / 100;
		const balconyThick = 0.15; // 15 سم
		// بروز دائري/مربع حول الجذع
		const balconyOuterPerimeter = shaftOuterPerimeter + 2 * Math.PI * balconyProj; // تقريبي
		const balconyArea = balconyOuterPerimeter * balconyProj / 2; // تقريبي
		const balconyVol = input.balconyCount * balconyArea * balconyThick;
		const balconyFormwork = input.balconyCount * (balconyArea + balconyOuterPerimeter * balconyThick);
		breakdown.push({
			component: `شرفات (${input.balconyCount})`, componentEn: `Balconies (${input.balconyCount})`,
			concreteVolume: r2(balconyVol), steelWeight: r2(steelFromRatio(balconyVol, STEEL_RATIOS.MINARET_BALCONY)),
			formworkArea: r2(balconyFormwork),
		});
	}

	// صبة نظافة (قاعدة المأذنة)
	const leanConcrete = shaftOuterArea * 1.5 * LEAN_CONCRETE_THICKNESS; // قاعدة أوسع 50%

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: leanConcrete,
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

		if (item.unit === 'LINEAR_METER' && item.length) {
			weight = item.length * item.quantity * GRC_WEIGHT_PER_LM_CORNICE;
			area = item.length * (item.height ?? 30) / 100 * item.quantity;
		} else if (item.unit === 'SQM' && item.area) {
			weight = item.area * item.quantity * GRC_WEIGHT_PER_SQM;
			area = item.area * item.quantity;
		} else if (item.unit === 'PIECE') {
			const pieceArea = ((item.height ?? 30) / 100) * ((item.width ?? 30) / 100);
			weight = pieceArea * item.quantity * GRC_WEIGHT_PER_SQM;
			area = pieceArea * item.quantity;
		}

		totalWeight += weight;
		breakdown.push({
			component: item.description ?? item.type,
			componentEn: item.type,
			concreteVolume: 0,
			steelWeight: r2(weight / 1000), // تحويل لأن الباقي بالكجم وهذا وزن GRC
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
		concreteVolume: input.concreteVolumeRC,
		steelWeight: input.steelWeight,
		formworkArea: input.formworkArea,
	}];

	return buildResult(input.elementType, input.name, input.quantity, breakdown, {
		concreteVolumePlain: input.concreteVolumePlain,
		waterproofingArea: input.waterproofingArea,
		excavationVolume: input.excavationVolume,
		blockCount: input.blockCount,
	});
}
