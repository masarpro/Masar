import { db } from "../client";
import type {
	FinanceAccountType,
	OrgExpenseCategory,
	FinanceTransactionStatus,
	PaymentMethod,
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
 * Get total balances summary for organization
 */
export async function getOrganizationBalancesSummary(organizationId: string) {
	const accounts = await db.organizationBank.findMany({
		where: { organizationId, isActive: true },
		select: {
			id: true,
			name: true,
			accountType: true,
			balance: true,
			currency: true,
		},
	});

	let totalBankBalance = 0;
	let totalCashBalance = 0;

	for (const account of accounts) {
		const balance = Number(account.balance);
		if (account.accountType === "BANK") {
			totalBankBalance += balance;
		} else {
			totalCashBalance += balance;
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
	const year = new Date().getFullYear();
	const prefix = `EXP-${year}-`;

	const lastExpense = await db.financeExpense.findFirst({
		where: {
			organizationId,
			expenseNo: { startsWith: prefix },
		},
		orderBy: { expenseNo: "desc" },
		select: { expenseNo: true },
	});

	let nextNumber = 1;
	if (lastExpense) {
		const lastNumber = parseInt(lastExpense.expenseNo.replace(prefix, ""), 10);
		if (!isNaN(lastNumber)) {
			nextNumber = lastNumber + 1;
		}
	}

	return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
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
		dateFrom?: Date;
		dateTo?: Date;
		query?: string;
		limit?: number;
		offset?: number;
	},
) {
	const where: {
		organizationId: string;
		category?: OrgExpenseCategory;
		sourceAccountId?: string;
		projectId?: string;
		status?: FinanceTransactionStatus;
		date?: { gte?: Date; lte?: Date };
		OR?: Array<{
			expenseNo?: { contains: string; mode: "insensitive" };
			description?: { contains: string; mode: "insensitive" };
			vendorName?: { contains: string; mode: "insensitive" };
		}>;
	} = { organizationId };

	if (options?.category) {
		where.category = options.category;
	}

	if (options?.sourceAccountId) {
		where.sourceAccountId = options.sourceAccountId;
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
 */
export async function createExpense(data: {
	organizationId: string;
	createdById: string;
	category: OrgExpenseCategory;
	customCategory?: string;
	description?: string;
	amount: number;
	date: Date;
	sourceAccountId: string;
	vendorName?: string;
	vendorTaxNumber?: string;
	projectId?: string;
	invoiceRef?: string;
	paymentMethod?: PaymentMethod;
	referenceNo?: string;
	notes?: string;
}) {
	const expenseNo = await generateExpenseNumber(data.organizationId);

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
				sourceAccountId: data.sourceAccountId,
				vendorName: data.vendorName,
				vendorTaxNumber: data.vendorTaxNumber,
				projectId: data.projectId,
				invoiceRef: data.invoiceRef,
				paymentMethod: data.paymentMethod ?? "BANK_TRANSFER",
				referenceNo: data.referenceNo,
				status: "COMPLETED",
				notes: data.notes,
			},
		});

		// Deduct from account balance
		await tx.organizationBank.update({
			where: { id: data.sourceAccountId },
			data: {
				balance: { decrement: data.amount },
			},
		});

		return expense;
	});
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
 */
export async function deleteExpense(id: string, organizationId: string) {
	const existing = await db.financeExpense.findFirst({
		where: { id, organizationId },
		select: { id: true, amount: true, sourceAccountId: true, status: true },
	});

	if (!existing) {
		throw new Error("Expense not found");
	}

	return db.$transaction(async (tx) => {
		// Delete the expense
		await tx.financeExpense.delete({ where: { id } });

		// Restore account balance if it was completed
		if (existing.status === "COMPLETED") {
			await tx.organizationBank.update({
				where: { id: existing.sourceAccountId },
				data: {
					balance: { increment: Number(existing.amount) },
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
	const year = new Date().getFullYear();
	const prefix = `RCV-${year}-`;

	const lastPayment = await db.financePayment.findFirst({
		where: {
			organizationId,
			paymentNo: { startsWith: prefix },
		},
		orderBy: { paymentNo: "desc" },
		select: { paymentNo: true },
	});

	let nextNumber = 1;
	if (lastPayment) {
		const lastNumber = parseInt(lastPayment.paymentNo.replace(prefix, ""), 10);
		if (!isNaN(lastNumber)) {
			nextNumber = lastNumber + 1;
		}
	}

	return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
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
	const year = new Date().getFullYear();
	const prefix = `TRF-${year}-`;

	const lastTransfer = await db.financeTransfer.findFirst({
		where: {
			organizationId,
			transferNo: { startsWith: prefix },
		},
		orderBy: { transferNo: "desc" },
		select: { transferNo: true },
	});

	let nextNumber = 1;
	if (lastTransfer) {
		const lastNumber = parseInt(lastTransfer.transferNo.replace(prefix, ""), 10);
		if (!isNaN(lastNumber)) {
			nextNumber = lastNumber + 1;
		}
	}

	return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
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

		// Update account balances
		await Promise.all([
			tx.organizationBank.update({
				where: { id: data.fromAccountId },
				data: { balance: { decrement: data.amount } },
			}),
			tx.organizationBank.update({
				where: { id: data.toAccountId },
				data: { balance: { increment: data.amount } },
			}),
		]);

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
		recentExpenses,
		recentPayments,
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
		recentExpenses,
		recentPayments,
	};
}
