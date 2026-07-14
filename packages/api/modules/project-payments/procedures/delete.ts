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
			// Deleting any part of a split payment removes the whole group →
			// reverse the journal + audit for every deleted row.
			const { deletedIds } = await deleteProjectPayment(
				input.paymentId,
				input.organizationId,
			);

			const { reverseAutoJournalEntry } = await import(
				"../../../lib/accounting/auto-journal"
			);
			for (const deletedId of deletedIds) {
				// Auto-Journal: reverse accounting entry for deleted project payment
				try {
					await reverseAutoJournalEntry(db, {
						organizationId: input.organizationId,
						referenceType: "PROJECT_PAYMENT",
						referenceId: deletedId,
						userId: context.user.id,
					});
				} catch (e) {
					console.error("[AutoJournal] Failed to reverse ProjectPayment entry:", e);
					await orgAuditLog({
						organizationId: input.organizationId,
						actorId: context.user.id,
						action: "JOURNAL_ENTRY_FAILED",
						entityType: "journal_entry",
						entityId: deletedId,
						metadata: { error: String(e), referenceType: "PROJECT_PAYMENT" },
					});
				}

				logAuditEvent(input.organizationId, input.projectId, {
					actorId: context.user.id,
					action: "PROJECT_PAYMENT_DELETED",
					entityType: "project_payment",
					entityId: deletedId,
					metadata: {},
				}).catch(() => {});
			}

			return { success: true };
		} catch (error) {
			if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", { message: "الدفعة غير موجودة" });
			}
			throw error;
		}
	});
