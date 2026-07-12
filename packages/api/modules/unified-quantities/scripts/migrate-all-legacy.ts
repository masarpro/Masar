// ════════════════════════════════════════════════════════════════
// Unified Quantities — Batch Legacy Migration
// يشغّل جسر الترحيل (نفس منطق procedures/migrate-legacy-study.ts)
// على كل الدراسات المؤهلة دفعة واحدة.
// ════════════════════════════════════════════════════════════════
//
// الاستخدام:
//   pnpm --filter @repo/api migrate:legacy -- --dry-run   (عرض فقط)
//   pnpm --filter @repo/api migrate:legacy                 (تنفيذ فعلي)
//
// - Idempotent: أي دراسة لديها QuantityItem مسبقاً تُتخطى.
// - إضافي فقط: البنود القديمة لا تُحذف أبداً.
// - أنواع التسعير فقط (QUICK_PRICING/CUSTOM_ITEMS/LUMP_SUM_ANALYSIS)
//   مستثناة — لا تمر بمرحلة الكميات أصلاً.

import { db } from "@repo/database";
import {
	planLegacyMigration,
	type CatalogLookupEntry,
	type LegacyFinishingRow,
	type LegacyMepRow,
} from "../lib/legacy-migration";
import { aggregateStudyTotals } from "../pricing/study-aggregator";

const DRY_RUN = process.argv.includes("--dry-run");
const PRICING_ONLY = new Set([
	"QUICK_PRICING",
	"CUSTOM_ITEMS",
	"LUMP_SUM_ANALYSIS",
]);

function dec(v: unknown): number | null {
	if (v === null || v === undefined) return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

async function main() {
	console.log(
		DRY_RUN
			? "🔍 DRY RUN — لا كتابة على قاعدة البيانات"
			: "🚀 تنفيذ فعلي — الترحيل سيُكتب على قاعدة البيانات",
	);

	const catalogRaw = await db.itemCatalogEntry.findMany({
		where: { isActive: true },
		select: {
			itemKey: true,
			domain: true,
			categoryKey: true,
			defaultCalculationMethod: true,
		},
	});
	const catalogByKey = new Map<string, CatalogLookupEntry>(
		catalogRaw.map((e) => [e.itemKey, e]),
	);
	console.log(`📚 الكتالوج: ${catalogByKey.size} بنداً نشطاً`);

	const studies = await db.costStudy.findMany({
		select: {
			id: true,
			organizationId: true,
			name: true,
			studyType: true,
			workScopes: true,
			buildingConfig: true,
			globalMarkupPercent: true,
			createdById: true,
			_count: { select: { finishingItems: true, mepItems: true } },
		},
		orderBy: { createdAt: "asc" },
	});
	console.log(`📋 إجمالي الدراسات: ${studies.length}`);

	const totals = {
		eligible: 0,
		migrated: 0,
		alreadyMigrated: 0,
		nothingToMigrate: 0,
		items: 0,
		unmatched: 0,
		spaces: 0,
		openings: 0,
		errors: 0,
	};

	for (const study of studies) {
		const scopes = Array.isArray(study.workScopes) ? study.workScopes : [];
		const scopeEligible =
			!PRICING_ONLY.has(study.studyType) &&
			(scopes.length === 0 ||
				scopes.includes("FINISHING") ||
				scopes.includes("MEP"));
		if (!scopeEligible) continue;

		const legacyCount = study._count.finishingItems + study._count.mepItems;
		if (legacyCount === 0 && !study.buildingConfig) {
			totals.nothingToMigrate++;
			continue;
		}
		totals.eligible++;

		const label = `"${study.name ?? study.id}" (${study.id})`;
		try {
			const [existingCount, existingContext, finishingRaw, mepRaw] =
				await Promise.all([
					db.quantityItem.count({
						where: {
							costStudyId: study.id,
							organizationId: study.organizationId,
						},
					}),
					db.quantityItemContext.findUnique({
						where: { costStudyId: study.id },
						select: { id: true },
					}),
					db.finishingItem.findMany({
						where: { costStudyId: study.id },
						orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
					}),
					db.mEPItem.findMany({
						where: { costStudyId: study.id },
						orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
					}),
				]);

			const finishingRows: LegacyFinishingRow[] = finishingRaw.map((r) => ({
				id: r.id,
				category: r.category,
				subCategory: r.subCategory,
				name: r.name,
				description: r.description,
				floorId: r.floorId,
				floorName: r.floorName,
				area: dec(r.area),
				length: dec(r.length),
				quantity: dec(r.quantity),
				unit: r.unit,
				wastagePercent: dec(r.wastagePercent),
				materialPrice: dec(r.materialPrice),
				laborPrice: dec(r.laborPrice),
				brand: r.brand,
				qualityLevel: r.qualityLevel,
				specifications: r.specifications,
				specData: r.specData,
				scope: r.scope,
				isEnabled: r.isEnabled,
				sortOrder: r.sortOrder,
			}));

			const mepRows: LegacyMepRow[] = mepRaw.map((r) => ({
				id: r.id,
				category: r.category,
				subCategory: r.subCategory,
				itemType: r.itemType,
				name: r.name,
				floorId: r.floorId,
				floorName: r.floorName,
				roomName: r.roomName,
				scope: r.scope,
				quantity: dec(r.quantity),
				length: dec(r.length),
				area: dec(r.area),
				unit: r.unit,
				wastagePercent: dec(r.wastagePercent),
				materialPrice: dec(r.materialPrice),
				laborPrice: dec(r.laborPrice),
				specifications: r.specifications,
				specData: r.specData,
				qualityLevel: r.qualityLevel,
				isEnabled: r.isEnabled,
				sortOrder: r.sortOrder,
			}));

			const plan = planLegacyMigration(
				{
					existingQuantityItemCount: existingCount,
					hasExistingContext: existingContext !== null,
					finishingRows,
					mepRows,
					buildingConfig: study.buildingConfig,
					globalMarkupPercent: Number(study.globalMarkupPercent) || 0,
				},
				catalogByKey,
			);

			if (plan.skip) {
				totals.alreadyMigrated++;
				console.log(
					`⏭️  ${label}: مرحَّلة مسبقاً (${existingCount} بنداً موحداً موجوداً)`,
				);
				continue;
			}

			console.log(
				`${DRY_RUN ? "🔍" : "✅"} ${label}: تشطيبات ${plan.stats.migratedFinishing} + كهروميكانيكا ${plan.stats.migratedMep}` +
					` (يدوي بلا مطابقة: ${plan.stats.unmatchedToManual}, متخطى: ${plan.stats.skipped})` +
					(plan.context
						? ` + سياق [مساحات ${plan.context.spaces.length}, فتحات ${plan.context.openings.length}]`
						: ""),
			);

			totals.items += plan.items.length;
			totals.unmatched += plan.stats.unmatchedToManual;
			totals.spaces += plan.context?.spaces.length ?? 0;
			totals.openings += plan.context?.openings.length ?? 0;

			if (DRY_RUN) continue;

			await db.$transaction(async (tx) => {
				if (plan.context) {
					const ctx = await tx.quantityItemContext.create({
						data: {
							costStudyId: study.id,
							organizationId: study.organizationId,
							totalFloorArea: plan.context.totalFloorArea,
							totalExteriorWallArea: plan.context.totalExteriorWallArea,
							totalRoofArea: plan.context.totalRoofArea,
							totalPerimeter: plan.context.totalPerimeter,
							averageFloorHeight: plan.context.averageFloorHeight,
							hasBasement: plan.context.hasBasement,
							hasRoof: plan.context.hasRoof,
							hasYard: plan.context.hasYard,
							yardArea: plan.context.yardArea,
							fenceLength: plan.context.fenceLength,
							generalNotes: "مُرحَّل تلقائياً من إعدادات المبنى القديمة",
						},
					});
					if (plan.context.spaces.length > 0) {
						await tx.quantityContextSpace.createMany({
							data: plan.context.spaces.map((s) => ({
								contextId: ctx.id,
								organizationId: study.organizationId,
								name: s.name,
								spaceType: s.spaceType,
								floorLabel: s.floorLabel,
								length: s.length,
								width: s.width,
								height: s.height,
								floorArea: s.floorArea,
								computedFloorArea: s.computedFloorArea,
								computedWallArea: s.computedWallArea,
								isWetArea: s.isWetArea,
								isExterior: s.isExterior,
								sortOrder: s.sortOrder,
							})),
						});
					}
					if (plan.context.openings.length > 0) {
						await tx.quantityContextOpening.createMany({
							data: plan.context.openings.map((o) => ({
								contextId: ctx.id,
								organizationId: study.organizationId,
								name: o.name,
								openingType: o.openingType,
								width: o.width,
								height: o.height,
								computedArea: o.computedArea,
								count: o.count,
								isExterior: o.isExterior,
								deductFromInteriorFinishes: o.deductFromInteriorFinishes,
							})),
						});
					}
				}
				if (plan.items.length > 0) {
					await tx.quantityItem.createMany({
						data: plan.items.map((p) => ({
							costStudyId: study.id,
							organizationId: study.organizationId,
							domain: p.domain,
							categoryKey: p.categoryKey,
							catalogItemKey: p.catalogItemKey,
							displayName: p.displayName,
							sortOrder: p.sortOrder,
							isEnabled: p.isEnabled,
							primaryValue: p.primaryValue,
							calculationMethod: p.calculationMethod,
							unit: p.unit,
							computedQuantity: p.computedQuantity,
							wastagePercent: p.wastagePercent,
							effectiveQuantity: p.effectiveQuantity,
							contextScope: p.contextScope,
							specMaterialName: p.specMaterialName,
							specMaterialBrand: p.specMaterialBrand,
							specMaterialGrade: p.specMaterialGrade,
							specNotes: p.specNotes,
							materialUnitPrice: p.materialUnitPrice,
							laborUnitPrice: p.laborUnitPrice,
							materialCost: p.materialCost,
							laborCost: p.laborCost,
							totalCost: p.totalCost,
							markupMethod: "percentage",
							hasCustomMarkup: false,
							sellUnitPrice: p.sellUnitPrice,
							sellTotalAmount: p.sellTotalAmount,
							profitAmount: p.profitAmount,
							profitPercent: p.profitPercent,
							notes: p.notes,
							createdById: study.createdById,
						})),
					});
				}
			});

			await aggregateStudyTotals(study.id, study.organizationId);
			totals.migrated++;
		} catch (e) {
			totals.errors++;
			console.error(`❌ ${label}:`, e instanceof Error ? e.message : e);
		}
	}

	console.log("\n═══ الملخص ═══");
	console.log(`مؤهلة للترحيل: ${totals.eligible}`);
	console.log(`رُحّلت فعلياً: ${DRY_RUN ? 0 : totals.migrated} ${DRY_RUN ? "(dry-run)" : ""}`);
	console.log(`مرحَّلة مسبقاً (تخطي): ${totals.alreadyMigrated}`);
	console.log(`لا شيء للترحيل: ${totals.nothingToMigrate}`);
	console.log(`إجمالي البنود المخطط لها: ${totals.items} (يدوي بلا مطابقة: ${totals.unmatched})`);
	console.log(`مساحات: ${totals.spaces}, فتحات: ${totals.openings}`);
	console.log(`أخطاء: ${totals.errors}`);
	if (totals.errors > 0) process.exitCode = 1;
}

main()
	.then(async () => {
		await db.$disconnect();
	})
	.catch(async (e) => {
		console.error("❌ فشل الترحيل الجماعي:", e);
		await db.$disconnect();
		process.exit(1);
	});
