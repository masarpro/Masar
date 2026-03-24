// Accounting Reports — queries over existing data
// No schema changes required — reads from FinanceInvoice, FinanceExpense, SubcontractClaim, etc.

import { type PrismaClient, Prisma } from "../generated/client";

// ========== Shared Types ==========

export interface DateRangeInput {
	organizationId: string;
	dateFrom: Date;
	dateTo: Date;
}

export interface AgingBucket {
	current: Prisma.Decimal; // 0-30 days
	days1to30: Prisma.Decimal;
	days31to60: Prisma.Decimal;
	days61to90: Prisma.Decimal;
	over90: Prisma.Decimal;
	total: Prisma.Decimal;
}

// ========== Aged Receivables ==========

export interface AgedReceivablesRow {
	clientId: string | null;
	clientName: string;
	current: Prisma.Decimal;
	days1to30: Prisma.Decimal;
	days31to60: Prisma.Decimal;
	days61to90: Prisma.Decimal;
	over90: Prisma.Decimal;
	total: Prisma.Decimal;
	invoices: {
		id: string;
		number: string;
		issueDate: Date;
		dueDate: Date;
		totalAmount: Prisma.Decimal;
		paidAmount: Prisma.Decimal;
		outstanding: Prisma.Decimal;
		agingDays: number;
		projectName: string | null;
	}[];
}

export interface AgedReceivablesResult {
	rows: AgedReceivablesRow[];
	totals: {
		current: Prisma.Decimal;
		days1to30: Prisma.Decimal;
		days31to60: Prisma.Decimal;
		days61to90: Prisma.Decimal;
		over90: Prisma.Decimal;
		total: Prisma.Decimal;
	};
	generatedAt: Date;
}

// ========== Aged Payables ==========

export interface AgedPayablesRow {
	contractId: string;
	contractorName: string;
	contractNo: string;
	projectId: string;
	projectName: string;
	current: Prisma.Decimal;
	days1to30: Prisma.Decimal;
	days31to60: Prisma.Decimal;
	days61to90: Prisma.Decimal;
	over90: Prisma.Decimal;
	total: Prisma.Decimal;
	details: {
		id: string;
		type: "claim" | "contract_balance";
		reference: string;
		date: Date;
		totalAmount: Prisma.Decimal;
		paidAmount: Prisma.Decimal;
		outstanding: Prisma.Decimal;
		agingDays: number;
	}[];
}

export interface AgedPayablesResult {
	rows: AgedPayablesRow[];
	totals: {
		current: Prisma.Decimal;
		days1to30: Prisma.Decimal;
		days31to60: Prisma.Decimal;
		days61to90: Prisma.Decimal;
		over90: Prisma.Decimal;
		total: Prisma.Decimal;
	};
	generatedAt: Date;
}

// ========== VAT Report ==========

export interface VATReportResult {
	period: {
		from: Date;
		to: Date;
		quarter: string; // "Q1 2026"
	};

	outputVAT: {
		taxInvoices: {
			taxableAmount: Prisma.Decimal;
			vatAmount: Prisma.Decimal;
			count: number;
		};
		simplifiedInvoices: {
			taxableAmount: Prisma.Decimal;
			vatAmount: Prisma.Decimal;
			count: number;
		};
		creditNotes: {
			taxableAmount: Prisma.Decimal;
			vatAmount: Prisma.Decimal;
			count: number;
		};
		standardInvoices: {
			taxableAmount: Prisma.Decimal;
			vatAmount: Prisma.Decimal;
			count: number;
		};
		total: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal };
	};

	inputVAT: {
		expenses: {
			taxableAmount: Prisma.Decimal;
			vatAmount: Prisma.Decimal;
			count: number;
		};
		subcontractors: {
			taxableAmount: Prisma.Decimal;
			vatAmount: Prisma.Decimal;
			count: number;
		};
		total: { taxableAmount: Prisma.Decimal; vatAmount: Prisma.Decimal };
	};

	netVAT: Prisma.Decimal;
	isPayable: boolean;

	invoiceDetails: {
		id: string;
		number: string;
		type: string;
		clientName: string;
		issueDate: Date;
		taxableAmount: Prisma.Decimal;
		vatAmount: Prisma.Decimal;
	}[];

	generatedAt: Date;
}

// ========== Income Statement ==========

export interface IncomeStatementResult {
	period: { from: Date; to: Date };

	revenue: {
		invoiceRevenue: Prisma.Decimal;
		directPayments: Prisma.Decimal;
		creditNotes: Prisma.Decimal;
		totalRevenue: Prisma.Decimal;
		byProject: {
			projectId: string;
			projectName: string;
			amount: Prisma.Decimal;
		}[];
		byClient: {
			clientId: string;
			clientName: string;
			amount: Prisma.Decimal;
		}[];
	};

	expenses: {
		byCategory: {
			category: string;
			categoryLabel: string;
			amount: Prisma.Decimal;
		}[];
		subcontractorPayments: Prisma.Decimal;
		payroll: Prisma.Decimal;
		companyExpenses: Prisma.Decimal;
		totalExpenses: Prisma.Decimal;
		byProject: {
			projectId: string;
			projectName: string;
			amount: Prisma.Decimal;
		}[];
	};

	summary: {
		grossProfit: Prisma.Decimal;
		totalExpenses: Prisma.Decimal;
		netProfit: Prisma.Decimal;
		profitMargin: number;
	};

	comparison?: {
		previousRevenue: Prisma.Decimal;
		previousExpenses: Prisma.Decimal;
		previousNetProfit: Prisma.Decimal;
		revenueChange: number;
		expensesChange: number;
		profitChange: number;
	};

	generatedAt: Date;
}

// ========== Helper: Aging bucket assignment ==========

const ZERO = new Prisma.Decimal(0);

function assignToBucket(agingDays: number, amount: Prisma.Decimal): AgingBucket {
	const bucket: AgingBucket = {
		current: ZERO,
		days1to30: ZERO,
		days31to60: ZERO,
		days61to90: ZERO,
		over90: ZERO,
		total: amount,
	};

	if (agingDays <= 0) {
		bucket.current = amount;
	} else if (agingDays <= 30) {
		bucket.days1to30 = amount;
	} else if (agingDays <= 60) {
		bucket.days31to60 = amount;
	} else if (agingDays <= 90) {
		bucket.days61to90 = amount;
	} else {
		bucket.over90 = amount;
	}

	return bucket;
}

function addBuckets(a: AgingBucket, b: AgingBucket): AgingBucket {
	return {
		current: a.current.add(b.current),
		days1to30: a.days1to30.add(b.days1to30),
		days31to60: a.days31to60.add(b.days31to60),
		days61to90: a.days61to90.add(b.days61to90),
		over90: a.over90.add(b.over90),
		total: a.total.add(b.total),
	};
}

function emptyBucket(): AgingBucket {
	return {
		current: ZERO,
		days1to30: ZERO,
		days31to60: ZERO,
		days61to90: ZERO,
		over90: ZERO,
		total: ZERO,
	};
}

function daysBetween(from: Date, to: Date): number {
	const msPerDay = 86400000;
	return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

// ========== Query: Aged Receivables ==========

export async function getAgedReceivables(
	db: PrismaClient,
	organizationId: string,
	options?: { asOfDate?: Date; projectId?: string },
): Promise<AgedReceivablesResult> {
	const asOfDate = options?.asOfDate ?? new Date();

	const where: any = {
		organizationId,
		status: {
			in: [
				"ISSUED",
				"SENT",
				"VIEWED",
				"PARTIALLY_PAID",
				"OVERDUE",
			],
		},
		invoiceType: {
			notIn: ["CREDIT_NOTE", "DEBIT_NOTE"],
		},
	};

	if (options?.projectId) {
		where.projectId = options.projectId;
	}

	const invoices = await db.financeInvoice.findMany({
		where,
		select: {
			id: true,
			invoiceNo: true,
			issueDate: true,
			dueDate: true,
			totalAmount: true,
			paidAmount: true,
			clientId: true,
			clientName: true,
			project: { select: { name: true } },
		},
		orderBy: { dueDate: "asc" },
	});

	// Group by client
	const clientMap = new Map<
		string,
		{ clientId: string | null; clientName: string; bucket: AgingBucket; invoices: AgedReceivablesRow["invoices"] }
	>();

	for (const inv of invoices) {
		const outstanding = new Prisma.Decimal(Number(inv.totalAmount) - Number(inv.paidAmount));
		if (outstanding.lte(ZERO)) continue;

		const agingDays = daysBetween(inv.dueDate, asOfDate);
		const bucket = assignToBucket(agingDays, outstanding);

		const key = inv.clientId ?? inv.clientName ?? "unknown";
		const existing = clientMap.get(key);

		const invoiceRow = {
			id: inv.id,
			number: inv.invoiceNo,
			issueDate: inv.issueDate,
			dueDate: inv.dueDate,
			totalAmount: inv.totalAmount,
			paidAmount: inv.paidAmount,
			outstanding,
			agingDays: Math.max(agingDays, 0),
			projectName: inv.project?.name ?? null,
		};

		if (existing) {
			existing.bucket = addBuckets(existing.bucket, bucket);
			existing.invoices.push(invoiceRow);
		} else {
			clientMap.set(key, {
				clientId: inv.clientId,
				clientName: inv.clientName,
				bucket,
				invoices: [invoiceRow],
			});
		}
	}

	const rows: AgedReceivablesRow[] = [];
	let totals = emptyBucket();

	for (const entry of clientMap.values()) {
		rows.push({
			clientId: entry.clientId,
			clientName: entry.clientName,
			...entry.bucket,
			invoices: entry.invoices,
		});
		totals = addBuckets(totals, entry.bucket);
	}

	// Sort by total descending
	rows.sort((a, b) => Number(b.total) - Number(a.total));

	return {
		rows,
		totals,
		generatedAt: new Date(),
	};
}

// ========== Query: Aged Payables ==========

export async function getAgedPayables(
	db: PrismaClient,
	organizationId: string,
	options?: { asOfDate?: Date; projectId?: string },
): Promise<AgedPayablesResult> {
	const asOfDate = options?.asOfDate ?? new Date();

	const contractWhere: any = {
		organizationId,
		status: { in: ["ACTIVE", "COMPLETED"] },
	};

	if (options?.projectId) {
		contractWhere.projectId = options.projectId;
	}

	const contracts = await db.subcontractContract.findMany({
		where: contractWhere,
		select: {
			id: true,
			name: true,
			contractNo: true,
			value: true,
			projectId: true,
			createdAt: true,
			project: { select: { name: true } },
			claims: {
				where: { status: "APPROVED" },
				select: {
					id: true,
					claimNo: true,
					netAmount: true,
					paidAmount: true,
					approvedAt: true,
					createdAt: true,
					payments: {
						select: { amount: true },
					},
				},
			},
			payments: {
				select: { amount: true, claimId: true },
			},
		},
	});

	const rows: AgedPayablesRow[] = [];
	let totals = emptyBucket();

	for (const contract of contracts) {
		let contractBucket = emptyBucket();
		const details: AgedPayablesRow["details"] = [];

		if (contract.claims.length > 0) {
			// Calculate outstanding from approved claims
			for (const claim of contract.claims) {
				const claimPayments = claim.payments.reduce(
					(sum, p) => sum + Number(p.amount),
					0,
				);
				const outstanding = new Prisma.Decimal(
					Number(claim.netAmount) - claimPayments,
				);

				if (outstanding.lte(ZERO)) continue;

				const agingDate = claim.approvedAt ?? claim.createdAt;
				const agingDays = daysBetween(agingDate, asOfDate);
				const bucket = assignToBucket(agingDays, outstanding);

				contractBucket = addBuckets(contractBucket, bucket);

				details.push({
					id: claim.id,
					type: "claim",
					reference: `#${claim.claimNo}`,
					date: agingDate,
					totalAmount: claim.netAmount,
					paidAmount: new Prisma.Decimal(claimPayments),
					outstanding,
					agingDays: Math.max(agingDays, 0),
				});
			}
		} else {
			// No claims — check contract balance directly
			const totalPaid = contract.payments.reduce(
				(sum, p) => sum + Number(p.amount),
				0,
			);
			const outstanding = new Prisma.Decimal(
				Number(contract.value) - totalPaid,
			);

			if (outstanding.gt(ZERO)) {
				// Age from contract creation date instead of treating as always "current"
				const agingDays = Math.max(0, Math.floor((asOfDate.getTime() - (contract.createdAt?.getTime() ?? asOfDate.getTime())) / (1000 * 60 * 60 * 24)));
				const bucket = assignToBucket(agingDays, outstanding);
				contractBucket = addBuckets(contractBucket, bucket);

				details.push({
					id: contract.id,
					type: "contract_balance",
					reference: contract.contractNo ?? contract.id,
					date: contract.createdAt ?? asOfDate,
					totalAmount: contract.value,
					paidAmount: new Prisma.Decimal(totalPaid),
					outstanding,
					agingDays,
				});
			}
		}

		if (contractBucket.total.gt(ZERO)) {
			rows.push({
				contractId: contract.id,
				contractorName: contract.name,
				contractNo: contract.contractNo ?? "",
				projectId: contract.projectId,
				projectName: contract.project?.name ?? "",
				...contractBucket,
				details,
			});
			totals = addBuckets(totals, contractBucket);
		}
	}

	rows.sort((a, b) => Number(b.total) - Number(a.total));

	return {
		rows,
		totals,
		generatedAt: new Date(),
	};
}

// ========== Query: VAT Report ==========

// Expense categories exempt from VAT (no input VAT to reclaim)
const VAT_EXEMPT_EXPENSE_CATEGORIES = [
	"SALARIES",
	"SALARY",
	"GOVERNMENT_FEES",
	"BANK_FEES",
	"FINES",
	"INSURANCE",
	"ZAKAT",
	"TAXES",
];

function getQuarterLabel(dateFrom: Date, dateTo: Date): string {
	const month = dateFrom.getMonth();
	const year = dateFrom.getFullYear();
	const quarter = Math.floor(month / 3) + 1;
	return `Q${quarter} ${year}`;
}

export async function getVATReport(
	db: PrismaClient,
	organizationId: string,
	dateFrom: Date,
	dateTo: Date,
): Promise<VATReportResult> {
	const [invoices, expenses, subPayments] = await Promise.all([
		// All invoices in period (including credit notes)
		db.financeInvoice.findMany({
			where: {
				organizationId,
				issueDate: { gte: dateFrom, lte: dateTo },
				status: { notIn: ["DRAFT", "CANCELLED"] },
			},
			select: {
				id: true,
				invoiceNo: true,
				invoiceType: true,
				clientName: true,
				issueDate: true,
				subtotal: true,
				vatAmount: true,
				totalAmount: true,
			},
		}),
		// Completed expenses in period
		db.financeExpense.findMany({
			where: {
				organizationId,
				date: { gte: dateFrom, lte: dateTo },
				status: "COMPLETED",
			},
			select: {
				id: true,
				amount: true,
				category: true,
			},
		}),
		// Subcontract payments with VAT-inclusive contracts
		db.subcontractPayment.findMany({
			where: {
				contract: {
					organizationId,
					includesVat: true,
				},
				date: { gte: dateFrom, lte: dateTo },
			},
			select: {
				amount: true,
			},
		}),
	]);

	// Output VAT — group invoices by type
	const outputGroups = {
		TAX: { taxableAmount: ZERO, vatAmount: ZERO, count: 0 },
		SIMPLIFIED: { taxableAmount: ZERO, vatAmount: ZERO, count: 0 },
		CREDIT_NOTE: { taxableAmount: ZERO, vatAmount: ZERO, count: 0 },
		STANDARD: { taxableAmount: ZERO, vatAmount: ZERO, count: 0 },
	};

	const invoiceDetails: VATReportResult["invoiceDetails"] = [];

	for (const inv of invoices) {
		const taxable = new Prisma.Decimal(
			Number(inv.totalAmount) - Number(inv.vatAmount),
		);
		const vat = new Prisma.Decimal(Number(inv.vatAmount));
		const type = inv.invoiceType as keyof typeof outputGroups;

		if (type in outputGroups) {
			const group = outputGroups[type];
			if (type === "CREDIT_NOTE") {
				// Credit notes are negative
				group.taxableAmount = group.taxableAmount.sub(taxable.abs());
				group.vatAmount = group.vatAmount.sub(vat.abs());
			} else {
				group.taxableAmount = group.taxableAmount.add(taxable);
				group.vatAmount = group.vatAmount.add(vat);
			}
			group.count++;
		}

		invoiceDetails.push({
			id: inv.id,
			number: inv.invoiceNo,
			type: inv.invoiceType,
			clientName: inv.clientName,
			issueDate: inv.issueDate,
			taxableAmount: taxable,
			vatAmount: vat,
		});
	}

	const outputTotal = {
		taxableAmount: outputGroups.TAX.taxableAmount
			.add(outputGroups.SIMPLIFIED.taxableAmount)
			.add(outputGroups.STANDARD.taxableAmount)
			.add(outputGroups.CREDIT_NOTE.taxableAmount),
		vatAmount: outputGroups.TAX.vatAmount
			.add(outputGroups.SIMPLIFIED.vatAmount)
			.add(outputGroups.STANDARD.vatAmount)
			.add(outputGroups.CREDIT_NOTE.vatAmount),
	};

	// Input VAT — expenses
	// FinanceExpense does NOT have a separate vatAmount field.
	// We estimate: for taxable categories, assume VAT is included at 15%
	// taxable = amount / 1.15, vatAmount = amount - taxable
	let expenseTaxable = ZERO;
	let expenseVat = ZERO;
	let expenseCount = 0;

	for (const exp of expenses) {
		const isExempt = VAT_EXEMPT_EXPENSE_CATEGORIES.includes(exp.category);
		if (isExempt) continue;

		const amount = new Prisma.Decimal(Number(exp.amount));
		// Reverse-calculate VAT from inclusive amount: taxable = amount / 1.15
		const taxable = amount.div(new Prisma.Decimal("1.15")).toDecimalPlaces(2);
		const vat = amount.sub(taxable);

		expenseTaxable = expenseTaxable.add(taxable);
		expenseVat = expenseVat.add(vat);
		expenseCount++;
	}

	// Input VAT — subcontractor payments (VAT-inclusive contracts)
	let subTaxable = ZERO;
	let subVat = ZERO;
	let subCount = 0;

	for (const payment of subPayments) {
		const amount = new Prisma.Decimal(Number(payment.amount));
		const taxable = amount.div(new Prisma.Decimal("1.15")).toDecimalPlaces(2);
		const vat = amount.sub(taxable);

		subTaxable = subTaxable.add(taxable);
		subVat = subVat.add(vat);
		subCount++;
	}

	const inputTotal = {
		taxableAmount: expenseTaxable.add(subTaxable),
		vatAmount: expenseVat.add(subVat),
	};

	const netVAT = outputTotal.vatAmount.sub(inputTotal.vatAmount);

	return {
		period: {
			from: dateFrom,
			to: dateTo,
			quarter: getQuarterLabel(dateFrom, dateTo),
		},
		outputVAT: {
			taxInvoices: outputGroups.TAX,
			simplifiedInvoices: outputGroups.SIMPLIFIED,
			creditNotes: outputGroups.CREDIT_NOTE,
			standardInvoices: outputGroups.STANDARD,
			total: outputTotal,
		},
		inputVAT: {
			expenses: {
				taxableAmount: expenseTaxable,
				vatAmount: expenseVat,
				count: expenseCount,
			},
			subcontractors: {
				taxableAmount: subTaxable,
				vatAmount: subVat,
				count: subCount,
			},
			total: inputTotal,
		},
		netVAT,
		isPayable: netVAT.gt(ZERO),
		invoiceDetails,
		generatedAt: new Date(),
	};
}

// ========== Query: Income Statement ==========

export async function getIncomeStatement(
	db: PrismaClient,
	organizationId: string,
	dateFrom: Date,
	dateTo: Date,
	options?: { projectId?: string; includeComparison?: boolean },
): Promise<IncomeStatementResult> {
	const projectFilter = options?.projectId
		? { projectId: options.projectId }
		: {};

	const [
		invoices,
		creditNotes,
		directPayments,
		expenses,
		subPaymentsAgg,
		payrollRuns,
		companyExpAgg,
	] = await Promise.all([
		// 1. Invoice revenue
		db.financeInvoice.findMany({
			where: {
				organizationId,
				issueDate: { gte: dateFrom, lte: dateTo },
				status: { notIn: ["DRAFT", "CANCELLED"] },
				invoiceType: { notIn: ["CREDIT_NOTE"] },
				...projectFilter,
			},
			select: {
				totalAmount: true,
				vatAmount: true,
				clientId: true,
				clientName: true,
				projectId: true,
				project: { select: { name: true } },
			},
		}),
		// 2. Credit notes
		db.financeInvoice.findMany({
			where: {
				organizationId,
				issueDate: { gte: dateFrom, lte: dateTo },
				invoiceType: "CREDIT_NOTE",
				status: { notIn: ["DRAFT", "CANCELLED"] },
				...projectFilter,
			},
			select: {
				totalAmount: true,
				vatAmount: true,
			},
		}),
		// 3. Direct payments (not linked to invoices)
		db.financePayment.findMany({
			where: {
				organizationId,
				date: { gte: dateFrom, lte: dateTo },
				invoiceId: null,
				status: "COMPLETED",
				...projectFilter,
			},
			select: {
				amount: true,
			},
		}),
		// 4. Expenses
		db.financeExpense.findMany({
			where: {
				organizationId,
				date: { gte: dateFrom, lte: dateTo },
				status: "COMPLETED",
				...projectFilter,
			},
			select: {
				amount: true,
				category: true,
				projectId: true,
				project: { select: { name: true } },
			},
		}),
		// 5. Subcontract payments
		db.subcontractPayment.aggregate({
			where: {
				contract: {
					organizationId,
					...(options?.projectId ? { projectId: options.projectId } : {}),
				},
				date: { gte: dateFrom, lte: dateTo },
			},
			_sum: { amount: true },
		}),
		// 6. Payroll
		db.payrollRun.findMany({
			where: {
				organizationId,
				status: { in: ["APPROVED", "PAID"] },
			},
			select: {
				totalNetSalary: true,
				month: true,
				year: true,
			},
		}),
		// 7. Company expense payments
		db.companyExpensePayment.aggregate({
			where: {
				expense: { organizationId },
				paidAt: { gte: dateFrom, lte: dateTo },
			},
			_sum: { amount: true },
		}),
	]);

	// Revenue calculation
	let invoiceRevenue = ZERO;
	const revenueByProject = new Map<string, { name: string; amount: Prisma.Decimal }>();
	const revenueByClient = new Map<string, { name: string; amount: Prisma.Decimal }>();

	for (const inv of invoices) {
		const net = new Prisma.Decimal(Number(inv.totalAmount) - Number(inv.vatAmount));
		invoiceRevenue = invoiceRevenue.add(net);

		if (inv.projectId) {
			const existing = revenueByProject.get(inv.projectId);
			if (existing) {
				existing.amount = existing.amount.add(net);
			} else {
				revenueByProject.set(inv.projectId, {
					name: inv.project?.name ?? "",
					amount: net,
				});
			}
		}

		const clientKey = inv.clientId ?? inv.clientName;
		if (clientKey) {
			const existing = revenueByClient.get(clientKey);
			if (existing) {
				existing.amount = existing.amount.add(net);
			} else {
				revenueByClient.set(clientKey, {
					name: inv.clientName,
					amount: net,
				});
			}
		}
	}

	let creditNoteTotal = ZERO;
	for (const cn of creditNotes) {
		creditNoteTotal = creditNoteTotal.add(
			new Prisma.Decimal(Number(cn.totalAmount) - Number(cn.vatAmount)),
		);
	}

	let directPaymentTotal = ZERO;
	for (const dp of directPayments) {
		directPaymentTotal = directPaymentTotal.add(new Prisma.Decimal(Number(dp.amount)));
	}

	const totalRevenue = invoiceRevenue.add(directPaymentTotal).sub(creditNoteTotal);

	// Expenses calculation
	const expenseByCategory = new Map<string, Prisma.Decimal>();
	const expenseByProject = new Map<string, { name: string; amount: Prisma.Decimal }>();

	for (const exp of expenses) {
		const amount = new Prisma.Decimal(Number(exp.amount));
		const existing = expenseByCategory.get(exp.category) ?? ZERO;
		expenseByCategory.set(exp.category, existing.add(amount));

		if (exp.projectId) {
			const projExp = expenseByProject.get(exp.projectId);
			if (projExp) {
				projExp.amount = projExp.amount.add(amount);
			} else {
				expenseByProject.set(exp.projectId, {
					name: exp.project?.name ?? "",
					amount,
				});
			}
		}
	}

	const subPayments = new Prisma.Decimal(
		Number(subPaymentsAgg._sum.amount ?? 0),
	);

	// Filter payroll runs within date range
	const payrollTotal = payrollRuns
		.filter((pr) => {
			const prDate = new Date(pr.year, pr.month - 1, 1);
			return prDate >= dateFrom && prDate <= dateTo;
		})
		.reduce((sum, pr) => sum.add(new Prisma.Decimal(Number(pr.totalNetSalary ?? 0))), ZERO);

	const companyExpTotal = new Prisma.Decimal(
		Number(companyExpAgg._sum?.amount ?? 0),
	);

	// Merge SALARY category expenses into payroll to avoid duplication
	const salaryExpense = expenseByCategory.get("SALARY") ?? ZERO;
	if (!salaryExpense.isZero()) {
		expenseByCategory.delete("SALARY");
	}
	const mergedPayroll = payrollTotal.add(salaryExpense);

	const totalExpenses = [...expenseByCategory.values()]
		.reduce((sum, v) => sum.add(v), ZERO)
		.add(subPayments)
		.add(mergedPayroll)
		.add(companyExpTotal);

	const netProfit = totalRevenue.sub(totalExpenses);
	const profitMargin = Number(totalRevenue) > 0
		? (Number(netProfit) / Number(totalRevenue)) * 100
		: 0;

	// Category labels mapping
	const categoryLabels: Record<string, string> = {
		MATERIALS: "مواد ومشتريات",
		EQUIPMENT_RENTAL: "إيجار معدات",
		FUEL: "وقود",
		TRANSPORTATION: "نقل ومواصلات",
		UTILITIES: "مرافق واتصالات",
		RENT: "إيجارات",
		SALARY: "رواتب وأجور",
		INSURANCE: "تأمين",
		MAINTENANCE: "صيانة",
		GOVERNMENT_FEES: "رسوم حكومية",
		BANK_FEES: "عمولات بنكية",
		FINES: "غرامات",
		FOOD: "تغذية",
		MISCELLANEOUS: "مصروفات أخرى",
		OTHER: "مصروفات أخرى",
	};

	// Build comparison if requested
	let comparison: IncomeStatementResult["comparison"];
	if (options?.includeComparison) {
		const periodMs = dateTo.getTime() - dateFrom.getTime();
		const prevFrom = new Date(dateFrom.getTime() - periodMs);
		const prevTo = new Date(dateFrom.getTime() - 1);

		const prevResult = await getIncomeStatement(db, organizationId, prevFrom, prevTo, {
			projectId: options.projectId,
			includeComparison: false,
		});

		const prevRev = Number(prevResult.revenue.totalRevenue);
		const prevExp = Number(prevResult.expenses.totalExpenses);
		const prevNet = Number(prevResult.summary.netProfit);

		comparison = {
			previousRevenue: prevResult.revenue.totalRevenue,
			previousExpenses: prevResult.expenses.totalExpenses,
			previousNetProfit: prevResult.summary.netProfit,
			revenueChange: prevRev > 0 ? ((Number(totalRevenue) - prevRev) / prevRev) * 100 : 0,
			expensesChange: prevExp > 0 ? ((Number(totalExpenses) - prevExp) / prevExp) * 100 : 0,
			profitChange: prevNet > 0 ? ((Number(netProfit) - prevNet) / prevNet) * 100 : 0,
		};
	}

	return {
		period: { from: dateFrom, to: dateTo },
		revenue: {
			invoiceRevenue,
			directPayments: directPaymentTotal,
			creditNotes: creditNoteTotal,
			totalRevenue,
			byProject: [...revenueByProject.entries()].map(([id, v]) => ({
				projectId: id,
				projectName: v.name,
				amount: v.amount,
			})),
			byClient: [...revenueByClient.entries()].map(([id, v]) => ({
				clientId: id,
				clientName: v.name,
				amount: v.amount,
			})),
		},
		expenses: {
			byCategory: [...expenseByCategory.entries()].map(([cat, amount]) => ({
				category: cat,
				categoryLabel: categoryLabels[cat] ?? cat,
				amount,
			})),
			subcontractorPayments: subPayments,
			payroll: mergedPayroll,
			companyExpenses: companyExpTotal,
			totalExpenses,
			byProject: [...expenseByProject.entries()].map(([id, v]) => ({
				projectId: id,
				projectName: v.name,
				amount: v.amount,
			})),
		},
		summary: {
			grossProfit: totalRevenue.sub(
				[...expenseByCategory.values()].reduce((sum, v) => sum.add(v), ZERO),
			),
			totalExpenses,
			netProfit,
			profitMargin: Math.round(profitMargin * 100) / 100,
		},
		comparison,
		generatedAt: new Date(),
	};
}
