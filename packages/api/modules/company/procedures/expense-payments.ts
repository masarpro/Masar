import {
	getExpensePayments,
	createExpensePayment,
	markExpensePaymentPaid,
	updateExpensePayment,
	deleteExpensePayment,
	generateMonthlyPayments,
	orgAuditLog,
	db,
} from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import {
	idString,
	optionalTrimmed,
	nullishTrimmed,
	positiveAmount,
	paginationLimit,
	paginationOffset,
	MAX_CODE,
	MAX_DESC,
} from "../../../lib/validation-constants";

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
			organizationId: idString(),
			expenseId: idString(),
			isPaid: z.boolean().optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "view",
		});

		return getExpensePayments(input.expenseId, input.organizationId, {
			isPaid: input.isPaid,
			limit: input.limit,
			offset: input.offset,
		});
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE EXPENSE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const createExpensePaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/expenses/{expenseId}/payments",
		tags: ["Company", "Expense Payments"],
		summary: "Create a new expense payment",
	})
	.input(
		z.object({
			organizationId: idString(),
			expenseId: idString(),
			periodStart: z.coerce.date(),
			periodEnd: z.coerce.date(),
			amount: positiveAmount(),
			dueDate: z.coerce.date(),
			isPaid: z.boolean().optional(),
			paidAt: z.coerce.date().optional(),
			bankAccountId: optionalTrimmed(MAX_CODE),
			referenceNo: optionalTrimmed(MAX_CODE),
			notes: optionalTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		const { organizationId, ...data } = input;
		return createExpensePayment(organizationId, data);
	});

// ═══════════════════════════════════════════════════════════════════════════
// MARK PAYMENT AS PAID
// ═══════════════════════════════════════════════════════════════════════════
export const markPaymentPaidProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/expense-payments/{id}/mark-paid",
		tags: ["Company", "Expense Payments"],
		summary: "Mark an expense payment as paid (creates FinanceExpense)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			paidAt: z.coerce.date().optional(),
			bankAccountId: idString(),
			referenceNo: optionalTrimmed(MAX_CODE),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		const result = await markExpensePaymentPaid(input.id, {
			paidAt: input.paidAt,
			bankAccountId: input.bankAccountId,
			referenceNo: input.referenceNo,
			organizationId: input.organizationId,
			createdById: context.user.id,
		});

		// Auto-Journal: generate accounting entry for the FinanceExpense created by marking payment as paid
		try {
			const { onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
			if (result.financeExpenseId) {
				const expense = await db.financeExpense.findUnique({
					where: { id: result.financeExpenseId },
					select: { id: true, category: true, amount: true, date: true, description: true, sourceAccountId: true, projectId: true, sourceType: true },
				});
				if (expense) {
					await onExpenseCompleted(db, {
						id: expense.id,
						organizationId: input.organizationId,
						category: expense.category,
						amount: expense.amount,
						date: expense.date,
						description: expense.description ?? expense.category,
						sourceAccountId: expense.sourceAccountId,
						projectId: expense.projectId,
						sourceType: expense.sourceType,
						userId: context.user.id,
					});
				}
			}
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for company expense payment:", e);
			await orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: result.financeExpenseId || input.id,
				metadata: { error: String(e), referenceType: "EXPENSE" },
			});
		}

		// Auto-create payment voucher for company expense payment
		try {
			if (result.financeExpenseId) {
				const { generateAtomicNo } = await import("@repo/database");
				const { numberToArabicWords } = await import("@repo/utils");
				const expenseData = await db.financeExpense.findUnique({
					where: { id: result.financeExpenseId },
					select: { id: true, amount: true, date: true, vendorName: true, description: true, category: true, projectId: true },
				});
				if (expenseData) {
					const voucherNo = await generateAtomicNo(input.organizationId, "PMT");
					await db.paymentVoucher.create({
						data: {
							organizationId: input.organizationId,
							voucherNo,
							expenseId: expenseData.id,
							date: expenseData.date,
							amount: expenseData.amount,
							amountInWords: numberToArabicWords(Number(expenseData.amount)),
							payeeName: expenseData.vendorName || expenseData.description || expenseData.category,
							payeeType: "SUPPLIER",
							paymentMethod: "BANK_TRANSFER",
							sourceAccountId: input.bankAccountId || null,
							projectId: expenseData.projectId || null,
							status: "ISSUED",
							preparedById: context.user.id,
							approvedById: context.user.id,
							approvedAt: new Date(),
						},
					});
				}
			}
		} catch (e) {
			console.error("[PaymentVoucher] Failed to create auto voucher from company expense:", e);
			await orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "voucher",
				entityId: input.id,
				metadata: { error: String(e), type: "PAYMENT_VOUCHER_AUTO_CREATE" },
			});
		}

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE EXPENSE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const updateExpensePaymentProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/company/expense-payments/{id}",
		tags: ["Company", "Expense Payments"],
		summary: "Update an expense payment",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			amount: positiveAmount().optional(),
			dueDate: z.coerce.date().optional(),
			isPaid: z.boolean().optional(),
			paidAt: z.coerce.date().nullable().optional(),
			bankAccountId: z.string().trim().max(MAX_CODE).nullable().optional(),
			referenceNo: nullishTrimmed(MAX_CODE),
			notes: nullishTrimmed(MAX_DESC),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		// Check if payment was already paid (has linked FinanceExpense with journal entry)
		const existingPayment = await db.companyExpensePayment.findFirst({
			where: {
				id: input.id,
				expense: { organizationId: input.organizationId },
			},
			select: { isPaid: true, financeExpenseId: true, amount: true },
		});

		const { organizationId, id, ...data } = input;

		const amountChanged =
			existingPayment?.isPaid === true &&
			!!existingPayment.financeExpenseId &&
			input.amount !== undefined &&
			Number(existingPayment.amount) !== input.amount;

		// Financial state changes atomically: payment row + bank delta + linked
		// FinanceExpense amount/paidAmount all commit or roll back together.
		const result = await db.$transaction(async (tx) => {
			const updated = await updateExpensePayment(id, organizationId, data, tx);

			if (amountChanged && existingPayment?.financeExpenseId) {
				const linked = await tx.financeExpense.findUnique({
					where: { id: existingPayment.financeExpenseId },
					select: { sourceAccountId: true },
				});
				const delta = (input.amount as number) - Number(existingPayment.amount);
				if (linked?.sourceAccountId && delta !== 0) {
					if (delta > 0) {
						// Deduct more — guard against driving the balance negative
						const dec = await tx.organizationBank.updateMany({
							where: { id: linked.sourceAccountId, balance: { gte: delta } },
							data: { balance: { decrement: delta } },
						});
						if (dec.count === 0) {
							throw new ORPCError("BAD_REQUEST", {
								message: "الرصيد غير كافي في الحساب المصدر",
							});
						}
					} else {
						await tx.organizationBank.update({
							where: { id: linked.sourceAccountId },
							data: { balance: { increment: Math.abs(delta) } },
						});
					}
				}
				await tx.financeExpense.update({
					where: { id: existingPayment.financeExpenseId },
					data: { amount: input.amount, paidAmount: input.amount },
				});
			}

			return updated;
		});

		// Journal adjustments run after the financial transaction (platform
		// convention: journal failures never break the original operation —
		// they are audit-logged as JOURNAL_ENTRY_FAILED).
		if (amountChanged && existingPayment?.financeExpenseId) {
			try {
				const { reverseAutoJournalEntry, onExpenseCompleted } = await import("../../../lib/accounting/auto-journal");
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "EXPENSE",
					referenceId: existingPayment.financeExpenseId,
					userId: context.user.id,
				});
				const expense = await db.financeExpense.findUnique({
					where: { id: existingPayment.financeExpenseId },
					select: { id: true, category: true, amount: true, date: true, description: true, sourceAccountId: true, projectId: true, sourceType: true },
				});
				if (expense) {
					await onExpenseCompleted(db, {
						id: expense.id,
						organizationId: input.organizationId,
						category: expense.category,
						amount: expense.amount,
						date: expense.date,
						description: expense.description ?? expense.category,
						sourceAccountId: expense.sourceAccountId,
						projectId: expense.projectId,
						sourceType: expense.sourceType,
						userId: context.user.id,
					});
				}
			} catch (e) {
				console.error("[AutoJournal] Failed to adjust entry for updated company expense payment:", e);
				await orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: existingPayment.financeExpenseId || input.id,
					metadata: { error: String(e), referenceType: "EXPENSE" },
				});
			}
		}

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE EXPENSE PAYMENT
// ═══════════════════════════════════════════════════════════════════════════
export const deleteExpensePaymentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/company/expense-payments/{id}",
		tags: ["Company", "Expense Payments"],
		summary: "Delete an expense payment",
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

		// Check if this payment has a linked FinanceExpense (created when marked as paid)
		const payment = await db.companyExpensePayment.findFirst({
			where: {
				id: input.id,
				expense: { organizationId: input.organizationId },
			},
			select: { financeExpenseId: true },
		});

		// Financial state changes atomically: the payment row, the bank-balance
		// restore, and the orphaned FinanceExpense all commit or roll back
		// together. If any step fails the whole delete is rejected — no more
		// silently-lost bank balance.
		const result = await db.$transaction(async (tx) => {
			const deleted = await deleteExpensePayment(
				input.id,
				input.organizationId,
				tx,
			);

			if (payment?.financeExpenseId) {
				const fx = await tx.financeExpense.findUnique({
					where: { id: payment.financeExpenseId },
					select: { sourceAccountId: true, paidAmount: true, amount: true },
				});
				if (fx?.sourceAccountId) {
					const restore = Number(fx.paidAmount ?? fx.amount);
					if (restore > 0) {
						await tx.organizationBank.update({
							where: { id: fx.sourceAccountId },
							data: { balance: { increment: restore } },
						});
					}
				}
				// deleteMany: idempotent if the expense was already removed elsewhere
				await tx.financeExpense.deleteMany({
					where: { id: payment.financeExpenseId },
				});
			}

			return deleted;
		});

		// Journal reversal runs after the financial transaction (platform
		// convention: journal failures never break the original operation).
		if (payment?.financeExpenseId) {
			try {
				const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
				await reverseAutoJournalEntry(db, {
					organizationId: input.organizationId,
					referenceType: "EXPENSE",
					referenceId: payment.financeExpenseId,
					userId: context.user.id,
				});
			} catch (e) {
				console.error("[AutoJournal] Failed to reverse entry for deleted company expense payment:", e);
				await orgAuditLog({
					organizationId: input.organizationId,
					actorId: context.user.id,
					action: "JOURNAL_ENTRY_FAILED",
					entityType: "journal_entry",
					entityId: payment.financeExpenseId || input.id,
					metadata: { error: String(e), referenceType: "EXPENSE" },
				});
			}
		}

		return result;
	});

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE MONTHLY PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════
export const generateMonthlyPaymentsProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/company/expenses/{expenseId}/generate-payments",
		tags: ["Company", "Expense Payments"],
		summary: "Generate upcoming payment records",
	})
	.input(
		z.object({
			organizationId: idString(),
			expenseId: idString(),
			monthsAhead: z.number().int().min(1).max(12).optional().default(3),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "company",
			action: "expenses",
		});

		return generateMonthlyPayments(
			input.expenseId,
			input.organizationId,
			input.monthsAhead,
		);
	});
