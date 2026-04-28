import { db } from "@repo/database";
import { protectedProcedure } from "../../../../orpc/procedures";
import { getItemsSchema } from "../../schemas/quantity-item.schema";
import { loadStudy, requireStudyAccess } from "../../lib/verify-access";

export const getItems = protectedProcedure
	.input(getItemsSchema)
	.handler(async ({ input, context }) => {
		await requireStudyAccess(input.organizationId, context.user.id);
		await loadStudy(input.costStudyId, input.organizationId);

		const items = await db.quantityItem.findMany({
			where: {
				costStudyId: input.costStudyId,
				organizationId: input.organizationId,
			},
			orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		});
		return { items, count: items.length };
	});
