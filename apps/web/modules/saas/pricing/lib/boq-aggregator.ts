// ═══════════════════════════════════════════════════════════════
// BOQ Aggregator - تجميع بيانات جدول الكميات
// ═══════════════════════════════════════════════════════════════

import { recalculateItem, type CuttingDetailRow, type RecalcResult } from "./boq-recalculator";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface StructuralItem {
	id: string;
	category: string;
	subCategory?: string | null;
	name: string;
	quantity: number;
	dimensions: Record<string, number>;
	concreteVolume: number;
	steelWeight: number;
	totalCost: number;
}

export interface BOQItemDetail {
	item: StructuralItem;
	recalc: RecalcResult;
}

export interface BOQSubGroup {
	key: string;
	label: string;
	items: BOQItemDetail[];
	concrete: number;
	rebar: number;
	blocks: number;
}

export interface BOQSection {
	category: string;
	label: string;
	icon: string;
	subGroups: BOQSubGroup[];
	totalConcrete: number;
	totalRebar: number;
	totalBlocks: number;
}

export interface FactoryOrderEntry {
	diameter: number;
	stockLength: number;
	count: number;
	weight: number;
}

export interface BOQSummary {
	sections: BOQSection[];
	grandTotals: {
		concrete: number;
		rebar: number;
		blocks: number;
		formwork: number;
	};
	factoryOrder: FactoryOrderEntry[];
	allCuttingDetails: CuttingDetailRow[];
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SECTION_ORDER = [
	"plainConcrete",
	"foundations",
	"groundBeams",
	"columns",
	"slabs",
	"beams",
	"blocks",
	"stairs",
];

const SECTION_LABELS: Record<string, string> = {
	plainConcrete: "صبة النظافة",
	foundations: "القواعد المسلحة",
	groundBeams: "الميدة (الكمرات الأرضية)",
	beams: "الكمرات",
	columns: "الأعمدة",
	slabs: "الأسقف",
	blocks: "البلوك",
	stairs: "السلالم",
};

const SECTION_ICONS: Record<string, string> = {
	plainConcrete: "🧱",
	foundations: "🏗️",
	groundBeams: "📏",
	beams: "📏",
	columns: "🏛️",
	slabs: "🏠",
	blocks: "🧱",
	stairs: "🪜",
};

const FOUNDATION_TYPE_LABELS: Record<string, string> = {
	isolated: "قواعد معزولة",
	combined: "قواعد مشتركة",
	strip: "قواعد شريطية",
	raft: "لبشة",
};

const FLOOR_LABELS: Record<string, string> = {
	neck: "الرقاب",
	ground: "الدور الأرضي",
	first: "الدور الأول",
	mezzanine: "الميزانين",
	repeated: "الدور المتكرر",
	annex: "الملحق",
	roof: "السطح",
};

const SLAB_FLOOR_LABELS: Record<string, string> = {
	ground: "سقف الدور الأرضي",
	first: "سقف الدور الأول",
	mezzanine: "سقف الميزانين",
	repeated: "سقف الدور المتكرر",
	annex: "سقف الملحق",
	roof: "السطح",
};

// ─────────────────────────────────────────────────────────────
// Aggregation
// ─────────────────────────────────────────────────────────────

function getSubGroupKey(item: StructuralItem): string {
	switch (item.category) {
		case "foundations":
			return item.subCategory || "isolated";
		case "columns":
		case "blocks":
		case "stairs":
			return item.subCategory || item.dimensions?.floor?.toString() || "ground";
		case "slabs":
			return item.dimensions?.floor?.toString() || "ground";
		default:
			return "default";
	}
}

function getSubGroupLabel(category: string, key: string): string {
	switch (category) {
		case "foundations":
			return FOUNDATION_TYPE_LABELS[key] || key;
		case "columns":
		case "blocks":
		case "stairs":
			return FLOOR_LABELS[key] || key;
		case "slabs":
			return SLAB_FLOOR_LABELS[key] || FLOOR_LABELS[key] || key;
		default:
			return key;
	}
}

export function aggregateBOQ(items: StructuralItem[]): BOQSummary {
	// Group by category, splitting beams into groundBeams vs regular beams
	const categoryMap = new Map<string, StructuralItem[]>();
	items.forEach((item) => {
		let cat = item.category;
		// Split beams: groundBeam subCategory goes to "groundBeams" section
		if (cat === "beams" && item.subCategory === "groundBeam") {
			cat = "groundBeams";
		}
		const list = categoryMap.get(cat) || [];
		list.push(item);
		categoryMap.set(cat, list);
	});

	const sections: BOQSection[] = [];
	const allCuttingDetails: CuttingDetailRow[] = [];
	const factoryMap = new Map<string, FactoryOrderEntry>();

	let grandConcrete = 0;
	let grandRebar = 0;
	let grandBlocks = 0;
	let grandFormwork = 0;

	for (const category of SECTION_ORDER) {
		const categoryItems = categoryMap.get(category);
		if (!categoryItems || categoryItems.length === 0) continue;

		// Sub-group items
		const subGroupMap = new Map<string, BOQItemDetail[]>();
		const subGroupOrder: string[] = [];

		for (const item of categoryItems) {
			const key = getSubGroupKey(item);
			if (!subGroupMap.has(key)) {
				subGroupMap.set(key, []);
				subGroupOrder.push(key);
			}

			// Recalculate cutting details
			const recalc = recalculateItem(
				item.category,
				item.subCategory,
				item.dimensions || {},
				item.quantity,
				item.name,
			);

			subGroupMap.get(key)!.push({ item, recalc });

			// Collect cutting details
			allCuttingDetails.push(...recalc.cuttingDetails);

			// Aggregate factory order
			recalc.totals.stocksNeeded.forEach((stock) => {
				const fKey = `${stock.diameter}-${stock.length}`;
				const existing = factoryMap.get(fKey);
				if (existing) {
					existing.count += stock.count;
					existing.weight += stock.count * stock.length * (REBAR_WEIGHTS_MAP[stock.diameter] || 0);
				} else {
					factoryMap.set(fKey, {
						diameter: stock.diameter,
						stockLength: stock.length,
						count: stock.count,
						weight: stock.count * stock.length * (REBAR_WEIGHTS_MAP[stock.diameter] || 0),
					});
				}
			});
		}

		// Build sub-groups
		const subGroups: BOQSubGroup[] = subGroupOrder.map((key) => {
			const groupItems = subGroupMap.get(key)!;
			const concrete = groupItems.reduce((s, d) => s + d.item.concreteVolume, 0);
			const rebar = groupItems.reduce((s, d) => s + d.item.steelWeight, 0);
			const blocks = category === "blocks"
				? groupItems.reduce((s, d) => s + d.item.quantity, 0)
				: 0;

			return {
				key,
				label: getSubGroupLabel(category, key),
				items: groupItems,
				concrete,
				rebar,
				blocks,
			};
		});

		const totalConcrete = subGroups.reduce((s, g) => s + g.concrete, 0);
		const totalRebar = subGroups.reduce((s, g) => s + g.rebar, 0);
		const totalBlocks = subGroups.reduce((s, g) => s + g.blocks, 0);

		grandConcrete += totalConcrete;
		grandRebar += totalRebar;
		grandBlocks += totalBlocks;

		// Formwork estimate
		if (category !== "blocks" && category !== "plainConcrete") {
			categoryItems.forEach((item) => {
				grandFormwork += (item.dimensions as any)?.formworkArea || 0;
			});
		}

		sections.push({
			category,
			label: SECTION_LABELS[category] || category,
			icon: SECTION_ICONS[category] || "📦",
			subGroups,
			totalConcrete,
			totalRebar,
			totalBlocks,
		});
	}

	// Sort factory order by diameter
	const factoryOrder = Array.from(factoryMap.values()).sort((a, b) => a.diameter - b.diameter);

	return {
		sections,
		grandTotals: {
			concrete: Number(grandConcrete.toFixed(2)),
			rebar: Number(grandRebar.toFixed(2)),
			blocks: grandBlocks,
			formwork: Number(grandFormwork.toFixed(2)),
		},
		factoryOrder,
		allCuttingDetails,
	};
}

// Helper weights map
export const REBAR_WEIGHTS_MAP: Record<number, number> = {
	6: 0.222,
	8: 0.395,
	10: 0.617,
	12: 0.888,
	14: 1.208,
	16: 1.578,
	18: 1.998,
	20: 2.466,
	22: 2.984,
	25: 3.853,
	28: 4.834,
	32: 6.313,
};
