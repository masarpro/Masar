import { updateSubcontractItem, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_CODE, MAX_ID,
	idString, nullishTrimmed,
} from "../../../lib/validation-constants";

export const updateSubcontractItemProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}/items/{itemId}",
		tags: ["Subcontract Items"],
		summary: "Update a subcontract item",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			itemId: idString(),
			itemCode: z.string().trim().max(MAX_CODE).nullish(),
			description: z.string().trim().min(1).max(MAX_NAME).optional(),
			descriptionEn: nullishTrimmed(MAX_NAME),
			unit: z.string().trim().min(1).max(MAX_CODE).optional(),
			contractQty: z.number().positive().max(999_999).optional(),
			unitPrice: z.number().positive().max(99_999_999.99).optional(),
			sortOrder: z.number().int().min(0).max(10_000).optional(),
			category: nullishTrimmed(MAX_ID),
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
