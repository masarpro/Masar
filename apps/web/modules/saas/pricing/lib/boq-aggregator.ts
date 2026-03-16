// ═══════════════════════════════════════════════════════════════
// BOQ Aggregator - تجميع بيانات جدول الكميات
// ═══════════════════════════════════════════════════════════════

import { recalculateItem, computeOptimizedFactoryOrder, type CuttingDetailRow, type RecalcResult } from "./boq-recalculator";

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
	"otherStructural",
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
	otherStructural: "عناصر إنشائية أخرى",
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
	otherStructural: "🔧",
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
// Floor Filter Types & Helpers
// ─────────────────────────────────────────────────────────────

export interface FloorFilterOption {
	value: string;   // "all" | "foundations" | floor.id
	label: string;   // Arabic display name
	icon?: string;
	sortOrder: number;
}

interface EnabledFloor {
	id: string;
	label: string;
	icon?: string;
	sortOrder: number;
}

/**
 * Determines which floor group a structural item belongs to.
 * Returns "foundations", a floor id, or "shared".
 */
export function getItemFloorGroup(
	item: StructuralItem,
	enabledFloors?: EnabledFloor[],
): string {
	const { category, subCategory, dimensions } = item;

	// Always foundations
	if (category === "plainConcrete") return "foundations";
	if (category === "foundations") return "foundations";

	// Ground beams → foundations
	if (category === "beams" && subCategory === "groundBeam") return "foundations";

	// Columns
	if (category === "columns") {
		if (
			subCategory &&
			(subCategory.endsWith("_neck") || subCategory === "neck")
		) {
			return "foundations";
		}
		// Match subCategory (floor id) to enabledFloors
		if (subCategory && enabledFloors) {
			const match = enabledFloors.find((f) => f.id === subCategory);
			if (match) return match.id;
		}
		// Fallback: use subCategory as-is if it looks like a floor id
		if (subCategory && subCategory !== "column") return subCategory;
		return "ground";
	}

	// Slabs and blocks — match dimensions.floor (Arabic label) to enabledFloors
	if (category === "slabs" || category === "blocks") {
		const floorLabel = (dimensions as any)?.floor?.toString();
		if (floorLabel && enabledFloors) {
			const match = enabledFloors.find(
				(f) =>
					f.label === floorLabel ||
					floorLabel.includes(f.label) ||
					f.label.includes(floorLabel),
			);
			if (match) return match.id;
		}
		// Fallback: try to match Arabic label to FLOOR_LABELS keys
		if (floorLabel) {
			for (const [key, label] of Object.entries(FLOOR_LABELS)) {
				if (floorLabel === label || floorLabel.includes(label) || label.includes(floorLabel)) {
					return key;
				}
			}
			for (const [key, label] of Object.entries(SLAB_FLOOR_LABELS)) {
				if (floorLabel === label || floorLabel.includes(label) || label.includes(floorLabel)) {
					return key;
				}
			}
		}
		return "ground";
	}

	// Stairs — match dimensions.floor (Arabic label) to enabledFloors, like slabs
	if (category === "stairs") {
		const floorLabel = (dimensions as any)?.floor?.toString();
		if (floorLabel && enabledFloors) {
			const match = enabledFloors.find(
				(f) =>
					f.label === floorLabel ||
					floorLabel.includes(f.label) ||
					f.label.includes(floorLabel),
			);
			if (match) return match.id;
		}
		if (floorLabel) {
			for (const [key, label] of Object.entries(FLOOR_LABELS)) {
				if (floorLabel === label || floorLabel.includes(label) || label.includes(floorLabel)) {
					return key;
				}
			}
		}
		return "shared";
	}

	// Regular beams (non-ground) → shared
	if (category === "beams") return "shared";

	// Other structural → shared (not floor-specific)
	if (category === "otherStructural") return "shared";

	return "ground";
}

/**
 * Builds the list of floor filter options based on actual items present.
 */
export function buildFloorFilterOptions(
	items: StructuralItem[],
	enabledFloors?: EnabledFloor[],
): FloorFilterOption[] {
	const options: FloorFilterOption[] = [
		{ value: "all", label: "المشروع بالكامل", icon: "🏗️", sortOrder: -1 },
	];

	const presentGroups = new Set<string>();
	for (const item of items) {
		presentGroups.add(getItemFloorGroup(item, enabledFloors));
	}

	// Add foundations if any foundation items exist
	if (presentGroups.has("foundations")) {
		options.push({
			value: "foundations",
			label: "الأساسات",
			icon: "🏗️",
			sortOrder: 0,
		});
	}

	// Add each enabled floor that has items
	if (enabledFloors) {
		for (const floor of enabledFloors) {
			if (presentGroups.has(floor.id)) {
				options.push({
					value: floor.id,
					label: floor.label,
					icon: floor.icon,
					sortOrder: floor.sortOrder,
				});
			}
		}
	} else {
		// Fallback: use FLOOR_LABELS for any present floor keys
		const floorKeys = Object.keys(FLOOR_LABELS);
		floorKeys.forEach((key, idx) => {
			if (presentGroups.has(key)) {
				options.push({
					value: key,
					label: FLOOR_LABELS[key],
					sortOrder: idx + 1,
				});
			}
		});
	}

	// Sort by sortOrder
	options.sort((a, b) => a.sortOrder - b.sortOrder);

	return options;
}

/**
 * Filters items by the selected floor value.
 * - "all" → all items
 * - "foundations" → only foundation-group items
 * - floor id → items matching that floor + "shared" items (stairs, regular beams)
 */
export function filterItemsByFloor(
	items: StructuralItem[],
	floorValue: string,
	enabledFloors?: EnabledFloor[],
): StructuralItem[] {
	if (floorValue === "all") return items;

	return items.filter((item) => {
		const group = getItemFloorGroup(item, enabledFloors);
		if (floorValue === "foundations") {
			return group === "foundations";
		}
		// For a specific floor, include matching items + shared items
		return group === floorValue || group === "shared";
	});
}

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
		case "otherStructural":
			return (item.dimensions as any)?.elementType || item.name || "default";
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
		case "otherStructural":
			return key;
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

	// Compute factory order with cross-operation remnant reuse
	const optimizedStocks = computeOptimizedFactoryOrder(allCuttingDetails);
	const factoryOrder = optimizedStocks
		.map((stock) => ({
			diameter: stock.diameter,
			stockLength: stock.stockLength,
			count: stock.count,
			weight: stock.count * stock.stockLength * (REBAR_WEIGHTS_MAP[stock.diameter] || 0),
		}))
		.sort((a, b) => a.diameter - b.diameter);

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
