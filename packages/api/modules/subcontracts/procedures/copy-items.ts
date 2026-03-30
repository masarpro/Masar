import { copySubcontractItems, logAuditEvent } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const copySubcontractItemsProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/{projectId}/subcontracts/{contractId}/items/copy",
		tags: ["Subcontract Items"],
		summary: "Copy items from another contract",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			sourceContractId: idString(),
			targetContractId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		const items = await copySubcontractItems(
			input.sourceContractId,
			input.targetContractId,
			input.organizationId,
			context.user.id,
		);

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_ITEMS_COPIED",
			entityType: "subcontract_item",
			entityId: input.targetContractId,
			metadata: {
				sourceContractId: input.sourceContractId,
				count: items.length,
			},
		}).catch(() => {});

		return { count: items.length };
	});
