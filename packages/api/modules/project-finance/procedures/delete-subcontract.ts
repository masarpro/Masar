import { deleteSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const deleteSubcontract = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/finance/subcontracts/{contractId}",
		tags: ["Project Finance"],
		summary: "Delete a subcontract contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		await deleteSubcontractContract(
			input.contractId,
			input.organizationId,
			input.projectId,
		);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_DELETED",
			entityType: "subcontract",
			entityId: input.contractId,
		}).catch(() => {});

		return { success: true, message: "تم حذف العقد بنجاح" };
	});
