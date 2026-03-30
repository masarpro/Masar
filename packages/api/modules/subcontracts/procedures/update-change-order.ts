import { updateSubcontractChangeOrder, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import {
	MAX_DESC, MAX_URL,
	idString, nullishTrimmed, signedAmount,
} from "../../../lib/validation-constants";

export const updateSubcontractChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders/{changeOrderId}",
		tags: ["Subcontracts"],
		summary: "Update a subcontract change order",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			changeOrderId: idString(),
			description: z.string().trim().min(1).max(MAX_DESC).optional(),
			amount: signedAmount().optional(),
			status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
			approvedDate: z.coerce.date().nullish(),
			attachmentUrl: nullishTrimmed(MAX_URL),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const { organizationId, projectId, contractId, changeOrderId, ...data } =
			input;

		const co = await updateSubcontractChangeOrder(changeOrderId, data);

		logAuditEvent(organizationId, projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CO_UPDATED",
			entityType: "subcontract_change_order",
			entityId: changeOrderId,
			metadata: { contractId },
		}).catch(() => {});

		return { ...co, amount: Number(co.amount) };
	});
