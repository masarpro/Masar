import {
	getExpensePayments,
	createExpensePayment,
	markExpensePaymentPaid,
	updateExpensePayment,
	deleteExpensePayment,
	generateMonthlyPayments,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

// ═══════════════════════════════════════════════════════════════════════════
// LIST EXPENSE PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════
export const listExpensePayments = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses/{expenseId}/payments",
		tags: ["Company", "Expense Payments"],
		summary: "List payments for an expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			expenseId: z.string(),
			isPaid: z.boolean().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getExpensePayments(input.expenseId, {
			isPaid: input.isPaid,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const createExpensePaymentProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expenses/{expenseId}/payments",
		tags: ["Company", "Expense Payments"],
		summary: "Create a new expense payment",
	})
	.input(
		z.object({
			organizationId: z.string(),
			expenseId: z.string(),
			periodStart: z.coerce.date(),
			periodEnd: z.coerce.date(),
			amount: z.number().positive(),
			dueDate: z.coerce.date(),
			isPaid: z.boolean().optional(),
			paidAt: z.coerce.date().optional(),
			bankAccountId: z.string().optional(),
			referenceNo: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		const { organizationId, ...data } = input;
		return createExpensePayment(data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// MARK PAYMENT AS PAID
// ═══════════════════════════════════════════════════════════════════════════
export const markPaymentPaidProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expense-payments/{id}/mark-paid",
		tags: ["Company", "Expense Payments"],
		summary: "Mark an expense payment as paid (creates FinanceExpense)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			paidAt: z.coerce.date().optional(),
			bankAccountId: z.string(),
			referenceNo: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return markExpensePaymentPaid(input.id, {
			paidAt: input.paidAt,
			bankAccountId: input.bankAccountId,
			referenceNo: input.referenceNo,
			organizationId: input.organizationId,
			createdById: context.user.id,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EXPENSE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const updateExpensePaymentProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/company/expense-payments/{id}",
		tags: ["Company", "Expense Payments"],
		summary: "Update an expense payment",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			amount: z.number().positive().optional(),
			dueDate: z.coerce.date().optional(),
			isPaid: z.boolean().optional(),
			paidAt: z.coerce.date().nullable().optional(),
			bankAccountId: z.string().nullable().optional(),
			referenceNo: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		const { organizationId, id, ...data } = input;
		return updateExpensePayment(id, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE EXPENSE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const deleteExpensePaymentProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/company/expense-payments/{id}",
		tags: ["Company", "Expense Payments"],
		summary: "Delete an expense payment",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return deleteExpensePayment(input.id);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE MONTHLY PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════
export const generateMonthlyPaymentsProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expenses/{expenseId}/generate-payments",
		tags: ["Company", "Expense Payments"],
		summary: "Generate upcoming payment records",
	})
	.input(
		z.object({
			organizationId: z.string(),
			expenseId: z.string(),
			monthsAhead: z.number().min(1).max(12).optional().default(3),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return generateMonthlyPayments(input.expenseId, input.monthsAhead);
	});
