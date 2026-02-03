import {
	createQuotation,
	updateQuotation,
	updateQuotationItems,
	updateQuotationStatus,
	deleteQuotation,
	convertQuotationToInvoice,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";

const quotationItemSchema = z.object({
	description: z.string().min(1, "وصف البند مطلوب"),
	quantity: z.number().positive("الكمية يجب أن تكون موجبة"),
	unit: z.string().optional(),
	unitPrice: z.number().min(0, "السعر يجب أن يكون صفر أو أكبر"),
});

export const createQuotationProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/quotations",
		tags: ["Finance", "Quotations"],
		summary: "Create a new quotation",
	})
	.input(
		z.object({
			organizationId: z.string(),
			clientId: z.string().optional(),
			clientName: z.string().min(1, "اسم العميل مطلوب"),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().email().optional().or(z.literal("")),
			clientAddress: z.string().optional(),
			clientTaxNumber: z.string().optional(),
			projectId: z.string().optional(),
			validUntil: z.string().datetime(),
			paymentTerms: z.string().optional(),
			deliveryTerms: z.string().optional(),
			warrantyTerms: z.string().optional(),
			notes: z.string().optional(),
			templateId: z.string().optional(),
			vatPercent: z.number().min(0).max(100).optional().default(15),
			discountPercent: z.number().min(0).max(100).optional().default(0),
			items: z.array(quotationItemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const quotation = await createQuotation({
			organizationId: input.organizationId,
			createdById: context.user.id,
			clientId: input.clientId,
			clientName: input.clientName,
			clientCompany: input.clientCompany,
			clientPhone: input.clientPhone,
			clientEmail: input.clientEmail || undefined,
			clientAddress: input.clientAddress,
			clientTaxNumber: input.clientTaxNumber,
			projectId: input.projectId,
			validUntil: new Date(input.validUntil),
			paymentTerms: input.paymentTerms,
			deliveryTerms: input.deliveryTerms,
			warrantyTerms: input.warrantyTerms,
			notes: input.notes,
			templateId: input.templateId,
			vatPercent: input.vatPercent,
			discountPercent: input.discountPercent,
			items: input.items,
		});

		return {
			...quotation,
			subtotal: Number(quotation.subtotal),
			discountPercent: Number(quotation.discountPercent),
			discountAmount: Number(quotation.discountAmount),
			vatPercent: Number(quotation.vatPercent),
			vatAmount: Number(quotation.vatAmount),
			totalAmount: Number(quotation.totalAmount),
			items: quotation.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});

export const updateQuotationProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/quotations/{id}",
		tags: ["Finance", "Quotations"],
		summary: "Update a quotation",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			clientId: z.string().nullish(),
			clientName: z.string().min(1).optional(),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().email().optional().or(z.literal("")),
			clientAddress: z.string().optional(),
			clientTaxNumber: z.string().optional(),
			projectId: z.string().nullish(),
			validUntil: z.string().datetime().optional(),
			paymentTerms: z.string().optional(),
			deliveryTerms: z.string().optional(),
			warrantyTerms: z.string().optional(),
			notes: z.string().optional(),
			templateId: z.string().nullish(),
			vatPercent: z.number().min(0).max(100).optional(),
			discountPercent: z.number().min(0).max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const { organizationId, id, ...data } = input;

		const quotation = await updateQuotation(id, organizationId, {
			...data,
			clientId: data.clientId ?? undefined,
			projectId: data.projectId ?? undefined,
			templateId: data.templateId ?? undefined,
			clientEmail: data.clientEmail || undefined,
			validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
		});

		return quotation;
	});

export const updateQuotationItemsProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/quotations/{id}/items",
		tags: ["Finance", "Quotations"],
		summary: "Update quotation items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			items: z.array(quotationItemSchema.extend({ id: z.string().optional() })),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const quotation = await updateQuotationItems(
			input.id,
			input.organizationId,
			input.items,
		);

		return {
			...quotation,
			subtotal: Number(quotation.subtotal),
			discountPercent: Number(quotation.discountPercent),
			discountAmount: Number(quotation.discountAmount),
			vatPercent: Number(quotation.vatPercent),
			vatAmount: Number(quotation.vatAmount),
			totalAmount: Number(quotation.totalAmount),
			items: quotation.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});

export const updateQuotationStatusProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/quotations/{id}/status",
		tags: ["Finance", "Quotations"],
		summary: "Update quotation status",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			status: z.enum([
				"DRAFT",
				"SENT",
				"VIEWED",
				"ACCEPTED",
				"REJECTED",
				"EXPIRED",
			]),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const quotation = await updateQuotationStatus(
			input.id,
			input.organizationId,
			input.status,
		);

		return quotation;
	});

export const deleteQuotationProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/quotations/{id}",
		tags: ["Finance", "Quotations"],
		summary: "Delete a quotation",
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
			action: "quotations",
		});

		await deleteQuotation(input.id, input.organizationId);

		return { success: true };
	});

export const convertQuotationToInvoiceProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/quotations/{id}/convert",
		tags: ["Finance", "Quotations"],
		summary: "Convert a quotation to an invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			issueDate: z.string().datetime().optional(),
			dueDate: z.string().datetime().optional(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const invoice = await convertQuotationToInvoice(
			input.id,
			input.organizationId,
			context.user.id,
			{
				issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
				dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
				invoiceType: input.invoiceType,
			},
		);

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
		};
	});
