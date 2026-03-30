import {
	getOrganizationPayments,
	getPaymentById,
	createPayment,
	updatePayment,
	deletePayment,
	orgAuditLog,
	db,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_SEARCH,
	idString, optionalTrimmed, searchQuery,
	positiveAmount, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";

// Enums
const paymentMethodEnum = z.enum([
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
]);

const financeTransactionStatusEnum = z.enum([
	"PENDING",
	"COMPLETED",
	"CANCELLED",
]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST PAYMENTS (المقبوضات)
// ═══════════════════════════════════════════════════════════════════════════
export const listOrgPayments = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/org-payments",
		tags: ["Finance", "Payments"],
		summary: "List payments/receipts for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			destinationAccountId: z.string().trim().max(100).optional(),
			clientId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			status: financeTransactionStatusEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getOrganizationPayments(input.organizationId, {
			destinationAccountId: input.destinationAccountId,
			clientId: input.clientId,
			projectId: input.projectId,
			status: input.status,
			dateFrom: input.dateFrom,
			dateTo: input.dateTo,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET SINGLE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const getOrgPayment = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/org-payments/{id}",
		tags: ["Finance", "Payments"],
		summary: "Get a single payment/receipt",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const payment = await getPaymentById(input.id, input.organizationId);

		if (!payment) {
			throw new Error("Payment not found");
		}

		return payment;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE PAYMENT (سند قبض)
// ═══════════════════════════════════════════════════════════════════════════
export const createOrgPaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/org-payments",
		tags: ["Finance", "Payments"],
		summary: "Create a new payment/receipt",
	})
	.input(
		z.object({
			organizationId: idString(),
			amount: positiveAmount(),
			date: z.coerce.date(),
			destinationAccountId: idString(),
			clientId: z.string().trim().max(100).optional(),
			clientName: optionalTrimmed(MAX_NAME),
			projectId: z.string().trim().max(100).optional(),
			invoiceId: z.string().trim().max(100).optional(),
			contractTermId: z.string().trim().max(100).optional(),
			paymentMethod: paymentMethodEnum.optional().default("CASH"),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			description: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const payment = await createPayment({
			organizationId: input.organizationId,
			createdById: context.user.id,
			amount: input.amount,
			date: input.date,
			destinationAccountId: input.destinationAccountId,
			clientId: input.clientId,
			clientName: input.clientName,
			projectId: input.projectId,
			invoiceId: input.invoiceId,
			contractTermId: input.contractTermId,
			paymentMethod: input.paymentMethod,
			referenceNo: input.referenceNo,
			description: input.description,
			notes: input.notes,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_CREATED",
			entityType: "payment",
			entityId: payment.id,
			metadata: { amount: input.amount, destinationAccountId: input.destinationAccountId },
		});

		// Auto-Journal: generate accounting entry for payment received
		try {
			const { onOrganizationPaymentReceived } = await import("../../../lib/accounting/auto-journal");
			await onOrganizationPaymentReceived(db, {
				id: payment.id,
				organizationId: input.organizationId,
				amount: payment.amount,
				date: payment.date,
				description: input.description ?? "مقبوضات",
				destinationAccountId: input.destinationAccountId,
				projectId: input.projectId,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: payment.id,
				metadata: { error: String(e), referenceType: "ORG_PAYMENT" },
			});
		}

		// Auto-create receipt voucher
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const voucherNo = await generateAtomicNo(input.organizationId, "RCV");
			await db.receiptVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					paymentId: payment.id,
					date: payment.date,
					amount: payment.amount,
					amountInWords: numberToArabicWords(Number(payment.amount)),
					receivedFrom: input.clientName || input.description || "مقبوضات",
					paymentMethod: input.paymentMethod || "CASH",
					destinationAccountId: input.destinationAccountId,
					clientId: input.clientId || null,
					projectId: input.projectId || null,
					status: "ISSUED",
					createdById: context.user.id,
				},
			});
		} catch (e) {
			console.error("[ReceiptVoucher] Failed to create auto voucher from payment:", e);
		}

		return payment;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const updateOrgPaymentProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/org-payments/{id}",
		tags: ["Finance", "Payments"],
		summary: "Update a payment/receipt",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			date: z.coerce.date().optional(),
			clientId: z.string().trim().max(100).nullable().optional(),
			clientName: optionalTrimmed(MAX_NAME),
			projectId: z.string().trim().max(100).nullable().optional(),
			invoiceId: z.string().trim().max(100).nullable().optional(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			description: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const { organizationId, id, ...data } = input;

		const payment = await updatePayment(id, organizationId, data);

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "PAYMENT_UPDATED",
			entityType: "payment",
			entityId: id,
			metadata: data,
		});

		return payment;
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const deleteOrgPaymentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/org-payments/{id}",
		tags: ["Finance", "Payments"],
		summary: "Delete a payment/receipt",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const result = await deletePayment(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "PAYMENT_DELETED",
			entityType: "payment",
			entityId: input.id,
		});

		// Auto-Journal: reverse accounting entry for deleted payment
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "ORG_PAYMENT",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for deleted payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "ORG_PAYMENT" },
			});
		}

		return result;
	});
