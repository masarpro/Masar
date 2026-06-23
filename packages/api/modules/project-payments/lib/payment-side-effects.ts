import {
	db,
	generateAtomicNo,
	logAuditEvent,
	orgAuditLog,
} from "@repo/database";
import { numberToArabicWords } from "@repo/utils";

type CreatedPaymentRow = {
	id: string;
	// Prisma Decimal at runtime — kept loose to avoid importing the Decimal type
	amount: any;
	paymentNo: string;
	contractTermId: string | null;
};

type SideEffectContext = {
	organizationId: string;
	projectId: string;
	date: Date;
	paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "OTHER";
	destinationAccountId?: string | null;
	description?: string | null;
	userId: string;
};

/**
 * Emit per-row side effects for created project payments: audit log, auto
 * journal entry, and receipt voucher. Shared by the create + update(replace)
 * procedures so a split payment's every part stays consistent.
 *
 * Each side effect is best-effort: failures are logged (and audited for the
 * journal) but never bubble up to break the payment itself.
 */
export async function emitProjectPaymentCreated(
	payments: CreatedPaymentRow[],
	ctx: SideEffectContext,
) {
	for (const payment of payments) {
		logAuditEvent(ctx.organizationId, ctx.projectId, {
			actorId: ctx.userId,
			action: "PROJECT_PAYMENT_CREATED",
			entityType: "project_payment",
			entityId: payment.id,
			metadata: {
				amount: Number(payment.amount),
				contractTermId: payment.contractTermId,
				paymentNo: payment.paymentNo,
			},
		}).catch(() => {});

		// Auto-Journal: generate accounting entry for project payment
		try {
			const { onProjectPaymentReceived } = await import(
				"../../../lib/accounting/auto-journal"
			);
			await onProjectPaymentReceived(db, {
				id: payment.id,
				organizationId: ctx.organizationId,
				amount: payment.amount,
				date: ctx.date,
				destinationAccountId: ctx.destinationAccountId ?? "",
				projectId: ctx.projectId,
				paymentNo: payment.paymentNo,
				userId: ctx.userId,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to create ProjectPayment entry:", e);
			orgAuditLog({
				organizationId: ctx.organizationId,
				actorId: ctx.userId,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: payment.id,
				metadata: { error: String(e), referenceType: "PROJECT_PAYMENT" },
			});
		}

		// Auto-create receipt voucher from project payment
		try {
			const voucherNo = await generateAtomicNo(ctx.organizationId, "RCV");
			await db.receiptVoucher.create({
				data: {
					organizationId: ctx.organizationId,
					voucherNo,
					projectPaymentId: payment.id,
					date: ctx.date,
					amount: payment.amount,
					amountInWords: numberToArabicWords(Number(payment.amount)),
					receivedFrom:
						ctx.description || `دفعة مشروع ${payment.paymentNo}`,
					paymentMethod: ctx.paymentMethod || "BANK_TRANSFER",
					destinationAccountId: ctx.destinationAccountId || null,
					projectId: ctx.projectId,
					status: "ISSUED",
					createdById: ctx.userId,
				},
			});
		} catch (e) {
			console.error(
				"[ReceiptVoucher] Failed to create auto voucher from project payment:",
				e,
			);
		}
	}
}
