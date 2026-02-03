import { updateClaimStatus, getProjectById, db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyClaimStatusChanged } from "../../notifications/lib/notification-service";

export const updateClaimStatusProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/claims/{claimId}/status",
		tags: ["Project Finance"],
		summary: "Update claim status",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
			status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "PAID", "REJECTED"]),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to manage payments
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "finance", action: "payments" },
		);

		// Get claim details before update for notification
		const existingClaim = await db.projectClaim.findUnique({
			where: { id: input.claimId },
			select: { createdById: true, claimNo: true },
		});

		const claim = await updateClaimStatus(
			input.claimId,
			input.organizationId,
			input.projectId,
			input.status,
		);

		// Notify claim creator about status change (fire and forget)
		if (existingClaim && existingClaim.createdById !== context.user.id) {
			getProjectById(input.projectId, input.organizationId)
				.then((project) => {
					if (project) {
						notifyClaimStatusChanged({
							organizationId: input.organizationId,
							projectId: input.projectId,
							projectName: project.name,
							claimId: input.claimId,
							claimNo: existingClaim.claimNo,
							newStatus: input.status,
							actorId: context.user.id,
							creatorId: existingClaim.createdById,
						}).catch(() => {
							// Silently ignore notification errors
						});
					}
				})
				.catch(() => {
					// Silently ignore errors
				});
		}

		return {
			...claim,
			amount: Number(claim.amount),
		};
	});
