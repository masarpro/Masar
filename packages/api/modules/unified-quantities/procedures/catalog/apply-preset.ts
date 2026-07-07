import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { applyPresetSchema } from "../../schemas/catalog.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";
import { getPreset } from "../../catalog";

/**
 * POST /unified-quantities/presets/apply
 * ينشئ بنود من باقة جاهزة. يقرأ الكتالوج من DB لجلب defaults.
 * بعد الإنشاء يستدعي aggregator لتحديث إجماليات الدراسة.
 */
export const applyPreset = subscriptionProcedure
	.input(applyPresetSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		const preset = getPreset(input.presetKey);
		if (!preset) {
			throw new ORPCError("NOT_FOUND", {
				message: `الباقة غير موجودة: ${input.presetKey}`,
			});
		}

		const catalogEntries = await db.itemCatalogEntry.findMany({
			where: { itemKey: { in: preset.itemKeys }, isActive: true },
		});
		const byKey = new Map(catalogEntries.map((e) => [e.itemKey, e]));

		// أعلى sortOrder حالي + 10 لكل بند جديد
		const maxSort = await db.quantityItem.aggregate({
			where: { costStudyId: input.costStudyId, organizationId: input.organizationId },
			_max: { sortOrder: true },
		});
		const baseSort = (maxSort._max.sortOrder ?? -10) + 10;

		const skipped: string[] = preset.itemKeys.filter((key) => !byKey.has(key));
		const entries = preset.itemKeys
			.map((key) => byKey.get(key))
			.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

		// دفعة واحدة بدل create لكل بند (N round-trips → 1) — الاستجابة تحتاج
		// البنود المنشأة نفسها، لذلك createManyAndReturn بدل createMany.
		const created =
			entries.length > 0
				? await db.quantityItem.createManyAndReturn({
						data: entries.map((entry, i) => ({
							costStudyId: input.costStudyId,
							organizationId: input.organizationId,
							domain: entry.domain,
							categoryKey: entry.categoryKey,
							catalogItemKey: entry.itemKey,
							displayName: entry.nameAr,
							sortOrder: baseSort + i * 10,
							isEnabled: true,
							calculationMethod: entry.defaultCalculationMethod,
							unit: entry.unit,
							wastagePercent: entry.defaultWastagePercent,
							materialUnitPrice: entry.defaultMaterialUnitPrice,
							laborUnitPrice: entry.defaultLaborUnitPrice,
							markupMethod: "percentage",
							hasCustomMarkup: false,
							computedQuantity: 0,
							effectiveQuantity: 0,
							createdById: context.user.id,
						})),
					})
				: [];
		// ترتيب الإرجاع من createManyAndReturn غير مضمون — ثبّته حسب sortOrder
		created.sort((a, b) => a.sortOrder - b.sortOrder);

		const totals = await aggregateStudyTotals(input.costStudyId, input.organizationId);

		return {
			itemsCreated: created.length,
			items: created,
			skippedKeys: skipped,
			studyTotals: totals,
		};
	});
