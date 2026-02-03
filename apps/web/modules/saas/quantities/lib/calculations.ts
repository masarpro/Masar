import {
	STRUCTURAL_PRICES,
	STRUCTURAL_LABOR_PRICES,
	REBAR_WEIGHTS,
} from "../constants/prices";

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
export interface FoundationInput {
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

export function calculateFoundation(data: FoundationInput): FoundationResult {
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
	const mainBarLengthX = length + 0.3; // إضافة الرجوع
	const mainBarLengthY = width + 0.3;

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
		0.5; // 50% للشبكة العلوية

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
export interface ColumnInput {
	quantity: number;
	width: number; // سم
	depth: number; // سم
	height: number; // متر
	mainBarsCount: number;
	mainBarDiameter: number; // مم
	stirrupDiameter: number; // مم
	stirrupSpacing: number; // مم
	concreteType?: string;
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

export function calculateColumn(data: ColumnInput): ColumnResult {
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
	} = data;

	// تحويل الأبعاد من سم إلى متر
	const widthM = width / 100;
	const depthM = depth / 100;

	// حجم الخرسانة
	const volumePerUnit = widthM * depthM * height;
	const concreteVolume = volumePerUnit * quantity;

	// الحديد الرئيسي
	const mainBarWeight = getRebarWeightPerMeter(mainBarDiameter);
	const mainBarLength = height + 0.8; // رجوع علوي وسفلي
	const mainRebarWeight =
		mainBarsCount * mainBarLength * mainBarWeight * quantity;

	// الكانات
	const stirrupPerimeter = 2 * (widthM + depthM - 0.08) + 0.3; // محيط الكانة + الرجوع
	const stirrupsCount = Math.ceil((height * 1000) / stirrupSpacing) + 1;
	const stirrupWeight = getRebarWeightPerMeter(stirrupDiameter);
	const stirrupRebarWeight =
		stirrupsCount * stirrupPerimeter * stirrupWeight * quantity;

	const totalRebarWeight = mainRebarWeight + stirrupRebarWeight;

	// مساحة الشدات
	const formworkArea = 2 * (widthM + depthM) * height * quantity;

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 350;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = totalRebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * 1.5; // الأعمدة أغلى
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
export interface BeamInput {
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

export function calculateBeam(data: BeamInput): BeamResult {
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
	const barLength = length + 0.6; // رجوع
	const topRebarWeight = topBarsCount * barLength * topBarWeight * quantity;

	// الحديد السفلي
	const bottomBarWeight = getRebarWeightPerMeter(bottomBarDiameter);
	const bottomRebarWeight =
		bottomBarsCount * barLength * bottomBarWeight * quantity;

	// الكانات
	const stirrupPerimeter = 2 * (widthM + heightM - 0.08) + 0.3;
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
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * 1.2;
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
export interface SlabInput {
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

export function calculateSlab(data: SlabInput): SlabResult {
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
	const blocksPerM2 = 12.5;
	const blocksCount = Math.ceil(netArea * blocksPerM2 * 1.05); // 5% هالك

	// حجم المونة (تقريبي: 0.02 م³/م²)
	const mortarVolume = netArea * 0.02;

	// التكلفة
	const blockPrice = STRUCTURAL_PRICES.blocks[thickness] || 3.5;
	const materialCost = blocksCount * blockPrice + mortarVolume * 150; // 150 ريال/م³ مونة
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

	// حساب الحديد
	const mainBarWeight = getRebarWeightPerMeter(mainBarDiameter);
	const mainBarsCount = Math.ceil((width * 1000) / mainBarSpacing) + 1;
	const mainRebarWeight =
		mainBarsCount * (flightLength + landingLength + 0.5) * mainBarWeight;

	const secondaryBarWeight = getRebarWeightPerMeter(secondaryBarDiameter);
	const secondaryBarsCount =
		Math.ceil(((flightLength + landingLength) * 1000) / secondaryBarSpacing) +
		1;
	const secondaryRebarWeight =
		secondaryBarsCount * (width + 0.3) * secondaryBarWeight;

	const rebarWeight = mainRebarWeight + secondaryRebarWeight;

	// مساحة الشدات
	const formworkArea = totalArea * 1.5; // السلالم تحتاج شدة أكثر

	// التكلفة
	const concretePrice = STRUCTURAL_PRICES.concrete[concreteType] || 310;
	const concreteCost = concreteVolume * concretePrice;
	const rebarCost = rebarWeight * STRUCTURAL_PRICES.steelPerKg;
	const formworkCost = formworkArea * STRUCTURAL_PRICES.formwork * 1.5;
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
export function calculateGroundBeam(data: BeamInput): BeamResult {
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
export function calculateNeckColumn(data: ColumnInput): ColumnResult {
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
