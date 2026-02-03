import {
	getFinanceDashboardStats,
	getRecentQuotations,
	getRecentInvoices,
	getOverdueInvoices,
	getOutstandingInvoices,
	getRevenueByPeriod,
	getRevenueByProject,
	getRevenueByClient,
	getQuotationConversionRate,
	getQuotationStatsByStatus,
	getInvoiceStatsByStatus,
	getProjectQuotationInvoiceSummary,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess, verifyProjectAccess } from "../../../lib/permissions";

export const getFinanceDashboard = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/dashboard",
		tags: ["Finance", "Dashboard"],
		summary: "Get finance dashboard stats",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const [stats, recentQuotations, recentInvoices, overdueInvoices] =
			await Promise.all([
				getFinanceDashboardStats(input.organizationId),
				getRecentQuotations(input.organizationId, 5),
				getRecentInvoices(input.organizationId, 5),
				getOverdueInvoices(input.organizationId, 5),
			]);

		return {
			stats,
			recentQuotations: recentQuotations.map((q) => ({
				...q,
				totalAmount: Number(q.totalAmount),
			})),
			recentInvoices: recentInvoices.map((inv) => ({
				...inv,
				totalAmount: Number(inv.totalAmount),
				paidAmount: Number(inv.paidAmount),
			})),
			overdueInvoices: overdueInvoices.map((inv) => ({
				...inv,
				totalAmount: Number(inv.totalAmount),
				paidAmount: Number(inv.paidAmount),
			})),
		};
	});

export const getFinanceOutstanding = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/outstanding",
		tags: ["Finance", "Reports"],
		summary: "Get outstanding invoices",
	})
	.input(
		z.object({
			organizationId: z.string(),
			limit: z.number().optional().default(20),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const invoices = await getOutstandingInvoices(
			input.organizationId,
			input.limit,
		);

		return invoices.map((inv) => ({
			...inv,
			totalAmount: Number(inv.totalAmount),
			paidAmount: Number(inv.paidAmount),
		}));
	});

export const getFinanceRevenueByPeriod = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/revenue-by-period",
		tags: ["Finance", "Reports"],
		summary: "Get revenue by period (month)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			startDate: z.string().datetime(),
			endDate: z.string().datetime(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const revenue = await getRevenueByPeriod(
			input.organizationId,
			new Date(input.startDate),
			new Date(input.endDate),
		);

		return revenue;
	});

export const getFinanceRevenueByProject = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/revenue-by-project",
		tags: ["Finance", "Reports"],
		summary: "Get revenue by project",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const revenue = await getRevenueByProject(input.organizationId);

		return revenue;
	});

export const getFinanceRevenueByClient = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/revenue-by-client",
		tags: ["Finance", "Reports"],
		summary: "Get revenue by client",
	})
	.input(
		z.object({
			organizationId: z.string(),
			limit: z.number().optional().default(10),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const revenue = await getRevenueByClient(input.organizationId, input.limit);

		return revenue;
	});

export const getFinanceConversionRate = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/conversion-rate",
		tags: ["Finance", "Reports"],
		summary: "Get quotation conversion rate",
	})
	.input(
		z.object({
			organizationId: z.string(),
			startDate: z.string().datetime().optional(),
			endDate: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const rate = await getQuotationConversionRate(
			input.organizationId,
			input.startDate ? new Date(input.startDate) : undefined,
			input.endDate ? new Date(input.endDate) : undefined,
		);

		return rate;
	});

export const getFinanceQuotationStats = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/quotation-stats",
		tags: ["Finance", "Reports"],
		summary: "Get quotation stats by status",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const stats = await getQuotationStatsByStatus(input.organizationId);

		return stats;
	});

export const getFinanceInvoiceStats = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/reports/invoice-stats",
		tags: ["Finance", "Reports"],
		summary: "Get invoice stats by status",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "reports",
		});

		const stats = await getInvoiceStatsByStatus(input.organizationId);

		return stats;
	});

export const getProjectFinance = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/projects/{projectId}",
		tags: ["Finance", "Projects"],
		summary: "Get finance summary for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const summary = await getProjectQuotationInvoiceSummary(
			input.projectId,
			input.organizationId,
		);

		return {
			...summary,
			recentQuotations: summary.recentQuotations.map((q) => ({
				...q,
				totalAmount: Number(q.totalAmount),
			})),
			recentInvoices: summary.recentInvoices.map((inv) => ({
				...inv,
				totalAmount: Number(inv.totalAmount),
				paidAmount: Number(inv.paidAmount),
			})),
		};
	});
