import { deleteSubcontractItem, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteSubcontractItemProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/subcontracts/{contractId}/items/{itemId}",
		tags: ["Subcontract Items"],
		summary: "Delete a subcontract item",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			itemId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		try {
			await deleteSubcontractItem(input.itemId, input.organizationId);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith("ITEM_IN_USE:")) {
				const count = error.message.split(":")[1];
				throw new ORPCError("BAD_REQUEST", {
					message: `لا يمكن حذف البند — مستخدم في ${count} مستخلص`,
				});
			}
			throw error;
		}

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_ITEM_DELETED",
			entityType: "subcontract_item",
			entityId: input.itemId,
			metadata: { contractId: input.contractId },
		}).catch(() => {});

		return { success: true };
	});
