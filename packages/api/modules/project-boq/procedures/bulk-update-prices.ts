import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const bulkUpdatePrices = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/boq/bulk-update-prices",
		tags: ["Project BOQ"],
		summary: "Update prices for multiple BOQ items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			prices: z
				.array(
					z.object({
						itemId: z.string(),
						unitPrice: z.number().min(0),
					}),
				)
				.min(1)
				.max(200),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "edit" },
		);

		const itemIds = input.prices.map((p) => p.itemId);

		// Fetch all items and verify they belong to this project
		const items = await db.projectBOQItem.findMany({
			where: {
				id: { in: itemIds },
				projectId: input.projectId,
				organizationId: input.organizationId,
			},
		});

		if (items.length !== itemIds.length) {
			throw new ORPCError("NOT_FOUND", {
				message: "بعض البنود غير موجودة أو لا تنتمي لهذا المشروع",
			});
		}

		const itemMap = new Map(items.map((item) => [item.id, item]));

		const updated = await db.$transaction(
			input.prices.map((price) => {
				const item = itemMap.get(price.itemId)!;
				const totalPrice = Number(item.quantity) * price.unitPrice;
				return db.projectBOQItem.update({
					where: { id: price.itemId },
					data: { unitPrice: price.unitPrice, totalPrice },
				});
			}),
		);

		return { updatedCount: updated.length };
	});
