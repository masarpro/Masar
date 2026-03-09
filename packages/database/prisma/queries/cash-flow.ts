import { db } from "../client";

// ═══════════════════════════════════════════════════════════════════════════
// Cash Flow Report Queries - تقرير التدفقات النقدية
// ═══════════════════════════════════════════════════════════════════════════

interface CashFlowPeriod {
	periodStart: string;
	periodEnd: string;
	inflows: {
		clientPayments: number;
		invoicePayments: number;
		total: number;
	};
	outflows: {
		projectExpenses: number;
		subcontractPayments: number;
		payroll: number;
		companyExpenses: number;
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

	// Optional project filter for expenses/payments
	const projectFilter = projectId ? { projectId } : {};
	const subcontractProjectFilter = projectId
		? { contract: { projectId } }
		: {};

	// Get opening balance from bank accounts
	const [bankBalances, allInflows, allExpenseOutflows, allSubcontractOutflows, pendingExpenses, pendingInvoices] =
		await Promise.all([
			// Bank account balances
			db.organizationBank.aggregate({
				where: { organizationId, isActive: true },
				_sum: { openingBalance: true },
			}),

			// All inflows (FinancePayment) in the full range
			db.financePayment.findMany({
				where: {
					organizationId,
					status: "COMPLETED",
					date: { gte: dateFrom, lte: dateTo },
					...projectFilter,
				},
				select: { amount: true, date: true },
				orderBy: { date: "asc" },
			}),

			// All expense outflows (FinanceExpense COMPLETED) in the full range
			db.financeExpense.findMany({
				where: {
					organizationId,
					status: "COMPLETED",
					date: { gte: dateFrom, lte: dateTo },
					...projectFilter,
				},
				select: {
					amount: true,
					date: true,
					category: true,
					sourceType: true,
				},
				orderBy: { date: "asc" },
			}),

			// All subcontract payment outflows in the full range
			db.subcontractPayment.findMany({
				where: {
					organizationId,
					status: "COMPLETED",
					date: { gte: dateFrom, lte: dateTo },
					...subcontractProjectFilter,
				},
				select: { amount: true, date: true },
				orderBy: { date: "asc" },
			}),

			// Pending expenses (for projections)
			db.financeExpense.findMany({
				where: {
					organizationId,
					status: "PENDING",
					...projectFilter,
				},
				select: { amount: true, paidAmount: true, dueDate: true },
			}),

			// Outstanding invoices (for projected inflows)
			db.financeInvoice.findMany({
				where: {
					organizationId,
					status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
					...(projectId ? { projectId } : {}),
				},
				select: { totalAmount: true, paidAmount: true, dueDate: true },
			}),
		]);

	const openingBalance = bankBalances._sum.openingBalance
		? Number(bankBalances._sum.openingBalance)
		: 0;

	// Generate periods
	const periodBounds = generatePeriods(dateFrom, dateTo, periodType);

	// Compute per-period data
	let cumulativeBalance = openingBalance;
	let totalInflowsSum = 0;
	let totalOutflowsSum = 0;

	const periods: CashFlowPeriod[] = periodBounds.map(({ start, end }) => {
		// Filter inflows for this period
		const periodInflows = allInflows.filter((p) => {
			const d = new Date(p.date);
			return d >= start && d <= end;
		});
		const clientPayments = periodInflows.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);
		// For cash flow, all FinancePayments are treated as client inflows
		const inflowTotal = clientPayments;

		// Filter expense outflows for this period
		const periodExpenses = allExpenseOutflows.filter((e) => {
			const d = new Date(e.date);
			return d >= start && d <= end;
		});

		// Separate by source type
		let projectExpenses = 0;
		let payroll = 0;
		let companyExpenses = 0;

		for (const e of periodExpenses) {
			const amt = Number(e.amount);
			if (
				e.sourceType === "FACILITY_PAYROLL"
			) {
				payroll += amt;
			} else if (
				e.sourceType === "FACILITY_RECURRING" ||
				e.sourceType === "FACILITY_ASSET"
			) {
				companyExpenses += amt;
			} else {
				projectExpenses += amt;
			}
		}

		// Filter subcontract outflows
		const periodSubPayments = allSubcontractOutflows.filter((p) => {
			const d = new Date(p.date);
			return d >= start && d <= end;
		});
		const subcontractPaymentsAmt = periodSubPayments.reduce(
			(sum, p) => sum + Number(p.amount),
			0,
		);

		const outflowTotal =
			projectExpenses + subcontractPaymentsAmt + payroll + companyExpenses;
		const netFlow = inflowTotal - outflowTotal;
		cumulativeBalance += netFlow;

		totalInflowsSum += inflowTotal;
		totalOutflowsSum += outflowTotal;

		return {
			periodStart: start.toISOString().split("T")[0]!,
			periodEnd: end.toISOString().split("T")[0]!,
			inflows: {
				clientPayments,
				invoicePayments: 0, // included in clientPayments
				total: inflowTotal,
			},
			outflows: {
				projectExpenses,
				subcontractPayments: subcontractPaymentsAmt,
				payroll,
				companyExpenses,
				total: outflowTotal,
			},
			netFlow,
			cumulativeBalance,
		};
	});

	// Projected inflows: outstanding invoices
	const expectedInflows = pendingInvoices.reduce((sum, inv) => {
		const outstanding =
			Number(inv.totalAmount ?? 0) - Number(inv.paidAmount ?? 0);
		return sum + Math.max(outstanding, 0);
	}, 0);

	// Projected outflows: pending expenses
	const expectedOutflows = pendingExpenses.reduce((sum, exp) => {
		const remaining =
			Number(exp.amount ?? 0) - Number(exp.paidAmount ?? 0);
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
