import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const bulkDelete = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/bulk-delete",
		tags: ["Project BOQ"],
		summary: "Delete multiple BOQ items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			itemIds: z.array(z.string()).min(1).max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "delete" },
		);

		const result = await db.projectBOQItem.deleteMany({
			where: {
				id: { in: input.itemIds },
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
		});

		return { deletedCount: result.count };
	});
