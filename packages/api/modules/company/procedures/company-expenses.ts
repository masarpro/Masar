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
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import {
	idString,
	trimmedString,
	optionalTrimmed,
	nullishTrimmed,
	searchQuery,
	positiveAmount,
	financialAmount,
	paginationLimit,
	paginationOffset,
	dayCount,
	MAX_NAME,
	MAX_DESC,
	MAX_CODE,
} from "../../../lib/validation-constants";

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
			organizationId: idString(),
			category: expenseCategoryEnum.optional(),
			recurrence: recurrenceTypeEnum.optional(),
			isActive: z.boolean().optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
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
			organizationId: idString(),
			id: idString(),
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
export const createCompanyExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/expenses",
		tags: ["Company", "Expenses"],
		summary: "Create a new recurring expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			name: trimmedString(MAX_NAME),
			category: expenseCategoryEnum,
			description: optionalTrimmed(MAX_DESC),
			amount: positiveAmount(),
			recurrence: recurrenceTypeEnum.optional(),
			vendor: optionalTrimmed(MAX_NAME),
			contractNumber: optionalTrimmed(MAX_CODE),
			startDate: z.coerce.date(),
			endDate: z.coerce.date().optional(),
			reminderDays: dayCount().optional(),
			notes: optionalTrimmed(MAX_DESC),
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
export const updateCompanyExpenseProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/expenses/{id}",
		tags: ["Company", "Expenses"],
		summary: "Update a company expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			name: trimmedString(MAX_NAME).optional(),
			category: expenseCategoryEnum.optional(),
			description: nullishTrimmed(MAX_DESC),
			amount: positiveAmount().optional(),
			recurrence: recurrenceTypeEnum.optional(),
			vendor: nullishTrimmed(MAX_NAME),
			contractNumber: nullishTrimmed(MAX_CODE),
			startDate: z.coerce.date().optional(),
			endDate: z.coerce.date().nullable().optional(),
			reminderDays: dayCount().optional(),
			isActive: z.boolean().optional(),
			notes: nullishTrimmed(MAX_DESC),
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
export const deactivateCompanyExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/expenses/{id}/deactivate",
		tags: ["Company", "Expenses"],
		summary: "Deactivate a company expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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
	.input(z.object({ organizationId: idString() }))
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
	.input(z.object({ organizationId: idString() }))
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
			organizationId: idString(),
			daysAhead: dayCount().optional().default(30),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getUpcomingCompanyPayments(input.organizationId, input.daysAhead);
	});
