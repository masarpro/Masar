// Account Statements — كشوفات الحساب
// Journal-based ledger by account code + project/subcontract/client summaries

import { type PrismaClient } from "../generated/client";
import { getAccountLedger, type AccountLedgerResult } from "./accounting";
import { getVendorStatement, type VendorStatementResult } from "./client-statements";

// ═══════════════════════════════════════════════════════════════════════════
// 1. Account Ledger by Code (wrapper around getAccountLedger)
// ═══════════════════════════════════════════════════════════════════════════

export async function getAccountLedgerByCode(
	db: PrismaClient,
	organizationId: string,
	accountCode: string,
	options: {
		dateFrom?: Date;
		dateTo?: Date;
		projectId?: string;
		page?: number;
		pageSize?: number;
	} = {},
): Promise<AccountLedgerResult> {
	// Resolve account ID from code
	const account = await db.chartAccount.findUnique({
		where: { organizationId_code: { organizationId, code: accountCode } },
		select: { id: true },
	});
	if (!account) throw new Error(`الحساب بالكود ${accountCode} غير موجود`);

	// If projectId filter requested, we need a custom query since getAccountLedger
	// doesn't support projectId filtering. Build it inline.
	if (options.projectId) {
		return getAccountLedgerWithProject(db, account.id, organizationId, options);
	}

	return getAccountLedger(db, account.id, organizationId, {
		dateFrom: options.dateFrom,
		dateTo: options.dateTo,
		page: options.page,
		pageSize: options.pageSize,
	});
}

// Extended version of getAccountLedger that supports projectId filtering
async function getAccountLedgerWithProject(
	db: PrismaClient,
	accountId: string,
	organizationId: string,
	options: {
		dateFrom?: Date;
		dateTo?: Date;
		projectId?: string;
		page?: number;
		pageSize?: number;
	},
): Promise<AccountLedgerResult> {
	const { dateFrom, dateTo, projectId, page = 1, pageSize = 100 } = options;

	const account = await db.chartAccount.findFirst({
		where: { id: accountId, organizationId },
		select: { id: true, code: true, nameAr: true, nameEn: true, type: true, normalBalance: true },
	});
	if (!account) throw new Error("الحساب غير موجود");

	const isDebitNormal = account.normalBalance === "DEBIT";

	// Opening balance
	let openingBalance = 0;
	if (dateFrom) {
		const openingAgg = await db.journalEntryLine.aggregate({
			where: {
				accountId,
				...(projectId ? { projectId } : {}),
				journalEntry: { organizationId, status: "POSTED", date: { lt: dateFrom } },
			},
			_sum: { debit: true, credit: true },
		});
		const d = Number(openingAgg._sum.debit ?? 0);
		const c = Number(openingAgg._sum.credit ?? 0);
		openingBalance = isDebitNormal ? d - c : c - d;
	}

	// Date filter
	const dateFilter: Record<string, Date> = {};
	if (dateFrom) dateFilter.gte = dateFrom;
	if (dateTo) dateFilter.lte = dateTo;

	const whereClause = {
		accountId,
		...(projectId ? { projectId } : {}),
		journalEntry: {
			organizationId,
			status: "POSTED" as const,
			...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
		},
	};

	const total = await db.journalEntryLine.count({ where: whereClause });

	const lines = await db.journalEntryLine.findMany({
		where: whereClause,
		include: {
			journalEntry: {
				select: {
					id: true, entryNo: true, date: true, description: true,
					referenceType: true, referenceNo: true,
				},
			},
		},
		orderBy: [
			{ journalEntry: { date: "asc" } },
			{ journalEntry: { entryNo: "asc" } },
		],
		skip: (page - 1) * pageSize,
		take: pageSize,
	});

	let runningBalance = openingBalance;
	let totalDebit = 0;
	let totalCredit = 0;

	const entries = lines.map((line) => {
		const d = Number(line.debit);
		const c = Number(line.credit);
		totalDebit += d;
		totalCredit += c;
		runningBalance += isDebitNormal ? d - c : c - d;

		return {
			date: line.journalEntry.date,
			entryNo: line.journalEntry.entryNo,
			entryId: line.journalEntry.id,
			description: line.journalEntry.description,
			referenceType: line.journalEntry.referenceType,
			referenceNo: line.journalEntry.referenceNo,
			debit: d,
			credit: c,
			runningBalance,
		};
	});

	return {
		account,
		openingBalance,
		entries,
		closingBalance: runningBalance,
		totalDebit,
		totalCredit,
		total,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Subcontract Statement (vendor statement + contract summary)
// ═══════════════════════════════════════════════════════════════════════════

export interface SubcontractStatementResult {
	contract: {
		id: string;
		contractNo: string | null;
		name: string;
		value: number;
		status: string;
	};
	project: {
		id: string;
		name: string;
	};
	vendorStatement: VendorStatementResult;
	summary: {
		totalContractValue: number;
		totalClaimed: number;
		totalPaid: number;
		remainingBalance: number;
		retentionHeld: number;
	};
}

export async function getSubcontractStatementData(
	db: PrismaClient,
	organizationId: string,
	contractId: string,
	dateFrom: Date,
	dateTo: Date,
): Promise<SubcontractStatementResult> {
	// 1. Contract info
	const contract = await db.subcontractContract.findFirst({
		where: { id: contractId, organizationId },
		select: {
			id: true, contractNo: true, name: true, value: true, status: true,
			projectId: true,
			project: { select: { id: true, name: true } },
		},
	});
	if (!contract) throw new Error("العقد غير موجود");

	// 2. Vendor statement (reuse existing)
	const vendorStatement = await getVendorStatement(db, organizationId, contractId, dateFrom, dateTo);

	// 3. Summary aggregates (all-time, not limited by date range)
	const [
		approvedChangeOrders,
		allClaims,
		allPayments,
	] = await Promise.all([
		// Approved change orders
		db.subcontractChangeOrder.aggregate({
			where: { contractId, status: "APPROVED" },
			_sum: { amount: true },
		}),
		// All approved/paid claims
		db.subcontractClaim.aggregate({
			where: { contractId, status: { in: ["APPROVED", "PAID"] } },
			_sum: { netAmount: true },
		}),
		// All completed payments
		db.subcontractPayment.aggregate({
			where: { contractId, status: "COMPLETED" },
			_sum: { amount: true },
		}),
	]);

	const contractValue = Number(contract.value);
	const changeOrdersValue = Number(approvedChangeOrders._sum.amount ?? 0);
	const totalContractValue = contractValue + changeOrdersValue;
	const totalClaimed = Number(allClaims._sum.netAmount ?? 0);
	const totalPaid = Number(allPayments._sum.amount ?? 0);
	const remainingBalance = totalContractValue - totalPaid;
	// Retention: estimated as totalClaimed - totalPaid (simplified — real retention depends on contract terms)
	const retentionHeld = Math.max(0, totalClaimed - totalPaid);

	return {
		contract: {
			id: contract.id,
			contractNo: contract.contractNo,
			name: contract.name,
			value: contractValue,
			status: contract.status,
		},
		project: contract.project,
		vendorStatement,
		summary: {
			totalContractValue,
			totalClaimed,
			totalPaid,
			remainingBalance,
			retentionHeld,
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Project Statement (revenue, costs, profitability from journal entries)
// ═══════════════════════════════════════════════════════════════════════════

export interface ProjectStatementResult {
	project: {
		id: string;
		name: string;
		contractValue: number;
		status: string;
	};
	period: {
		from: Date | null;
		to: Date | null;
	};
	revenue: {
		total: number;
		breakdown: Array<{ accountCode: string; accountName: string; amount: number }>;
	};
	costs: {
		total: number;
		breakdown: Array<{ accountCode: string; accountName: string; amount: number }>;
	};
	profitability: {
		grossProfit: number;
		profitMargin: number;
	};
	cashFlow: {
		totalIn: number;
		totalOut: number;
		netCash: number;
	};
}

export async function getProjectStatementData(
	db: PrismaClient,
	organizationId: string,
	projectId: string,
	options: { dateFrom?: Date; dateTo?: Date } = {},
): Promise<ProjectStatementResult> {
	const { dateFrom, dateTo } = options;

	// 1. Project info
	const project = await db.project.findFirst({
		where: { id: projectId, organizationId },
		select: { id: true, name: true, contractValue: true, status: true },
	});
	if (!project) throw new Error("المشروع غير موجود");

	// 2. Revenue & Costs from journal entries grouped by account
	const dateFilter: any = {};
	if (dateFrom) dateFilter.gte = dateFrom;
	if (dateTo) dateFilter.lte = dateTo;

	const journalLines = await db.journalEntryLine.findMany({
		where: {
			projectId,
			journalEntry: {
				organizationId,
				status: "POSTED",
				...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
			},
		},
		include: {
			account: { select: { code: true, nameAr: true, type: true } },
		},
	});

	// Group by account
	const accountMap = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();
	for (const line of journalLines) {
		const key = line.account.code;
		const existing = accountMap.get(key) || {
			code: line.account.code,
			name: line.account.nameAr,
			type: line.account.type,
			debit: 0,
			credit: 0,
		};
		existing.debit += Number(line.debit);
		existing.credit += Number(line.credit);
		accountMap.set(key, existing);
	}

	// Revenue accounts (4xxx) — credit - debit = net revenue
	const revenueBreakdown: Array<{ accountCode: string; accountName: string; amount: number }> = [];
	let totalRevenue = 0;

	// Cost accounts (5xxx, 6xxx) — debit - credit = net cost
	const costsBreakdown: Array<{ accountCode: string; accountName: string; amount: number }> = [];
	let totalCosts = 0;

	for (const [, acc] of accountMap) {
		if (acc.type === "REVENUE") {
			const amount = acc.credit - acc.debit;
			if (Math.abs(amount) > 0.01) {
				revenueBreakdown.push({ accountCode: acc.code, accountName: acc.name, amount });
				totalRevenue += amount;
			}
		} else if (acc.type === "EXPENSE") {
			const amount = acc.debit - acc.credit;
			if (Math.abs(amount) > 0.01) {
				costsBreakdown.push({ accountCode: acc.code, accountName: acc.name, amount });
				totalCosts += amount;
			}
		}
	}

	// Sort breakdowns by amount descending
	revenueBreakdown.sort((a, b) => b.amount - a.amount);
	costsBreakdown.sort((a, b) => b.amount - a.amount);

	// 3. Cash flow from actual payment/expense records
	const cashDateFilter: any = {};
	if (dateFrom) cashDateFilter.gte = dateFrom;
	if (dateTo) cashDateFilter.lte = dateTo;

	const [paymentsIn, expensesOut, subPaymentsOut] = await Promise.all([
		// Cash in: project payments + org payments linked to project
		db.projectPayment.aggregate({
			where: {
				projectId,
				organizationId,
				...(Object.keys(cashDateFilter).length > 0 ? { date: cashDateFilter } : {}),
			},
			_sum: { amount: true },
		}),
		// Cash out: expenses linked to project
		db.financeExpense.aggregate({
			where: {
				projectId,
				organizationId,
				status: "COMPLETED",
				...(Object.keys(cashDateFilter).length > 0 ? { date: cashDateFilter } : {}),
			},
			_sum: { amount: true },
		}),
		// Cash out: subcontract payments for this project
		db.subcontractPayment.aggregate({
			where: {
				organizationId,
				contract: { projectId },
				status: "COMPLETED",
				...(Object.keys(cashDateFilter).length > 0 ? { date: cashDateFilter } : {}),
			},
			_sum: { amount: true },
		}),
	]);

	const totalIn = Number(paymentsIn._sum.amount ?? 0);
	const totalOut = Number(expensesOut._sum.amount ?? 0) + Number(subPaymentsOut._sum.amount ?? 0);

	const grossProfit = totalRevenue - totalCosts;
	const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

	return {
		project: {
			id: project.id,
			name: project.name,
			contractValue: Number(project.contractValue ?? 0),
			status: project.status,
		},
		period: { from: dateFrom ?? null, to: dateTo ?? null },
		revenue: { total: totalRevenue, breakdown: revenueBreakdown },
		costs: { total: totalCosts, breakdown: costsBreakdown },
		profitability: {
			grossProfit,
			profitMargin: Math.round(profitMargin * 100) / 100,
		},
		cashFlow: {
			totalIn,
			totalOut,
			netCash: totalIn - totalOut,
		},
	};
}
