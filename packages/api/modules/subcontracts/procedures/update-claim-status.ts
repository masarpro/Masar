import { updateSubcontractClaimStatus, db, logAuditEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const updateSubcontractClaimStatusProcedure = subscriptionProcedure
	.route({
		method: "PATCH",
		path: "/projects/{projectId}/subcontracts/claims/{claimId}/status",
		tags: ["Subcontract Claims"],
		summary: "Update subcontract claim status",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			claimId: z.string(),
			status: z.enum([
				"DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED",
				"PARTIALLY_PAID", "PAID", "REJECTED", "CANCELLED",
			]),
			rejectionReason: z.string().optional(),
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
			const claim = await updateSubcontractClaimStatus(
				input.claimId,
				input.organizationId,
				input.status as any,
				{
					rejectionReason: input.rejectionReason,
					approvedById: input.status === "APPROVED" ? context.user.id : undefined,
				},
			);

			logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "SUBCONTRACT_CLAIM_STATUS_CHANGED",
				entityType: "subcontract_claim",
				entityId: input.claimId,
				metadata: { newStatus: input.status },
			}).catch(() => {});

			// Auto-Journal: create accrual entry when claim is approved
			if (input.status === "APPROVED") {
				try {
					const { onSubcontractClaimApproved } = await import("../../../lib/accounting/auto-journal");
					const contract = await db.subcontractContract.findUnique({
						where: { id: claim.contractId },
						select: { name: true, projectId: true },
					});
					await onSubcontractClaimApproved(db, {
						id: claim.id,
						organizationId: input.organizationId,
						claimNo: claim.claimNo,
						contractorName: contract?.name ?? "",
						netAmount: claim.netAmount,
						date: new Date(),
						projectId: contract?.projectId ?? input.projectId,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed for SubcontractClaim approval:", e);
				}
			}

			// Auto-Journal: reverse accrual entry when claim is rejected or cancelled
			if (input.status === "REJECTED" || input.status === "CANCELLED") {
				try {
					const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
					await reverseAutoJournalEntry(db, {
						organizationId: input.organizationId,
						referenceType: "SUBCONTRACT_CLAIM_APPROVED",
						referenceId: input.claimId,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to reverse entry for rejected/cancelled subcontract claim:", e);
				}
			}

			return {
				...claim,
				grossAmount: Number(claim.grossAmount),
				retentionAmount: Number(claim.retentionAmount),
				advanceDeduction: Number(claim.advanceDeduction),
				vatAmount: Number(claim.vatAmount),
				netAmount: Number(claim.netAmount),
				paidAmount: Number(claim.paidAmount),
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "CLAIM_NOT_FOUND") {
					throw new ORPCError("NOT_FOUND", { message: "المستخلص غير موجود" });
				}
				if (error.message.startsWith("INVALID_TRANSITION:")) {
					throw new ORPCError("BAD_REQUEST", {
						message: "لا يمكن تغيير حالة المستخلص بهذا الشكل",
					});
				}
			}
			throw error;
		}
	});
