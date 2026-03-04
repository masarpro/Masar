import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prUpdateItems = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/procurement/purchase-requests/{requestId}/items",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Replace all items of a purchase request (draft only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			requestId: z.string(),
			items: z
				.array(
					z.object({
						name: z.string().min(1),
						description: z.string().optional(),
						unit: z.string().min(1),
						quantity: z.number().positive(),
						estimatedPrice: z.number().min(0).default(0),
						costStudyItemId: z.string().optional(),
						costStudyItemType: z.string().optional(),
					}),
				)
				.min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "request",
		});

		const existing = await db.purchaseRequest.findFirst({
			where: { id: input.requestId, organizationId: input.organizationId },
		});
		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "طلب الشراء غير موجود",
			});
		}
		if (existing.status !== "PR_DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن تعديل بنود طلب غير مسودة",
			});
		}

		const estimatedTotal = input.items.reduce(
			(sum, item) => sum + item.quantity * item.estimatedPrice,
			0,
		);

		const pr = await db.$transaction(async (tx) => {
			await tx.purchaseRequestItem.deleteMany({
				where: { purchaseRequestId: input.requestId },
			});

			return tx.purchaseRequest.update({
				where: { id: input.requestId },
				data: {
					estimatedTotal,
					items: {
						create: input.items.map((item, index) => ({
							name: item.name,
							description: item.description,
							unit: item.unit,
							quantity: item.quantity,
							estimatedPrice: item.estimatedPrice,
							totalEstimate: item.quantity * item.estimatedPrice,
							costStudyItemId: item.costStudyItemId,
							costStudyItemType: item.costStudyItemType,
							sortOrder: index,
						})),
					},
				},
				include: { items: { orderBy: { sortOrder: "asc" } } },
			});
		});

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
		};
	});
