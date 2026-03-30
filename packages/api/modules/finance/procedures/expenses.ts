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
	db,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_DESC, MAX_CODE,
	idString, optionalTrimmed, searchQuery,
	positiveAmount, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";

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
			organizationId: idString(),
			category: orgExpenseCategoryEnum.optional(),
			sourceAccountId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			status: financeTransactionStatusEnum.optional(),
			sourceType: expenseSourceTypeEnum.optional(),
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
			organizationId: idString(),
			id: idString(),
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
			organizationId: idString(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			projectId: z.string().trim().max(100).optional(),
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
export const createExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/expenses",
		tags: ["Finance", "Expenses"],
		summary: "Create a new expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			category: orgExpenseCategoryEnum,
			customCategory: z.string().trim().max(MAX_NAME).optional(),
			description: optionalTrimmed(MAX_DESC),
			amount: positiveAmount(),
			date: z.coerce.date(),
			sourceAccountId: z.string().trim().max(100).optional(),
			vendorName: optionalTrimmed(MAX_NAME),
			vendorTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).optional(),
			invoiceRef: z.string().trim().max(MAX_CODE).optional(),
			paymentMethod: paymentMethodEnum.optional().default("BANK_TRANSFER"),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			status: financeTransactionStatusEnum.optional(),
			sourceType: expenseSourceTypeEnum.optional(),
			dueDate: z.coerce.date().optional(),
			notes: optionalTrimmed(MAX_DESC),
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

		// Update onboarding checklist
		await db.onboardingProgress.updateMany({
			where: { organizationId: input.organizationId, firstExpenseRecorded: false },
			data: { firstExpenseRecorded: true },
		}).catch(() => {});

		// Auto-Journal: generate accounting entry for completed expense
		if ((input.status ?? "COMPLETED") === "COMPLETED") {
			try {
				const { onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
				await onExpenseCompleted(db, {
					id: expense.id,
					organizationId: input.organizationId,
					category: input.category,
					amount: expense.amount,
					date: expense.date,
					description: input.description ?? input.category,
					sourceAccountId: input.sourceAccountId,
					projectId: input.projectId,
					sourceType: input.sourceType,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to generate entry for expense:", e);
				orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: expense.id,
					metadata: { error: String(e), referenceType: "EXPENSE" },
				});
			}

			// Auto-create payment voucher for completed expense
			try {
				const { generateAtomicNo } = await import("@repo/database");
				const { numberToArabicWords } = await import("@repo/utils");
				const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
				await db.paymentVoucher.create({
					data: {
						organizationId: input.organizationId,
						voucherNo,
						expenseId: expense.id,
						date: expense.date,
						amount: expense.amount,
						amountInWords: numberToArabicWords(Number(expense.amount)),
						payeeName: input.vendorName || input.description || input.category,
						payeeType: "SUPPLIER",
						paymentMethod: input.paymentMethod || "BANK_TRANSFER",
						sourceAccountId: input.sourceAccountId || null,
						projectId: input.projectId || null,
						status: "ISSUED",
						preparedById: context.user.id,
						approvedById: context.user.id,
						approvedAt: new Date(),
					},
				});
			} catch (e) {
				console.error("[PaymentVoucher] Failed to create auto voucher from expense:", e);
			}
		}

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const updateExpenseProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Update an expense",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			category: orgExpenseCategoryEnum.optional(),
			customCategory: z.string().trim().max(MAX_NAME).optional(),
			description: optionalTrimmed(MAX_DESC),
			date: z.coerce.date().optional(),
			vendorName: optionalTrimmed(MAX_NAME),
			vendorTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).nullable().optional(),
			invoiceRef: z.string().trim().max(MAX_CODE).optional(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			notes: optionalTrimmed(MAX_DESC),
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
export const deleteExpenseProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/expenses/{id}",
		tags: ["Finance", "Expenses"],
		summary: "Delete an expense",
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

		const result = await deleteExpense(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_DELETED",
			entityType: "expense",
			entityId: input.id,
		});

		// Auto-Journal: reverse accounting entry for deleted expense
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "EXPENSE",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for deleted expense:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// PAY EXPENSE (full or partial)
// ═══════════════════════════════════════════════════════════════════════════
export const payExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/expenses/{id}/pay",
		tags: ["Finance", "Expenses"],
		summary: "Pay a pending expense (full or partial)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			sourceAccountId: idString(),
			paymentMethod: paymentMethodEnum.optional(),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			amount: positiveAmount().optional(),
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

		// Auto-Journal: generate accounting entry for expense payment
		try {
			const { onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
			await onExpenseCompleted(db, {
				id: expense.id,
				organizationId: input.organizationId,
				category: expense.category,
				amount: expense.amount,
				date: expense.date,
				description: expense.description ?? expense.category,
				sourceAccountId: input.sourceAccountId,
				projectId: expense.projectId,
				sourceType: expense.sourceType,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for expense payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: expense.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

		// Auto-create payment voucher for paid expense
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
			await db.paymentVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					expenseId: expense.id,
					date: expense.date,
					amount: expense.amount,
					amountInWords: numberToArabicWords(Number(expense.amount)),
					payeeName: expense.vendorName || expense.description || expense.category,
					payeeType: "SUPPLIER",
					paymentMethod: input.paymentMethod || "BANK_TRANSFER",
					sourceAccountId: input.sourceAccountId || null,
					projectId: expense.projectId || null,
					status: "ISSUED",
					preparedById: context.user.id,
					approvedById: context.user.id,
					approvedAt: new Date(),
				},
			});
		} catch (e) {
			console.error("[PaymentVoucher] Failed to create auto voucher from expense payment:", e);
		}

		return expense;
	});

// ═══════════════════════════════════════════════════════════════════════════
// CANCEL EXPENSE
// ═══════════════════════════════════════════════════════════════════════════
export const cancelExpenseProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/expenses/{id}/cancel",
		tags: ["Finance", "Expenses"],
		summary: "Cancel a pending expense",
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

		const expense = await cancelExpense(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "EXPENSE_CANCELLED",
			entityType: "expense",
			entityId: input.id,
		});

		// Auto-Journal: reverse accounting entry for cancelled expense
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "EXPENSE",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for cancelled expense:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

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
			organizationId: idString(),
			category: orgExpenseCategoryEnum.optional(),
			sourceAccountId: z.string().trim().max(100).optional(),
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
