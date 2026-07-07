import {
	updateProjectPayment,
	replaceProjectPaymentGroup,
	logAuditEvent,
	orgAuditLog,
	isPeriodClosed,
	db,
} from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { emitProjectPaymentCreated } from "../lib/payment-side-effects";

export const updateProjectPaymentProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/projects/{projectId}/payments/{paymentId}",
		tags: ["Project Payments"],
		summary: "Update a project payment",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			paymentId: z.string().trim().max(100),
			amount: z.number().positive("مبلغ الدفعة يجب أن يكون أكبر من صفر").optional(),
			date: z.coerce.date().optional(),
			paymentMethod: z
				.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
				.optional(),
			referenceNo: z.string().trim().max(100).nullish(),
			description: z.string().trim().max(2000).nullish(),
			destinationAccountId: z.string().trim().max(100).nullish(),
			note: z.string().trim().max(100).nullish(),
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
			// Detect whether this payment is part of a split group → editing a
			// split payment redistributes the whole payment as one unit.
			const target = await db.projectPayment.findUnique({
				where: { id: input.paymentId, organizationId: input.organizationId },
			});
			if (!target) {
				throw new ORPCError("NOT_FOUND", { message: "الدفعة غير موجودة" });
			}

			// Guard BEFORE any write: the journal entry is reversed and re-created
			// at the payment's effective date — if that date lands in a closed
			// period the re-create silently returns null, leaving the payment row
			// updated while its ledger entry is gone (or stale). Reject up front.
			const effectiveDate = input.date ?? target.date;
			if (await isPeriodClosed(db, input.organizationId, effectiveDate)) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"لا يمكن تعديل دفعة تقع في فترة محاسبية مغلقة أو نقلها إلى فترة مغلقة",
				});
			}

			if (target.splitGroupId) {
				// Resolve the new total (default to the current group total)
				let newAmount = input.amount;
				if (newAmount == null) {
					const agg = await db.projectPayment.aggregate({
						where: {
							splitGroupId: target.splitGroupId,
							organizationId: input.organizationId,
						},
						_sum: { amount: true },
					});
					newAmount = Number(agg._sum.amount ?? 0);
				}

				const date = input.date ?? target.date;
				const paymentMethod = input.paymentMethod ?? target.paymentMethod;
				const destinationAccountId =
					input.destinationAccountId !== undefined
						? input.destinationAccountId
						: target.destinationAccountId;
				const description =
					input.description !== undefined
						? input.description
						: target.description;

				const result = await replaceProjectPaymentGroup(
					input.paymentId,
					input.organizationId,
					{
						amount: newAmount,
						date,
						paymentMethod,
						referenceNo:
							input.referenceNo !== undefined
								? input.referenceNo
								: target.referenceNo,
						description,
						destinationAccountId,
						note: input.note !== undefined ? input.note : target.note,
						createdById: context.user.id,
					},
				);

				// Reverse journals for the removed rows
				const { reverseAutoJournalEntry } = await import(
					"../../../lib/accounting/auto-journal"
				);
				for (const deletedId of result.deletedIds) {
					try {
						await reverseAutoJournalEntry(db, {
							organizationId: input.organizationId,
							referenceType: "PROJECT_PAYMENT",
							referenceId: deletedId,
							userId: context.user.id,
						});
					} catch (e) {
						console.error("[AutoJournal] Failed to reverse ProjectPayment entry:", e);
						orgAuditLog({
							organizationId: input.organizationId,
							actorId: context.user.id,
							action: "JOURNAL_ENTRY_FAILED",
							entityType: "journal_entry",
							entityId: deletedId,
							metadata: { error: String(e), referenceType: "PROJECT_PAYMENT" },
						});
					}
				}

				// Emit journals + vouchers + audit for the freshly created rows
				await emitProjectPaymentCreated(result.payments, {
					organizationId: input.organizationId,
					projectId: input.projectId,
					date,
					paymentMethod,
					destinationAccountId,
					description,
					userId: context.user.id,
				});

				return {
					...result.primary,
					amount: Number(result.primary.amount),
					splitCount: result.splitCount,
				};
			}

			const payment = await updateProjectPayment(
				input.paymentId,
				input.organizationId,
				{
					amount: input.amount,
					date: input.date,
					paymentMethod: input.paymentMethod,
					referenceNo: input.referenceNo,
					description: input.description,
					destinationAccountId: input.destinationAccountId,
					note: input.note,
				},
			);

			// Auto-Journal: reverse old entry and create new one with updated data
			// (closed-period guard already enforced above, before any write)
			try {
				const { reverseAutoJournalEntry, onProjectPaymentReceived } = await import("../../../lib/accounting/auto-journal");
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "PROJECT_PAYMENT",
					referenceId: input.paymentId,
					userId: context.user.id,
				});
				await onProjectPaymentReceived(db, {
					id: payment.id,
					organizationId: input.organizationId,
					amount: payment.amount,
					date: payment.date,
					destinationAccountId: payment.destinationAccountId ?? "",
					projectId: payment.projectId,
					paymentNo: payment.paymentNo,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to update ProjectPayment entry:", e);
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
				action: "PROJECT_PAYMENT_UPDATED",
				entityType: "project_payment",
				entityId: payment.id,
				metadata: { amount: Number(payment.amount) },
			}).catch(() => {});

			return { ...payment, amount: Number(payment.amount) };
		} catch (error) {
			if (error instanceof ORPCError) throw error;
			if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
				throw new ORPCError("NOT_FOUND", { message: "الدفعة غير موجودة" });
			}
			if (
				error instanceof Error &&
				error.message.startsWith("PAYMENT_EXCEEDS_CONTRACT:")
			) {
				const [, ceiling, collected, available] = error.message.split(":");
				const fmt = (v?: string) =>
					new Intl.NumberFormat("en-US").format(Number(v ?? 0));
				throw new ORPCError("BAD_REQUEST", {
					message: `مبلغ الدفعة يتجاوز المتبقي من قيمة العقد — قيمة العقد المعدّلة: ${fmt(ceiling)} ريال، المحصّل: ${fmt(collected)} ريال، المتاح: ${fmt(available)} ريال`,
				});
			}
			throw error;
		}
	});
