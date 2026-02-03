import {
	createInvoice,
	updateInvoice,
	updateInvoiceItems,
	updateInvoiceStatus,
	addInvoicePayment,
	deleteInvoicePayment,
	deleteInvoice,
	getInvoiceById,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { generateZatcaQR } from "../../../lib/zatca";
import { db } from "@repo/database/prisma/client";

const invoiceItemSchema = z.object({
	description: z.string().min(1, "وصف البند مطلوب"),
	quantity: z.number().positive("الكمية يجب أن تكون موجبة"),
	unit: z.string().optional(),
	unitPrice: z.number().min(0, "السعر يجب أن يكون صفر أو أكبر"),
});

export const createInvoiceProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/invoices",
		tags: ["Finance", "Invoices"],
		summary: "Create a new invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional().default("STANDARD"),
			clientId: z.string().optional(),
			clientName: z.string().min(1, "اسم العميل مطلوب"),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().email().optional().or(z.literal("")),
			clientAddress: z.string().optional(),
			clientTaxNumber: z.string().optional(),
			projectId: z.string().optional(),
			quotationId: z.string().optional(),
			issueDate: z.string().datetime(),
			dueDate: z.string().datetime(),
			paymentTerms: z.string().optional(),
			notes: z.string().optional(),
			templateId: z.string().optional(),
			vatPercent: z.number().min(0).max(100).optional().default(15),
			discountPercent: z.number().min(0).max(100).optional().default(0),
			items: z.array(invoiceItemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		// Get organization for seller tax number if invoice is TAX type
		let sellerTaxNumber: string | undefined;
		if (input.invoiceType === "TAX") {
			const org = await db.organization.findUnique({
				where: { id: input.organizationId },
				select: { taxNumber: true },
			});
			sellerTaxNumber = org?.taxNumber ?? undefined;
		}

		const invoice = await createInvoice({
			organizationId: input.organizationId,
			createdById: context.user.id,
			invoiceType: input.invoiceType,
			clientId: input.clientId,
			clientName: input.clientName,
			clientCompany: input.clientCompany,
			clientPhone: input.clientPhone,
			clientEmail: input.clientEmail || undefined,
			clientAddress: input.clientAddress,
			clientTaxNumber: input.clientTaxNumber,
			projectId: input.projectId,
			quotationId: input.quotationId,
			issueDate: new Date(input.issueDate),
			dueDate: new Date(input.dueDate),
			paymentTerms: input.paymentTerms,
			notes: input.notes,
			templateId: input.templateId,
			vatPercent: input.vatPercent,
			discountPercent: input.discountPercent,
			sellerTaxNumber,
			items: input.items,
		});

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

export const updateInvoiceProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}",
		tags: ["Finance", "Invoices"],
		summary: "Update an invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
			clientId: z.string().nullish(),
			clientName: z.string().min(1).optional(),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().email().optional().or(z.literal("")),
			clientAddress: z.string().optional(),
			clientTaxNumber: z.string().optional(),
			projectId: z.string().nullish(),
			issueDate: z.string().datetime().optional(),
			dueDate: z.string().datetime().optional(),
			paymentTerms: z.string().optional(),
			notes: z.string().optional(),
			templateId: z.string().nullish(),
			vatPercent: z.number().min(0).max(100).optional(),
			discountPercent: z.number().min(0).max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const { organizationId, id, ...data } = input;

		const invoice = await updateInvoice(id, organizationId, {
			...data,
			clientId: data.clientId ?? undefined,
			projectId: data.projectId ?? undefined,
			templateId: data.templateId ?? undefined,
			clientEmail: data.clientEmail || undefined,
			issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
			dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
		});

		return invoice;
	});

export const updateInvoiceItemsProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}/items",
		tags: ["Finance", "Invoices"],
		summary: "Update invoice items",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			items: z.array(invoiceItemSchema.extend({ id: z.string().optional() })),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const invoice = await updateInvoiceItems(
			input.id,
			input.organizationId,
			input.items,
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

export const updateInvoiceStatusProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}/status",
		tags: ["Finance", "Invoices"],
		summary: "Update invoice status",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			status: z.enum([
				"DRAFT",
				"SENT",
				"VIEWED",
				"OVERDUE",
				"CANCELLED",
			]),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const invoice = await updateInvoiceStatus(
			input.id,
			input.organizationId,
			input.status,
		);

		return invoice;
	});

export const convertToTaxInvoiceProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/convert-to-tax",
		tags: ["Finance", "Invoices"],
		summary: "Convert an invoice to a tax invoice with ZATCA QR code",
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
			action: "invoices",
		});

		// Get the invoice
		const invoice = await getInvoiceById(input.id, input.organizationId);
		if (!invoice) {
			throw new ORPCError("NOT_FOUND", { message: "الفاتورة غير موجودة" });
		}

		if (invoice.invoiceType === "TAX") {
			throw new ORPCError("BAD_REQUEST", {
				message: "الفاتورة بالفعل فاتورة ضريبية",
			});
		}

		// Get organization for seller info
		const org = await db.organization.findUnique({
			where: { id: input.organizationId },
			select: { name: true, taxNumber: true },
		});

		if (!org?.taxNumber) {
			throw new ORPCError("BAD_REQUEST", {
				message: "الرقم الضريبي للمنشأة غير موجود. يرجى إضافته في إعدادات المنظمة",
			});
		}

		// Generate ZATCA QR code
		const qrCode = generateZatcaQR({
			sellerName: org.name,
			vatNumber: org.taxNumber,
			timestamp: invoice.issueDate,
			totalWithVat: Number(invoice.totalAmount),
			vatAmount: Number(invoice.vatAmount),
		});

		// Update invoice
		const updatedInvoice = await updateInvoice(input.id, input.organizationId, {
			invoiceType: "TAX",
			sellerTaxNumber: org.taxNumber,
			qrCode,
		});

		return updatedInvoice;
	});

export const addInvoicePaymentProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/payments",
		tags: ["Finance", "Invoices"],
		summary: "Add a payment to an invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			amount: z.number().positive("المبلغ يجب أن يكون موجب"),
			paymentDate: z.string().datetime(),
			paymentMethod: z.string().optional(),
			referenceNo: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		const payment = await addInvoicePayment(
			input.id,
			input.organizationId,
			{
				createdById: context.user.id,
				amount: input.amount,
				paymentDate: new Date(input.paymentDate),
				paymentMethod: input.paymentMethod,
				referenceNo: input.referenceNo,
				notes: input.notes,
			},
		);

		return {
			...payment,
			amount: Number(payment.amount),
		};
	});

export const deleteInvoicePaymentProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/invoices/{invoiceId}/payments/{paymentId}",
		tags: ["Finance", "Invoices"],
		summary: "Delete a payment from an invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			invoiceId: z.string(),
			paymentId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "payments",
		});

		await deleteInvoicePayment(
			input.paymentId,
			input.invoiceId,
			input.organizationId,
		);

		return { success: true };
	});

export const deleteInvoiceProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/finance/invoices/{id}",
		tags: ["Finance", "Invoices"],
		summary: "Delete an invoice",
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
			action: "invoices",
		});

		await deleteInvoice(input.id, input.organizationId);

		return { success: true };
	});
