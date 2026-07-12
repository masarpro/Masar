import { describe, it, expect } from "vitest";
import {
	planLegacyMigration,
	planContextFromBuildingConfig,
	resolveFinishingCatalogKey,
	resolveMepCatalogKey,
	type CatalogLookupEntry,
	type LegacyFinishingRow,
	type LegacyMepRow,
	type MigrationPlanInput,
} from "../../../modules/unified-quantities/lib/legacy-migration";

// ════════════════════════════════════════════════════════════════
// Helpers — كتالوج مصغّر يحاكي ItemCatalogEntry من الـ DB
// ════════════════════════════════════════════════════════════════

function catalog(entries: CatalogLookupEntry[]): Map<string, CatalogLookupEntry> {
	return new Map(entries.map((e) => [e.itemKey, e]));
}

const CATALOG = catalog([
	{
		itemKey: "finishing.paint.interior",
		domain: "FINISHING",
		categoryKey: "paint",
		defaultCalculationMethod: "direct_area",
	},
	{
		itemKey: "finishing.plaster.interior",
		domain: "FINISHING",
		categoryKey: "plaster",
		defaultCalculationMethod: "direct_area",
	},
	{
		itemKey: "finishing.walls.kitchen_ceramic",
		domain: "FINISHING",
		categoryKey: "walls",
		defaultCalculationMethod: "direct_area",
	},
	{
		itemKey: "finishing.insulation.foundation",
		domain: "FINISHING",
		categoryKey: "insulation",
		defaultCalculationMethod: "direct_area",
	},
	{
		itemKey: "finishing.doors.interior_wood",
		domain: "FINISHING",
		categoryKey: "doors",
		defaultCalculationMethod: "per_room",
	},
	{
		itemKey: "mep.electrical.outlet_normal",
		domain: "MEP",
		categoryKey: "electrical",
		defaultCalculationMethod: "per_unit",
	},
	{
		itemKey: "mep.plumbing.pipe_run",
		domain: "MEP",
		categoryKey: "plumbing",
		defaultCalculationMethod: "length_only",
	},
	{
		itemKey: "special.elevator",
		domain: "SPECIAL",
		categoryKey: "special",
		defaultCalculationMethod: "per_unit",
	},
]);

function finishingRow(overrides: Partial<LegacyFinishingRow>): LegacyFinishingRow {
	return {
		id: "fin-1",
		category: "FINISHING_INTERIOR_PAINT",
		name: "دهان داخلي",
		unit: "m2",
		area: 100,
		wastagePercent: 10,
		materialPrice: 18,
		laborPrice: 7,
		isEnabled: true,
		sortOrder: 0,
		...overrides,
	};
}

function mepRow(overrides: Partial<LegacyMepRow>): LegacyMepRow {
	return {
		id: "mep-1",
		category: "ELECTRICAL",
		subCategory: "power_outlets",
		itemType: "outlet_13a",
		name: "مقبس عادي",
		unit: "عدد",
		quantity: 24,
		wastagePercent: 0,
		materialPrice: 35,
		laborPrice: 15,
		isEnabled: true,
		sortOrder: 0,
		...overrides,
	};
}

function baseInput(overrides: Partial<MigrationPlanInput>): MigrationPlanInput {
	return {
		existingQuantityItemCount: 0,
		hasExistingContext: false,
		finishingRows: [],
		mepRows: [],
		buildingConfig: null,
		globalMarkupPercent: 30,
		...overrides,
	};
}

// ════════════════════════════════════════════════════════════════
// المطابقة مع الكتالوج
// ════════════════════════════════════════════════════════════════

describe("resolveFinishingCatalogKey", () => {
	it("maps plain categories", () => {
		expect(
			resolveFinishingCatalogKey({ category: "FINISHING_INTERIOR_PAINT", name: "" }),
		).toBe("finishing.paint.interior");
	});

	it("disambiguates waterproofing by subCategory", () => {
		expect(
			resolveFinishingCatalogKey({
				category: "FINISHING_WATERPROOFING",
				subCategory: "WP_FOUNDATIONS",
				name: "",
			}),
		).toBe("finishing.insulation.foundation");
		// حمامات — لا مقابل في الكتالوج
		expect(
			resolveFinishingCatalogKey({
				category: "FINISHING_WATERPROOFING",
				subCategory: "WP_BATHROOMS",
				name: "",
			}),
		).toBeNull();
	});

	it("splits wall tiles kitchen vs bathroom by saved name", () => {
		expect(
			resolveFinishingCatalogKey({
				category: "FINISHING_WALL_TILES",
				name: "سبلاش باك مطبخ",
			}),
		).toBe("finishing.walls.kitchen_ceramic");
		expect(
			resolveFinishingCatalogKey({
				category: "FINISHING_WALL_TILES",
				name: "تكسيات جدران حمامات",
			}),
		).toBe("finishing.walls.bathroom_ceramic");
	});

	it("returns null for categories without a catalog counterpart", () => {
		expect(
			resolveFinishingCatalogKey({ category: "FINISHING_RAILINGS", name: "درابزين" }),
		).toBeNull();
	});
});

describe("resolveMepCatalogKey", () => {
	it("matches by itemType first", () => {
		expect(resolveMepCatalogKey({ itemType: "outlet_13a" })).toBe(
			"mep.electrical.outlet_normal",
		);
		expect(resolveMepCatalogKey({ itemType: "elevator_6person" })).toBe(
			"special.elevator",
		);
	});

	it("falls back to subCategory", () => {
		expect(
			resolveMepCatalogKey({ itemType: "ppr_20mm", subCategory: "pipes" }),
		).toBe("mep.plumbing.pipe_run");
	});

	it("returns null when nothing matches", () => {
		expect(
			resolveMepCatalogKey({ itemType: "manhole_60x60", subCategory: "drainage" }),
		).toBeNull();
	});
});

// ════════════════════════════════════════════════════════════════
// planLegacyMigration — بنود مطابقة
// ════════════════════════════════════════════════════════════════

describe("planLegacyMigration — catalog-matched mapping", () => {
	it("maps a matched finishing row keeping saved quantities as truth", () => {
		const plan = planLegacyMigration(
			baseInput({ finishingRows: [finishingRow({})] }),
			CATALOG,
		);

		expect(plan.skip).toBe(false);
		expect(plan.items).toHaveLength(1);
		const item = plan.items[0];
		expect(item.matched).toBe(true);
		expect(item.domain).toBe("FINISHING");
		expect(item.categoryKey).toBe("paint");
		expect(item.catalogItemKey).toBe("finishing.paint.interior");
		// طريقة بسيطة → primary = الأساس والهدر محمول
		expect(item.calculationMethod).toBe("direct_area");
		expect(item.primaryValue).toBe(100);
		expect(item.wastagePercent).toBe(10);
		expect(item.computedQuantity).toBe(100);
		expect(item.effectiveQuantity).toBe(110); // 100 × 1.10
		// الأسعار محمولة والتكلفة = effective × unit price
		expect(item.materialUnitPrice).toBe(18);
		expect(item.laborUnitPrice).toBe(7);
		expect(item.materialCost).toBe(1980); // 110 × 18
		expect(item.laborCost).toBe(770); // 110 × 7
		expect(item.totalCost).toBe(2750);
		// التسعير عبر Global markup 30%
		expect(item.sellUnitPrice).toBe(32.5); // 25 × 1.3
		expect(plan.stats.migratedFinishing).toBe(1);
		expect(plan.stats.unmatchedToManual).toBe(0);
	});

	it("maps a matched MEP row (count unit → no wastage applied)", () => {
		const plan = planLegacyMigration(
			baseInput({ mepRows: [mepRow({ wastagePercent: 10 })] }),
			CATALOG,
		);

		const item = plan.items[0];
		expect(item.matched).toBe(true);
		expect(item.domain).toBe("MEP");
		expect(item.catalogItemKey).toBe("mep.electrical.outlet_normal");
		expect(item.calculationMethod).toBe("per_unit");
		// وحدة عدّ: المحرك القديم لا يطبق هدراً — تُصفَّر النسبة للحفاظ على الكمية
		expect(item.wastagePercent).toBe(0);
		expect(item.effectiveQuantity).toBe(24);
		expect(plan.stats.migratedMep).toBe(1);
	});

	it("falls back to manual for matched entries with complex default methods", () => {
		// الأبواب الداخلية defaultCalculationMethod=per_room — إعادة حسابها
		// تتطلب سياق غرف، فالأمان = manual بالكمية الفعّالة
		const plan = planLegacyMigration(
			baseInput({
				finishingRows: [
					finishingRow({
						category: "FINISHING_INTERIOR_DOORS",
						name: "أبواب داخلية",
						area: null,
						quantity: 8,
						unit: "عدد",
						wastagePercent: 0,
					}),
				],
			}),
			CATALOG,
		);

		const item = plan.items[0];
		expect(item.matched).toBe(true);
		expect(item.catalogItemKey).toBe("finishing.doors.interior_wood");
		expect(item.calculationMethod).toBe("manual");
		expect(item.primaryValue).toBe(8);
		expect(item.effectiveQuantity).toBe(8);
	});
});

// ════════════════════════════════════════════════════════════════
// unmatched → manual fallback (لا شيء يسقط صامتاً)
// ════════════════════════════════════════════════════════════════

describe("planLegacyMigration — unmatched → manual fallback", () => {
	it("keeps unmatched finishing rows as manual items with all data", () => {
		const plan = planLegacyMigration(
			baseInput({
				finishingRows: [
					finishingRow({
						id: "fin-x",
						category: "FINISHING_RAILINGS",
						name: "درابزين استانلس",
						description: "درابزين درج داخلي",
						area: null,
						length: 12,
						unit: "m",
						wastagePercent: 5,
						materialPrice: 250,
						laborPrice: 80,
						floorName: "الدور الأول",
					}),
				],
			}),
			CATALOG,
		);

		const item = plan.items[0];
		expect(item.matched).toBe(false);
		expect(item.calculationMethod).toBe("manual");
		expect(item.domain).toBe("FINISHING");
		expect(item.catalogItemKey).toBe("legacy.FINISHING_RAILINGS");
		// الكمية الفعّالة القديمة = 12 × 1.05
		expect(item.primaryValue).toBe(12.6);
		expect(item.effectiveQuantity).toBe(12.6);
		expect(item.wastagePercent).toBe(0); // الهدر مدموج في الكمية
		expect(item.unit).toBe("m");
		expect(item.displayName).toContain("درابزين استانلس");
		expect(item.displayName).toContain("الدور الأول");
		expect(item.notes).toContain("درابزين درج داخلي");
		expect(item.notes).toContain("FINISHING_RAILINGS");
		expect(plan.stats.unmatchedToManual).toBe(1);
	});

	it("keeps unmatched MEP rows with sentinel catalog key", () => {
		const plan = planLegacyMigration(
			baseInput({
				mepRows: [
					mepRow({
						id: "mep-x",
						category: "FIREFIGHTING",
						subCategory: "cabinets",
						itemType: "hose_cabinet",
						name: "كبينة حريق",
						quantity: 3,
					}),
				],
			}),
			CATALOG,
		);

		const item = plan.items[0];
		expect(item.matched).toBe(false);
		expect(item.calculationMethod).toBe("manual");
		expect(item.catalogItemKey).toBe("legacy.MEP_FIREFIGHTING.hose_cabinet");
		expect(item.effectiveQuantity).toBe(3);
		expect(plan.stats.unmatchedToManual).toBe(1);
	});

	it("never drops enabled rows: migrated + skipped = total", () => {
		const plan = planLegacyMigration(
			baseInput({
				finishingRows: [
					finishingRow({ id: "a" }),
					finishingRow({ id: "b", category: "FINISHING_ROOF" }),
					finishingRow({ id: "c", isEnabled: false }),
				],
				mepRows: [mepRow({ id: "d" }), mepRow({ id: "e", isEnabled: false })],
			}),
			CATALOG,
		);

		expect(plan.stats.migratedFinishing).toBe(2);
		expect(plan.stats.migratedMep).toBe(1);
		expect(plan.stats.skipped).toBe(2); // المعطّلة فقط
		expect(
			plan.stats.migratedFinishing + plan.stats.migratedMep + plan.stats.skipped,
		).toBe(5);
	});
});

// ════════════════════════════════════════════════════════════════
// Idempotency guard
// ════════════════════════════════════════════════════════════════

describe("planLegacyMigration — idempotency", () => {
	it("skips entirely when unified items already exist", () => {
		const plan = planLegacyMigration(
			baseInput({
				existingQuantityItemCount: 7,
				finishingRows: [finishingRow({})],
				mepRows: [mepRow({})],
				buildingConfig: { floors: [{ name: "أرضي", area: 200, height: 3 }] },
			}),
			CATALOG,
		);

		expect(plan.skip).toBe(true);
		expect(plan.skipReason).toBe("already_migrated");
		expect(plan.items).toHaveLength(0);
		expect(plan.context).toBeNull();
		expect(plan.stats.migratedFinishing).toBe(0);
		expect(plan.stats.migratedMep).toBe(0);
	});

	it("does not recreate context when one already exists", () => {
		const plan = planLegacyMigration(
			baseInput({
				hasExistingContext: true,
				finishingRows: [finishingRow({})],
				buildingConfig: {
					floors: [{ name: "أرضي", area: 200, height: 3, floorType: "GROUND" }],
				},
			}),
			CATALOG,
		);

		expect(plan.skip).toBe(false);
		expect(plan.context).toBeNull();
		expect(plan.items).toHaveLength(1);
	});

	it("is deterministic — same input produces the same plan", () => {
		const input = baseInput({
			finishingRows: [finishingRow({}), finishingRow({ id: "f2", category: "FINISHING_ROOF" })],
			mepRows: [mepRow({})],
		});
		const a = planLegacyMigration(input, CATALOG);
		const b = planLegacyMigration(input, CATALOG);
		expect(a).toEqual(b);
	});
});

// ════════════════════════════════════════════════════════════════
// buildingConfig → Context / Spaces / Openings
// ════════════════════════════════════════════════════════════════

describe("planContextFromBuildingConfig", () => {
	const config = {
		totalLandArea: 400,
		buildingPerimeter: 60,
		landPerimeter: 90,
		hasGarden: true,
		floors: [
			{
				id: "f1",
				name: "الدور الأرضي",
				area: 200,
				height: 3.2,
				floorType: "GROUND",
				isRepeated: false,
				repeatCount: 1,
				rooms: [
					{ id: "r1", name: "مجلس", length: 5, width: 4, type: "majlis" },
					{ id: "r2", name: "حمام", length: 2, width: 2, type: "bathroom" },
				],
				openings: [
					{
						id: "o1",
						type: "door",
						subType: "باب رئيسي",
						width: 1.2,
						height: 2.4,
						count: 1,
						isExternal: true,
					},
					{
						id: "o2",
						type: "window",
						subType: "نافذة كبيرة",
						width: 1.5,
						height: 1.5,
						count: 4,
						isExternal: true,
					},
				],
			},
			{
				id: "f2",
				name: "الدور الأول",
				area: 180,
				height: 3,
				floorType: "UPPER",
				isRepeated: true,
				repeatCount: 2,
				rooms: [],
				openings: [],
			},
		],
	};

	it("builds context totals, spaces, and openings", () => {
		const ctx = planContextFromBuildingConfig(config);
		expect(ctx).not.toBeNull();
		if (!ctx) return;

		// 200 + 180×2
		expect(ctx.totalFloorArea).toBe(560);
		expect(ctx.totalPerimeter).toBe(60);
		// (3.2 + 3×2) × 60
		expect(ctx.totalExteriorWallArea).toBe(552);
		expect(ctx.fenceLength).toBe(90);
		expect(ctx.hasYard).toBe(true);
		expect(ctx.hasBasement).toBe(false);

		// غرفتان في الأرضي + مساحة دور واحدة للأول (بلا غرف)
		expect(ctx.spaces).toHaveLength(3);
		const bathroom = ctx.spaces.find((s) => s.name === "حمام");
		expect(bathroom?.isWetArea).toBe(true);
		expect(bathroom?.computedFloorArea).toBe(4);
		expect(bathroom?.floorLabel).toBe("الدور الأرضي");
		const floorSpace = ctx.spaces.find((s) => s.name === "الدور الأول");
		expect(floorSpace?.spaceType).toBe("custom");
		expect(floorSpace?.floorArea).toBe(180);

		// الفتحات
		expect(ctx.openings).toHaveLength(2);
		const window = ctx.openings.find((o) => o.openingType === "window");
		expect(window?.computedArea).toBe(2.25);
		expect(window?.count).toBe(4);
		expect(window?.isExterior).toBe(true);
		expect(window?.deductFromInteriorFinishes).toBe(false);
	});

	it("returns null for empty/invalid config", () => {
		expect(planContextFromBuildingConfig(null)).toBeNull();
		expect(planContextFromBuildingConfig({})).toBeNull();
		expect(planContextFromBuildingConfig({ floors: [] })).toBeNull();
		expect(planContextFromBuildingConfig("garbage")).toBeNull();
	});
});
