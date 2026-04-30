import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { linkItemsSchema } from "../../schemas/quantity-item.schema";
import { loadItem, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

/**
 * POST /unified-quantities/items/link
 * يربط بنداً بمصدر، أو يفصل الربط (linkedFromItemId=null).
 *
 * Validation:
 * - المصدر يجب يكون في نفس الدراسة
 * - لا يمكن ربط البند بنفسه
 * - دورة (A→B→A) ممنوعة
 * - كمية مصدر صفر مسموحة لكن تُحذِّر
 */
export const linkItems = subscriptionProcedure
	.input(linkItemsSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const target = await loadItem(input.itemId, input.organizationId);

		const warnings: string[] = [];

		if (input.linkedFromItemId) {
			if (input.linkedFromItemId === input.itemId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "لا يمكن ربط البند بنفسه",
				});
			}

			const source = await db.quantityItem.findFirst({
				where: {
					id: input.linkedFromItemId,
					organizationId: input.organizationId,
					costStudyId: target.costStudyId,
				},
				select: {
					id: true,
					linkedFromItemId: true,
					effectiveQuantity: true,
				},
			});
			if (!source) {
				throw new ORPCError("NOT_FOUND", {
					message: "البند المصدر غير موجود في نفس الدراسة",
				});
			}

			// منع الدورة المباشرة (A→B حيث B→A أصلاً)
			if (source.linkedFromItemId === input.itemId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "ربط دائري (المصدر مرتبط بالبند الحالي) — ممنوع",
				});
			}

			if (Number(source.effectiveQuantity) === 0) {
				warnings.push("⚠️ كمية البند المصدر صفر — الكمية المشتقّة ستكون صفراً");
			}
		}

		const updated = await db.quantityItem.update({
			where: { id: input.itemId },
			data: {
				linkedFromItemId: input.linkedFromItemId,
				linkQuantityFormula: input.linkedFromItemId ? input.linkQuantityFormula : null,
				linkPercentValue: input.linkedFromItemId ? input.linkPercentValue : null,
				updatedById: context.user.id,
			},
		});

		const totals = await aggregateStudyTotals(target.costStudyId, input.organizationId);

		return { item: updated, warnings, studyTotals: totals };
	});
