import {
	getOrganizationExpenses,
	getExpenseById,
	createExpense,
	updateExpense,
	deleteExpense,
	getExpensesSummaryByCategory,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

// Enums
const orgExpenseCategoryEnum = z.enum([
	"MATERIALS",
	"LABOR",
	"EQUIPMENT_RENTAL",
	"EQUIPMENT_PURCHASE",
	"SUBCONTRACTOR",
	"TRANSPORT",
	"SALARIES",
	"RENT",
	"UTILITIES",
	"COMMUNICATIONS",
	"INSURANCE",
	"LICENSES",
	"BANK_FEES",
	"FUEL",
	"MAINTENANCE",
	"SUPPLIES",
	"MARKETING",
	"TRAINING",
	"TRAVEL",
	"HOSPITALITY",
	"LOAN_PAYMENT",
	"TAXES",
	"ZAKAT",
	"REFUND",
	"MISC",
	"CUSTOM",
]);

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
// LIST EXPENSES
// ═══════════════════════════════════════════════════════════════════════════
export const listExpenses = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses",
		tags: ["Finance", "Expenses"],
		summary: "List expenses for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			category: orgExpenseCategoryEnum.optional(),
			sourceAccountId: z.string().optional(),
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

		return getOrganizationExpenses(input.organizationId, {
			category: input.category,
			sourceAccountId: input.sourceAccountId,
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
// GET SINGLE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const getExpense = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Get a single expense",
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

		const expense = await getExpenseById(input.id, input.organizationId);

		if (!expense) {
			throw new Error("Expense not found");
		}

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET EXPENSES SUMMARY BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════
export const getExpensesSummary = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses/summary",
		tags: ["Finance", "Expenses"],
		summary: "Get expenses summary by category",
	})
	.input(
		z.object({
			organizationId: z.string(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			projectId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		return getExpensesSummaryByCategory(
			input.organizationId,
			input.dateFrom,
			input.dateTo,
			input.projectId,
		);
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const createExpenseProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/expenses",
		tags: ["Finance", "Expenses"],
		summary: "Create a new expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			category: orgExpenseCategoryEnum,
			customCategory: z.string().optional(),
			description: z.string().optional(),
			amount: z.number().positive(),
			date: z.coerce.date(),
			sourceAccountId: z.string(),
			vendorName: z.string().optional(),
			vendorTaxNumber: z.string().optional(),
			projectId: z.string().optional(),
			invoiceRef: z.string().optional(),
			paymentMethod: paymentMethodEnum.optional().default("BANK_TRANSFER"),
			referenceNo: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		return createExpense({
			organizationId: input.organizationId,
			createdById: context.user.id,
			category: input.category,
			customCategory: input.customCategory,
			description: input.description,
			amount: input.amount,
			date: input.date,
			sourceAccountId: input.sourceAccountId,
			vendorName: input.vendorName,
			vendorTaxNumber: input.vendorTaxNumber,
			projectId: input.projectId,
			invoiceRef: input.invoiceRef,
			paymentMethod: input.paymentMethod,
			referenceNo: input.referenceNo,
			notes: input.notes,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const updateExpenseProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Update an expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			category: orgExpenseCategoryEnum.optional(),
			customCategory: z.string().optional(),
			description: z.string().optional(),
			date: z.coerce.date().optional(),
			vendorName: z.string().optional(),
			vendorTaxNumber: z.string().optional(),
			projectId: z.string().nullable().optional(),
			invoiceRef: z.string().optional(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const { organizationId, id, ...data } = input;

		return updateExpense(id, organizationId, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const deleteExpenseProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Delete an expense",
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

		return deleteExpense(input.id, input.organizationId);
	});
