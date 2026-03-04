import { updateSubcontractItem, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateSubcontractItemProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}/items/{itemId}",
		tags: ["Subcontract Items"],
		summary: "Update a subcontract item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			itemId: z.string(),
			itemCode: z.string().nullish(),
			description: z.string().min(1).optional(),
			descriptionEn: z.string().nullish(),
			unit: z.string().min(1).optional(),
			contractQty: z.number().positive().optional(),
			unitPrice: z.number().positive().optional(),
			sortOrder: z.number().optional(),
			category: z.string().nullish(),
			isLumpSum: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const { organizationId, projectId, contractId, itemId, ...data } = input;

		const item = await updateSubcontractItem(itemId, organizationId, data);

		logAuditEvent(organizationId, projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_ITEM_UPDATED",
			entityType: "subcontract_item",
			entityId: itemId,
			metadata: { contractId },
		}).catch(() => {});

		return {
			...item,
			contractQty: Number(item.contractQty),
			unitPrice: Number(item.unitPrice),
			totalAmount: Number(item.totalAmount),
		};
	});
