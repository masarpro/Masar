import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getUnpricedItems = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/boq/unpriced",
		tags: ["Project BOQ"],
		summary: "Get unpriced BOQ items",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const items = await db.projectBOQItem.findMany({
			where: {
				projectId: input.projectId,
				organizationId: input.organizationId,
				unitPrice: null,
			},
			orderBy: { sortOrder: "asc" },
		});

		return items.map((item) => ({
			...item,
			quantity: Number(item.quantity),
			unitPrice: null,
			totalPrice: null,
		}));
	});
