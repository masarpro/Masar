import { updateSubcontractChangeOrder, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateSubcontractChangeOrderProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/{contractId}/change-orders/{changeOrderId}",
		tags: ["Subcontracts"],
		summary: "Update a subcontract change order",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			changeOrderId: z.string(),
			description: z.string().min(1).optional(),
			amount: z.number().optional(),
			status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
			approvedDate: z.coerce.date().nullish(),
			attachmentUrl: z.string().nullish(),
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
