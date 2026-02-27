import {
	createInvoice,
	updateInvoice,
	updateInvoiceItems,
	updateInvoiceStatus,
	addInvoicePayment,
	deleteInvoicePayment,
	deleteInvoice,
	getInvoiceById,
	issueInvoice,
	duplicateInvoice,
	createCreditNote,
	calculateInvoiceTotals,
	orgAuditLog,
	getEntityOrgAuditLogs,
	getOrganizationFinanceSettings,
	updateInvoiceNotes,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { generateZatcaQR, generateZatcaQRImage } from "../../../lib/zatca";
import { db } from "@repo/database/prisma/client";
import crypto from "crypto";

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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_CREATED",
			entityType: "invoice",
			entityId: invoice.id,
			metadata: { invoiceType: input.invoiceType, clientName: input.clientName, totalAmount: Number(invoice.totalAmount) },
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

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "INVOICE_UPDATED",
			entityType: "invoice",
			entityId: id,
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
		};
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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_ITEMS_UPDATED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { itemCount: input.items.length },
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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_STATUS_CHANGED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { newStatus: input.status },
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
		};
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
				message: "الرقم الضريبي للمنشأة غير موجود. يرجى إضافته في إعدادات المالية",
			});
		}

		// Validate VAT number format (ZATCA requires exactly 15 digits)
		const cleanVatNo = org.taxNumber.replace(/[\s\-]/g, "");
		if (!/^\d{15}$/.test(cleanVatNo)) {
			throw new ORPCError("BAD_REQUEST", {
				message: `الرقم الضريبي يجب أن يكون 15 رقماً بالضبط (بدون رموز أو مسافات). الرقم الحالي: "${org.taxNumber}". يرجى تصحيحه في إعدادات المالية`,
			});
		}

		// Generate ZATCA QR code
		const tlvBase64 = generateZatcaQR({
			sellerName: org.name,
			vatNumber: cleanVatNo,
			timestamp: invoice.issueDate,
			totalWithVat: Number(invoice.totalAmount),
			vatAmount: Number(invoice.vatAmount),
		});
		const qrCode = await generateZatcaQRImage(tlvBase64);

		// Update invoice
		const updatedInvoice = await updateInvoice(input.id, input.organizationId, {
			invoiceType: "TAX",
			sellerTaxNumber: org.taxNumber,
			qrCode,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_CONVERTED_TO_TAX",
			entityType: "invoice",
			entityId: input.id,
		});

		return {
			...updatedInvoice,
			subtotal: Number(updatedInvoice.subtotal),
			discountPercent: Number(updatedInvoice.discountPercent),
			discountAmount: Number(updatedInvoice.discountAmount),
			vatPercent: Number(updatedInvoice.vatPercent),
			vatAmount: Number(updatedInvoice.vatAmount),
			totalAmount: Number(updatedInvoice.totalAmount),
			paidAmount: Number(updatedInvoice.paidAmount),
		};
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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_PAYMENT_ADDED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { amount: input.amount, paymentId: payment.id },
		});

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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_PAYMENT_DELETED",
			entityType: "invoice",
			entityId: input.invoiceId,
			metadata: { paymentId: input.paymentId },
		});

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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_DELETED",
			entityType: "invoice",
			entityId: input.id,
		});

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// ISSUE INVOICE — إصدار الفاتورة رسمياً
// ═══════════════════════════════════════════════════════════════════════════

export const issueInvoiceProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/issue",
		tags: ["Finance", "Invoices"],
		summary: "Issue an invoice (DRAFT → ISSUED)",
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

		if (invoice.status !== "DRAFT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن إصدار فاتورة ليست في حالة مسودة",
			});
		}

		// ─── Gather seller info from Finance Settings + Organization ────────
		const [org, financeSettings] = await Promise.all([
			db.organization.findUnique({
				where: { id: input.organizationId },
				select: { name: true, taxNumber: true },
			}),
			getOrganizationFinanceSettings(input.organizationId),
		]);

		// Resolve seller fields: finance settings take priority, fallback to org
		const sellerName = financeSettings?.companyNameAr || org?.name || "";
		const sellerTaxNumber = financeSettings?.taxNumber || org?.taxNumber || "";
		const sellerAddress = financeSettings?.address || "";
		const sellerPhone = financeSettings?.phone || "";

		// ─── Validation gate ─────────────────────────────────────────────
		if (!sellerName) {
			throw new ORPCError("BAD_REQUEST", {
				message: "اسم المنشأة مطلوب. يرجى إضافته في إعدادات المالية (صفحة الإعدادات ← بيانات المنشأة)",
			});
		}

		if (!invoice.clientName) {
			throw new ORPCError("BAD_REQUEST", {
				message: "اسم العميل مطلوب لإصدار الفاتورة",
			});
		}

		if (invoice.invoiceType === "TAX" && !invoice.clientTaxNumber) {
			throw new ORPCError("BAD_REQUEST", {
				message: "الرقم الضريبي للعميل مطلوب للفاتورة الضريبية (B2B)",
			});
		}

		const validItems = invoice.items.filter(
			(item) => Number(item.quantity) > 0 && Number(item.unitPrice) > 0,
		);
		if (validItems.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "يجب أن تحتوي الفاتورة على بند واحد على الأقل بكمية وسعر أكبر من صفر",
			});
		}

		if (!invoice.issueDate) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تاريخ الإصدار مطلوب",
			});
		}

		// ─── Generate QR for all invoices when tax number is available ───
		let qrCode: string | undefined;
		if (sellerTaxNumber) {
			const cleanTaxNumber = sellerTaxNumber.replace(/[\s\-]/g, "");
			if (!/^\d{15}$/.test(cleanTaxNumber)) {
				// Only throw for TAX/SIMPLIFIED — for STANDARD just skip QR
				if (invoice.invoiceType === "TAX" || invoice.invoiceType === "SIMPLIFIED") {
					throw new ORPCError("BAD_REQUEST", {
						message: `الرقم الضريبي يجب أن يكون 15 رقماً بالضبط (بدون رموز أو مسافات). الرقم الحالي: "${sellerTaxNumber}". يرجى تصحيحه في إعدادات المالية`,
					});
				}
			} else {
				const totals = calculateInvoiceTotals(
					invoice.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
					invoice.discountPercent,
					invoice.vatPercent,
				);

				const tlvBase64 = generateZatcaQR({
					sellerName,
					vatNumber: cleanTaxNumber,
					timestamp: invoice.issueDate,
					totalWithVat: Number(totals.totalAmount),
					vatAmount: Number(totals.vatAmount),
				});
				qrCode = await generateZatcaQRImage(tlvBase64);
			}
		} else if (invoice.invoiceType === "TAX" || invoice.invoiceType === "SIMPLIFIED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "الرقم الضريبي مطلوب للفاتورة الضريبية/المبسطة. يرجى إضافته في إعدادات المالية (صفحة الإعدادات ← بيانات المنشأة)",
			});
		}

		const zatcaUuid = crypto.randomUUID();

		const issuedInvoice = await issueInvoice(input.id, input.organizationId, {
			sellerName,
			sellerTaxNumber: sellerTaxNumber ? sellerTaxNumber.replace(/[\s\-]/g, "") : undefined,
			sellerAddress: sellerAddress || undefined,
			sellerPhone: sellerPhone || undefined,
			qrCode,
			zatcaUuid,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_ISSUED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { invoiceType: invoice.invoiceType, totalAmount: Number(issuedInvoice.totalAmount) },
		});

		return {
			...issuedInvoice,
			subtotal: Number(issuedInvoice.subtotal),
			discountPercent: Number(issuedInvoice.discountPercent),
			discountAmount: Number(issuedInvoice.discountAmount),
			vatPercent: Number(issuedInvoice.vatPercent),
			vatAmount: Number(issuedInvoice.vatAmount),
			totalAmount: Number(issuedInvoice.totalAmount),
			paidAmount: Number(issuedInvoice.paidAmount),
			items: issuedInvoice.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// DUPLICATE INVOICE — نسخ الفاتورة
// ═══════════════════════════════════════════════════════════════════════════

export const duplicateInvoiceProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/duplicate",
		tags: ["Finance", "Invoices"],
		summary: "Duplicate an invoice as a new DRAFT",
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

		const newInvoice = await duplicateInvoice(
			input.id,
			input.organizationId,
			context.user.id,
		);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_DUPLICATED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { newInvoiceId: newInvoice.id, newInvoiceNo: newInvoice.invoiceNo },
		});

		return {
			...newInvoice,
			subtotal: Number(newInvoice.subtotal),
			discountPercent: Number(newInvoice.discountPercent),
			discountAmount: Number(newInvoice.discountAmount),
			vatPercent: Number(newInvoice.vatPercent),
			vatAmount: Number(newInvoice.vatAmount),
			totalAmount: Number(newInvoice.totalAmount),
			paidAmount: Number(newInvoice.paidAmount),
			items: newInvoice.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE CREDIT NOTE — إنشاء إشعار دائن
// ═══════════════════════════════════════════════════════════════════════════

export const createCreditNoteProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/credit-note",
		tags: ["Finance", "Invoices"],
		summary: "Create a credit note for an invoice",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			reason: z.string().min(1, "سبب الإشعار الدائن مطلوب"),
			items: z.array(
				z.object({
					description: z.string().min(1),
					quantity: z.number().positive(),
					unit: z.string().optional(),
					unitPrice: z.number().min(0),
				}),
			).min(1, "يجب إضافة بند واحد على الأقل"),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		// Get org + finance settings for seller info
		const [orgCN, financeSettingsCN] = await Promise.all([
			db.organization.findUnique({
				where: { id: input.organizationId },
				select: { name: true, taxNumber: true },
			}),
			getOrganizationFinanceSettings(input.organizationId),
		]);

		// Resolve seller fields: finance settings take priority
		const cnSellerName = financeSettingsCN?.companyNameAr || orgCN?.name || "";
		const cnSellerTaxNumber = financeSettingsCN?.taxNumber || orgCN?.taxNumber || "";
		const cnSellerAddress = financeSettingsCN?.address || "";
		const cnSellerPhone = financeSettingsCN?.phone || "";

		// Get original invoice to check its type
		const original = await getInvoiceById(input.id, input.organizationId);
		if (!original) {
			throw new ORPCError("NOT_FOUND", { message: "الفاتورة الأصلية غير موجودة" });
		}

		// Generate QR for credit note if original was TAX/SIMPLIFIED
		let qrCode: string | undefined;
		const cleanCnTaxNumber = cnSellerTaxNumber ? cnSellerTaxNumber.replace(/[\s\-]/g, "") : "";
		if (
			(original.invoiceType === "TAX" || original.invoiceType === "SIMPLIFIED") &&
			cleanCnTaxNumber &&
			/^\d{15}$/.test(cleanCnTaxNumber)
		) {
			const totals = calculateInvoiceTotals(
				input.items,
				original.discountPercent,
				original.vatPercent,
			);

			const tlvBase64 = generateZatcaQR({
				sellerName: cnSellerName,
				vatNumber: cleanCnTaxNumber,
				timestamp: new Date(),
				totalWithVat: Number(totals.totalAmount),
				vatAmount: Number(totals.vatAmount),
			});
			qrCode = await generateZatcaQRImage(tlvBase64);
		}

		const creditNote = await createCreditNote({
			organizationId: input.organizationId,
			createdById: context.user.id,
			originalInvoiceId: input.id,
			reason: input.reason,
			items: input.items,
			qrCode,
			zatcaUuid: crypto.randomUUID(),
			sellerName: cnSellerName || undefined,
			sellerTaxNumber: cnSellerTaxNumber || undefined,
			sellerAddress: cnSellerAddress || undefined,
			sellerPhone: cnSellerPhone || undefined,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_CREDIT_NOTE_CREATED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { creditNoteId: creditNote.id, creditNoteNo: creditNote.invoiceNo },
		});

		return {
			...creditNote,
			subtotal: Number(creditNote.subtotal),
			discountPercent: Number(creditNote.discountPercent),
			discountAmount: Number(creditNote.discountAmount),
			vatPercent: Number(creditNote.vatPercent),
			vatAmount: Number(creditNote.vatAmount),
			totalAmount: Number(creditNote.totalAmount),
			paidAmount: Number(creditNote.paidAmount),
			items: creditNote.items.map((item) => ({
				...item,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE INVOICE NOTES — تحديث ملاحظات الفاتورة (بدون قيود الحالة)
// ═══════════════════════════════════════════════════════════════════════════

export const updateInvoiceNotesProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}/notes",
		tags: ["Finance", "Invoices"],
		summary: "Update invoice notes (any status)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			id: z.string(),
			notes: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const invoice = await updateInvoiceNotes(
			input.id,
			input.organizationId,
			input.notes,
		);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_NOTES_UPDATED",
			entityType: "invoice",
			entityId: input.id,
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
		};
	});

// ═══════════════════════════════════════════════════════════════════════════
// GET INVOICE ACTIVITY — سجل نشاط الفاتورة
// ═══════════════════════════════════════════════════════════════════════════

export const getInvoiceActivityProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/invoices/{id}/activity",
		tags: ["Finance", "Invoices"],
		summary: "Get audit trail for an invoice",
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

		const logs = await getEntityOrgAuditLogs(
			input.organizationId,
			"invoice",
			input.id,
		);

		return { logs };
	});
