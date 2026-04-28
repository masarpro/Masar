import { db } from "@repo/database";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { deleteItemSchema } from "../../schemas/quantity-item.schema";
import { loadItem, requireStudyAccess } from "../../lib/verify-access";
import { aggregateStudyTotals } from "../../pricing/study-aggregator";

export const deleteItem = subscriptionProcedure
	.input(deleteItemSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		const item = await loadItem(input.id, input.organizationId);

		await db.quantityItem.delete({ where: { id: input.id } });
		const totals = await aggregateStudyTotals(item.costStudyId, input.organizationId);

		return { deleted: true, id: input.id, studyTotals: totals };
	});
