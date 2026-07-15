import { startOfTodayRiyadhUtc } from "@repo/utils";
import { db } from "../client";
import type { FinanceInvoiceStatus, QuotationStatus } from "../generated/client";

// ═══════════════════════════════════════════════════════════════════════════
// FINANCE REPORTS - تقارير المالية
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get finance dashboard stats for an organization
 */
export async function getFinanceDashboardStats(organizationId: string) {
	const [
		totalQuotations,
		draftQuotations,
		sentQuotations,
		acceptedQuotations,
		totalInvoices,
		draftInvoices,
		sentInvoices,
		paidInvoices,
		overdueInvoices,
		quotationsTotalValue,
		invoicesTotalValue,
		invoicesPaidValue,
		totalClients,
	] = await Promise.all([
		// Quotation counts
		db.quotation.count({ where: { organizationId } }),
		db.quotation.count({ where: { organizationId, status: "DRAFT" } }),
		db.quotation.count({ where: { organizationId, status: "SENT" } }),
		db.quotation.count({ where: { organizationId, status: "ACCEPTED" } }),

		// Invoice counts
		db.financeInvoice.count({ where: { organizationId } }),
		db.financeInvoice.count({ where: { organizationId, status: "DRAFT" } }),
		db.financeInvoice.count({ where: { organizationId, status: "SENT" } }),
		db.financeInvoice.count({ where: { organizationId, status: "PAID" } }),
		db.financeInvoice.count({
			where: {
				organizationId,
				// Must include OVERDUE: the daily cron flips past-due invoices to
				// OVERDUE, so a SENT/PARTIALLY_PAID-only filter goes blind to every
				// overdue receivable after the first cron run.
				status: {
					in: ["ISSUED", "SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"],
				},
				dueDate: { lt: startOfTodayRiyadhUtc() },
			},
		}),

		// Total values
		db.quotation.aggregate({
			where: { organizationId },
			_sum: { totalAmount: true },
		}),
		// Invoice value: exclude staging drafts and CANCELLED, and exclude
		// CREDIT_NOTE — a credit note's negative total AND its increment of the
		// original's paidAmount would otherwise double-count against outstanding.
		db.financeInvoice.aggregate({
			where: {
				organizationId,
				isDraft: false,
				status: { not: "CANCELLED" },
				invoiceType: { not: "CREDIT_NOTE" },
			},
			_sum: { totalAmount: true },
		}),
		db.financeInvoice.aggregate({
			where: {
				organizationId,
				isDraft: false,
				status: { not: "CANCELLED" },
			},
			_sum: { paidAmount: true },
		}),

		// Client count
		db.client.count({ where: { organizationId, isActive: true } }),
	]);

	const outstandingAmount =
		Number(invoicesTotalValue._sum.totalAmount ?? 0) -
		Number(invoicesPaidValue._sum.paidAmount ?? 0);

	return {
		quotations: {
			total: totalQuotations,
			draft: draftQuotations,
			sent: sentQuotations,
			accepted: acceptedQuotations,
			totalValue: Number(quotationsTotalValue._sum.totalAmount ?? 0),
		},
		invoices: {
			total: totalInvoices,
			draft: draftInvoices,
			sent: sentInvoices,
			paid: paidInvoices,
			overdue: overdueInvoices,
			totalValue: Number(invoicesTotalValue._sum.totalAmount ?? 0),
			paidValue: Number(invoicesPaidValue._sum.paidAmount ?? 0),
			outstandingValue: outstandingAmount,
		},
		clients: {
			total: totalClients,
		},
	};
}

/**
 * Get recent quotations for dashboard
 */
export async function getRecentQuotations(
	organizationId: string,
	limit = 5,
) {
	return db.quotation.findMany({
		where: { organizationId },
		select: {
			id: true,
			quotationNo: true,
			clientName: true,
			clientCompany: true,
			status: true,
			totalAmount: true,
			validUntil: true,
			createdAt: true,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

/**
 * Get recent invoices for dashboard
 */
export async function getRecentInvoices(
	organizationId: string,
	limit = 5,
) {
	return db.financeInvoice.findMany({
		where: { organizationId },
		select: {
			id: true,
			invoiceNo: true,
			clientName: true,
			clientCompany: true,
			status: true,
			totalAmount: true,
			paidAmount: true,
			dueDate: true,
			createdAt: true,
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices(
	organizationId: string,
	limit = 10,
) {
	return db.financeInvoice.findMany({
		where: {
			organizationId,
			// Include OVERDUE (the cron flips past-due invoices to it) plus the
			// other unpaid states — a SENT/PARTIALLY_PAID-only filter goes blind
			// once the daily cron has run.
			status: { in: ["ISSUED", "SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
			dueDate: { lt: startOfTodayRiyadhUtc() },
		},
		include: {
			client: { select: { id: true, name: true, company: true } },
			project: { select: { id: true, name: true, slug: true } },
		},
		orderBy: { dueDate: "asc" },
		take: limit,
	});
}

/**
 * Get outstanding invoices (unpaid or partially paid)
 */
export async function getOutstandingInvoices(
	organizationId: string,
	limit = 20,
) {
	return db.financeInvoice.findMany({
		where: {
			organizationId,
			status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
		},
		include: {
			client: { select: { id: true, name: true, company: true } },
			project: { select: { id: true, name: true, slug: true } },
		},
		orderBy: { dueDate: "asc" },
		take: limit,
	});
}

/**
 * Group payments into sorted monthly revenue buckets.
 * Pure function — exported for unit tests (pins getRevenueByPeriod output).
 */
export function groupPaymentsByMonth(
	payments: Array<{ amount: unknown; paymentDate: Date }>,
): Array<{ month: string; revenue: number }> {
	const revenueByMonth: Record<string, number> = {};

	for (const payment of payments) {
		const monthKey = `${payment.paymentDate.getFullYear()}-${String(payment.paymentDate.getMonth() + 1).padStart(2, "0")}`;
		revenueByMonth[monthKey] = (revenueByMonth[monthKey] ?? 0) + Number(payment.amount);
	}

	const sortedMonths = Object.keys(revenueByMonth).sort();

	return sortedMonths.map((month) => ({
		month,
		revenue: revenueByMonth[month],
	}));
}

/**
 * Get revenue by period (month)
 * Revenue = collected invoice payments grouped by payment month (cash basis).
 */
export async function getRevenueByPeriod(
	organizationId: string,
	startDate: Date,
	endDate: Date,
) {
	const payments = await db.financeInvoicePayment.findMany({
		where: {
			invoice: { organizationId },
			paymentDate: {
				gte: startDate,
				lte: endDate,
			},
		},
		select: {
			amount: true,
			paymentDate: true,
		},
	});

	return groupPaymentsByMonth(payments);
}

/**
 * Get revenue by project
 */
export async function getRevenueByProject(organizationId: string) {
	const invoicesByProject = await db.financeInvoice.groupBy({
		by: ["projectId"],
		where: {
			organizationId,
			projectId: { not: null },
			status: { in: ["PAID", "PARTIALLY_PAID"] },
		},
		_sum: {
			totalAmount: true,
			paidAmount: true,
		},
	});

	// Get project details
	const projectIds = invoicesByProject
		.filter((i) => i.projectId)
		.map((i) => i.projectId as string);

	const projects = await db.project.findMany({
		where: { id: { in: projectIds } },
		select: { id: true, name: true, slug: true },
	});

	const projectMap = new Map(projects.map((p) => [p.id, p]));

	return invoicesByProject
		.filter((i) => i.projectId)
		.map((i) => ({
			project: projectMap.get(i.projectId as string),
			totalInvoiced: Number(i._sum.totalAmount ?? 0),
			totalPaid: Number(i._sum.paidAmount ?? 0),
		}))
		.sort((a, b) => b.totalInvoiced - a.totalInvoiced);
}

/**
 * Get quotation conversion rate
 */
export async function getQuotationConversionRate(
	organizationId: string,
	startDate?: Date,
	endDate?: Date,
) {
	const where: {
		organizationId: string;
		createdAt?: { gte?: Date; lte?: Date };
	} = { organizationId };

	if (startDate || endDate) {
		where.createdAt = {};
		if (startDate) where.createdAt.gte = startDate;
		if (endDate) where.createdAt.lte = endDate;
	}

	const [total, converted, accepted] = await Promise.all([
		db.quotation.count({ where }),
		db.quotation.count({ where: { ...where, status: "CONVERTED" } }),
		db.quotation.count({ where: { ...where, status: "ACCEPTED" } }),
	]);

	return {
		total,
		converted,
		accepted,
		conversionRate: total > 0 ? ((converted + accepted) / total) * 100 : 0,
	};
}

/**
 * Get revenue by client
 */
export async function getRevenueByClient(
	organizationId: string,
	limit = 10,
) {
	const invoicesByClient = await db.financeInvoice.groupBy({
		by: ["clientId"],
		where: {
			organizationId,
			clientId: { not: null },
			status: { in: ["PAID", "PARTIALLY_PAID"] },
		},
		_sum: {
			totalAmount: true,
			paidAmount: true,
		},
		_count: { id: true },
	});

	// Get client details
	const clientIds = invoicesByClient
		.filter((i) => i.clientId)
		.map((i) => i.clientId as string);

	const clients = await db.client.findMany({
		where: { id: { in: clientIds } },
		select: { id: true, name: true, company: true },
	});

	const clientMap = new Map(clients.map((c) => [c.id, c]));

	return invoicesByClient
		.filter((i) => i.clientId)
		.map((i) => ({
			client: clientMap.get(i.clientId as string),
			totalInvoiced: Number(i._sum.totalAmount ?? 0),
			totalPaid: Number(i._sum.paidAmount ?? 0),
			invoiceCount: i._count.id,
		}))
		.sort((a, b) => b.totalPaid - a.totalPaid)
		.slice(0, limit);
}

/**
 * Get quotation stats by status
 */
export async function getQuotationStatsByStatus(organizationId: string) {
	const statuses: QuotationStatus[] = [
		"DRAFT",
		"SENT",
		"VIEWED",
		"ACCEPTED",
		"REJECTED",
		"EXPIRED",
		"CONVERTED",
	];

	// قروب واحد بدل عدّ + تجميع لكل حالة (كان ~14 استعلاماً)
	const grouped = await db.quotation.groupBy({
		by: ["status"],
		where: { organizationId },
		_count: { _all: true },
		_sum: { totalAmount: true },
	});
	const byStatus = new Map(grouped.map((g) => [g.status, g]));

	return statuses.map((status) => {
		const g = byStatus.get(status);
		return {
			status,
			count: g?._count._all ?? 0,
			totalValue: Number(g?._sum.totalAmount ?? 0),
		};
	});
}

/**
 * Get invoice stats by status
 */
export async function getInvoiceStatsByStatus(organizationId: string) {
	const statuses: FinanceInvoiceStatus[] = [
		"DRAFT",
		"SENT",
		"VIEWED",
		"PARTIALLY_PAID",
		"PAID",
		"OVERDUE",
		"CANCELLED",
	];

	// قروب واحد بدل عدّ + تجميع لكل حالة (كان ~14 استعلاماً)
	const grouped = await db.financeInvoice.groupBy({
		by: ["status"],
		where: { organizationId },
		_count: { _all: true },
		_sum: { totalAmount: true, paidAmount: true },
	});
	const byStatus = new Map(grouped.map((g) => [g.status, g]));

	return statuses.map((status) => {
		const g = byStatus.get(status);
		return {
			status,
			count: g?._count._all ?? 0,
			totalValue: Number(g?._sum.totalAmount ?? 0),
			paidValue: Number(g?._sum.paidAmount ?? 0),
		};
	});
}

/**
 * Get finance summary for a specific project
 */
export async function getProjectQuotationInvoiceSummary(
	projectId: string,
	organizationId: string,
) {
	const [
		quotationStats,
		invoiceStats,
		recentQuotations,
		recentInvoices,
	] = await Promise.all([
		// Quotation stats
		Promise.all([
			db.quotation.count({ where: { projectId, organizationId } }),
			db.quotation.aggregate({
				where: { projectId, organizationId },
				_sum: { totalAmount: true },
			}),
		]),

		// Invoice stats
		Promise.all([
			db.financeInvoice.count({ where: { projectId, organizationId } }),
			db.financeInvoice.aggregate({
				where: { projectId, organizationId },
				_sum: { totalAmount: true, paidAmount: true },
			}),
		]),

		// Recent quotations
		db.quotation.findMany({
			where: { projectId, organizationId },
			select: {
				id: true,
				quotationNo: true,
				status: true,
				totalAmount: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		}),

		// Recent invoices
		db.financeInvoice.findMany({
			where: { projectId, organizationId },
			select: {
				id: true,
				invoiceNo: true,
				status: true,
				totalAmount: true,
				paidAmount: true,
				dueDate: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		}),
	]);

	return {
		quotations: {
			count: quotationStats[0],
			totalValue: Number(quotationStats[1]._sum.totalAmount ?? 0),
		},
		invoices: {
			count: invoiceStats[0],
			totalValue: Number(invoiceStats[1]._sum.totalAmount ?? 0),
			paidValue: Number(invoiceStats[1]._sum.paidAmount ?? 0),
			outstandingValue:
				Number(invoiceStats[1]._sum.totalAmount ?? 0) -
				Number(invoiceStats[1]._sum.paidAmount ?? 0),
		},
		recentQuotations,
		recentInvoices,
	};
}
