import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../../lib/permissions";

export const dashboardGetStats = protectedProcedure
	.route({
		method: "GET",
		path: "/procurement/dashboard",
		tags: ["Procurement", "Dashboard"],
		summary: "Get procurement dashboard statistics",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "procurement",
			action: "view",
		});

		const orgFilter: any = { organizationId: input.organizationId };
		if (input.projectId) {
			(orgFilter as any).projectId = input.projectId;
		}

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [
			pendingRequests,
			activeOrders,
			pendingReceipts,
			unpaidInvoices,
			monthlySpend,
			totalVendors,
			recentPRs,
			overdueInvoices,
		] = await Promise.all([
			// Pending purchase requests
			db.purchaseRequest.count({
				where: { ...orgFilter, status: { in: ["PR_DRAFT", "PR_PENDING"] } },
			}),
			// Active purchase orders
			db.purchaseOrder.count({
				where: {
					...orgFilter,
					status: {
						in: [
							"PO_DRAFT",
							"PO_PENDING_APPROVAL",
							"PO_APPROVED",
							"PO_SENT",
							"PO_PARTIALLY_RECEIVED",
						],
					},
				},
			}),
			// Pending goods receipts
			db.goodsReceipt.count({
				where: {
					organizationId: input.organizationId,
					status: "PENDING_INSPECTION",
				},
			}),
			// Unpaid vendor invoices
			db.vendorInvoice.count({
				where: {
					...orgFilter,
					status: {
						in: ["VI_APPROVED", "VI_PARTIALLY_PAID"],
					},
				},
			}),
			// Monthly spend (vendor invoices this month)
			db.vendorInvoice.aggregate({
				where: {
					...orgFilter,
					invoiceDate: { gte: startOfMonth },
					status: { notIn: ["VI_CANCELLED"] },
				},
				_sum: { totalAmount: true },
			}),
			// Total active vendors
			db.vendor.count({
				where: { organizationId: input.organizationId, isActive: true },
			}),
			// Recent purchase requests
			db.purchaseRequest.findMany({
				where: orgFilter,
				select: {
					id: true,
					prNumber: true,
					title: true,
					status: true,
					priority: true,
					estimatedTotal: true,
					createdAt: true,
					project: { select: { name: true } },
					requestedBy: { select: { name: true } },
				},
				orderBy: { createdAt: "desc" },
				take: 5,
			}),
			// Overdue invoices
			db.vendorInvoice.findMany({
				where: {
					...orgFilter,
					status: { in: ["VI_APPROVED", "VI_PARTIALLY_PAID"] },
					dueDate: { lt: now },
				},
				select: {
					id: true,
					invoiceNumber: true,
					totalAmount: true,
					paidAmount: true,
					dueDate: true,
					vendor: { select: { name: true } },
				},
				orderBy: { dueDate: "asc" },
				take: 5,
			}),
		]);

		return {
			pendingRequests,
			activeOrders,
			pendingReceipts,
			unpaidInvoices,
			monthlySpend: Number(monthlySpend._sum.totalAmount ?? 0),
			totalVendors,
			recentPRs: recentPRs.map((pr) => ({
				...pr,
				estimatedTotal: Number(pr.estimatedTotal),
			})),
			overdueInvoices: overdueInvoices.map((vi) => ({
				...vi,
				totalAmount: Number(vi.totalAmount),
				paidAmount: Number(vi.paidAmount),
				remaining: Number(vi.totalAmount) - Number(vi.paidAmount),
			})),
		};
	});
