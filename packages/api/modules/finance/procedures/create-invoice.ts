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
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import { generateZatcaQR, generateZatcaQRImage } from "../../../lib/zatca";
import { processInvoiceForZatca } from "../../../lib/zatca/phase2/zatca-service";
import { db } from "@repo/database/prisma/client";
import crypto from "crypto";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE, MAX_ADDRESS, MAX_ARRAY,
	idString, optionalTrimmed, nullishTrimmed,
	financialAmount, percentage, quantity, unitPrice,
} from "../../../lib/validation-constants";

const invoiceItemSchema = z.object({
	description: z.string().trim().min(1, "وصف البند مطلوب").max(MAX_NAME),
	quantity: quantity().positive("الكمية يجب أن تكون موجبة"),
	unit: z.string().trim().max(50).optional(),
	unitPrice: unitPrice().min(0, "السعر يجب أن يكون صفر أو أكبر"),
});

export const createInvoiceProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/invoices",
		tags: ["Finance", "Invoices"],
		summary: "Create a new invoice",
	})
	.input(
		z.object({
			organizationId: idString(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional().default("STANDARD"),
			clientId: z.string().trim().max(100).optional(),
			clientName: z.string().trim().min(1, "اسم العميل مطلوب").max(MAX_NAME),
			clientCompany: optionalTrimmed(MAX_NAME),
			clientPhone: z.string().trim().max(MAX_PHONE).optional(),
			clientEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
			clientAddress: optionalTrimmed(MAX_ADDRESS),
			clientTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).optional(),
			quotationId: z.string().trim().max(100).optional(),
			issueDate: z.string().min(1),
			dueDate: z.string().min(1),
			paymentTerms: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
			templateId: z.string().trim().max(100).optional(),
			vatPercent: percentage().optional().default(15),
			discountPercent: percentage().optional().default(0),
			items: z.array(invoiceItemSchema).min(1, "يجب إضافة بند واحد على الأقل").max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		// Validate issueDate <= dueDate
		if (new Date(input.issueDate) > new Date(input.dueDate)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "تاريخ الإصدار يجب أن يكون قبل أو يساوي تاريخ الاستحقاق",
			});
		}

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

		// If created from a quotation, update its status to CONVERTED
		if (input.quotationId) {
			await db.quotation.update({
				where: { id: input.quotationId },
				data: { status: "CONVERTED" },
			});
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_CREATED",
			entityType: "invoice",
			entityId: invoice.id,
			metadata: { invoiceType: input.invoiceType, clientName: input.clientName, totalAmount: Number(invoice.totalAmount) },
		});

		// Update onboarding checklist
		await db.onboardingProgress.updateMany({
			where: { organizationId: input.organizationId, firstInvoiceCreated: false },
			data: { firstInvoiceCreated: true },
		}).catch(() => {});

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

export const updateInvoiceProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}",
		tags: ["Finance", "Invoices"],
		summary: "Update an invoice",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
			clientId: z.string().trim().max(100).nullish(),
			clientName: z.string().trim().min(1).max(MAX_NAME).optional(),
			clientCompany: optionalTrimmed(MAX_NAME),
			clientPhone: z.string().trim().max(MAX_PHONE).optional(),
			clientEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
			clientAddress: optionalTrimmed(MAX_ADDRESS),
			clientTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).nullish(),
			issueDate: z.string().min(1).optional(),
			dueDate: z.string().min(1).optional(),
			paymentTerms: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
			templateId: z.string().trim().max(100).nullish(),
			vatPercent: percentage().optional(),
			discountPercent: percentage().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		const { organizationId, id, ...data } = input;

		// Validate issueDate <= dueDate
		if (input.issueDate && input.dueDate) {
			if (new Date(input.issueDate) > new Date(input.dueDate)) {
				throw new ORPCError("BAD_REQUEST", {
					message: "تاريخ الإصدار يجب أن يكون قبل أو يساوي تاريخ الاستحقاق",
				});
			}
		} else if (input.issueDate || input.dueDate) {
			const existing = await getInvoiceById(id, organizationId);
			if (existing) {
				const issueDate = input.issueDate ? new Date(input.issueDate) : existing.issueDate;
				const dueDate = input.dueDate ? new Date(input.dueDate) : existing.dueDate;
				if (issueDate && dueDate && issueDate > dueDate) {
					throw new ORPCError("BAD_REQUEST", {
						message: "تاريخ الإصدار يجب أن يكون قبل أو يساوي تاريخ الاستحقاق",
					});
				}
			}
		}

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

export const updateInvoiceItemsProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}/items",
		tags: ["Finance", "Invoices"],
		summary: "Update invoice items",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			items: z.array(invoiceItemSchema.extend({ id: z.string().trim().max(100).optional() })).max(MAX_ARRAY),
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

export const updateInvoiceStatusProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}/status",
		tags: ["Finance", "Invoices"],
		summary: "Update invoice status",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			status: z.enum([
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

		// Validate allowed status transitions
		const ALLOWED_TRANSITIONS: Record<string, string[]> = {
			DRAFT: [],
			ISSUED: ["SENT", "OVERDUE", "CANCELLED"],
			SENT: ["VIEWED", "OVERDUE", "CANCELLED"],
			VIEWED: ["OVERDUE", "CANCELLED"],
			PARTIALLY_PAID: ["OVERDUE", "CANCELLED"],
			PAID: [],
			OVERDUE: ["CANCELLED"],
			CANCELLED: [],
		};

		const currentInvoice = await db.financeInvoice.findFirst({
			where: { id: input.id, organizationId: input.organizationId },
			select: { status: true },
		});
		if (!currentInvoice) throw new Error("الفاتورة غير موجودة");

		const allowed = ALLOWED_TRANSITIONS[currentInvoice.status] ?? [];
		if (!allowed.includes(input.status)) {
			throw new Error(`لا يمكن تغيير حالة الفاتورة من ${currentInvoice.status} إلى ${input.status}`);
		}

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

export const convertToTaxInvoiceProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/convert-to-tax",
		tags: ["Finance", "Invoices"],
		summary: "Convert an invoice to a tax invoice with ZATCA QR code",
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
			action: "invoices",
		});

		await enforceFeatureAccess(input.organizationId, "zatca.qr", context.user);

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

export const addInvoicePaymentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/payments",
		tags: ["Finance", "Invoices"],
		summary: "Add a payment to an invoice",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			amount: financialAmount().positive("المبلغ يجب أن يكون موجب"),
			paymentDate: z.string().min(1),
			paymentMethod: z.string().trim().max(MAX_CODE).optional(),
			referenceNo: z.string().trim().max(MAX_CODE).optional(),
			notes: optionalTrimmed(MAX_DESC),
			sourceAccountId: z.string().trim().max(100).optional(),
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
				sourceAccountId: input.sourceAccountId,
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

		// Auto-Journal: generate accounting entry for invoice payment
		try {
			const { onInvoicePaymentReceived } = await import("../../../lib/accounting/auto-journal");
			const inv = await db.financeInvoice.findUnique({ where: { id: input.id }, select: { invoiceNo: true, clientName: true, projectId: true } });
			if (inv) {
				await onInvoicePaymentReceived(db, {
					paymentId: payment.id,
					organizationId: input.organizationId,
					invoiceId: input.id,
					invoiceNumber: inv.invoiceNo,
					clientName: inv.clientName,
					amount: payment.amount,
					date: new Date(input.paymentDate),
					sourceAccountId: input.sourceAccountId || "",
					projectId: inv.projectId,
					userId: context.user.id,
				});
			}
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for invoice payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: payment.id,
				metadata: { error: String(e), referenceType: "INVOICE_PAYMENT" },
			});
		}

		// Auto-create receipt voucher from invoice payment
		try {
			const { generateAtomicNo } = await import("@repo/database");
			const { numberToArabicWords } = await import("@repo/utils");
			const invoiceData = await db.financeInvoice.findUnique({ where: { id: input.id }, select: { clientName: true, projectId: true } });
			const voucherNo = await generateAtomicNo(input.organizationId, "RCV");
			await db.receiptVoucher.create({
				data: {
					organizationId: input.organizationId,
					voucherNo,
					invoicePaymentId: payment.id,
					date: new Date(input.paymentDate),
					amount: payment.amount,
					amountInWords: numberToArabicWords(Number(payment.amount)),
					receivedFrom: invoiceData?.clientName || "عميل",
					paymentMethod: (input.paymentMethod as any) || "BANK_TRANSFER",
					destinationAccountId: input.sourceAccountId || null,
					clientId: null,
					projectId: invoiceData?.projectId || null,
					status: "ISSUED",
					createdById: context.user.id,
				},
			});
		} catch (e) {
			console.error("[ReceiptVoucher] Failed to create auto voucher from invoice payment:", e);
		}

		return {
			...payment,
			amount: Number(payment.amount),
		};
	});

export const deleteInvoicePaymentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/invoices/{invoiceId}/payments/{paymentId}",
		tags: ["Finance", "Invoices"],
		summary: "Delete a payment from an invoice",
	})
	.input(
		z.object({
			organizationId: idString(),
			invoiceId: idString(),
			paymentId: idString(),
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

		// Auto-Journal: reverse accounting entry for deleted invoice payment
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "INVOICE_PAYMENT",
				referenceId: input.paymentId,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for deleted invoice payment:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.paymentId,
				metadata: { error: String(e), referenceType: "INVOICE_PAYMENT" },
			});
		}

		return { success: true };
	});

export const deleteInvoiceProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/invoices/{id}",
		tags: ["Finance", "Invoices"],
		summary: "Delete an invoice",
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

		// Auto-Journal: reverse accounting entry for deleted invoice
		try {
			const { reverseAutoJournalEntry } = await import("../../../lib/accounting/auto-journal");
			await reverseAutoJournalEntry(db, {
				organizationId: input.organizationId,
				referenceType: "INVOICE",
				referenceId: input.id,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to reverse entry for deleted invoice:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: input.id,
				metadata: { error: String(e), referenceType: "INVOICE" },
			});
		}

		return { success: true };
	});

// ═══════════════════════════════════════════════════════════════════════════
// ISSUE INVOICE — إصدار الفاتورة رسمياً
// ═══════════════════════════════════════════════════════════════════════════

export const issueInvoiceProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/issue",
		tags: ["Finance", "Invoices"],
		summary: "Issue an invoice (DRAFT → ISSUED)",
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
				select: { name: true, taxNumber: true, commercialRegister: true, address: true, city: true },
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

		// ─── Validate tax number for TAX/SIMPLIFIED invoices ────────────
		if (sellerTaxNumber) {
			const cleanTaxNumber = sellerTaxNumber.replace(/[\s\-]/g, "");
			if (!/^\d{15}$/.test(cleanTaxNumber)) {
				if (invoice.invoiceType === "TAX" || invoice.invoiceType === "SIMPLIFIED") {
					throw new ORPCError("BAD_REQUEST", {
						message: `الرقم الضريبي يجب أن يكون 15 رقماً بالضبط (بدون رموز أو مسافات). الرقم الحالي: "${sellerTaxNumber}". يرجى تصحيحه في إعدادات المالية`,
					});
				}
			}
		} else if (invoice.invoiceType === "TAX" || invoice.invoiceType === "SIMPLIFIED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "الرقم الضريبي مطلوب للفاتورة الضريبية/المبسطة. يرجى إضافته في إعدادات المالية (صفحة الإعدادات ← بيانات المنشأة)",
			});
		}

		const zatcaUuid = crypto.randomUUID();

		// ─── Issue the invoice first (DRAFT → ISSUED) ───────────────────
		const issuedInvoice = await issueInvoice(input.id, input.organizationId, {
			sellerName,
			sellerTaxNumber: sellerTaxNumber ? sellerTaxNumber.replace(/[\s\-]/g, "") : undefined,
			sellerAddress: sellerAddress || undefined,
			sellerPhone: sellerPhone || undefined,
			zatcaUuid,
		});

		// ─── ZATCA Processing (Phase 1 QR or Phase 2 XML+Sign+Submit) ──
		// Silent failure: ZATCA errors don't block invoice issuance
		try {
			const zatcaResult = await processInvoiceForZatca(
				db,
				{ ...issuedInvoice, zatcaUuid, items: issuedInvoice.items },
				input.organizationId,
				{
					name: sellerName,
					taxNumber: sellerTaxNumber,
					crNumber: org?.commercialRegister ?? undefined,
					address: sellerAddress || org?.address || undefined,
					city: org?.city ?? undefined,
				},
			);

			// Update invoice with ZATCA results
			await db.financeInvoice.update({
				where: { id: issuedInvoice.id },
				data: {
					qrCode: zatcaResult.qrCode || undefined,
					zatcaInvoiceType: zatcaResult.zatcaInvoiceType || undefined,
					zatcaSubmissionStatus: zatcaResult.zatcaSubmissionStatus,
					zatcaHash: zatcaResult.zatcaHash || undefined,
					zatcaSignature: zatcaResult.zatcaSignature || undefined,
					zatcaXml: zatcaResult.zatcaXml || undefined,
					zatcaClearedXml: zatcaResult.zatcaClearedXml || undefined,
					zatcaCounterValue: zatcaResult.zatcaCounterValue ?? undefined,
					zatcaPreviousHash: zatcaResult.zatcaPreviousHash || undefined,
					zatcaSubmittedAt: zatcaResult.zatcaSubmittedAt || undefined,
					zatcaClearedAt: zatcaResult.zatcaClearedAt || undefined,
				},
			});
		} catch (error) {
			console.error("[ZATCA] Failed to process invoice:", error);
			// Invoice is already ISSUED — ZATCA status stays NOT_APPLICABLE
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_ISSUED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { invoiceType: invoice.invoiceType, totalAmount: Number(issuedInvoice.totalAmount) },
		});

		// Auto-Journal: generate accounting entry for invoice issuance
		try {
			const { onInvoiceIssued } = await import("../../../lib/accounting/auto-journal");
			await onInvoiceIssued(db, {
				id: issuedInvoice.id,
				organizationId: input.organizationId,
				number: issuedInvoice.invoiceNo,
				issueDate: issuedInvoice.issueDate,
				clientName: issuedInvoice.clientName,
				totalAmount: issuedInvoice.totalAmount,
				vatAmount: issuedInvoice.vatAmount,
				projectId: issuedInvoice.projectId,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for invoice issue:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: issuedInvoice.id,
				metadata: { error: String(e), referenceType: "INVOICE" },
			});
		}

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

export const duplicateInvoiceProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/duplicate",
		tags: ["Finance", "Invoices"],
		summary: "Duplicate an invoice as a new DRAFT",
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

export const createCreditNoteProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/invoices/{id}/credit-note",
		tags: ["Finance", "Invoices"],
		summary: "Create a credit note for an invoice",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			reason: z.string().trim().min(1, "سبب الإشعار الدائن مطلوب").max(MAX_DESC),
			items: z.array(
				z.object({
					description: z.string().trim().min(1).max(MAX_NAME),
					quantity: quantity().positive(),
					unit: z.string().trim().max(50).optional(),
					unitPrice: unitPrice().min(0),
				}),
			).min(1, "يجب إضافة بند واحد على الأقل").max(MAX_ARRAY),
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
				select: { name: true, taxNumber: true, commercialRegister: true, address: true, city: true },
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

		const cnZatcaUuid = crypto.randomUUID();

		const creditNote = await createCreditNote({
			organizationId: input.organizationId,
			createdById: context.user.id,
			originalInvoiceId: input.id,
			reason: input.reason,
			items: input.items,
			zatcaUuid: cnZatcaUuid,
			sellerName: cnSellerName || undefined,
			sellerTaxNumber: cnSellerTaxNumber || undefined,
			sellerAddress: cnSellerAddress || undefined,
			sellerPhone: cnSellerPhone || undefined,
		});

		// ─── ZATCA Processing for Credit Note ──────────────────────────
		try {
			const zatcaResult = await processInvoiceForZatca(
				db,
				{ ...creditNote, zatcaUuid: cnZatcaUuid, items: creditNote.items },
				input.organizationId,
				{
					name: cnSellerName,
					taxNumber: cnSellerTaxNumber,
					crNumber: orgCN?.commercialRegister ?? undefined,
					address: cnSellerAddress || orgCN?.address || undefined,
					city: orgCN?.city ?? undefined,
				},
			);

			await db.financeInvoice.update({
				where: { id: creditNote.id },
				data: {
					qrCode: zatcaResult.qrCode || undefined,
					zatcaInvoiceType: zatcaResult.zatcaInvoiceType || undefined,
					zatcaSubmissionStatus: zatcaResult.zatcaSubmissionStatus,
					zatcaHash: zatcaResult.zatcaHash || undefined,
					zatcaSignature: zatcaResult.zatcaSignature || undefined,
					zatcaXml: zatcaResult.zatcaXml || undefined,
					zatcaClearedXml: zatcaResult.zatcaClearedXml || undefined,
					zatcaCounterValue: zatcaResult.zatcaCounterValue ?? undefined,
					zatcaPreviousHash: zatcaResult.zatcaPreviousHash || undefined,
					zatcaSubmittedAt: zatcaResult.zatcaSubmittedAt || undefined,
					zatcaClearedAt: zatcaResult.zatcaClearedAt || undefined,
				},
			});
		} catch (error) {
			console.error("[ZATCA] Failed to process credit note:", error);
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_CREDIT_NOTE_CREATED",
			entityType: "invoice",
			entityId: input.id,
			metadata: { creditNoteId: creditNote.id, creditNoteNo: creditNote.invoiceNo },
		});

		// Auto-Journal: generate accounting entry for credit note
		try {
			const { onCreditNoteIssued } = await import("../../../lib/accounting/auto-journal");
			await onCreditNoteIssued(db, {
				id: creditNote.id,
				organizationId: input.organizationId,
				number: creditNote.invoiceNo,
				issueDate: creditNote.issueDate,
				clientName: creditNote.clientName,
				totalAmount: creditNote.totalAmount,
				vatAmount: creditNote.vatAmount,
				projectId: creditNote.projectId,
				userId: context.user.id,
			});
		} catch (e) {
			console.error("[AutoJournal] Failed to generate entry for credit note:", e);
			orgAuditLog({
				organizationId: input.organizationId,
				actorId: context.user.id,
				action: "JOURNAL_ENTRY_FAILED",
				entityType: "journal_entry",
				entityId: creditNote.id,
				metadata: { error: String(e), referenceType: "CREDIT_NOTE" },
			});
		}

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

export const updateInvoiceNotesProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/invoices/{id}/notes",
		tags: ["Finance", "Invoices"],
		summary: "Update invoice notes (any status)",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			notes: z.string().trim().max(MAX_DESC),
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
			action: "INVOICE_UPDATED",
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

export const getInvoiceActivityProcedure = subscriptionProcedure
	.route({
		method: "GET",
		path: "/finance/invoices/{id}/activity",
		tags: ["Finance", "Invoices"],
		summary: "Get audit trail for an invoice",
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

		const logs = await getEntityOrgAuditLogs(
			input.organizationId,
			"invoice",
			input.id,
		);

		return { logs };
	});
