import { db, orgAuditLog } from "@repo/database";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { studyScope } from "../schemas/common";
import {
	loadStudyForMigration,
	requireStudyAccess,
} from "../lib/verify-access";
import {
	planLegacyMigration,
	type CatalogLookupEntry,
	type LegacyFinishingRow,
	type LegacyMepRow,
} from "../lib/legacy-migration";
import { aggregateStudyTotals } from "../pricing/study-aggregator";

/** Prisma Decimal | null → number | null (num() لا يقبل كائن Decimal) */
function dec(v: unknown): number | null {
	if (v === null || v === undefined) return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

/**
 * POST /unified-quantities/migrate-legacy-study
 *
 * جسر الترحيل: ينسخ بنود FinishingItem/MEPItem القديمة + buildingConfig
 * إلى QuantityItem/QuantityItemContext حتى لا تظهر الدراسات القديمة
 * فارغة عند تفعيل NEXT_PUBLIC_FEATURE_UNIFIED_QUANTITIES.
 *
 * قرارات التصميم (التفاصيل في lib/legacy-migration.ts):
 * - الكميات المحفوظة هي الحقيقة — لا تُعاد أي اشتقاقات.
 * - بند بلا مطابقة كتالوج → calculationMethod="manual" بكامل بياناته
 *   (لا يسقط أي بند صامتاً).
 * - Idempotent: وجود أي QuantityItem مسبقاً → إرجاع العدّادات بلا تكرار
 *   (alreadyMigrated=true). البنود القديمة لا تُحذف — تبقى كمرجع.
 * - يستخدم loadStudyForMigration وليس loadStudy: فحص العلم هناك يمنع
 *   الكتابة قبل تفعيله، والترحيل يجب أن يسبق التفعيل (تجاوز مقصود
 *   وموثّق في verify-access.ts).
 */
export const migrateLegacyStudy = subscriptionProcedure
	.input(studyScope)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const study = await loadStudyForMigration(
			input.costStudyId,
			input.organizationId,
		);

		const [existingCount, existingContext, finishingRaw, mepRaw, catalogRaw] =
			await Promise.all([
				db.quantityItem.count({
					where: {
						costStudyId: input.costStudyId,
						organizationId: input.organizationId,
					},
				}),
				db.quantityItemContext.findUnique({
					where: { costStudyId: input.costStudyId },
					select: { id: true },
				}),
				db.finishingItem.findMany({
					where: { costStudyId: input.costStudyId },
					orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
				}),
				db.mEPItem.findMany({
					where: { costStudyId: input.costStudyId },
					orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
				}),
				db.itemCatalogEntry.findMany({
					where: { isActive: true },
					select: {
						itemKey: true,
						domain: true,
						categoryKey: true,
						defaultCalculationMethod: true,
					},
				}),
			]);

		const catalogByKey = new Map<string, CatalogLookupEntry>(
			catalogRaw.map((e) => [e.itemKey, e]),
		);

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
			return {
				alreadyMigrated: true,
				existingItems: existingCount,
				migratedFinishing: 0,
				migratedMep: 0,
				skipped: 0,
				unmatchedToManual: 0,
				spacesCreated: 0,
				openingsCreated: 0,
				legacyFinishingCount: finishingRows.length,
				legacyMepCount: mepRows.length,
			};
		}

		const migrationResult = await db.$transaction(async (tx) => {
			// اقفل صف الدراسة (FOR UPDATE) لمنع ترحيلين متزامنين من إدراج
			// البنود مرتين — كلاهما كان يقرأ count=0 قبل بدء المعاملة فيُضاعف.
			await tx.$queryRaw`
				SELECT id FROM cost_studies
				WHERE id = ${input.costStudyId}
				  AND organization_id = ${input.organizationId}
				FOR UPDATE
			`;

			// أعد فحص العدّاد داخل القفل: لو رُحّلت الدراسة بالفعل (أو بالتوازي)
			// → تخطٍّ كامل بلا تكرار.
			const lockedCount = await tx.quantityItem.count({
				where: {
					costStudyId: input.costStudyId,
					organizationId: input.organizationId,
				},
			});
			if (lockedCount > 0) {
				return {
					alreadyMigrated: true as const,
					existingItems: lockedCount,
					spacesCreated: 0,
					openingsCreated: 0,
				};
			}

			let spacesCreated = 0;
			let openingsCreated = 0;

			// 1. السياق المشترك من buildingConfig (فقط لو غير موجود)
			if (plan.context) {
				const ctx = await tx.quantityItemContext.create({
					data: {
						costStudyId: input.costStudyId,
						organizationId: input.organizationId,
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
					const res = await tx.quantityContextSpace.createMany({
						data: plan.context.spaces.map((s) => ({
							contextId: ctx.id,
							organizationId: input.organizationId,
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
					spacesCreated = res.count;
				}

				if (plan.context.openings.length > 0) {
					const res = await tx.quantityContextOpening.createMany({
						data: plan.context.openings.map((o) => ({
							contextId: ctx.id,
							organizationId: input.organizationId,
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
					openingsCreated = res.count;
				}
			}

			// 2. البنود المرحَّلة (كل القيم المحسوبة جاهزة من الـ planner)
			if (plan.items.length > 0) {
				await tx.quantityItem.createMany({
					data: plan.items.map((p) => ({
						costStudyId: input.costStudyId,
						organizationId: input.organizationId,
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
						createdById: context.user.id,
					})),
				});
			}

			return {
				alreadyMigrated: false as const,
				existingItems: 0,
				spacesCreated,
				openingsCreated,
			};
		});

		// لو خسر هذا الاستدعاء السباق (ترحيل متزامن سبقه داخل القفل) → أرجع
		// استجابة "مُرحَّل مسبقاً" بلا إعادة تجميع أو audit.
		if (migrationResult.alreadyMigrated) {
			return {
				alreadyMigrated: true,
				existingItems: migrationResult.existingItems,
				migratedFinishing: 0,
				migratedMep: 0,
				skipped: 0,
				unmatchedToManual: 0,
				spacesCreated: 0,
				openingsCreated: 0,
				legacyFinishingCount: finishingRows.length,
				legacyMepCount: mepRows.length,
			};
		}

		const { spacesCreated, openingsCreated } = migrationResult;

		// 3. تحديث إجماليات الدراسة الـ cached (خارج الـ transaction — كباقي
		//    procedures الوحدة)
		const totals = await aggregateStudyTotals(
			input.costStudyId,
			input.organizationId,
		);

		// 4. Audit — لا يوجد OrgAuditAction مخصص للدراسات، نستخدم
		//    SETTINGS_UPDATED مع metadata واضحة (إضافة action جديد يتطلب
		//    تعديل schema.prisma وهو خارج نطاق هذه المهمة)
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "SETTINGS_UPDATED",
			entityType: "cost_study_unified_migration",
			entityId: input.costStudyId,
			metadata: {
				operation: "unified_quantities_legacy_migration",
				migratedFinishing: plan.stats.migratedFinishing,
				migratedMep: plan.stats.migratedMep,
				skipped: plan.stats.skipped,
				unmatchedToManual: plan.stats.unmatchedToManual,
				spacesCreated,
				openingsCreated,
			},
		});

		return {
			alreadyMigrated: false,
			existingItems: 0,
			migratedFinishing: plan.stats.migratedFinishing,
			migratedMep: plan.stats.migratedMep,
			skipped: plan.stats.skipped,
			unmatchedToManual: plan.stats.unmatchedToManual,
			spacesCreated,
			openingsCreated,
			legacyFinishingCount: finishingRows.length,
			legacyMepCount: mepRows.length,
			studyTotals: totals,
		};
	});
