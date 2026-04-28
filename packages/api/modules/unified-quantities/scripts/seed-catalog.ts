// ════════════════════════════════════════════════════════════════
// Unified Quantities Engine — Catalog Seed
// يقوم بـ upsert لكل بنود الكتالوج في جدول item_catalog_entries
// ════════════════════════════════════════════════════════════════
//
// الاستخدام:
//   pnpm --filter @repo/api seed:catalog
//
// يستخدم upsert (where: itemKey) — آمن لإعادة التشغيل.

import { db } from "@repo/database";
import { FULL_CATALOG, PRESETS } from "../catalog";

async function main() {
	console.log(`🌱 Seeding ${FULL_CATALOG.length} catalog entries...`);

	let inserted = 0;
	let updated = 0;

	for (const entry of FULL_CATALOG) {
		const existing = await db.itemCatalogEntry.findUnique({
			where: { itemKey: entry.itemKey },
			select: { id: true },
		});

		await db.itemCatalogEntry.upsert({
			where: { itemKey: entry.itemKey },
			create: {
				itemKey: entry.itemKey,
				domain: entry.domain,
				categoryKey: entry.categoryKey,
				subcategoryKey: entry.subcategoryKey ?? null,
				nameAr: entry.nameAr,
				nameEn: entry.nameEn,
				descriptionAr: entry.descriptionAr ?? null,
				descriptionEn: entry.descriptionEn ?? null,
				icon: entry.icon,
				color: entry.color ?? null,
				unit: entry.unit,
				defaultWastagePercent: entry.defaultWastagePercent,
				defaultCalculationMethod: entry.defaultCalculationMethod,
				requiredFields: entry.requiredFields as never,
				defaultMaterialUnitPrice: entry.defaultMaterialUnitPrice ?? null,
				defaultLaborUnitPrice: entry.defaultLaborUnitPrice ?? null,
				commonMaterials: (entry.commonMaterials ?? null) as never,
				commonColors: (entry.commonColors ?? null) as never,
				linkableFrom: entry.linkableFrom ?? [],
				legacyDerivationType: entry.legacyDerivationType ?? null,
				legacyScope: entry.legacyScope ?? null,
				displayOrder: entry.displayOrder,
				isActive: true,
			},
			update: {
				domain: entry.domain,
				categoryKey: entry.categoryKey,
				subcategoryKey: entry.subcategoryKey ?? null,
				nameAr: entry.nameAr,
				nameEn: entry.nameEn,
				descriptionAr: entry.descriptionAr ?? null,
				descriptionEn: entry.descriptionEn ?? null,
				icon: entry.icon,
				color: entry.color ?? null,
				unit: entry.unit,
				defaultWastagePercent: entry.defaultWastagePercent,
				defaultCalculationMethod: entry.defaultCalculationMethod,
				requiredFields: entry.requiredFields as never,
				defaultMaterialUnitPrice: entry.defaultMaterialUnitPrice ?? null,
				defaultLaborUnitPrice: entry.defaultLaborUnitPrice ?? null,
				commonMaterials: (entry.commonMaterials ?? null) as never,
				commonColors: (entry.commonColors ?? null) as never,
				linkableFrom: entry.linkableFrom ?? [],
				legacyDerivationType: entry.legacyDerivationType ?? null,
				legacyScope: entry.legacyScope ?? null,
				displayOrder: entry.displayOrder,
			},
		});

		if (existing) updated++;
		else inserted++;
	}

	console.log(`✅ Catalog: ${inserted} inserted, ${updated} updated, ${FULL_CATALOG.length} total`);
	console.log(`📚 Presets: ${PRESETS.length} (kept in code, not seeded to DB)`);

	// Summary by domain
	const byDomain = FULL_CATALOG.reduce<Record<string, number>>((acc, e) => {
		acc[e.domain] = (acc[e.domain] ?? 0) + 1;
		return acc;
	}, {});
	console.log("📊 By domain:", byDomain);
}

main()
	.then(async () => {
		await db.$disconnect();
		process.exit(0);
	})
	.catch(async (e) => {
		console.error("❌ Seed failed:", e);
		await db.$disconnect();
		process.exit(1);
	});
