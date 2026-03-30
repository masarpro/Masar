import {
	createQuotation,
	updateQuotation,
	updateQuotationItems,
	updateQuotationStatus,
	deleteQuotation,
	convertQuotationToInvoice,
	orgAuditLog,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { enforceFeatureAccess } from "../../../lib/feature-gate";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE, MAX_ADDRESS, MAX_ARRAY,
	idString, optionalTrimmed,
	percentage, quantity, unitPrice,
} from "../../../lib/validation-constants";

const quotationItemSchema = z.object({
	description: z.string().trim().min(1, "وصف البند مطلوب").max(MAX_NAME),
	quantity: quantity().positive("الكمية يجب أن تكون موجبة"),
	unit: z.string().trim().max(50).optional(),
	unitPrice: unitPrice().min(0, "السعر يجب أن يكون صفر أو أكبر"),
});

export const createQuotationProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/quotations",
		tags: ["Finance", "Quotations"],
		summary: "Create a new quotation",
	})
	.input(
		z.object({
			organizationId: idString(),
			clientId: z.string().trim().max(100).optional(),
			clientName: z.string().trim().min(1, "اسم العميل مطلوب").max(MAX_NAME),
			clientCompany: optionalTrimmed(MAX_NAME),
			clientPhone: z.string().trim().max(MAX_PHONE).optional(),
			clientEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
			clientAddress: optionalTrimmed(MAX_ADDRESS),
			clientTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).optional(),
			validUntil: z.string().trim().datetime(),
			paymentTerms: optionalTrimmed(MAX_DESC),
			deliveryTerms: optionalTrimmed(MAX_DESC),
			warrantyTerms: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
			templateId: z.string().trim().max(100).optional(),
			vatPercent: percentage().optional().default(15),
			discountPercent: percentage().optional().default(0),
			items: z.array(quotationItemSchema).min(1, "يجب إضافة بند واحد على الأقل").max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "pricing",
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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_CREATED",
			entityType: "quotation",
			entityId: quotation.id,
			metadata: { clientName: input.clientName, totalAmount: Number(quotation.totalAmount) },
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

export const updateQuotationProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/quotations/{id}",
		tags: ["Finance", "Quotations"],
		summary: "Update a quotation",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			clientId: z.string().trim().max(100).nullish(),
			clientName: z.string().trim().min(1).max(MAX_NAME).optional(),
			clientCompany: optionalTrimmed(MAX_NAME),
			clientPhone: z.string().trim().max(MAX_PHONE).optional(),
			clientEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
			clientAddress: optionalTrimmed(MAX_ADDRESS),
			clientTaxNumber: z.string().trim().max(MAX_CODE).optional(),
			projectId: z.string().trim().max(100).nullish(),
			validUntil: z.string().trim().datetime().optional(),
			paymentTerms: optionalTrimmed(MAX_DESC),
			deliveryTerms: optionalTrimmed(MAX_DESC),
			warrantyTerms: optionalTrimmed(MAX_DESC),
			notes: optionalTrimmed(MAX_DESC),
			templateId: z.string().trim().max(100).nullish(),
			vatPercent: percentage().optional(),
			discountPercent: percentage().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "pricing",
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

		orgAuditLog({
			organizationId,
			actorId: context.user.id,
			action: "QUOTATION_UPDATED",
			entityType: "quotation",
			entityId: id,
		});

		return quotation;
	});

export const updateQuotationItemsProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/quotations/{id}/items",
		tags: ["Finance", "Quotations"],
		summary: "Update quotation items",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			items: z.array(quotationItemSchema.extend({ id: z.string().trim().max(100).optional() })).max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "pricing",
			action: "quotations",
		});

		const quotation = await updateQuotationItems(
			input.id,
			input.organizationId,
			input.items,
		);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_ITEMS_UPDATED",
			entityType: "quotation",
			entityId: input.id,
			metadata: { itemCount: input.items.length },
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

export const updateQuotationStatusProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/quotations/{id}/status",
		tags: ["Finance", "Quotations"],
		summary: "Update quotation status",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
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
			section: "pricing",
			action: "quotations",
		});

		const quotation = await updateQuotationStatus(
			input.id,
			input.organizationId,
			input.status,
		);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_STATUS_CHANGED",
			entityType: "quotation",
			entityId: input.id,
			metadata: { newStatus: input.status },
		});

		return quotation;
	});

export const deleteQuotationProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/quotations/{id}",
		tags: ["Finance", "Quotations"],
		summary: "Delete a quotation",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "pricing",
			action: "quotations",
		});

		await deleteQuotation(input.id, input.organizationId);

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_DELETED",
			entityType: "quotation",
			entityId: input.id,
		});

		return { success: true };
	});

export const convertQuotationToInvoiceProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/quotations/{id}/convert",
		tags: ["Finance", "Quotations"],
		summary: "Convert a quotation to an invoice",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			issueDate: z.string().trim().datetime().optional(),
			dueDate: z.string().trim().datetime().optional(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		await enforceFeatureAccess(input.organizationId, "quotation.export", context.user);

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

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_CONVERTED",
			entityType: "quotation",
			entityId: input.id,
			metadata: { invoiceId: invoice.id, invoiceType: input.invoiceType },
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
