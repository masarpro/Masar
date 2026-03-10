import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const deleteItem = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/delete",
		tags: ["Project BOQ"],
		summary: "Delete a single BOQ item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			itemId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "delete" },
		);

		// Verify item belongs to this project and organization
		const existing = await db.projectBOQItem.findFirst({
			where: {
				id: input.itemId,
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "البند غير موجود أو لا ينتمي لهذا المشروع",
			});
		}

		await db.projectBOQItem.delete({ where: { id: input.itemId } });

		return { success: true };
	});
