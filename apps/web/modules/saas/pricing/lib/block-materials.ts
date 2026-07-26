// ═══════════════════════════════════════════════════════════════════════════
// اشتقاق مواد البلوك للتسعير (بلوك + مونة "بطحة وأسمنت" + أعتاب الفتحات)
// ───────────────────────────────────────────────────────────────────────────
// المصدر الوحيد للحقيقة الذي يستخدمه تبويب "المواد" وتبويب "المصنعيات" في
// لوحة تسعير التكلفة. لا يحتوي معادلات إنشائية جديدة — يقرأ نتائج المحرك
// المحفوظة في dimensions.__result (BlockForm) ويسقط على قيم البند عند
// البنود القديمة المحفوظة قبل إضافة __result.
// ═══════════════════════════════════════════════════════════════════════════

import { BLOCK_TYPES, MORTAR_FACTORS, WASTE_PERCENTAGES } from "../constants/blocks";

/** عدد البلوك في المتر المربع للمقاس القياسي 40×20 سم */
export const BLOCKS_PER_SQM = 12.5;

// ─── متوسط المونة لكل حبة بلوك ───
// مشتق من معاملات المونة القياسية: (حجم المونة/م²) ÷ (عدد البلوك/م²)
// ثم يُقسَّم على نسبة الخلط (أسمنت : رمل = 1 : 4).
const MORTAR_VOLUME_PER_BLOCK = MORTAR_FACTORS.volumePerSqm / BLOCKS_PER_SQM;
const MORTAR_TOTAL_PARTS =
	MORTAR_FACTORS.mixRatio.cement + MORTAR_FACTORS.mixRatio.sand;

/** متوسط حجم البطحة (الرمل) لكل حبة بلوك — م³ */
export const SAND_VOLUME_PER_BLOCK =
	MORTAR_VOLUME_PER_BLOCK *
	(MORTAR_FACTORS.mixRatio.sand / MORTAR_TOTAL_PARTS);

/** متوسط عدد أكياس الأسمنت لكل حبة بلوك — كيس (50 كجم) */
export const CEMENT_BAGS_PER_BLOCK =
	(MORTAR_VOLUME_PER_BLOCK *
		(MORTAR_FACTORS.mixRatio.cement / MORTAR_TOTAL_PARTS) *
		MORTAR_FACTORS.cementDensity) /
	MORTAR_FACTORS.cementBagWeight;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BlockItemLike {
	id?: string;
	category?: string;
	quantity?: number | string | null;
	dimensions?: Record<string, any> | null;
	concreteVolume?: number | string | null;
	steelWeight?: number | string | null;
}

export interface BlockMaterials {
	/** مفتاح التجميع: نوع البلوك + السماكة */
	key: string;
	blockType: string;
	thickness: number;
	/** مثال: «بلوك 20 سم — عازل (ساندويتش)» */
	label: string;
	blockCount: number;
	netArea: number;
	sandVolume: number;
	cementBags: number;
	lintelCount: number;
	lintelLength: number;
	lintelConcreteVolume: number;
	lintelSteelKg: number;
}

export interface BlockGroupAgg {
	key: string;
	label: string;
	blockType: string;
	thickness: number;
	blockCount: number;
	netArea: number;
}

export interface BlockMaterialsAggregate {
	groups: BlockGroupAgg[];
	mortar: { sandVolume: number; cementBags: number };
	lintels: {
		count: number;
		length: number;
		concreteVolume: number;
		steelKg: number;
	};
	totalBlockCount: number;
	totalNetArea: number;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const num = (v: unknown): number => {
	const n = Number(v ?? 0);
	return Number.isFinite(n) ? n : 0;
};

export function blockGroupKey(blockType: string, thickness: number): string {
	return `${blockType}|${thickness}`;
}

export function blockGroupLabel(blockType: string, thickness: number): string {
	const typeName =
		BLOCK_TYPES[blockType as keyof typeof BLOCK_TYPES]?.nameAr ?? "مفرغ عادي";
	return `بلوك ${thickness} سم — ${typeName}`;
}

/**
 * يشتق كميات المواد لبند بلوك واحد.
 * يفضّل `dimensions.__result` المحفوظ من نموذج البلوك، ويسقط على
 * حقول البند (quantity / concreteVolume / steelWeight) للبنود القديمة.
 */
export function deriveBlockMaterials(item: BlockItemLike): BlockMaterials {
	const dims = (item.dimensions ?? {}) as Record<string, any>;
	const result = (dims.__result ?? {}) as Record<string, any>;

	const thickness = num(dims.thickness) || 20;
	const blockType = String(dims.blockType || "hollow");

	// عدد البلوك شامل الهدر — كمية البند هي عدد البلوك الإجمالي
	const blockCount = num(result.blockCount) || num(item.quantity);

	// المساحة الصافية: من النتيجة المحفوظة، وإلا تُعكس من عدد البلوك
	const wasteFactor = 1 + WASTE_PERCENTAGES.blocks.standard / 100;
	const netArea =
		num(result.netArea) ||
		(blockCount > 0 ? blockCount / (BLOCKS_PER_SQM * wasteFactor) : 0);

	// المونة: متوسط بطحة وأسمنت لكل حبة بلوك
	const sandVolume = blockCount * SAND_VOLUME_PER_BLOCK;
	const cementBags = blockCount * CEMENT_BAGS_PER_BLOCK;

	// الأعتاب: من النتيجة المحفوظة، وإلا من حقول البند (تُحفظ فيها منذ البداية)
	const lintelConcreteVolume =
		num(result.lintelConcreteVolume) || num(item.concreteVolume);
	const lintelSteelKg =
		num(result.lintelRebarWeight) || num(item.steelWeight);

	return {
		key: blockGroupKey(blockType, thickness),
		blockType,
		thickness,
		label: blockGroupLabel(blockType, thickness),
		blockCount,
		netArea,
		sandVolume,
		cementBags,
		lintelCount: num(result.lintelCount),
		lintelLength: num(result.lintelLength),
		lintelConcreteVolume,
		lintelSteelKg,
	};
}

/** يجمّع كل بنود البلوك في مجموعات حسب النوع والسماكة + إجماليات المونة والأعتاب. */
export function aggregateBlockMaterials(
	items: BlockItemLike[],
): BlockMaterialsAggregate {
	const groupMap = new Map<string, BlockGroupAgg>();
	let sandVolume = 0;
	let cementBags = 0;
	let lintelCount = 0;
	let lintelLength = 0;
	let lintelConcreteVolume = 0;
	let lintelSteelKg = 0;

	for (const item of items) {
		if (item.category !== "blocks") continue;
		const m = deriveBlockMaterials(item);

		const existing = groupMap.get(m.key);
		if (existing) {
			existing.blockCount += m.blockCount;
			existing.netArea += m.netArea;
		} else {
			groupMap.set(m.key, {
				key: m.key,
				label: m.label,
				blockType: m.blockType,
				thickness: m.thickness,
				blockCount: m.blockCount,
				netArea: m.netArea,
			});
		}

		sandVolume += m.sandVolume;
		cementBags += m.cementBags;
		lintelCount += m.lintelCount;
		lintelLength += m.lintelLength;
		lintelConcreteVolume += m.lintelConcreteVolume;
		lintelSteelKg += m.lintelSteelKg;
	}

	const groups = Array.from(groupMap.values()).sort(
		(a, b) => a.thickness - b.thickness || a.label.localeCompare(b.label, "ar"),
	);

	return {
		groups,
		mortar: { sandVolume, cementBags },
		lintels: {
			count: lintelCount,
			length: lintelLength,
			concreteVolume: lintelConcreteVolume,
			steelKg: lintelSteelKg,
		},
		totalBlockCount: groups.reduce((s, g) => s + g.blockCount, 0),
		totalNetArea: groups.reduce((s, g) => s + g.netArea, 0),
	};
}
