import { getOrganizationInvoices, getInvoiceById, getOrganizationFinanceSettings } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString, searchQuery, paginationLimit, paginationOffset } from "../../../lib/validation-constants";

export const listInvoices = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/invoices",
		tags: ["Finance", "Invoices"],
		summary: "List invoices for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			status: z
				.enum([
					"DRAFT",
					"ISSUED",
					"SENT",
					"VIEWED",
					"PARTIALLY_PAID",
					"PAID",
					"OVERDUE",
					"CANCELLED",
				])
				.optional(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED", "CREDIT_NOTE", "DEBIT_NOTE"]).optional(),
			clientId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			query: searchQuery(),
			overdue: z.boolean().optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// OVERDUE status is updated by daily cron job:
		// /api/cron/update-overdue-invoices

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
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		// Fetch invoice + org finance settings in parallel
		const [invoice, financeSettings] = await Promise.all([
			getInvoiceById(input.id, input.organizationId),
			getOrganizationFinanceSettings(input.organizationId),
		]);

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
			creditNotes: (invoice.creditNotes ?? []).map((cn) => ({
				...cn,
				totalAmount: Number(cn.totalAmount),
			})),
			relatedInvoice: invoice.relatedInvoice
				? {
						...invoice.relatedInvoice,
						totalAmount: Number(invoice.relatedInvoice.totalAmount),
					}
				: null,
			// Organization finance settings for displaying seller info
			organizationSettings: financeSettings
				? {
						companyNameAr: financeSettings.companyNameAr,
						companyNameEn: financeSettings.companyNameEn,
						taxNumber: financeSettings.taxNumber,
						commercialReg: financeSettings.commercialReg,
						address: financeSettings.address,
						phone: financeSettings.phone,
						email: financeSettings.email,
						website: financeSettings.website,
						logo: financeSettings.logo,
						bankName: financeSettings.bankName,
						iban: financeSettings.iban,
						accountName: financeSettings.accountName,
					}
				: null,
		};
	});
