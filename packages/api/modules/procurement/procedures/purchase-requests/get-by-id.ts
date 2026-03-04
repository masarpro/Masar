import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/purchase-requests/{requestId}",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Get purchase request details",
	})
	.input(
		z.object({
			organizationId: z.string(),
			requestId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const pr = await db.purchaseRequest.findFirst({
			where: {
				id: input.requestId,
				organizationId: input.organizationId,
			},
			include: {
				project: { select: { id: true, name: true, slug: true } },
				requestedBy: { select: { id: true, name: true } },
				approvedBy: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
				items: { orderBy: { sortOrder: "asc" } },
				purchaseOrders: {
					select: {
						id: true,
						poNumber: true,
						status: true,
						totalAmount: true,
						vendor: { select: { id: true, name: true } },
					},
				},
			},
		});

		if (!pr) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب الشراء غير موجود",
			});
		}

		return {
			...pr,
			estimatedTotal: Number(pr.estimatedTotal),
			items: pr.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				estimatedPrice: Number(item.estimatedPrice),
				totalEstimate: Number(item.totalEstimate),
				orderedQuantity: Number(item.orderedQuantity),
				receivedQuantity: Number(item.receivedQuantity),
			})),
			purchaseOrders: pr.purchaseOrders.map((po) => ({
				...po,
				totalAmount: Number(po.totalAmount),
			})),
		};
	});
