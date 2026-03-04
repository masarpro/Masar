import { db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const prUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/procurement/purchase-requests/{requestId}",
		tags: ["Procurement", "Purchase Requests"],
		summary: "Update a purchase request (draft only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			requestId: z.string(),
			title: z.string().min(1).optional(),
			description: z.string().nullish(),
			priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
			requiredDate: z.coerce.date().nullish(),
			notes: z.string().nullish(),
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
				message: "لا يمكن تعديل طلب غير مسودة",
			});
		}

		const { organizationId, requestId, ...data } = input;
		const pr = await db.purchaseRequest.update({
			where: { id: requestId },
			data,
		});

		return { ...pr, estimatedTotal: Number(pr.estimatedTotal) };
	});
