import { createSubcontractContract, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString, trimmedString, positiveAmount, nullishTrimmed, MAX_NAME, MAX_DESC } from "../../../lib/validation-constants";

export const createSubcontract = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/finance/subcontracts",
		tags: ["Project Finance"],
		summary: "Create a new subcontract contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			name: trimmedString(MAX_NAME),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().optional(),
			value: positiveAmount(),
			notes: nullishTrimmed(MAX_DESC).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const contract = await createSubcontractContract({
			organizationId: input.organizationId,
			projectId: input.projectId,
			createdById: context.user.id,
			name: input.name,
			startDate: input.startDate,
			endDate: input.endDate,
			value: input.value,
			notes: input.notes,
		});

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CREATED",
			entityType: "subcontract",
			entityId: contract.id,
			metadata: { name: input.name, value: input.value },
		}).catch(() => {});

		return {
			...contract,
			value: Number(contract.value),
		};
	});
