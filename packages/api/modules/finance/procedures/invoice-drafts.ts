// Invoice Drafts (مسودات الفواتير) — staging autosave + commit
// المسودة سجل isDraft=true لا يستهلك رقماً رسمياً. الحفظ التلقائي يكتب عليها فقط.
// زر "حفظ" يستدعي commit: مسودة جديدة ← فاتورة حقيقية، مسودة تعديل ← تُطبَّق على الأصل.

import {
	createInvoiceDraft,
	updateInvoiceDraftHeader,
	updateInvoiceDraftItems,
	getOrCreateInvoiceEditDraft,
	commitInvoiceDraft,
	deleteInvoiceDraft,
	getOrganizationInvoiceDrafts,
	countOrganizationInvoiceDrafts,
	getInvoiceById,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure, protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { orgAuditLog } from "@repo/database";
import {
	MAX_NAME, MAX_DESC, MAX_CODE, MAX_PHONE, MAX_ADDRESS, MAX_ARRAY,
	idString, searchQuery, paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";

const optStr = (max: number) =>
	z.union([z.string().max(max), z.null()]).optional().transform((v) => v ?? undefined);

const draftItemSchema = z.object({
	id: optStr(100),
	description: z.string().min(1).max(MAX_DESC),
	quantity: z.coerce.number().positive().max(999_999),
	unit: optStr(50),
	unitPrice: z.coerce.number().nonnegative().max(99_999_999.99),
});

function serializeInvoice(inv: any) {
	return {
		...inv,
		subtotal: Number(inv.subtotal),
		discountPercent: Number(inv.discountPercent),
		discountAmount: Number(inv.discountAmount),
		vatPercent: Number(inv.vatPercent),
		vatAmount: Number(inv.vatAmount),
		totalAmount: Number(inv.totalAmount),
		paidAmount: Number(inv.paidAmount),
		items: (inv.items ?? []).map((item: any) => ({
			...item,
			quantity: Number(item.quantity),
			unitPrice: Number(item.unitPrice),
			totalPrice: Number(item.totalPrice),
		})),
	};
}

// ── Create draft (lazy autosave target) ──
export const createInvoiceDraftProcedure = subscriptionProcedure
	.route({ method: "POST", path: "/finance/invoices/drafts", tags: ["Finance", "Invoices"], summary: "Create an invoice draft" })
	.input(
		z.object({
			organizationId: idString(),
			sourceInvoiceId: optStr(100),
			quotationId: optStr(100),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
			clientId: optStr(100),
			clientName: optStr(MAX_NAME),
			clientCompany: optStr(MAX_NAME),
			clientPhone: optStr(MAX_PHONE),
			clientEmail: optStr(254),
			clientAddress: optStr(MAX_ADDRESS),
			clientTaxNumber: optStr(MAX_CODE),
			projectId: optStr(100),
			issueDate: optStr(40),
			dueDate: optStr(40),
			paymentTerms: optStr(MAX_DESC),
			notes: optStr(MAX_DESC),
			templateId: optStr(100),
			vatPercent: z.coerce.number().min(0).max(100).optional(),
			discountPercent: z.coerce.number().min(0).max(100).optional(),
			items: z.array(draftItemSchema).max(MAX_ARRAY).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "invoices" });

		const draft = await createInvoiceDraft({
			organizationId: input.organizationId,
			createdById: context.user.id,
			sourceInvoiceId: input.sourceInvoiceId,
			quotationId: input.quotationId,
			invoiceType: input.invoiceType,
			clientId: input.clientId,
			clientName: input.clientName,
			clientCompany: input.clientCompany,
			clientPhone: input.clientPhone,
			clientEmail: input.clientEmail,
			clientAddress: input.clientAddress,
			clientTaxNumber: input.clientTaxNumber,
			projectId: input.projectId,
			issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
			dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
			paymentTerms: input.paymentTerms,
			notes: input.notes,
			templateId: input.templateId,
			vatPercent: input.vatPercent,
			discountPercent: input.discountPercent,
			items: input.items,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_DRAFT_CREATED",
			entityType: "invoice",
			entityId: draft.id,
			metadata: { sourceInvoiceId: input.sourceInvoiceId ?? null },
		});

		return serializeInvoice(draft);
	});

// ── Update draft header (autosave) ──
export const updateInvoiceDraftProcedure = subscriptionProcedure
	.route({ method: "PUT", path: "/finance/invoices/drafts/{id}", tags: ["Finance", "Invoices"], summary: "Update an invoice draft header" })
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			invoiceType: z.enum(["STANDARD", "TAX", "SIMPLIFIED"]).optional(),
			clientId: optStr(100),
			clientName: optStr(MAX_NAME),
			clientCompany: optStr(MAX_NAME),
			clientPhone: optStr(MAX_PHONE),
			clientEmail: optStr(254),
			clientAddress: optStr(MAX_ADDRESS),
			clientTaxNumber: optStr(MAX_CODE),
			projectId: optStr(100),
			issueDate: optStr(40),
			dueDate: optStr(40),
			paymentTerms: optStr(MAX_DESC),
			notes: optStr(MAX_DESC),
			templateId: optStr(100),
			vatPercent: z.coerce.number().min(0).max(100).optional(),
			discountPercent: z.coerce.number().min(0).max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "invoices" });
		const { organizationId, id, issueDate, dueDate, ...rest } = input;
		await updateInvoiceDraftHeader(id, organizationId, {
			...rest,
			issueDate: issueDate ? new Date(issueDate) : undefined,
			dueDate: dueDate ? new Date(dueDate) : undefined,
		});
		return { success: true };
	});

// ── Update draft items (autosave) ──
export const updateInvoiceDraftItemsProcedure = subscriptionProcedure
	.route({ method: "PUT", path: "/finance/invoices/drafts/{id}/items", tags: ["Finance", "Invoices"], summary: "Update an invoice draft's items" })
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			items: z.array(draftItemSchema).max(MAX_ARRAY),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "invoices" });
		await updateInvoiceDraftItems(input.id, input.organizationId, input.items);
		return { success: true };
	});

// ── Start (resume-or-create) an edit-draft from a committed invoice ──
export const editInvoiceProcedure = subscriptionProcedure
	.route({ method: "POST", path: "/finance/invoices/{id}/edit-draft", tags: ["Finance", "Invoices"], summary: "Start an edit draft for a committed invoice" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "invoices" });
		try {
			const draft = await getOrCreateInvoiceEditDraft(input.id, input.organizationId, context.user.id);
			return { id: draft.id };
		} catch (e: any) {
			throw new ORPCError("CONFLICT", { message: e?.message ?? "تعذّر بدء التعديل" });
		}
	});

// ── Commit a draft (Save) ──
export const commitInvoiceDraftProcedure = subscriptionProcedure
	.route({ method: "POST", path: "/finance/invoices/drafts/{id}/commit", tags: ["Finance", "Invoices"], summary: "Commit an invoice draft" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "invoices" });
		let invoice;
		try {
			invoice = await commitInvoiceDraft(input.id, input.organizationId);
		} catch (e: any) {
			throw new ORPCError("BAD_REQUEST", { message: e?.message ?? "تعذّر حفظ المسودة" });
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_DRAFT_COMMITTED",
			entityType: "invoice",
			entityId: invoice.id,
			metadata: { invoiceNo: invoice.invoiceNo },
		});

		return serializeInvoice(invoice);
	});

// ── Discard a draft ──
export const deleteInvoiceDraftProcedure = subscriptionProcedure
	.route({ method: "DELETE", path: "/finance/invoices/drafts/{id}", tags: ["Finance", "Invoices"], summary: "Discard an invoice draft" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "invoices" });
		await deleteInvoiceDraft(input.id, input.organizationId);
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_DRAFT_DISCARDED",
			entityType: "invoice",
			entityId: input.id,
		});
		return { success: true };
	});

// ── List drafts ──
export const listInvoiceDraftsProcedure = protectedProcedure
	.route({ method: "GET", path: "/finance/invoices/drafts", tags: ["Finance", "Invoices"], summary: "List invoice drafts" })
	.input(
		z.object({
			organizationId: idString(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "view" });
		const result = await getOrganizationInvoiceDrafts(input.organizationId, {
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});
		return {
			drafts: result.drafts.map((d: any) => ({
				...d,
				subtotal: Number(d.subtotal),
				totalAmount: Number(d.totalAmount),
			})),
			total: result.total,
		};
	});

// ── Get a single draft (to load into the form) ──
export const getInvoiceDraftProcedure = protectedProcedure
	.route({ method: "GET", path: "/finance/invoices/drafts/{id}", tags: ["Finance", "Invoices"], summary: "Get an invoice draft" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "view" });
		const invoice = await getInvoiceById(input.id, input.organizationId);
		if (!invoice || !invoice.isDraft) {
			throw new ORPCError("NOT_FOUND", { message: "المسودة غير موجودة" });
		}
		return serializeInvoice(invoice);
	});

// ── Count drafts (badge) ──
export const countInvoiceDraftsProcedure = protectedProcedure
	.route({ method: "GET", path: "/finance/invoices/drafts/count", tags: ["Finance", "Invoices"], summary: "Count invoice drafts" })
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "finance", action: "view" });
		return { count: await countOrganizationInvoiceDrafts(input.organizationId) };
	});
