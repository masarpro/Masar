import { deleteSubcontractChangeOrder, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteSubcontractChangeOrderProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders/{changeOrderId}",
		tags: ["Subcontracts"],
		summary: "Delete a subcontract change order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			changeOrderId: z.string(),
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
