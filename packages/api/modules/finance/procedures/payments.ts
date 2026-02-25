import {
	getOrganizationPayments,
	getPaymentById,
	createPayment,
	updatePayment,
	deletePayment,
	orgAuditLog,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

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
			organizationId: z.string(),
			destinationAccountId: z.string().optional(),
			clientId: z.string().optional(),
			projectId: z.string().optional(),
			status: financeTransactionStatusEnum.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
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
			organizationId: z.string(),
			id: z.string(),
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
export const createOrgPaymentProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/org-payments",
		tags: ["Finance", "Payments"],
		summary: "Create a new payment/receipt",
	})
	.input(
		z.object({
			organizationId: z.string(),
			amount: z.number().positive(),
			date: z.coerce.date(),
			destinationAccountId: z.string(),
			clientId: z.string().optional(),
			clientName: z.string().optional(),
			projectId: z.string().optional(),
			invoiceId: z.string().optional(),
			contractTermId: z.string().optional(),
			paymentMethod: paymentMethodEnum.optional().default("CASH"),
			referenceNo: z.string().optional(),
			description: z.string().optional(),
			notes: z.string().optional(),
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

		return payment;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const updateOrgPaymentProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/org-payments/{id}",
		tags: ["Finance", "Payments"],
		summary: "Update a payment/receipt",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			date: z.coerce.date().optional(),
			clientId: z.string().nullable().optional(),
			clientName: z.string().optional(),
			projectId: z.string().nullable().optional(),
			invoiceId: z.string().nullable().optional(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().optional(),
			description: z.string().optional(),
			notes: z.string().optional(),
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
export const deleteOrgPaymentProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/org-payments/{id}",
		tags: ["Finance", "Payments"],
		summary: "Delete a payment/receipt",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
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

		return result;
	});
