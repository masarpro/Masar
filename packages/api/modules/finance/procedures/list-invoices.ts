import { getOrganizationInvoices, getInvoiceById } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

export const listInvoices = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/invoices",
		tags: ["Finance", "Invoices"],
		summary: "List invoices for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			status: z
				.enum([
					"DRAFT",
					"SENT",
					"VIEWED",
					"PARTIALLY_PAID",
					"PAID",
					"OVERDUE",
					"CANCELLED",
				])
				.optional(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
			clientId: z.string().optional(),
			projectId: z.string().optional(),
			query: z.string().optional(),
			overdue: z.boolean().optional(),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await getOrganizationInvoices(input.organizationId, {
			status: input.status,
			invoiceType: input.invoiceType,
			clientId: input.clientId,
			projectId: input.projectId,
			query: input.query,
			overdue: input.overdue,
			limit: input.limit,
			offset: input.offset,
		});

		// Convert Decimal to number for JSON serialization
		return {
			invoices: result.invoices.map((inv) => ({
				...inv,
				subtotal: Number(inv.subtotal),
				discountPercent: Number(inv.discountPercent),
				discountAmount: Number(inv.discountAmount),
				vatPercent: Number(inv.vatPercent),
				vatAmount: Number(inv.vatAmount),
				totalAmount: Number(inv.totalAmount),
				paidAmount: Number(inv.paidAmount),
			})),
			total: result.total,
		};
	});

export const getInvoice = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/invoices/{id}",
		tags: ["Finance", "Invoices"],
		summary: "Get an invoice by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const invoice = await getInvoiceById(input.id, input.organizationId);

		if (!invoice) {
			throw new ORPCError("NOT_FOUND", { message: "الفاتورة غير موجودة" });
		}

		// Convert Decimal to number for JSON serialization
		return {
			...invoice,
			subtotal: Number(invoice.subtotal),
			discountPercent: Number(invoice.discountPercent),
			discountAmount: Number(invoice.discountAmount),
			vatPercent: Number(invoice.vatPercent),
			vatAmount: Number(invoice.vatAmount),
			totalAmount: Number(invoice.totalAmount),
			paidAmount: Number(invoice.paidAmount),
			items: invoice.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
			payments: invoice.payments.map((payment) => ({
				...payment,
				amount: Number(payment.amount),
			})),
		};
	});
