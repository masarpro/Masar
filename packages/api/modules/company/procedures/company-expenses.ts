import {
	getCompanyExpenses,
	getCompanyExpenseById,
	createCompanyExpense,
	updateCompanyExpense,
	deactivateCompanyExpense,
	getCompanyExpenseSummary,
	getCompanyExpenseDashboardData,
	getUpcomingCompanyPayments,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

const expenseCategoryEnum = z.enum([
	"RENT", "UTILITIES", "COMMUNICATIONS", "INSURANCE", "LICENSES",
	"SUBSCRIPTIONS", "MAINTENANCE", "BANK_FEES", "MARKETING",
	"TRANSPORT", "HOSPITALITY", "OTHER",
]);
const recurrenceTypeEnum = z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"]);

// ═══════════════════════════════════════════════════════════════════════════
// LIST COMPANY EXPENSES
// ═══════════════════════════════════════════════════════════════════════════
export const listCompanyExpenses = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses",
		tags: ["Company", "Expenses"],
		summary: "List company recurring expenses",
	})
	.input(
		z.object({
			organizationId: z.string(),
			category: expenseCategoryEnum.optional(),
			recurrence: recurrenceTypeEnum.optional(),
			isActive: z.boolean().optional(),
			query: z.string().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getCompanyExpenses(input.organizationId, {
			category: input.category,
			recurrence: input.recurrence,
			isActive: input.isActive,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET COMPANY EXPENSE BY ID
// ═══════════════════════════════════════════════════════════════════════════
export const getCompanyExpenseByIdProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses/{id}",
		tags: ["Company", "Expenses"],
		summary: "Get a single company expense",
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
			action: "view",
		});

		const expense = await getCompanyExpenseById(input.id, input.organizationId);
		if (!expense) throw new Error("Expense not found");
		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE COMPANY EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const createCompanyExpenseProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expenses",
		tags: ["Company", "Expenses"],
		summary: "Create a new recurring expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1, "اسم المصروف مطلوب"),
			category: expenseCategoryEnum,
			description: z.string().optional(),
			amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
			recurrence: recurrenceTypeEnum.optional(),
			vendor: z.string().optional(),
			contractNumber: z.string().optional(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date().optional(),
			reminderDays: z.number().min(0).optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return createCompanyExpense(input);
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE COMPANY EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const updateCompanyExpenseProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/company/expenses/{id}",
		tags: ["Company", "Expenses"],
		summary: "Update a company expense",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			name: z.string().min(1).optional(),
			category: expenseCategoryEnum.optional(),
			description: z.string().nullable().optional(),
			amount: z.number().positive().optional(),
			recurrence: recurrenceTypeEnum.optional(),
			vendor: z.string().nullable().optional(),
			contractNumber: z.string().nullable().optional(),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().nullable().optional(),
			reminderDays: z.number().min(0).optional(),
			isActive: z.boolean().optional(),
			notes: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		const { organizationId, id, ...data } = input;
		return updateCompanyExpense(id, organizationId, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// DEACTIVATE COMPANY EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const deactivateCompanyExpenseProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/company/expenses/{id}/deactivate",
		tags: ["Company", "Expenses"],
		summary: "Deactivate a company expense",
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

		return deactivateCompanyExpense(input.id, input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET COMPANY EXPENSE SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
export const getCompanyExpenseSummaryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses/summary",
		tags: ["Company", "Expenses"],
		summary: "Get company expense summary",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getCompanyExpenseSummary(input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET COMPANY EXPENSE DASHBOARD DATA
// ═══════════════════════════════════════════════════════════════════════════
export const getCompanyExpenseDashboardDataProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses/dashboard",
		tags: ["Company", "Expenses"],
		summary: "Get company expense data for dashboard (byCategory + monthly)",
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getCompanyExpenseDashboardData(input.organizationId);
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET UPCOMING PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════
export const getUpcomingPaymentsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/company/expenses/upcoming-payments",
		tags: ["Company", "Expenses"],
		summary: "Get upcoming expense payments",
	})
	.input(
		z.object({
			organizationId: z.string(),
			daysAhead: z.number().optional().default(30),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getUpcomingCompanyPayments(input.organizationId, input.daysAhead);
	});
