import { deleteProjectPayment, logAuditEvent, orgAuditLog, db } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const deleteProjectPaymentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/projects/{projectId}/payments/{paymentId}",
		tags: ["Project Payments"],
		summary: "Delete a project payment",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			paymentId: z.string().trim().max(100),
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
			await deleteProjectPayment(input.paymentId, input.organizationId);

			// Auto-Journal: reverse accounting entry for deleted project payment
			try {
				const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "PROJECT_PAYMENT",
					referenceId: input.paymentId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to reverse ProjectPayment entry:", e);
				orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: input.paymentId,
					metadata: { error: String(e), referenceType: "PROJECT_PAYMENT" },
				});
			}

			logAuditEvent(input.organizationId, input.projectId, {
				actorId: context.user.id,
				action: "PROJECT_PAYMENT_DELETED",
				entityType: "project_payment",
				entityId: input.paymentId,
				metadata: {},
			}).catch(() => {});

			return { success: true };
		} catch (error) {
			if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", { message: "الدفعة غير موجودة" });
			}
			throw error;
		}
	});
