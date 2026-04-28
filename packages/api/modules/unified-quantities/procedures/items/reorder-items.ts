import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { reorderItemsSchema } from "../../schemas/quantity-item.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";

export const reorderItems = subscriptionProcedure
	.input(reorderItemsSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		// تحقق أن كل البنود في نفس الدراسة (لمنع cross-study reorder)
		const owned = await db.quantityItem.count({
			where: {
				id: { in: input.itemIds },
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
			},
		});
		if (owned !== input.itemIds.length) {
			throw new Error("بعض البنود لا تنتمي للدراسة المحدّدة");
		}

		// $transaction — كل sortOrder يُحدَّث ذرّياً
		await db.$transaction(
			input.itemIds.map((id, index) =>
				db.quantityItem.update({
					where: { id },
					data: { sortOrder: (index + 1) * 10, updatedById: context.user.id },
				}),
			),
		);

		return { reordered: input.itemIds.length };
	});
