import { updateClaimStatus, getProjectById, orgAuditLog, db } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyClaimStatusChanged } from "../../notifications/lib/notification-service";

export const updateClaimStatusProcedure = subscriptionProcedure
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

		// Auto-Journal: generate accrual entry when claim is approved
		if (input.status === "APPROVED") {
			try {
				const { onProjectClaimApproved } = await import("../../../lib/accounting/auto-journal");
				const { Prisma } = await import("@repo/database/prisma/generated/client");
				const project = await db.project.findUnique({
					where: { id: input.projectId },
					select: { clientName: true },
				});
				await onProjectClaimApproved(db, {
					id: input.claimId,
					organizationId: input.organizationId,
					claimNo: existingClaim?.claimNo ?? 0,
					clientName: project?.clientName ?? "",
					netAmount: new Prisma.Decimal(Number(claim.amount)),
					date: new Date(),
					projectId: input.projectId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to generate entry for project claim approval:", e);
				orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.claimId,
					metadata: { error: String(e), referenceType: "PROJECT_CLAIM_APPROVED" },
				});
			}
		}

		// Auto-Journal: reverse accrual entry when claim is rejected
		if (input.status === "REJECTED") {
			try {
				const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "PROJECT_CLAIM_APPROVED",
					referenceId: input.claimId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to reverse entry for rejected project claim:", e);
				orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.claimId,
					metadata: { error: String(e), referenceType: "PROJECT_CLAIM_APPROVED" },
				});
			}
		}

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
