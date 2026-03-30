import {
	getAgedReceivables,
	getAgedPayables,
	getVATReport,
	getIncomeStatement,
} from "@repo/database";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString, percentage } from "../../../lib/validation-constants";

// ========== Shared Input Schema ==========

const accountingReportInput = z.object({
	organizationId: idString(),
	dateFrom: z.string().trim().datetime().optional(),
	dateTo: z.string().trim().datetime().optional(),
	projectId: z.string().trim().max(100).optional(),
});

// ========== Aged Receivables ==========

export const getAgedReceivablesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/accounting-reports/aged-receivables",
		tags: ["Finance", "Accounting Reports"],
		summary: "Get aged receivables report",
	})
	.input(
		z.object({
			organizationId: idString(),
			asOfDate: z.string().trim().datetime().optional(),
			projectId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const result = await getAgedReceivables(db, input.organizationId, {
			asOfDate: input.asOfDate ? new Date(input.asOfDate) : undefined,
			projectId: input.projectId,
		});

		// Convert Decimals to numbers for JSON serialization
		return {
			rows: result.rows.map((row) => ({
				...row,
				current: Number(row.current),
				days1to30: Number(row.days1to30),
				days31to60: Number(row.days31to60),
				days61to90: Number(row.days61to90),
				over90: Number(row.over90),
				total: Number(row.total),
				invoices: row.invoices.map((inv) => ({
					...inv,
					totalAmount: Number(inv.totalAmount),
					paidAmount: Number(inv.paidAmount),
					outstanding: Number(inv.outstanding),
				})),
			})),
			totals: {
				current: Number(result.totals.current),
				days1to30: Number(result.totals.days1to30),
				days31to60: Number(result.totals.days31to60),
				days61to90: Number(result.totals.days61to90),
				over90: Number(result.totals.over90),
				total: Number(result.totals.total),
			},
			generatedAt: result.generatedAt,
		};
	});

// ========== Aged Payables ==========

export const getAgedPayablesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/accounting-reports/aged-payables",
		tags: ["Finance", "Accounting Reports"],
		summary: "Get aged payables report",
	})
	.input(
		z.object({
			organizationId: idString(),
			asOfDate: z.string().trim().datetime().optional(),
			projectId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const result = await getAgedPayables(db, input.organizationId, {
			asOfDate: input.asOfDate ? new Date(input.asOfDate) : undefined,
			projectId: input.projectId,
		});

		return {
			rows: result.rows.map((row) => ({
				...row,
				current: Number(row.current),
				days1to30: Number(row.days1to30),
				days31to60: Number(row.days31to60),
				days61to90: Number(row.days61to90),
				over90: Number(row.over90),
				total: Number(row.total),
				details: row.details.map((d) => ({
					...d,
					totalAmount: Number(d.totalAmount),
					paidAmount: Number(d.paidAmount),
					outstanding: Number(d.outstanding),
				})),
			})),
			totals: {
				current: Number(result.totals.current),
				days1to30: Number(result.totals.days1to30),
				days31to60: Number(result.totals.days31to60),
				days61to90: Number(result.totals.days61to90),
				over90: Number(result.totals.over90),
				total: Number(result.totals.total),
			},
			generatedAt: result.generatedAt,
		};
	});

// ========== VAT Report ==========

export const getVATReportProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/accounting-reports/vat-report",
		tags: ["Finance", "Accounting Reports"],
		summary: "Get VAT report for ZATCA filing",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.string().trim().datetime(),
			dateTo: z.string().trim().datetime(),
			quarter: z.number().int().min(1).max(4).optional(),
			year: z.number().int().min(2000).max(2100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		let dateFrom: Date;
		let dateTo: Date;

		if (input.quarter && input.year) {
			const startMonth = (input.quarter - 1) * 3;
			dateFrom = new Date(input.year, startMonth, 1);
			dateTo = new Date(input.year, startMonth + 3, 0); // last day of quarter
		} else {
			dateFrom = new Date(input.dateFrom);
			dateTo = new Date(input.dateTo);
		}

		const result = await getVATReport(db, input.organizationId, dateFrom, dateTo);

		// Convert Decimals
		const convertGroup = (g: { taxableAmount: any; vatAmount: any; count: number }) => ({
			taxableAmount: Number(g.taxableAmount),
			vatAmount: Number(g.vatAmount),
			count: g.count,
		});

		return {
			period: result.period,
			outputVAT: {
				taxInvoices: convertGroup(result.outputVAT.taxInvoices),
				simplifiedInvoices: convertGroup(result.outputVAT.simplifiedInvoices),
				creditNotes: convertGroup(result.outputVAT.creditNotes),
				standardInvoices: convertGroup(result.outputVAT.standardInvoices),
				total: {
					taxableAmount: Number(result.outputVAT.total.taxableAmount),
					vatAmount: Number(result.outputVAT.total.vatAmount),
				},
			},
			inputVAT: {
				expenses: convertGroup(result.inputVAT.expenses),
				subcontractors: convertGroup(result.inputVAT.subcontractors),
				total: {
					taxableAmount: Number(result.inputVAT.total.taxableAmount),
					vatAmount: Number(result.inputVAT.total.vatAmount),
				},
			},
			netVAT: Number(result.netVAT),
			isPayable: result.isPayable,
			invoiceDetails: result.invoiceDetails.map((d) => ({
				...d,
				taxableAmount: Number(d.taxableAmount),
				vatAmount: Number(d.vatAmount),
			})),
			generatedAt: result.generatedAt,
		};
	});

// ========== Income Statement ==========

export const getIncomeStatementProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/accounting-reports/income-statement",
		tags: ["Finance", "Accounting Reports"],
		summary: "Get simplified income statement",
	})
	.input(
		z.object({
			organizationId: idString(),
			dateFrom: z.string().trim().datetime(),
			dateTo: z.string().trim().datetime(),
			projectId: z.string().trim().max(100).optional(),
			includeComparison: z.boolean().optional().default(true),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const result = await getIncomeStatement(
			db,
			input.organizationId,
			new Date(input.dateFrom),
			new Date(input.dateTo),
			{
				projectId: input.projectId,
				includeComparison: input.includeComparison,
			},
		);

		return {
			period: result.period,
			revenue: {
				invoiceRevenue: Number(result.revenue.invoiceRevenue),
				directPayments: Number(result.revenue.directPayments),
				creditNotes: Number(result.revenue.creditNotes),
				totalRevenue: Number(result.revenue.totalRevenue),
				byProject: result.revenue.byProject.map((p) => ({
					...p,
					amount: Number(p.amount),
				})),
				byClient: result.revenue.byClient.map((c) => ({
					...c,
					amount: Number(c.amount),
				})),
			},
			expenses: {
				byCategory: result.expenses.byCategory.map((c) => ({
					...c,
					amount: Number(c.amount),
				})),
				subcontractorPayments: Number(result.expenses.subcontractorPayments),
				payroll: Number(result.expenses.payroll),
				companyExpenses: Number(result.expenses.companyExpenses),
				totalExpenses: Number(result.expenses.totalExpenses),
				byProject: result.expenses.byProject.map((p) => ({
					...p,
					amount: Number(p.amount),
				})),
			},
			summary: {
				grossProfit: Number(result.summary.grossProfit),
				totalExpenses: Number(result.summary.totalExpenses),
				netProfit: Number(result.summary.netProfit),
				profitMargin: result.summary.profitMargin,
			},
			comparison: result.comparison
				? {
						previousRevenue: Number(result.comparison.previousRevenue),
						previousExpenses: Number(result.comparison.previousExpenses),
						previousNetProfit: Number(result.comparison.previousNetProfit),
						revenueChange: result.comparison.revenueChange,
						expensesChange: result.comparison.expensesChange,
						profitChange: result.comparison.profitChange,
					}
				: undefined,
			generatedAt: result.generatedAt,
		};
	});
