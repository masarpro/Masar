import { updateClaimStatus, getProjectById, orgAuditLog, db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { notifyEvent } from "../../notifications/lib/notify";
import { idString } from "../../../lib/validation-constants";

const CLAIM_STATUS_LABELS: Record<string, string> = {
	DRAFT: "مسودة",
	SUBMITTED: "مقدم",
	APPROVED: "معتمد",
	PAID: "مدفوع",
	REJECTED: "مرفوض",
};

export const updateClaimStatusProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/finance/claims/{claimId}/status",
		tags: ["Project Finance"],
		summary: "Update claim status",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			claimId: idString(),
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

		let claim;
		try {
			claim = await updateClaimStatus(
				input.claimId,
				input.organizationId,
				input.projectId,
				input.status,
			);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "المستخلص غير موجود") {
					throw new ORPCError("NOT_FOUND", { message: error.message });
				}
				if (error.message === "CLAIMS_EXCEED_CONTRACT_VALUE") {
					throw new ORPCError("BAD_REQUEST", {
						message: "إجمالي المستخلصات يتجاوز قيمة العقد المعدلة",
					});
				}
				if (error.message.startsWith("لا يمكن تغيير حالة")) {
					throw new ORPCError("BAD_REQUEST", { message: error.message });
				}
			}
			throw error;
		}

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
					// Recognize the revenue in the claim's own billing period, not on
					// the approval day — otherwise back-dated claims land in the wrong
					// month and go missing from period-scoped accounting reports.
					date: claim.periodEnd ?? claim.dueDate ?? claim.createdAt ?? new Date(),
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

		// Approval/rejection can flip the project between cash-basis and billed —
		// re-align existing payment entries so revenue is neither double-counted
		// (payment on 4100 + claim accrual) nor lost (payment on 1120 with no accrual).
		if (input.status === "APPROVED" || input.status === "REJECTED") {
			try {
				const { reconcileProjectPaymentEntries } = await import(
					"../../../lib/accounting/reconcile-project-payments"
				);
				await reconcileProjectPaymentEntries(db, {
					organizationId: input.organizationId,
					projectId: input.projectId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to reconcile project payment entries after claim status change:", e);
			}
		}

		// Notify claim creator about status change
		if (existingClaim) {
			const project = await getProjectById(input.projectId, input.organizationId);
			await notifyEvent({
				event: "projects.claimStatusChanged",
				organizationId: input.organizationId,
				actorId: context.user.id,
				projectId: input.projectId,
				entity: { type: "claim", id: input.claimId },
				recipients: existingClaim.createdById
					? [existingClaim.createdById]
					: [],
				data: {
					projectName: project?.name,
					claimNo: existingClaim.claimNo,
					status: CLAIM_STATUS_LABELS[input.status] ?? input.status,
				},
			});
		}

		return {
			...claim,
			amount: Number(claim.amount),
		};
	});
