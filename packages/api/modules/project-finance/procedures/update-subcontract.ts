import { updateSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString, positiveAmount, MAX_NAME, MAX_DESC } from "../../../lib/validation-constants";

export const updateSubcontract = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/subcontracts/{contractId}",
		tags: ["Project Finance"],
		summary: "Update a subcontract contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
			name: z.string().trim().min(1).max(MAX_NAME).optional(),
			startDate: z.coerce.date().nullable().optional(),
			endDate: z.coerce.date().nullable().optional(),
			value: positiveAmount().optional(),
			notes: z.string().trim().max(MAX_DESC).nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const contract = await updateSubcontractContract(
			input.contractId,
			input.organizationId,
			input.projectId,
			{
				name: input.name,
				startDate: input.startDate,
				endDate: input.endDate,
				value: input.value,
				notes: input.notes,
			},
		);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_UPDATED",
			entityType: "subcontract",
			entityId: input.contractId,
		}).catch(() => {});

		return {
			...contract,
			value: Number(contract.value),
		};
	});
