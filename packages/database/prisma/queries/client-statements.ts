// Client & Vendor Statements
// Works independently of accounting mode — uses invoice/payment data directly

import { type PrismaClient } from "../generated/client";

export interface StatementLine {
	date: Date;
	referenceNo: string;
	description: string;
	debit: number;
	credit: number;
	runningBalance: number;
}

export interface ClientStatementResult {
	client: {
		id: string;
		name: string;
		businessName: string | null;
		taxNumber: string | null;
		address: string | null;
	};
	dateFrom: Date;
	dateTo: Date;
	openingBalance: number;
	lines: StatementLine[];
	closingBalance: number;
	totalDebit: number;
	totalCredit: number;
}

export async function getClientStatement(
	db: PrismaClient,
	organizationId: string,
	clientId: string,
	dateFrom: Date,
	dateTo: Date,
): Promise<ClientStatementResult> {
	// 1. Fetch client
	const client = await db.client.findFirst({
		where: { id: clientId, organizationId },
		select: { id: true, name: true, businessName: true, taxNumber: true, address: true },
	});
	if (!client) throw new Error("العميل غير موجود");

	// 2. Opening balance: invoices before dateFrom - payments before dateFrom
	const [invoicesBefore, paymentsBefore, directPaymentsBefore] = await Promise.all([
		db.financeInvoice.aggregate({
			where: {
				organizationId,
				clientId,
				status: { notIn: ["DRAFT", "CANCELLED"] },
				issueDate: { lt: dateFrom },
			},
			_sum: { totalAmount: true },
		}),
		db.financeInvoicePayment.aggregate({
			where: {
				invoice: { organizationId, clientId },
				paymentDate: { lt: dateFrom },
			},
			_sum: { amount: true },
		}),
		db.financePayment.aggregate({
			where: {
				organizationId,
				clientId,
				status: "COMPLETED",
				date: { lt: dateFrom },
			},
			_sum: { amount: true },
		}),
	]);

	const openingBalance =
		Number(invoicesBefore._sum.totalAmount ?? 0) -
		Number(paymentsBefore._sum.amount ?? 0) -
		Number(directPaymentsBefore._sum.amount ?? 0);

	// 3. Fetch in-period transactions
	const [invoices, invoicePayments, directPayments] = await Promise.all([
		db.financeInvoice.findMany({
			where: {
				organizationId,
				clientId,
				status: { notIn: ["DRAFT", "CANCELLED"] },
				issueDate: { gte: dateFrom, lte: dateTo },
			},
			select: { invoiceNo: true, issueDate: true, totalAmount: true, invoiceType: true },
			orderBy: { issueDate: "asc" },
		}),
		db.financeInvoicePayment.findMany({
			where: {
				invoice: { organizationId, clientId },
				paymentDate: { gte: dateFrom, lte: dateTo },
			},
			select: { paymentDate: true, amount: true, referenceNo: true, invoice: { select: { invoiceNo: true } } },
			orderBy: { paymentDate: "asc" },
		}),
		db.financePayment.findMany({
			where: {
				organizationId,
				clientId,
				status: "COMPLETED",
				date: { gte: dateFrom, lte: dateTo },
			},
			select: { paymentNo: true, date: true, amount: true, description: true },
			orderBy: { date: "asc" },
		}),
	]);

	// 4. Merge and sort
	const allLines: Array<{ date: Date; referenceNo: string; description: string; debit: number; credit: number }> = [];

	for (const inv of invoices) {
		const isCreditNote = inv.invoiceType === "CREDIT_NOTE";
		allLines.push({
			date: inv.issueDate,
			referenceNo: inv.invoiceNo,
			description: isCreditNote ? "إشعار دائن" : "فاتورة",
			debit: isCreditNote ? 0 : Number(inv.totalAmount),
			credit: isCreditNote ? Number(inv.totalAmount) : 0,
		});
	}

	for (const pay of invoicePayments) {
		allLines.push({
			date: pay.paymentDate,
			referenceNo: pay.invoice?.invoiceNo ?? pay.referenceNo ?? "",
			description: "دفعة على فاتورة",
			debit: 0,
			credit: Number(pay.amount),
		});
	}

	for (const pay of directPayments) {
		allLines.push({
			date: pay.date,
			referenceNo: pay.paymentNo,
			description: pay.description ?? "دفعة مباشرة",
			debit: 0,
			credit: Number(pay.amount),
		});
	}

	// Sort by date
	allLines.sort((a, b) => a.date.getTime() - b.date.getTime());

	// 5. Calculate running balance
	let runningBalance = openingBalance;
	let totalDebit = 0;
	let totalCredit = 0;

	const lines: StatementLine[] = allLines.map((line) => {
		totalDebit += line.debit;
		totalCredit += line.credit;
		runningBalance += line.debit - line.credit;
		return { ...line, runningBalance };
	});

	return {
		client,
		dateFrom,
		dateTo,
		openingBalance,
		lines,
		closingBalance: runningBalance,
		totalDebit,
		totalCredit,
	};
}

// ========================================
// Vendor Statement (Subcontractor)
// ========================================

export interface VendorStatementResult {
	vendor: {
		contractId: string;
		contractNo: string;
		vendorName: string;
	};
	dateFrom: Date;
	dateTo: Date;
	openingBalance: number;
	lines: StatementLine[];
	closingBalance: number;
	totalDebit: number;
	totalCredit: number;
}

export async function getVendorStatement(
	db: PrismaClient,
	organizationId: string,
	contractId: string,
	dateFrom: Date,
	dateTo: Date,
): Promise<VendorStatementResult> {
	// 1. Fetch contract
	const contract = await db.subcontractContract.findFirst({
		where: { id: contractId, organizationId },
		select: { id: true, contractNo: true, name: true },
	});
	if (!contract) throw new Error("العقد غير موجود");

	// 2. Opening balance: claims before dateFrom - payments before dateFrom
	const [claimsBefore, paymentsBefore] = await Promise.all([
		db.subcontractClaim.aggregate({
			where: {
				contractId,
				status: { in: ["APPROVED", "PAID"] },
				periodEnd: { lt: dateFrom },
			},
			_sum: { netAmount: true },
		}),
		db.subcontractPayment.aggregate({
			where: {
				contractId,
				status: "COMPLETED",
				date: { lt: dateFrom },
			},
			_sum: { amount: true },
		}),
	]);

	const openingBalance =
		Number(claimsBefore._sum.netAmount ?? 0) -
		Number(paymentsBefore._sum.amount ?? 0);

	// 3. Fetch in-period transactions
	const [claims, payments] = await Promise.all([
		db.subcontractClaim.findMany({
			where: {
				contractId,
				status: { in: ["APPROVED", "PAID"] },
				periodEnd: { gte: dateFrom, lte: dateTo },
			},
			select: { claimNo: true, periodEnd: true, netAmount: true },
			orderBy: { periodEnd: "asc" },
		}),
		db.subcontractPayment.findMany({
			where: {
				contractId,
				status: "COMPLETED",
				date: { gte: dateFrom, lte: dateTo },
			},
			select: { paymentNo: true, date: true, amount: true, description: true },
			orderBy: { date: "asc" },
		}),
	]);

	// 4. Merge and sort
	const allLines: Array<{ date: Date; referenceNo: string; description: string; debit: number; credit: number }> = [];

	for (const claim of claims) {
		allLines.push({
			date: claim.periodEnd,
			referenceNo: String(claim.claimNo),
			description: "مستخلص",
			debit: Number(claim.netAmount),
			credit: 0,
		});
	}

	for (const pay of payments) {
		allLines.push({
			date: pay.date,
			referenceNo: pay.paymentNo,
			description: pay.description ?? "دفعة",
			debit: 0,
			credit: Number(pay.amount),
		});
	}

	allLines.sort((a, b) => a.date.getTime() - b.date.getTime());

	// 5. Calculate running balance
	let runningBalance = openingBalance;
	let totalDebit = 0;
	let totalCredit = 0;

	const lines: StatementLine[] = allLines.map((line) => {
		totalDebit += line.debit;
		totalCredit += line.credit;
		runningBalance += line.debit - line.credit;
		return { ...line, runningBalance };
	});

	return {
		vendor: {
			contractId: contract.id,
			contractNo: contract.contractNo ?? "",
			vendorName: contract.name,
		},
		dateFrom,
		dateTo,
		openingBalance,
		lines,
		closingBalance: runningBalance,
		totalDebit,
		totalCredit,
	};
}
