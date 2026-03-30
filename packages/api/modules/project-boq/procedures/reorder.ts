import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const reorder = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/reorder",
		tags: ["Project BOQ"],
		summary: "Reorder BOQ items",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			orderedIds: z.array(z.string().trim().max(100)).min(1).max(500),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		await db.$transaction(
			input.orderedIds.map((id, index) =>
				db.projectBOQItem.update({
					where: { id },
					data: { sortOrder: index },
				}),
			),
		);

		return { success: true };
	});
