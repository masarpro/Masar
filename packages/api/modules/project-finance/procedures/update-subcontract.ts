import { updateSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateSubcontract = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/subcontracts/{contractId}",
		tags: ["Project Finance"],
		summary: "Update a subcontract contract",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
			name: z.string().min(1).optional(),
			startDate: z.coerce.date().nullable().optional(),
			endDate: z.coerce.date().nullable().optional(),
			value: z.number().positive("قيمة العقد يجب أن تكون أكبر من صفر").optional(),
			notes: z.string().nullable().optional(),
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
