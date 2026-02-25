import {
	getOrganizationExpenses,
	getExpenseById,
	createExpense,
	updateExpense,
	deleteExpense,
	payExpense,
	cancelExpense,
	getExpensesSummaryByCategory,
	getOrganizationSubcontractPayments,
	orgAuditLog,
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

const expenseSourceTypeEnum = z.enum([
	"MANUAL",
	"FACILITY_PAYROLL",
	"FACILITY_RECURRING",
	"FACILITY_ASSET",
	"PROJECT",
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
			sourceType: expenseSourceTypeEnum.optional(),
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
			sourceType: input.sourceType,
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
			sourceAccountId: z.string().optional(),
			vendorName: z.string().optional(),
			vendorTaxNumber: z.string().optional(),
			projectId: z.string().optional(),
			invoiceRef: z.string().optional(),
			paymentMethod: paymentMethodEnum.optional().default("BANK_TRANSFER"),
			referenceNo: z.string().optional(),
			status: financeTransactionStatusEnum.optional(),
			sourceType: expenseSourceTypeEnum.optional(),
			dueDate: z.coerce.date().optional(),
			notes: z.string().optional(),
		}).refine(
			(data) => {
				// sourceAccountId is required when status is not PENDING
				if (data.status !== "PENDING" && !data.sourceAccountId) {
					return false;
				}
				return true;
			},
			{ message: "sourceAccountId is required for non-pending expenses", path: ["sourceAccountId"] },
		),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const expense = await createExpense({
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
			status: input.status,
			sourceType: input.sourceType,
			dueDate: input.dueDate,
			notes: input.notes,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_CREATED",
			entityType: "expense",
			entityId: expense.id,
			metadata: { amount: input.amount, category: input.category, status: input.status ?? "COMPLETED" },
		});

		return expense;
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

		const expense = await updateExpense(id, organizationId, data);

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "EXPENSE_UPDATED",
			entityType: "expense",
			entityId: id,
			metadata: data,
		});

		return expense;
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

		const result = await deleteExpense(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_DELETED",
			entityType: "expense",
			entityId: input.id,
		});

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// PAY EXPENSE (full or partial)
// ═══════════════════════════════════════════════════════════════════════════
export const payExpenseProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/expenses/{id}/pay",
		tags: ["Finance", "Expenses"],
		summary: "Pay a pending expense (full or partial)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			sourceAccountId: z.string(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().optional(),
			amount: z.number().positive().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const expense = await payExpense({
			expenseId: input.id,
			organizationId: input.organizationId,
			sourceAccountId: input.sourceAccountId,
			paymentMethod: input.paymentMethod,
			referenceNo: input.referenceNo,
			amount: input.amount,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_PAID",
			entityType: "expense",
			entityId: input.id,
			metadata: { amount: input.amount, sourceAccountId: input.sourceAccountId, newStatus: expense.status },
		});

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const cancelExpenseProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/expenses/{id}/cancel",
		tags: ["Finance", "Expenses"],
		summary: "Cancel a pending expense",
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

		const expense = await cancelExpense(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_CANCELLED",
			entityType: "expense",
			entityId: input.id,
		});

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// LIST EXPENSES WITH SUBCONTRACT PAYMENTS (UNIFIED)
// ═══════════════════════════════════════════════════════════════════════════
export const listExpensesWithSubcontracts = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expenses-unified",
		tags: ["Finance", "Expenses"],
		summary: "List expenses + subcontract payments unified",
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

		// Fetch both in parallel
		const [expensesResult, subPaymentsResult] = await Promise.all([
			getOrganizationExpenses(input.organizationId, {
				category: input.category,
				sourceAccountId: input.sourceAccountId,
				projectId: input.projectId,
				status: input.status,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				query: input.query,
				limit: 200, // fetch more so we can merge and re-sort
				offset: 0,
			}),
			// Only fetch subcontract payments if no category filter (or if category is SUBCONTRACTOR)
			!input.category || input.category === "SUBCONTRACTOR"
				? getOrganizationSubcontractPayments(input.organizationId, {
						projectId: input.projectId,
						status: input.status,
						dateFrom: input.dateFrom,
						dateTo: input.dateTo,
						query: input.query,
						limit: 200,
						offset: 0,
					})
				: { payments: [], total: 0 },
		]);

		// Normalize expenses
		const normalizedExpenses = expensesResult.expenses.map((e) => ({
			_type: "expense" as const,
			id: e.id,
			refNo: e.expenseNo,
			date: e.date,
			category: e.category,
			description: e.description,
			amount: Number(e.amount),
			vendorName: e.vendorName,
			status: e.status,
			sourceAccount: e.sourceAccount,
			project: e.project,
			createdBy: e.createdBy,
			// Subcontract-specific fields
			contractName: null as string | null,
			contractNo: null as string | null,
		}));

		// Normalize subcontract payments
		const normalizedSubPayments = subPaymentsResult.payments.map((p) => ({
			_type: "subcontract_payment" as const,
			id: p.id,
			refNo: p.paymentNo,
			date: p.date,
			category: "SUBCONTRACTOR" as const,
			description: p.description,
			amount: Number(p.amount),
			vendorName: p.contract.name,
			status: p.status,
			sourceAccount: p.sourceAccount,
			project: p.contract.project,
			createdBy: p.createdBy,
			contractName: p.contract.name,
			contractNo: p.contract.contractNo,
		}));

		// Merge and sort by date descending
		const unified = [...normalizedExpenses, ...normalizedSubPayments].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);

		// Apply pagination
		const paged = unified.slice(input.offset, input.offset + input.limit);
		const total = expensesResult.total + subPaymentsResult.total;

		// Compute combined summary
		const expensesTotal = normalizedExpenses.reduce(
			(sum, e) => sum + e.amount,
			0,
		);
		const subcontractTotal = normalizedSubPayments.reduce(
			(sum, p) => sum + p.amount,
			0,
		);

		return {
			items: paged,
			total,
			expensesTotal,
			subcontractTotal,
			grandTotal: expensesTotal + subcontractTotal,
		};
	});
