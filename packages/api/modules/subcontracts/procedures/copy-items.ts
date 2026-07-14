import { copySubcontractItems, getSubcontractById, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
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

		// Both contracts must belong to the verified project + organization,
		// otherwise items could be copied across projects/organizations.
		const [sourceContract, targetContract] = await Promise.all([
			getSubcontractById(
				input.sourceContractId,
				input.organizationId,
				input.projectId,
			),
			getSubcontractById(
				input.targetContractId,
				input.organizationId,
				input.projectId,
			),
		]);
		if (!(sourceContract && targetContract)) {
			throw new ORPCError("NOT_FOUND", {
				message: "عقد الباطن غير موجود",
			});
		}

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
		}).catch((e) => console.error("[Subcontracts] audit log failed:", e));

		return { count: items.length };
	});
