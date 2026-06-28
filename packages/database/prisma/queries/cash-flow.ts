import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Cash Flow Report Queries - تقرير التدفقات النقدية
//
// Derived entirely from the POSTED general ledger (JournalEntryLine), not from
// individual source tables. Every cash movement in the system posts a DR/CR to
// a cash/bank account (children of 1110 "النقدية والبنوك"), so reading the
// ledger captures ALL sources exactly once — invoice/project/direct payments,
// receipt & payment vouchers, expenses, subcontractor payments, payroll,
// capital contributions and owner drawings — with no double-counting and with
// figures that reconcile against the balance sheet's cash position.
// ═══════════════════════════════════════════════════════════════════════════

interface CashFlowPeriod {
	periodStart: string;
	periodEnd: string;
	inflows: {
		operating: number;
		financing: number;
		total: number;
	};
	outflows: {
		operating: number;
		financing: number;
		total: number;
	};
	netFlow: number;
	cumulativeBalance: number;
}

/**
 * Generate period boundaries (weekly or monthly) between dateFrom and dateTo
 */
function generatePeriods(
	dateFrom: Date,
	dateTo: Date,
	periodType: "weekly" | "monthly",
): Array<{ start: Date; end: Date }> {
	const periods: Array<{ start: Date; end: Date }> = [];
	const current = new Date(dateFrom);

	while (current < dateTo) {
		const periodStart = new Date(current);
		let periodEnd: Date;

		if (periodType === "monthly") {
			periodEnd = new Date(
				current.getFullYear(),
				current.getMonth() + 1,
				0,
				23,
				59,
				59,
				999,
			);
			current.setMonth(current.getMonth() + 1);
			current.setDate(1);
		} else {
			// weekly
			periodEnd = new Date(current);
			periodEnd.setDate(periodEnd.getDate() + 6);
			periodEnd.setHours(23, 59, 59, 999);
			current.setDate(current.getDate() + 7);
		}

		// Cap at dateTo
		if (periodEnd > dateTo) {
			periodEnd = new Date(dateTo);
			periodEnd.setHours(23, 59, 59, 999);
		}

		periods.push({ start: periodStart, end: periodEnd });
	}

	return periods;
}

export async function getCashFlowReport(
	organizationId: string,
	options: {
		projectId?: string;
		periodType: "weekly" | "monthly";
		dateFrom: Date;
		dateTo: Date;
	},
) {
	const { projectId, periodType, dateFrom, dateTo } = options;

	// 1. Resolve cash/bank chart accounts: 1110 parent + all its children
	//    (each OrganizationBank/cash account gets a postable sub-account under 1110).
	const cashParent = await db.chartAccount.findUnique({
		where: { organizationId_code: { organizationId, code: "1110" } },
		select: { id: true },
	});

	const emptyReport = {
		periods: [] as CashFlowPeriod[],
		summary: {
			totalInflows: 0,
			totalOutflows: 0,
			netCashFlow: 0,
			openingBalance: 0,
			closingBalance: 0,
		},
		projected: { expectedInflows: 0, expectedOutflows: 0, projectedBalance: 0 },
	};

	if (!cashParent) {
		// Accounting / chart of accounts not initialised yet for this org.
		return emptyReport;
	}

	const cashAccounts = await db.chartAccount.findMany({
		where: {
			organizationId,
			OR: [{ id: cashParent.id }, { parentId: cashParent.id }],
		},
		select: { id: true },
	});
	const cashIds = new Set(cashAccounts.map((a) => a.id));

	const projectLineFilter = projectId ? { projectId } : {};

	// 2. Opening balance = net cash position before the range. Includes opening
	//    balance entries regardless of their date so they always sit in "opening"
	//    rather than appearing as a period inflow.
	const openingAgg = await db.journalEntryLine.aggregate({
		where: {
			accountId: { in: [...cashIds] },
			...projectLineFilter,
			journalEntry: {
				organizationId,
				status: "POSTED",
				OR: [
					{ date: { lt: dateFrom } },
					{ referenceType: "OPENING_BALANCE" },
				],
			},
		},
		_sum: { debit: true, credit: true },
	});
	const openingBalance =
		Number(openingAgg._sum.debit ?? 0) - Number(openingAgg._sum.credit ?? 0);

	// 3. In-range POSTED lines, grouped by entry so each entry yields a single
	//    net cash movement classified as operating vs financing.
	const lines = await db.journalEntryLine.findMany({
		where: {
			journalEntry: {
				organizationId,
				status: "POSTED",
				date: { gte: dateFrom, lte: dateTo },
			},
		},
		select: {
			journalEntryId: true,
			debit: true,
			credit: true,
			projectId: true,
			account: { select: { id: true, type: true } },
			journalEntry: { select: { date: true, referenceType: true } },
		},
	});

	interface EntryAgg {
		date: Date;
		referenceType: string | null;
		cashDelta: number;
		hasCash: boolean;
		hasEquityContra: boolean;
	}
	const byEntry = new Map<string, EntryAgg>();
	for (const line of lines) {
		let g = byEntry.get(line.journalEntryId);
		if (!g) {
			g = {
				date: new Date(line.journalEntry.date),
				referenceType: line.journalEntry.referenceType,
				cashDelta: 0,
				hasCash: false,
				hasEquityContra: false,
			};
			byEntry.set(line.journalEntryId, g);
		}
		if (cashIds.has(line.account.id)) {
			// When scoped to a project, only count cash legs tagged with it.
			if (projectId && line.projectId !== projectId) continue;
			g.cashDelta += Number(line.debit) - Number(line.credit);
			g.hasCash = true;
		} else if (line.account.type === "EQUITY") {
			// Contra side is equity → financing activity (capital / drawings).
			g.hasEquityContra = true;
		}
	}

	interface Movement {
		date: Date;
		amount: number; // signed: + inflow, − outflow
		financing: boolean;
	}
	const movements: Movement[] = [];
	for (const g of byEntry.values()) {
		// Opening balances are folded into openingBalance, not shown as flows.
		if (g.referenceType === "OPENING_BALANCE") continue;
		if (!g.hasCash) continue;
		// Pure internal transfers between own cash/bank accounts net to ~0 and
		// must not inflate gross inflows/outflows.
		if (Math.abs(g.cashDelta) < 0.005) continue;
		movements.push({
			date: g.date,
			amount: g.cashDelta,
			financing: g.hasEquityContra,
		});
	}

	// 4. Bucket movements into periods
	const periodBounds = generatePeriods(dateFrom, dateTo, periodType);
	let cumulativeBalance = openingBalance;
	let totalInflowsSum = 0;
	let totalOutflowsSum = 0;

	const periods: CashFlowPeriod[] = periodBounds.map(({ start, end }) => {
		let operatingIn = 0;
		let financingIn = 0;
		let operatingOut = 0;
		let financingOut = 0;

		for (const m of movements) {
			if (m.date < start || m.date > end) continue;
			if (m.amount >= 0) {
				if (m.financing) financingIn += m.amount;
				else operatingIn += m.amount;
			} else {
				const out = -m.amount;
				if (m.financing) financingOut += out;
				else operatingOut += out;
			}
		}

		const inflowTotal = operatingIn + financingIn;
		const outflowTotal = operatingOut + financingOut;
		const netFlow = inflowTotal - outflowTotal;
		cumulativeBalance += netFlow;

		totalInflowsSum += inflowTotal;
		totalOutflowsSum += outflowTotal;

		return {
			periodStart: start.toISOString().split("T")[0]!,
			periodEnd: end.toISOString().split("T")[0]!,
			inflows: {
				operating: operatingIn,
				financing: financingIn,
				total: inflowTotal,
			},
			outflows: {
				operating: operatingOut,
				financing: financingOut,
				total: outflowTotal,
			},
			netFlow,
			cumulativeBalance,
		};
	});

	// 5. Forward projections (independent of the ledger): outstanding invoices in,
	//    pending expenses out.
	const [pendingExpenses, pendingInvoices] = await Promise.all([
		db.financeExpense.findMany({
			where: {
				organizationId,
				status: "PENDING",
				...(projectId ? { projectId } : {}),
			},
			select: { amount: true, paidAmount: true },
		}),
		db.financeInvoice.findMany({
			where: {
				organizationId,
				status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
				...(projectId ? { projectId } : {}),
			},
			select: { totalAmount: true, paidAmount: true },
		}),
	]);

	const expectedInflows = pendingInvoices.reduce((sum, inv) => {
		const outstanding =
			Number(inv.totalAmount ?? 0) - Number(inv.paidAmount ?? 0);
		return sum + Math.max(outstanding, 0);
	}, 0);

	const expectedOutflows = pendingExpenses.reduce((sum, exp) => {
		const remaining = Number(exp.amount ?? 0) - Number(exp.paidAmount ?? 0);
		return sum + Math.max(remaining, 0);
	}, 0);

	const closingBalance = cumulativeBalance;
	const projectedBalance = closingBalance + expectedInflows - expectedOutflows;

	return {
		periods,
		summary: {
			totalInflows: totalInflowsSum,
			totalOutflows: totalOutflowsSum,
			netCashFlow: totalInflowsSum - totalOutflowsSum,
			openingBalance,
			closingBalance,
		},
		projected: {
			expectedInflows,
			expectedOutflows,
			projectedBalance,
		},
	};
}
