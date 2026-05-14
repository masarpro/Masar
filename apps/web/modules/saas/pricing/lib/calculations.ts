import {
	STRUCTURAL_PRICES,
	STRUCTURAL_LABOR_PRICES,
	REBAR_WEIGHTS,
} from "../constants/prices";
import {
	FOUNDATION_BAR_RETURN,
	FOUNDATION_SECONDARY_RATIO,
	COLUMN_MAIN_BAR_RETURN,
	COLUMN_FORMWORK_MULTIPLIER,
	STIRRUP_COVER_DEDUCTION,
	STIRRUP_HOOK_LENGTH,
	BEAM_BAR_RETURN,
	BEAM_FORMWORK_MULTIPLIER,
	BLOCKS_PER_SQM,
	BLOCK_WASTE_FACTOR,
	MORTAR_VOLUME_PER_SQM,
	MORTAR_COST_PER_CUBIC_METER,
	STAIRS_FORMWORK_MULTIPLIER,
} from "../constants/structural-defaults";

// ═══════════════════════════════════════════════════════════════
// دالة مساعدة: وزن الحديد لكل متر طولي
// ═══════════════════════════════════════════════════════════════
function getRebarWeightPerMeter(diameter: number): number {
	// الوزن = (القطر²) × 0.00617 كجم/م
	return REBAR_WEIGHTS[diameter] || diameter * diameter * 0.00617;
}

// ═══════════════════════════════════════════════════════════════
// حسابات القواعد (Foundations)
// ═══════════════════════════════════════════════════════════════
export interface FoundationCalcInput {
	quantity: number;
	length: number; // متر
	width: number; // متر
	depth: number; // متر
	mainBarDiameter: number; // مم
	mainBarSpacing: number; // مم
	secondaryBarDiameter?: number; // مم
	secondaryBarSpacing?: number; // مم
	concreteType?: string;
}

export interface FoundationResult {
	volumePerUnit: number;
	concreteVolume: number;
	mainBarsCountX: number;
	mainBarsCountY: number;
	mainRebarWeight: number;
	secondaryRebarWeight: number;
	rebarWeight: number;
	formworkArea: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	laborCost: number;
	totalCost: number;
}

export function calculateFoundation(data: FoundationCalcInput): FoundationResult {
	const {
		quantity,
		length,
		width,
		depth,
		mainBarDiameter,
		mainBarSpacing,
		secondaryBarDiameter = 12,
		secondaryBarSpacing = 200,
		concreteType = "C30",
	} = data;

	// حجم الخرسانة
	const volumePerUnit = length * width * depth;
	const concreteVolume = volumePerUnit * quantity;

	// حساب الحديد الرئيسي (شبكة سفلية)
	const mainBarsCountX = Math.ceil((width * 1000) / mainBarSpacing) + 1;
	const mainBarsCountY = Math.ceil((length * 1000) / mainBarSpacing) + 1;
	const mainBarLengthX = length + FOUNDATION_BAR_RETURN; // إضافة الرجوع
	const mainBarLengthY = width + FOUNDATION_BAR_RETURN;

	// وزن الحديد الرئيسي
	const mainBarWeight = getRebarWeightPerMeter(mainBarDiameter);
	const mainRebarWeight =
		(mainBarsCountX * mainBarLengthX + mainBarsCountY * mainBarLengthY) *
		mainBarWeight *
		quantity;

	// الحديد الثانوي (شبكة علوية)
	const secondaryBarWeight = getRebarWeightPerMeter(secondaryBarDiameter);
	const secondaryBarsCountX =
		Math.ceil((width * 1000) / secondaryBarSpacing) + 1;
	const secondaryBarsCountY =
		Math.ceil((length * 1000) / secondaryBarSpacing) + 1;
	const secondaryRebarWeight =
		(secondaryBarsCountX * mainBarLengthX +
			secondaryBarsCountY * mainBarLengthY) *
		secondaryBarWeight *
		quantity *
		FOUNDATION_SECONDARY_RATIO; // 50% للشبكة العلوية

	const totalRebarWeight = mainRebarWeight + secondaryRebarWeight;

	// مساحة الشدات (الجوانب + القاعدة)
	const formworkArea =
		(2 * (length + width) * depth + length * width) * quantity;

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = totalRebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.foundations;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		volumePerUnit,
		concreteVolume,
		mainBarsCountX,
		mainBarsCountY,
		mainRebarWeight,
		secondaryRebarWeight,
		rebarWeight: totalRebarWeight,
		formworkArea,
		concreteCost,
		rebarCost,
		formworkCost,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات الأعمدة (Columns)
// ═══════════════════════════════════════════════════════════════
export interface ColumnCalcInput {
	quantity: number;
	width: number; // سم
	depth: number; // سم
	height: number; // متر
	mainBarsCount: number;
	mainBarDiameter: number; // مم
	stirrupDiameter: number; // مم
	stirrupSpacing: number; // مم
	concreteType?: string;
	shape?: "rectangular" | "circular";
	diameter?: number; // سم — للعمود الدائري
}

export interface ColumnResult {
	volumePerUnit: number;
	concreteVolume: number;
	mainRebarWeight: number;
	stirrupRebarWeight: number;
	rebarWeight: number;
	formworkArea: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	laborCost: number;
	totalCost: number;
}

export function calculateColumn(data: ColumnCalcInput): ColumnResult {
	const {
		quantity,
		width,
		depth,
		height,
		mainBarsCount,
		mainBarDiameter,
		stirrupDiameter,
		stirrupSpacing,
		concreteType = "C35",
		shape = "rectangular",
		diameter,
	} = data;

	// تحويل الأبعاد من سم إلى متر
	const widthM = width / 100;
	const depthM = depth / 100;
	const isCircular = shape === "circular" && diameter && diameter > 0;
	const diameterM = isCircular ? (diameter as number) / 100 : 0;

	// حجم الخرسانة
	const volumePerUnit = isCircular
		? Math.PI * (diameterM / 2) ** 2 * height
		: widthM * depthM * height;
	const concreteVolume = volumePerUnit * quantity;

	// الحديد الرئيسي
	const mainBarWeight = getRebarWeightPerMeter(mainBarDiameter);
	const mainBarLength = height + COLUMN_MAIN_BAR_RETURN; // رجوع علوي وسفلي
	const mainRebarWeight =
		mainBarsCount * mainBarLength * mainBarWeight * quantity;

	// الكانات (دائرية للعمود الدائري، مستطيلة للعمود المستطيل)
	const stirrupPerimeter = isCircular
		? Math.PI * (diameterM - 2 * STIRRUP_COVER_DEDUCTION) + STIRRUP_HOOK_LENGTH
		: 2 * (widthM + depthM - STIRRUP_COVER_DEDUCTION) + STIRRUP_HOOK_LENGTH;
	const stirrupsCount = Math.ceil((height * 1000) / stirrupSpacing) + 1;
	const stirrupWeight = getRebarWeightPerMeter(stirrupDiameter);
	const stirrupRebarWeight =
		stirrupsCount * stirrupPerimeter * stirrupWeight * quantity;

	const totalRebarWeight = mainRebarWeight + stirrupRebarWeight;

	// مساحة الشدات
	const formworkArea = isCircular
		? Math.PI * diameterM * height * quantity
		: 2 * (widthM + depthM) * height * quantity;

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 350;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = totalRebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * COLUMN_FORMWORK_MULTIPLIER; // الأعمدة أغلى
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.columns;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		volumePerUnit,
		concreteVolume,
		mainRebarWeight,
		stirrupRebarWeight,
		rebarWeight: totalRebarWeight,
		formworkArea,
		concreteCost,
		rebarCost,
		formworkCost,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات الكمرات (Beams)
// ═══════════════════════════════════════════════════════════════
export interface BeamCalcInput {
	quantity: number;
	width: number; // سم
	height: number; // سم
	length: number; // متر
	topBarsCount: number;
	topBarDiameter: number; // مم
	bottomBarsCount: number;
	bottomBarDiameter: number; // مم
	stirrupDiameter: number; // مم
	stirrupSpacing: number; // مم
	concreteType?: string;
}

export interface BeamResult {
	volumePerUnit: number;
	concreteVolume: number;
	topRebarWeight: number;
	bottomRebarWeight: number;
	stirrupRebarWeight: number;
	rebarWeight: number;
	formworkArea: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	laborCost: number;
	totalCost: number;
}

export function calculateBeam(data: BeamCalcInput): BeamResult {
	const {
		quantity,
		width,
		height,
		length,
		topBarsCount,
		topBarDiameter,
		bottomBarsCount,
		bottomBarDiameter,
		stirrupDiameter,
		stirrupSpacing,
		concreteType = "C30",
	} = data;

	// تحويل الأبعاد من سم إلى متر
	const widthM = width / 100;
	const heightM = height / 100;

	// حجم الخرسانة
	const volumePerUnit = widthM * heightM * length;
	const concreteVolume = volumePerUnit * quantity;

	// الحديد العلوي
	const topBarWeight = getRebarWeightPerMeter(topBarDiameter);
	const barLength = length + BEAM_BAR_RETURN; // رجوع
	const topRebarWeight = topBarsCount * barLength * topBarWeight * quantity;

	// الحديد السفلي
	const bottomBarWeight = getRebarWeightPerMeter(bottomBarDiameter);
	const bottomRebarWeight =
		bottomBarsCount * barLength * bottomBarWeight * quantity;

	// الكانات
	const stirrupPerimeter = 2 * (widthM + heightM - STIRRUP_COVER_DEDUCTION) + STIRRUP_HOOK_LENGTH;
	const stirrupsCount = Math.ceil((length * 1000) / stirrupSpacing) + 1;
	const stirrupWeight = getRebarWeightPerMeter(stirrupDiameter);
	const stirrupRebarWeight =
		stirrupsCount * stirrupPerimeter * stirrupWeight * quantity;

	const totalRebarWeight =
		topRebarWeight + bottomRebarWeight + stirrupRebarWeight;

	// مساحة الشدات (القاع + الجانبين)
	const formworkArea =
		(widthM + 2 * heightM) * length * quantity;

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = totalRebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * BEAM_FORMWORK_MULTIPLIER;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.beams;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		volumePerUnit,
		concreteVolume,
		topRebarWeight,
		bottomRebarWeight,
		stirrupRebarWeight,
		rebarWeight: totalRebarWeight,
		formworkArea,
		concreteCost,
		rebarCost,
		formworkCost,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات البلاطات (Slabs)
// ═══════════════════════════════════════════════════════════════
export interface SlabCalcInput {
	length: number; // متر
	width: number; // متر
	thickness: number; // سم
	slabType: "solid" | "hollow" | "ribbed";
	mainBarDiameter: number; // مم
	mainBarSpacing: number; // مم
	secondaryBarDiameter: number; // مم
	secondaryBarSpacing: number; // مم
	// للبلاطات الهوردي
	ribWidth?: number; // سم
	ribSpacing?: number; // مم
	blockHeight?: number; // سم
	concreteType?: string;
}

export interface SlabResult {
	area: number;
	concreteVolume: number;
	blocksCount: number;
	mainRebarWeight: number;
	secondaryRebarWeight: number;
	rebarWeight: number;
	formworkArea: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	blocksCost: number;
	laborCost: number;
	totalCost: number;
}

export function calculateSlab(data: SlabCalcInput): SlabResult {
	const {
		length,
		width,
		thickness,
		slabType,
		mainBarDiameter,
		mainBarSpacing,
		secondaryBarDiameter,
		secondaryBarSpacing,
		ribWidth = 15,
		ribSpacing = 520,
		blockHeight = 20,
		concreteType = "C30",
	} = data;

	const area = length * width;
	let concreteVolume: number;
	let blocksCount = 0;

	if (slabType === "solid") {
		concreteVolume = area * (thickness / 100);
	} else if (slabType === "hollow" || slabType === "ribbed") {
		// بلاطة هوردي
		const ribWidthM = ribWidth / 100;
		const ribSpacingM = ribSpacing / 1000;
		const blockHeightM = blockHeight / 100;

		const ribsCount = Math.ceil(width / ribSpacingM);
		const ribVolume =
			ribsCount * length * ribWidthM * (blockHeightM + 0.05);
		const topSlabVolume = area * 0.05; // طبقة علوية 5 سم
		concreteVolume = ribVolume + topSlabVolume;

		// عدد البلوكات (40×25×height)
		blocksCount = Math.ceil(area / (ribSpacingM * 0.4)) * 2.5;
	} else {
		concreteVolume = area * (thickness / 100);
	}

	// حساب الحديد الرئيسي
	const mainBarWeight = getRebarWeightPerMeter(mainBarDiameter);
	const mainBarsCount = Math.ceil((width * 1000) / mainBarSpacing) + 1;
	const mainRebarWeight = mainBarsCount * (length + 0.4) * mainBarWeight;

	// حساب الحديد الثانوي
	const secondaryBarWeight = getRebarWeightPerMeter(secondaryBarDiameter);
	const secondaryBarsCount =
		Math.ceil((length * 1000) / secondaryBarSpacing) + 1;
	const secondaryRebarWeight =
		secondaryBarsCount * (width + 0.4) * secondaryBarWeight;

	const totalRebarWeight = mainRebarWeight + secondaryRebarWeight;

	// مساحة الشدات
	const formworkArea = area;

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = totalRebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork;
	const blocksCost = blocksCount * (STRUCTURAL_PRICES.blocks[20] || 4.5);
	const laborCost = area * STRUCTURAL_LABOR_PRICES.slabs;
	const totalCost =
		concreteCost + rebarCost + formworkCost + blocksCost + laborCost;

	return {
		area,
		concreteVolume,
		blocksCount,
		mainRebarWeight,
		secondaryRebarWeight,
		rebarWeight: totalRebarWeight,
		formworkArea,
		concreteCost,
		rebarCost,
		formworkCost,
		blocksCost,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات البلوك (Block Walls)
// ═══════════════════════════════════════════════════════════════
export interface BlockInput {
	length: number; // متر
	height: number; // متر
	thickness: 10 | 15 | 20; // سم
	openings?: Array<{ width: number; height: number }>; // متر
}

export interface BlockResult {
	grossArea: number;
	openingsArea: number;
	netArea: number;
	blocksCount: number;
	mortarVolume: number;
	materialCost: number;
	laborCost: number;
	totalCost: number;
}

export function calculateBlocks(data: BlockInput): BlockResult {
	const { length, height, thickness, openings = [] } = data;

	// المساحة الإجمالية
	const grossArea = length * height;

	// مساحة الفتحات
	const openingsArea = openings.reduce(
		(sum, o) => sum + o.width * o.height,
		0
	);

	// المساحة الصافية
	const netArea = grossArea - openingsArea;

	// عدد البلوكات (بلوك 40×20 سم = 12.5 بلوكة/م²)
	const blocksCount = Math.ceil(netArea * BLOCKS_PER_SQM * BLOCK_WASTE_FACTOR); // 5% هالك

	// حجم المونة (تقريبي: 0.02 م³/م²)
	const mortarVolume = netArea * MORTAR_VOLUME_PER_SQM;

	// التكلفة
	const blockPrice = STRUCTURAL_PRICES.blocks[thickness] || 3.5;
	const materialCost = blocksCount * blockPrice + mortarVolume * MORTAR_COST_PER_CUBIC_METER;
	const laborCost = netArea * STRUCTURAL_LABOR_PRICES.blocks;
	const totalCost = materialCost + laborCost;

	return {
		grossArea,
		openingsArea,
		netArea,
		blocksCount,
		mortarVolume,
		materialCost,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات السلالم (Stairs)
// ═══════════════════════════════════════════════════════════════
export interface StairsInput {
	width: number; // متر (عرض الدرج)
	flightLength: number; // متر (طول الجزء المائل)
	landingLength: number; // متر (طول البسطة)
	landingWidth: number; // متر (عرض البسطة)
	thickness: number; // سم (سماكة البلاطة)
	risersCount: number; // عدد القوائم
	riserHeight: number; // سم (ارتفاع القائمة)
	treadDepth: number; // سم (عمق النائمة)
	mainBarDiameter: number; // مم
	mainBarSpacing: number; // مم
	secondaryBarDiameter: number; // مم
	secondaryBarSpacing: number; // مم
	concreteType?: string;
}

export interface StairsResult {
	flightArea: number;
	landingArea: number;
	totalArea: number;
	concreteVolume: number;
	rebarWeight: number;
	formworkArea: number;
	concreteCost: number;
	rebarCost: number;
	formworkCost: number;
	laborCost: number;
	totalCost: number;
}

// ثوابت حساب حديد السلالم (SBC 304)
const STAIR_REBAR_DEFAULTS = {
	DEV_LENGTH_MULTIPLIER: 40,      // 40d - طول التماسك
	HOOK_MULTIPLIER: 12,            // 12d - طول الخطاف
	TOP_BAR_EXTENSION_RATIO: 0.25,  // 0.25L - امتداد الحديد العلوي
	CUT_LENGTH_ROUNDING: 0.05,      // تقريب لأقرب 5 سم
};

function roundUpTo5cm(length: number): number {
	return Math.ceil(length / 0.05) * 0.05;
}

export function calculateStairs(data: StairsInput): StairsResult {
	const {
		width,
		flightLength,
		landingLength,
		landingWidth,
		thickness,
		risersCount,
		riserHeight,
		treadDepth,
		mainBarDiameter,
		mainBarSpacing,
		secondaryBarDiameter,
		secondaryBarSpacing,
		concreteType = "C30",
	} = data;

	// مساحة الدرج المائل
	const flightArea = flightLength * width;

	// مساحة البسطة
	const landingArea = landingLength * landingWidth;

	const totalArea = flightArea + landingArea;

	// حجم الخرسانة (الدرج + البسطة + الدرجات)
	const thicknessM = thickness / 100;
	const riserHeightM = riserHeight / 100;
	const treadDepthM = treadDepth / 100;

	// حجم بلاطة الدرج
	const slabVolume = flightArea * thicknessM;

	// حجم الدرجات (مثلثات)
	const stepsVolume =
		(risersCount * width * riserHeightM * treadDepthM) / 2;

	// حجم البسطة
	const landingVolume = landingArea * thicknessM;

	const concreteVolume = slabVolume + stepsVolume + landingVolume;

	// حساب الحديد - 4 طبقات
	const mainBarWeight = getRebarWeightPerMeter(mainBarDiameter);
	const secondaryBarWeight = getRebarWeightPerMeter(secondaryBarDiameter);

	const mainDevLength = STAIR_REBAR_DEFAULTS.DEV_LENGTH_MULTIPLIER * (mainBarDiameter / 1000);
	const mainHookLength = STAIR_REBAR_DEFAULTS.HOOK_MULTIPLIER * (mainBarDiameter / 1000);
	const secDevLength = STAIR_REBAR_DEFAULTS.DEV_LENGTH_MULTIPLIER * (secondaryBarDiameter / 1000);
	const secHookLength = STAIR_REBAR_DEFAULTS.HOOK_MULTIPLIER * (secondaryBarDiameter / 1000);

	const totalLength = flightLength + landingLength;
	const mainBarsCount = Math.ceil((width * 1000) / mainBarSpacing) + 1;
	const secondaryBarsCount =
		Math.ceil((totalLength * 1000) / secondaryBarSpacing) + 1;

	// الطبقة 1: حديد سفلي رئيسي (طولي)
	const bottomMainBarLength = roundUpTo5cm(totalLength + 2 * mainDevLength + 2 * mainHookLength);
	const bottomMainWeight = mainBarsCount * bottomMainBarLength * mainBarWeight;

	// الطبقة 2: حديد سفلي ثانوي (عرضي)
	const bottomSecBarLength = roundUpTo5cm(width + 2 * secDevLength + 2 * secHookLength);
	const bottomSecWeight = secondaryBarsCount * bottomSecBarLength * secondaryBarWeight;

	// الطبقة 3: حديد علوي رئيسي (مساند) - قطعتان لكل سيخ عند المساند
	const topExtension = STAIR_REBAR_DEFAULTS.TOP_BAR_EXTENSION_RATIO * flightLength;
	const topMainPieceLength = roundUpTo5cm(topExtension + mainDevLength + mainHookLength);
	const topMainCount = mainBarsCount * 2; // قطعتان: عند المسند العلوي والسفلي
	const topMainWeight = topMainCount * topMainPieceLength * mainBarWeight;

	// الطبقة 4: حديد علوي ثانوي (توزيع مساند)
	const topSecBarLength = bottomSecBarLength; // نفس طول السفلي الثانوي
	const topSecCount = 2 * (Math.ceil((topExtension * 1000) / secondaryBarSpacing) + 1);
	const topSecWeight = topSecCount * topSecBarLength * secondaryBarWeight;

	const rebarWeight = bottomMainWeight + bottomSecWeight + topMainWeight + topSecWeight;

	// مساحة الشدات
	const formworkArea = totalArea * STAIRS_FORMWORK_MULTIPLIER; // السلالم تحتاج شدة أكثر

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = rebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * STAIRS_FORMWORK_MULTIPLIER;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.stairs;
	const totalCost = concreteCost + rebarCost + formworkCost + laborCost;

	return {
		flightArea,
		landingArea,
		totalArea,
		concreteVolume,
		rebarWeight,
		formworkArea,
		concreteCost,
		rebarCost,
		formworkCost,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات الميدات (Ground Beams)
// ═══════════════════════════════════════════════════════════════
export function calculateGroundBeam(data: BeamCalcInput): BeamResult {
	// الميدات مشابهة للكمرات لكن بأسعار مختلفة
	const result = calculateBeam(data);

	// تعديل تكلفة العمالة
	const laborCost = result.concreteVolume * STRUCTURAL_LABOR_PRICES.groundBeams;
	const totalCost =
		result.concreteCost + result.rebarCost + result.formworkCost + laborCost;

	return {
		...result,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات الرقاب (Neck Columns)
// ═══════════════════════════════════════════════════════════════
export function calculateNeckColumn(data: ColumnCalcInput): ColumnResult {
	// الرقاب مشابهة للأعمدة لكن بأسعار مختلفة
	const result = calculateColumn(data);

	// تعديل تكلفة العمالة
	const laborCost = result.concreteVolume * STRUCTURAL_LABOR_PRICES.neckColumns;
	const totalCost =
		result.concreteCost + result.rebarCost + result.formworkCost + laborCost;

	return {
		...result,
		laborCost,
		totalCost,
	};
}

// ═══════════════════════════════════════════════════════════════
// حسابات الخرسانة العادية (Plain Concrete)
// ═══════════════════════════════════════════════════════════════
export interface PlainConcreteInput {
	length: number; // متر
	width: number; // متر
	thickness: number; // سم
	concreteType?: string;
}

export interface PlainConcreteResult {
	area: number;
	concreteVolume: number;
	concreteCost: number;
	laborCost: number;
	totalCost: number;
}

export function calculatePlainConcrete(
	data: PlainConcreteInput
): PlainConcreteResult {
	const { length, width, thickness, concreteType = "C20" } = data;

	const area = length * width;
	const concreteVolume = area * (thickness / 100);

	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 250;
	const concreteCost = concreteVolume * concretePrice;
	const laborCost = concreteVolume * STRUCTURAL_LABOR_PRICES.plainConcrete;
	const totalCost = concreteCost + laborCost;

	return {
		area,
		concreteVolume,
		concreteCost,
		laborCost,
		totalCost,
	};
}
