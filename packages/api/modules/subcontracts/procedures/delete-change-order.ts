import { deleteSubcontractChangeOrder, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const deleteSubcontractChangeOrderProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders/{changeOrderId}",
		tags: ["Subcontracts"],
		summary: "Delete a subcontract change order",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			changeOrderId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		await deleteSubcontractChangeOrder(input.changeOrderId);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CO_DELETED",
			entityType: "subcontract_change_order",
			entityId: input.changeOrderId,
			metadata: { contractId: input.contractId },
		}).catch(() => {});

		return { success: true };
	});
