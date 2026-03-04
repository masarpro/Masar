import { deleteSubcontractClaim, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteSubcontractClaimProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}",
		tags: ["Subcontract Claims"],
		summary: "Delete a subcontract claim (DRAFT only)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
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
			await deleteSubcontractClaim(input.claimId, input.organizationId);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CLAIM_NOT_FOUND") {
					throw new ORPCError("NOT_FOUND", { message: "المستخلص غير موجود" });
				}
				if (error.message === "CLAIM_NOT_DRAFT") {
					throw new ORPCError("BAD_REQUEST", {
						message: "لا يمكن حذف المستخلص إلا في حالة المسودة",
					});
				}
			}
			throw error;
		}

		logAuditEvent(input.organizationId, input.projectId, {
			actorId: context.user.id,
			action: "SUBCONTRACT_CLAIM_DELETED",
			entityType: "subcontract_claim",
			entityId: input.claimId,
			metadata: {},
		}).catch(() => {});

		return { success: true };
	});
