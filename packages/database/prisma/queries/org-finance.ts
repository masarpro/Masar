import { db } from "../client";
import { Prisma } from "../generated/client";
import type {
	FinanceAccountType,
	OrgExpenseCategory,
	FinanceTransactionStatus,
	PaymentMethod,
	ExpenseSourceType,
} from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZATION BANK QUERIES - استعلامات الحسابات البنكية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next bank account number (internal reference)
 */
export async function generateBankAccountRef(
	organizationId: string,
): Promise<string> {
	const prefix = "ACC-";

	const lastAccount = await db.organizationBank.findFirst({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
		select: { id: true },
	});

	const count = await db.organizationBank.count({ where: { organizationId } });
	return `${prefix}${(count + 1).toString().padStart(3, "0")}`;
}

/**
 * Get all bank accounts for an organization
 */
export async function getOrganizationBankAccounts(
	organizationId: string,
	options?: {
		accountType?: FinanceAccountType;
		isActive?: boolean;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		accountType?: FinanceAccountType;
		isActive?: boolean;
		OR?: Array<{
			name?: { contains: string; mode: "insensitive" };
			bankName?: { contains: string; mode: "insensitive" };
			accountNumber?: { contains: string };
		}>;
	} = { organizationId };

	if (options?.accountType) {
		where.accountType = options.accountType;
	}

	if (options?.isActive !== undefined) {
		where.isActive = options.isActive;
	}

	if (options?.query) {
		where.OR = [
			{ name: { contains: options.query, mode: "insensitive" } },
			{ bankName: { contains: options.query, mode: "insensitive" } },
			{ accountNumber: { contains: options.query } },
		];
	}

	const [accounts, total] = await Promise.all([
		db.organizationBank.findMany({
			where,
			include: {
				createdBy: { select: { id: true, name: true } },
				_count: {
					select: {
						expensesFrom: true,
						paymentsTo: true,
						transfersFrom: true,
						transfersTo: true,
					},
				},
			},
			orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.organizationBank.count({ where }),
	]);

	return { accounts, total };
}

/**
 * Get a single bank account by ID
 */
export async function getBankAccountById(id: string, organizationId: string) {
	return db.organizationBank.findFirst({
		where: { id, organizationId },
		include: {
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Get total balances summary for organization.
 * Uses DB-side groupBy aggregation to avoid JS floating-point drift across many accounts.
 */
export async function getOrganizationBalancesSummary(organizationId: string) {
	const [accounts, grouped] = await Promise.all([
		db.organizationBank.findMany({
			where: { organizationId, isActive: true },
			select: {
				id: true,
				name: true,
				accountType: true,
				balance: true,
				currency: true,
			},
		}),
		db.organizationBank.groupBy({
			by: ["accountType"],
			where: { organizationId, isActive: true },
			_sum: { balance: true },
		}),
	]);

	let totalBankBalance = 0;
	let totalCashBalance = 0;

	for (const group of grouped) {
		const sum = Number(group._sum.balance ?? 0);
		if (group.accountType === "BANK") {
			totalBankBalance = sum;
		} else {
			totalCashBalance = sum;
		}
	}

	return {
		accounts,
		totalBankBalance,
		totalCashBalance,
		totalBalance: totalBankBalance + totalCashBalance,
	};
}

/**
 * Reconcile a bank account: compare stored balance against computed balance
 * from all balance-affecting transactions.
 *
 * Read-only — never auto-corrects. Returns a discrepancy report.
 *
 * Computation:
 *   computedBalance = openingBalance + paymentsIn - expensesOut - subcontractPaymentsOut + transfersIn - transfersOut
 *
 * Status filters (matching the mutation logic in this file):
 *   - Payments: COMPLETED only (balance incremented on create, decremented on delete)
 *   - Expenses: non-CANCELLED with paidAmount > 0 (balance decremented per paidAmount)
 *   - SubcontractPayments: COMPLETED only (balance decremented on create via subcontract.ts)
 *   - Transfers: COMPLETED only (cancelled transfers have balances reversed)
 */
export async function reconcileBankAccount(
	accountId: string,
	organizationId: string,
) {
	const ZERO = new Prisma.Decimal(0);

	// 1. Fetch the bank account (org-isolated)
	const account = await db.organizationBank.findFirst({
		where: { id: accountId, organizationId },
		select: { id: true, balance: true, openingBalance: true },
	});

	if (!account) {
		throw new Error("Bank account not found");
	}

	// 2. DB-side aggregation for each balance component
	const [paymentsAgg, expensesAgg, subcontractPaymentsAgg, transfersOutAgg, transfersInAgg] =
		await Promise.all([
			// Payments IN: COMPLETED payments crediting this account
			db.financePayment.aggregate({
				where: {
					organizationId,
					destinationAccountId: accountId,
					status: "COMPLETED",
				},
				_sum: { amount: true },
			}),
			// Expenses OUT: non-CANCELLED expenses debiting this account (by paidAmount)
			db.financeExpense.aggregate({
				where: {
					organizationId,
					sourceAccountId: accountId,
					status: { not: "CANCELLED" },
				},
				_sum: { paidAmount: true },
			}),
			// SubcontractPayments OUT: COMPLETED subcontract payments from this account
			db.subcontractPayment.aggregate({
				where: {
					organizationId,
					sourceAccountId: accountId,
					status: "COMPLETED",
				},
				_sum: { amount: true },
			}),
			// Transfers OUT: COMPLETED transfers from this account
			db.financeTransfer.aggregate({
				where: {
					organizationId,
					fromAccountId: accountId,
					status: "COMPLETED",
				},
				_sum: { amount: true },
			}),
			// Transfers IN: COMPLETED transfers to this account
			db.financeTransfer.aggregate({
				where: {
					organizationId,
					toAccountId: accountId,
					status: "COMPLETED",
				},
				_sum: { amount: true },
			}),
		]);

	const openingBalance = account.openingBalance ?? ZERO;
	const paymentsIn = paymentsAgg._sum.amount ?? ZERO;
	const expensesOut = expensesAgg._sum.paidAmount ?? ZERO;
	const subcontractPaymentsOut = subcontractPaymentsAgg._sum.amount ?? ZERO;
	const transfersOut = transfersOutAgg._sum.amount ?? ZERO;
	const transfersIn = transfersInAgg._sum.amount ?? ZERO;

	// 3. Compute expected balance using Decimal arithmetic
	const computedBalance = new Prisma.Decimal(openingBalance)
		.add(paymentsIn)
		.sub(expensesOut)
		.sub(subcontractPaymentsOut)
		.add(transfersIn)
		.sub(transfersOut);

	// 4. Delta and tolerance check (1 halala = 0.01 SAR)
	const storedBalance = account.balance;
	const delta = new Prisma.Decimal(storedBalance).sub(computedBalance);
	const isBalanced = delta.abs().lte(new Prisma.Decimal("0.01"));

	return {
		storedBalance,
		computedBalance,
		delta,
		isBalanced,
		components: {
			openingBalance,
			paymentsIn,
			expensesOut,
			subcontractPaymentsOut,
			transfersIn,
			transfersOut,
		},
	};
}

/**
 * Create a new bank account
 */
export async function createBankAccount(data: {
	organizationId: string;
	createdById: string;
	name: string;
	accountNumber?: string;
	bankName?: string;
	iban?: string;
	accountType?: FinanceAccountType;
	balance?: number;
	currency?: string;
	isDefault?: boolean;
	notes?: string;
}) {
	// If this is marked as default, unset other defaults
	if (data.isDefault) {
		await db.organizationBank.updateMany({
			where: { organizationId: data.organizationId, isDefault: true },
			data: { isDefault: false },
		});
	}

	return db.organizationBank.create({
		data: {
			organizationId: data.organizationId,
			createdById: data.createdById,
			name: data.name,
			accountNumber: data.accountNumber,
			bankName: data.bankName,
			iban: data.iban,
			accountType: data.accountType ?? "BANK",
			balance: data.balance ?? 0,
			currency: data.currency ?? "SAR",
			isDefault: data.isDefault ?? false,
			isActive: true,
			notes: data.notes,
		},
	});
}

/**
 * Update a bank account
 */
export async function updateBankAccount(
	id: string,
	organizationId: string,
	data: Partial<{
		name: string;
		accountNumber: string;
		bankName: string;
		iban: string;
		accountType: FinanceAccountType;
		currency: string;
		isActive: boolean;
		notes: string;
	}>,
) {
	const existing = await db.organizationBank.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Bank account not found");
	}

	return db.organizationBank.update({
		where: { id },
		data,
	});
}

/**
 * Set a bank account as default
 */
export async function setDefaultBankAccount(id: string, organizationId: string) {
	const existing = await db.organizationBank.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Bank account not found");
	}

	// Unset other defaults
	await db.organizationBank.updateMany({
		where: { organizationId, isDefault: true },
		data: { isDefault: false },
	});

	return db.organizationBank.update({
		where: { id },
		data: { isDefault: true },
	});
}

/**
 * Delete a bank account (only if no transactions)
 */
export async function deleteBankAccount(id: string, organizationId: string) {
	const existing = await db.organizationBank.findFirst({
		where: { id, organizationId },
		include: {
			_count: {
				select: {
					expensesFrom: true,
					paymentsTo: true,
					transfersFrom: true,
					transfersTo: true,
				},
			},
		},
	});

	if (!existing) {
		throw new Error("Bank account not found");
	}

	const totalTransactions =
		existing._count.expensesFrom +
		existing._count.paymentsTo +
		existing._count.transfersFrom +
		existing._count.transfersTo;

	if (totalTransactions > 0) {
		throw new Error("Cannot delete account with existing transactions");
	}

	return db.organizationBank.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCE EXPENSE QUERIES - استعلامات المصروفات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next expense number
 */
export async function generateExpenseNumber(
	organizationId: string,
): Promise<string> {
	const { generateAtomicNo } = await import("./sequences");
	return generateAtomicNo(organizationId, "EXP");
}

/**
 * Get all expenses for an organization
 */
export async function getOrganizationExpenses(
	organizationId: string,
	options?: {
		category?: OrgExpenseCategory;
		sourceAccountId?: string;
		projectId?: string;
		status?: FinanceTransactionStatus;
		sourceType?: ExpenseSourceType;
		dateFrom?: Date;
		dateTo?: Date;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.category) where.category = options.category;
	if (options?.sourceAccountId) where.sourceAccountId = options.sourceAccountId;
	if (options?.projectId) where.projectId = options.projectId;
	if (options?.status) where.status = options.status;
	if (options?.sourceType) where.sourceType = options.sourceType;

	if (options?.dateFrom || options?.dateTo) {
		const date: Record<string, Date> = {};
		if (options.dateFrom) date.gte = options.dateFrom;
		if (options.dateTo) date.lte = options.dateTo;
		where.date = date;
	}

	if (options?.query) {
		where.OR = [
			{ expenseNo: { contains: options.query, mode: "insensitive" } },
			{ description: { contains: options.query, mode: "insensitive" } },
			{ vendorName: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [expenses, total] = await Promise.all([
		db.financeExpense.findMany({
			where,
			include: {
				sourceAccount: { select: { id: true, name: true, accountType: true } },
				project: { select: { id: true, name: true, slug: true } },
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.financeExpense.count({ where }),
	]);

	return { expenses, total };
}

/**
 * Get a single expense by ID
 */
export async function getExpenseById(id: string, organizationId: string) {
	return db.financeExpense.findFirst({
		where: { id, organizationId },
		include: {
			sourceAccount: true,
			project: { select: { id: true, name: true, slug: true } },
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Create a new expense and deduct from account balance
 * When status is PENDING (obligation), no balance deduction occurs
 */
export async function createExpense(data: {
	organizationId: string;
	createdById: string;
	category: OrgExpenseCategory;
	customCategory?: string;
	description?: string;
	amount: number;
	date: Date;
	sourceAccountId?: string;
	vendorName?: string;
	vendorTaxNumber?: string;
	projectId?: string;
	invoiceRef?: string;
	paymentMethod?: PaymentMethod;
	referenceNo?: string;
	status?: FinanceTransactionStatus;
	sourceType?: ExpenseSourceType;
	sourceId?: string;
	dueDate?: Date;
	notes?: string;
}) {
	const expenseNo = await generateExpenseNumber(data.organizationId);
	const status = data.status ?? "COMPLETED";
	const isCompleted = status === "COMPLETED";

	// Layer 1: Early balance check (UX — fast fail before transaction)
	if (isCompleted && data.sourceAccountId) {
		const account = await db.organizationBank.findFirst({
			where: { id: data.sourceAccountId, organizationId: data.organizationId },
			select: { balance: true },
		});
		if (!account || Number(account.balance) < data.amount) {
			throw new Error("الرصيد غير كافي في الحساب المصدر");
		}
	}

	return db.$transaction(async (tx) => {
		// Create the expense
		const expense = await tx.financeExpense.create({
			data: {
				organizationId: data.organizationId,
				createdById: data.createdById,
				expenseNo,
				category: data.category,
				customCategory: data.customCategory,
				description: data.description,
				amount: data.amount,
				date: data.date,
				sourceAccountId: data.sourceAccountId ?? null,
				vendorName: data.vendorName,
				vendorTaxNumber: data.vendorTaxNumber,
				projectId: data.projectId,
				invoiceRef: data.invoiceRef,
				paymentMethod: data.paymentMethod ?? "BANK_TRANSFER",
				referenceNo: data.referenceNo,
				status,
				sourceType: data.sourceType ?? "MANUAL",
				sourceId: data.sourceId,
				paidAmount: isCompleted ? data.amount : 0,
				dueDate: data.dueDate,
				notes: data.notes,
			},
		});

		// Only deduct from account balance if COMPLETED and sourceAccountId is provided
		if (isCompleted && data.sourceAccountId) {
			// Layer 2: Atomic guard — prevents negative balance under concurrency
			const updated = await tx.organizationBank.updateMany({
				where: { id: data.sourceAccountId, balance: { gte: data.amount } },
				data: { balance: { decrement: data.amount } },
			});
			if (updated.count === 0) {
				throw new Error("الرصيد غير كافي في الحساب المصدر");
			}
		}

		return expense;
	});
}

/**
 * Pay a PENDING expense (full or partial)
 */
export async function payExpense(data: {
	expenseId: string;
	organizationId: string;
	sourceAccountId: string;
	paymentMethod?: PaymentMethod;
	referenceNo?: string;
	amount?: number; // if not provided, pays the full remaining amount
}) {
	const expense = await db.financeExpense.findFirst({
		where: { id: data.expenseId, organizationId: data.organizationId },
		select: { id: true, amount: true, paidAmount: true, status: true, sourceAccountId: true },
	});

	if (!expense) {
		throw new Error("Expense not found");
	}

	if (expense.status === "COMPLETED") {
		throw new Error("Expense is already fully paid");
	}

	if (expense.status === "CANCELLED") {
		throw new Error("Cannot pay a cancelled expense");
	}

	const totalAmount = Number(expense.amount);
	const currentPaid = Number(expense.paidAmount);
	const remaining = totalAmount - currentPaid;
	const payAmount = data.amount ?? remaining;

	if (payAmount <= 0) {
		throw new Error("Payment amount must be positive");
	}

	if (payAmount > remaining) {
		throw new Error(`Payment amount (${payAmount}) exceeds remaining (${remaining})`);
	}

	// Layer 1: Early balance check (UX — fast fail before transaction)
	const sourceAccount = await db.organizationBank.findFirst({
		where: { id: data.sourceAccountId, organizationId: data.organizationId },
		select: { balance: true },
	});
	if (!sourceAccount) {
		throw new Error("الحساب المصدر غير موجود");
	}
	if (Number(sourceAccount.balance) < payAmount) {
		throw new Error("الرصيد غير كافي في الحساب المصدر");
	}

	const newPaidAmount = currentPaid + payAmount;
	const isFullyPaid = newPaidAmount >= totalAmount;

	return db.$transaction(async (tx) => {
		// Update the expense
		const updated = await tx.financeExpense.update({
			where: { id: data.expenseId },
			data: {
				paidAmount: newPaidAmount,
				status: isFullyPaid ? "COMPLETED" : "PENDING",
				sourceAccountId: data.sourceAccountId,
				paymentMethod: data.paymentMethod ?? "BANK_TRANSFER",
				referenceNo: data.referenceNo,
			},
		});

		// Layer 2: Atomic guard — prevents negative balance under concurrency
		const balanceUpdate = await tx.organizationBank.updateMany({
			where: { id: data.sourceAccountId, balance: { gte: payAmount } },
			data: { balance: { decrement: payAmount } },
		});
		if (balanceUpdate.count === 0) {
			throw new Error("الرصيد غير كافي في الحساب المصدر");
		}

		return updated;
	});
}

/**
 * Cancel a PENDING expense
 */
export async function cancelExpense(id: string, organizationId: string) {
	const existing = await db.financeExpense.findFirst({
		where: { id, organizationId },
		select: { id: true, status: true, paidAmount: true, sourceAccountId: true },
	});

	if (!existing) {
		throw new Error("Expense not found");
	}

	if (existing.status === "CANCELLED") {
		throw new Error("Expense is already cancelled");
	}

	// If there were partial payments, restore them to the account
	const paidAmount = Number(existing.paidAmount);

	return db.$transaction(async (tx) => {
		const updated = await tx.financeExpense.update({
			where: { id },
			data: { status: "CANCELLED" },
		});

		if (paidAmount > 0 && existing.sourceAccountId) {
			await tx.organizationBank.update({
				where: { id: existing.sourceAccountId },
				data: {
					balance: { increment: paidAmount },
				},
			});
		}

		return updated;
	});
}

/**
 * Get computed payment status for an expense
 */
export function getExpensePaymentStatus(expense: {
	amount: number | { toString(): string };
	paidAmount: number | { toString(): string };
	status: string;
	dueDate?: Date | null;
}): "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" {
	if (expense.status === "CANCELLED") return "CANCELLED";

	const total = Number(expense.amount);
	const paid = Number(expense.paidAmount);

	if (paid >= total) return "PAID";

	if (expense.status === "PENDING" || paid < total) {
		if (expense.dueDate && new Date(expense.dueDate) < new Date()) {
			return paid > 0 ? "OVERDUE" : "OVERDUE";
		}
		return paid > 0 ? "PARTIAL" : "PENDING";
	}

	return "PAID";
}

/**
 * Update an expense
 */
export async function updateExpense(
	id: string,
	organizationId: string,
	data: Partial<{
		category: OrgExpenseCategory;
		customCategory: string;
		description: string;
		date: Date;
		vendorName: string;
		vendorTaxNumber: string;
		projectId: string | null;
		invoiceRef: string;
		paymentMethod: PaymentMethod;
		referenceNo: string;
		notes: string;
	}>,
) {
	const existing = await db.financeExpense.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Expense not found");
	}

	return db.financeExpense.update({
		where: { id },
		data,
	});
}

/**
 * Delete an expense and restore account balance
 * Blocks deletion of facility-generated expenses
 */
export async function deleteExpense(id: string, organizationId: string) {
	const existing = await db.financeExpense.findFirst({
		where: { id, organizationId },
		select: { id: true, amount: true, paidAmount: true, sourceAccountId: true, status: true, sourceType: true },
	});

	if (!existing) {
		throw new Error("Expense not found");
	}

	// Block deletion of facility-generated expenses from finance side
	if (existing.sourceType !== "MANUAL") {
		throw new Error("Cannot delete facility-generated expenses. Cancel from the source module instead.");
	}

	return db.$transaction(async (tx) => {
		// Delete the expense
		await tx.financeExpense.delete({ where: { id } });

		// Restore only the paid amount to account balance
		const restoreAmount = Number(existing.paidAmount);
		if (restoreAmount > 0 && existing.sourceAccountId) {
			await tx.organizationBank.update({
				where: { id: existing.sourceAccountId },
				data: {
					balance: { increment: restoreAmount },
				},
			});
		}
	});
}

/**
 * Get expenses summary by category for a period
 */
export async function getExpensesSummaryByCategory(
	organizationId: string,
	dateFrom?: Date,
	dateTo?: Date,
	projectId?: string,
) {
	const where: {
		organizationId: string;
		status: FinanceTransactionStatus;
		projectId?: string;
		date?: { gte?: Date; lte?: Date };
	} = {
		organizationId,
		status: "COMPLETED",
	};

	if (projectId) {
		where.projectId = projectId;
	}

	if (dateFrom || dateTo) {
		where.date = {};
		if (dateFrom) where.date.gte = dateFrom;
		if (dateTo) where.date.lte = dateTo;
	}

	const expenses = await db.financeExpense.groupBy({
		by: ["category"],
		where,
		_sum: { amount: true },
		_count: true,
	});

	return expenses.map((e) => ({
		category: e.category,
		total: Number(e._sum.amount) || 0,
		count: e._count,
	}));
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCONTRACT PAYMENTS FOR ORG FINANCE - دفعات الباطن على مستوى المنظمة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get subcontract payments at organization level (for unified expenses view)
 */
export async function getOrganizationSubcontractPayments(
	organizationId: string,
	options?: {
		projectId?: string;
		status?: FinanceTransactionStatus;
		dateFrom?: Date;
		dateTo?: Date;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: Record<string, unknown> = { organizationId };

	if (options?.projectId) {
		where.contract = { projectId: options.projectId };
	}

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.dateFrom || options?.dateTo) {
		const dateFilter: Record<string, Date> = {};
		if (options?.dateFrom) dateFilter.gte = options.dateFrom;
		if (options?.dateTo) dateFilter.lte = options.dateTo;
		where.date = dateFilter;
	}

	if (options?.query) {
		where.OR = [
			{ paymentNo: { contains: options.query, mode: "insensitive" } },
			{ description: { contains: options.query, mode: "insensitive" } },
			{
				contract: {
					name: { contains: options.query, mode: "insensitive" },
				},
			},
		];
	}

	const [payments, total] = await Promise.all([
		db.subcontractPayment.findMany({
			where: where as any,
			include: {
				contract: {
					select: {
						id: true,
						name: true,
						contractNo: true,
						project: { select: { id: true, name: true, slug: true } },
					},
				},
				sourceAccount: {
					select: { id: true, name: true, accountType: true },
				},
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.subcontractPayment.count({ where: where as any }),
	]);

	return { payments, total };
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCE PAYMENT QUERIES - استعلامات المقبوضات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next payment number
 */
export async function generatePaymentNumber(
	organizationId: string,
): Promise<string> {
	const { generateAtomicNo } = await import("./sequences");
	return generateAtomicNo(organizationId, "RCV");
}

/**
 * Get all payments for an organization
 */
export async function getOrganizationPayments(
	organizationId: string,
	options?: {
		destinationAccountId?: string;
		clientId?: string;
		projectId?: string;
		status?: FinanceTransactionStatus;
		dateFrom?: Date;
		dateTo?: Date;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		destinationAccountId?: string;
		clientId?: string;
		projectId?: string;
		status?: FinanceTransactionStatus;
		date?: { gte?: Date; lte?: Date };
		OR?: Array<{
			paymentNo?: { contains: string; mode: "insensitive" };
			description?: { contains: string; mode: "insensitive" };
			clientName?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.destinationAccountId) {
		where.destinationAccountId = options.destinationAccountId;
	}

	if (options?.clientId) {
		where.clientId = options.clientId;
	}

	if (options?.projectId) {
		where.projectId = options.projectId;
	}

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.dateFrom || options?.dateTo) {
		where.date = {};
		if (options.dateFrom) where.date.gte = options.dateFrom;
		if (options.dateTo) where.date.lte = options.dateTo;
	}

	if (options?.query) {
		where.OR = [
			{ paymentNo: { contains: options.query, mode: "insensitive" } },
			{ description: { contains: options.query, mode: "insensitive" } },
			{ clientName: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [payments, total] = await Promise.all([
		db.financePayment.findMany({
			where,
			include: {
				destinationAccount: { select: { id: true, name: true, accountType: true } },
				client: { select: { id: true, name: true, company: true } },
				project: { select: { id: true, name: true, slug: true } },
				invoice: { select: { id: true, invoiceNo: true, totalAmount: true } },
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.financePayment.count({ where }),
	]);

	return { payments, total };
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(id: string, organizationId: string) {
	return db.financePayment.findFirst({
		where: { id, organizationId },
		include: {
			destinationAccount: true,
			client: true,
			project: { select: { id: true, name: true, slug: true } },
			invoice: { select: { id: true, invoiceNo: true, totalAmount: true, paidAmount: true } },
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Create a new payment and add to account balance
 */
export async function createPayment(data: {
	organizationId: string;
	createdById: string;
	amount: number;
	date: Date;
	destinationAccountId: string;
	clientId?: string;
	clientName?: string;
	projectId?: string;
	invoiceId?: string;
	contractTermId?: string;
	paymentMethod?: PaymentMethod;
	referenceNo?: string;
	description?: string;
	notes?: string;
}) {
	const paymentNo = await generatePaymentNumber(data.organizationId);

	return db.$transaction(async (tx) => {
		// Create the payment
		const payment = await tx.financePayment.create({
			data: {
				organizationId: data.organizationId,
				createdById: data.createdById,
				paymentNo,
				amount: data.amount,
				date: data.date,
				destinationAccountId: data.destinationAccountId,
				clientId: data.clientId,
				clientName: data.clientName,
				projectId: data.projectId,
				invoiceId: data.invoiceId,
				contractTermId: data.contractTermId,
				paymentMethod: data.paymentMethod ?? "CASH",
				referenceNo: data.referenceNo,
				status: "COMPLETED",
				description: data.description,
				notes: data.notes,
			},
		});

		// Add to account balance
		await tx.organizationBank.update({
			where: { id: data.destinationAccountId },
			data: {
				balance: { increment: data.amount },
			},
		});

		return payment;
	});
}

/**
 * Update a payment
 */
export async function updatePayment(
	id: string,
	organizationId: string,
	data: Partial<{
		date: Date;
		clientId: string | null;
		clientName: string;
		projectId: string | null;
		invoiceId: string | null;
		paymentMethod: PaymentMethod;
		referenceNo: string;
		description: string;
		notes: string;
	}>,
) {
	const existing = await db.financePayment.findFirst({
		where: { id, organizationId },
		select: { id: true },
	});

	if (!existing) {
		throw new Error("Payment not found");
	}

	return db.financePayment.update({
		where: { id },
		data,
	});
}

/**
 * Delete a payment and deduct from account balance
 */
export async function deletePayment(id: string, organizationId: string) {
	const existing = await db.financePayment.findFirst({
		where: { id, organizationId },
		select: { id: true, amount: true, destinationAccountId: true, status: true },
	});

	if (!existing) {
		throw new Error("Payment not found");
	}

	return db.$transaction(async (tx) => {
		// Delete the payment
		await tx.financePayment.delete({ where: { id } });

		// Deduct from account balance if it was completed
		if (existing.status === "COMPLETED") {
			await tx.organizationBank.update({
				where: { id: existing.destinationAccountId },
				data: {
					balance: { decrement: Number(existing.amount) },
				},
			});
		}
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCE TRANSFER QUERIES - استعلامات التحويلات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate next transfer number
 */
export async function generateTransferNumber(
	organizationId: string,
): Promise<string> {
	const { generateAtomicNo } = await import("./sequences");
	return generateAtomicNo(organizationId, "TRF");
}

/**
 * Get all transfers for an organization
 */
export async function getOrganizationTransfers(
	organizationId: string,
	options?: {
		fromAccountId?: string;
		toAccountId?: string;
		status?: FinanceTransactionStatus;
		dateFrom?: Date;
		dateTo?: Date;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		fromAccountId?: string;
		toAccountId?: string;
		status?: FinanceTransactionStatus;
		date?: { gte?: Date; lte?: Date };
		OR?: Array<{
			transferNo?: { contains: string; mode: "insensitive" };
			description?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.fromAccountId) {
		where.fromAccountId = options.fromAccountId;
	}

	if (options?.toAccountId) {
		where.toAccountId = options.toAccountId;
	}

	if (options?.status) {
		where.status = options.status;
	}

	if (options?.dateFrom || options?.dateTo) {
		where.date = {};
		if (options.dateFrom) where.date.gte = options.dateFrom;
		if (options.dateTo) where.date.lte = options.dateTo;
	}

	if (options?.query) {
		where.OR = [
			{ transferNo: { contains: options.query, mode: "insensitive" } },
			{ description: { contains: options.query, mode: "insensitive" } },
		];
	}

	const [transfers, total] = await Promise.all([
		db.financeTransfer.findMany({
			where,
			include: {
				fromAccount: { select: { id: true, name: true, accountType: true } },
				toAccount: { select: { id: true, name: true, accountType: true } },
				createdBy: { select: { id: true, name: true } },
			},
			orderBy: { date: "desc" },
			take: options?.limit ?? 50,
			skip: options?.offset ?? 0,
		}),
		db.financeTransfer.count({ where }),
	]);

	return { transfers, total };
}

/**
 * Get a single transfer by ID
 */
export async function getTransferById(id: string, organizationId: string) {
	return db.financeTransfer.findFirst({
		where: { id, organizationId },
		include: {
			fromAccount: true,
			toAccount: true,
			createdBy: { select: { id: true, name: true, email: true } },
		},
	});
}

/**
 * Create a transfer between two accounts (atomic transaction)
 */
export async function createTransfer(data: {
	organizationId: string;
	createdById: string;
	amount: number;
	date: Date;
	fromAccountId: string;
	toAccountId: string;
	description?: string;
	notes?: string;
	referenceNo?: string;
}) {
	if (data.fromAccountId === data.toAccountId) {
		throw new Error("Cannot transfer to the same account");
	}

	const transferNo = await generateTransferNumber(data.organizationId);

	return db.$transaction(async (tx) => {
		// Verify both accounts exist and belong to organization
		const [fromAccount, toAccount] = await Promise.all([
			tx.organizationBank.findFirst({
				where: { id: data.fromAccountId, organizationId: data.organizationId },
				select: { id: true, balance: true },
			}),
			tx.organizationBank.findFirst({
				where: { id: data.toAccountId, organizationId: data.organizationId },
				select: { id: true },
			}),
		]);

		if (!fromAccount) {
			throw new Error("Source account not found");
		}

		if (!toAccount) {
			throw new Error("Destination account not found");
		}

		// Layer 1: Early balance check (UX — fast fail)
		if (Number(fromAccount.balance) < data.amount) {
			throw new Error("الرصيد غير كافي في الحساب المصدر");
		}

		// Create the transfer
		const transfer = await tx.financeTransfer.create({
			data: {
				organizationId: data.organizationId,
				createdById: data.createdById,
				transferNo,
				amount: data.amount,
				date: data.date,
				fromAccountId: data.fromAccountId,
				toAccountId: data.toAccountId,
				status: "COMPLETED",
				description: data.description,
				notes: data.notes,
				referenceNo: data.referenceNo,
			},
		});

		// Layer 2: Atomic guard — prevents negative balance under concurrency
		const balanceUpdate = await tx.organizationBank.updateMany({
			where: { id: data.fromAccountId, balance: { gte: data.amount } },
			data: { balance: { decrement: data.amount } },
		});
		if (balanceUpdate.count === 0) {
			throw new Error("الرصيد غير كافي في الحساب المصدر");
		}

		// Increment destination account
		await tx.organizationBank.update({
			where: { id: data.toAccountId },
			data: { balance: { increment: data.amount } },
		});

		return transfer;
	});
}

/**
 * Cancel a transfer and reverse account balances
 */
export async function cancelTransfer(id: string, organizationId: string) {
	const existing = await db.financeTransfer.findFirst({
		where: { id, organizationId },
		select: {
			id: true,
			amount: true,
			fromAccountId: true,
			toAccountId: true,
			status: true,
		},
	});

	if (!existing) {
		throw new Error("Transfer not found");
	}

	if (existing.status === "CANCELLED") {
		throw new Error("Transfer already cancelled");
	}

	return db.$transaction(async (tx) => {
		// Update transfer status
		const transfer = await tx.financeTransfer.update({
			where: { id },
			data: { status: "CANCELLED" },
		});

		// Reverse account balances if it was completed
		if (existing.status === "COMPLETED") {
			await Promise.all([
				tx.organizationBank.update({
					where: { id: existing.fromAccountId },
					data: { balance: { increment: Number(existing.amount) } },
				}),
				tx.organizationBank.update({
					where: { id: existing.toAccountId },
					data: { balance: { decrement: Number(existing.amount) } },
				}),
			]);
		}

		return transfer;
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD & REPORTS - لوحة التحكم والتقارير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get organization finance dashboard summary
 */
export async function getOrgFinanceDashboard(
	organizationId: string,
	options?: {
		dateFrom?: Date;
		dateTo?: Date;
	},
) {
	const dateFilter = {
		...(options?.dateFrom && { gte: options.dateFrom }),
		...(options?.dateTo && { lte: options.dateTo }),
	};

	const hasDateFilter = Object.keys(dateFilter).length > 0;

	const [
		balancesSummary,
		expensesTotal,
		paymentsTotal,
		subcontractPaymentsTotal,
		recentExpenses,
		recentPayments,
		pendingObligations,
	] = await Promise.all([
		getOrganizationBalancesSummary(organizationId),
		db.financeExpense.aggregate({
			where: {
				organizationId,
				status: "COMPLETED",
				...(hasDateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),
		db.financePayment.aggregate({
			where: {
				organizationId,
				status: "COMPLETED",
				...(hasDateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),
		db.subcontractPayment.aggregate({
			where: {
				organizationId,
				status: "COMPLETED",
				...(hasDateFilter && { date: dateFilter }),
			},
			_sum: { amount: true },
			_count: true,
		}),
		db.financeExpense.findMany({
			where: { organizationId },
			include: {
				sourceAccount: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		}),
		db.financePayment.findMany({
			where: { organizationId },
			include: {
				destinationAccount: { select: { id: true, name: true } },
				client: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		}),
		db.financeExpense.aggregate({
			where: {
				organizationId,
				status: "PENDING",
			},
			_sum: { amount: true },
			_count: true,
		}),
	]);

	return {
		balances: balancesSummary,
		expenses: {
			total: Number(expensesTotal._sum.amount) || 0,
			count: expensesTotal._count,
		},
		payments: {
			total: Number(paymentsTotal._sum.amount) || 0,
			count: paymentsTotal._count,
		},
		subcontractPayments: {
			total: Number(subcontractPaymentsTotal._sum.amount) || 0,
			count: subcontractPaymentsTotal._count,
		},
		totalMoneyOut: (Number(expensesTotal._sum.amount) || 0)
			+ (Number(subcontractPaymentsTotal._sum.amount) || 0),
		pendingObligations: {
			total: Number(pendingObligations._sum.amount) || 0,
			count: pendingObligations._count,
		},
		recentExpenses,
		recentPayments,
	};
}
