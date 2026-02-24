import { deleteSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteSubcontractProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/subcontracts/{contractId}",
		tags: ["Subcontracts"],
		summary: "Delete a subcontract contract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
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
			metadata: {},
		}).catch(() => {});

		return { success: true, message: "تم حذف عقد الباطن بنجاح" };
	});
