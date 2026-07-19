// Quotation Drafts (مسودات عروض الأسعار) — staging autosave + commit
// نفس مبدأ مسودات الفواتير: isDraft=true، الحفظ التلقائي يكتب على المسودة، "حفظ" = commit.

import {
	createQuotationDraft,
	updateQuotationDraftHeader,
	updateQuotationDraftItems,
	updateQuotationDraftContentBlocks,
	getOrCreateQuotationEditDraft,
	commitQuotationDraft,
	deleteQuotationDraft,
	getOrganizationQuotationDrafts,
	countOrganizationQuotationDrafts,
	getQuotationById,
	orgAuditLog,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure, protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
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

const contentBlockSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1).max(5000),
	position: z.enum(["BEFORE_TABLE", "AFTER_TABLE"]),
});

function serializeQuotation(q: any) {
	return {
		...q,
		subtotal: Number(q.subtotal),
		discountPercent: Number(q.discountPercent),
		discountAmount: Number(q.discountAmount),
		vatPercent: Number(q.vatPercent),
		vatAmount: Number(q.vatAmount),
		totalAmount: Number(q.totalAmount),
		items: (q.items ?? []).map((item: any) => ({
			...item,
			quantity: Number(item.quantity),
			unitPrice: Number(item.unitPrice),
			totalPrice: Number(item.totalPrice),
		})),
	};
}

// ── Create draft ──
export const createQuotationDraftProcedure = subscriptionProcedure
	.route({ method: "POST", path: "/finance/quotations/drafts", tags: ["Finance", "Quotations"], summary: "Create a quotation draft" })
	.input(
		z.object({
			organizationId: idString(),
			sourceQuotationId: optStr(100),
			clientId: optStr(100),
			clientName: optStr(MAX_NAME),
			clientCompany: optStr(MAX_NAME),
			clientPhone: optStr(MAX_PHONE),
			clientEmail: optStr(254),
			clientAddress: optStr(MAX_ADDRESS),
			clientTaxNumber: optStr(MAX_CODE),
			projectId: optStr(100),
			validUntil: optStr(40),
			paymentTerms: optStr(MAX_DESC),
			deliveryTerms: optStr(MAX_DESC),
			warrantyTerms: optStr(MAX_DESC),
			notes: optStr(MAX_DESC),
			introduction: optStr(5000),
			termsAndConditions: optStr(5000),
			templateId: optStr(100),
			vatPercent: z.coerce.number().min(0).max(100).optional(),
			discountPercent: z.coerce.number().min(0).max(100).optional(),
			items: z.array(draftItemSchema).max(MAX_ARRAY).optional(),
			contentBlocks: z.array(contentBlockSchema).max(20).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });

		const draft = await createQuotationDraft({
			organizationId: input.organizationId,
			createdById: context.user.id,
			sourceQuotationId: input.sourceQuotationId,
			clientId: input.clientId,
			clientName: input.clientName,
			clientCompany: input.clientCompany,
			clientPhone: input.clientPhone,
			clientEmail: input.clientEmail,
			clientAddress: input.clientAddress,
			clientTaxNumber: input.clientTaxNumber,
			projectId: input.projectId,
			validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
			paymentTerms: input.paymentTerms,
			deliveryTerms: input.deliveryTerms,
			warrantyTerms: input.warrantyTerms,
			notes: input.notes,
			introduction: input.introduction,
			termsAndConditions: input.termsAndConditions,
			templateId: input.templateId,
			vatPercent: input.vatPercent,
			discountPercent: input.discountPercent,
			items: input.items,
			contentBlocks: input.contentBlocks,
		});

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_DRAFT_CREATED",
			entityType: "quotation",
			entityId: draft.id,
			metadata: { sourceQuotationId: input.sourceQuotationId ?? null },
		});

		return serializeQuotation(draft);
	});

// ── Update draft header ──
export const updateQuotationDraftProcedure = subscriptionProcedure
	.route({ method: "PUT", path: "/finance/quotations/drafts/{id}", tags: ["Finance", "Quotations"], summary: "Update a quotation draft header" })
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			clientId: optStr(100),
			clientName: optStr(MAX_NAME),
			clientCompany: optStr(MAX_NAME),
			clientPhone: optStr(MAX_PHONE),
			clientEmail: optStr(254),
			clientAddress: optStr(MAX_ADDRESS),
			clientTaxNumber: optStr(MAX_CODE),
			projectId: optStr(100),
			validUntil: optStr(40),
			paymentTerms: optStr(MAX_DESC),
			deliveryTerms: optStr(MAX_DESC),
			warrantyTerms: optStr(MAX_DESC),
			notes: optStr(MAX_DESC),
			introduction: optStr(5000),
			termsAndConditions: optStr(5000),
			templateId: optStr(100),
			vatPercent: z.coerce.number().min(0).max(100).optional(),
			discountPercent: z.coerce.number().min(0).max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		const { organizationId, id, validUntil, ...rest } = input;
		await updateQuotationDraftHeader(id, organizationId, {
			...rest,
			validUntil: validUntil ? new Date(validUntil) : undefined,
		});
		return { success: true };
	});

// ── Update draft items ──
export const updateQuotationDraftItemsProcedure = subscriptionProcedure
	.route({ method: "PUT", path: "/finance/quotations/drafts/{id}/items", tags: ["Finance", "Quotations"], summary: "Update a quotation draft's items" })
	.input(z.object({ organizationId: idString(), id: idString(), items: z.array(draftItemSchema).max(MAX_ARRAY) }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		await updateQuotationDraftItems(input.id, input.organizationId, input.items);
		return { success: true };
	});

// ── Update draft content blocks ──
export const updateQuotationDraftContentBlocksProcedure = subscriptionProcedure
	.route({ method: "PUT", path: "/finance/quotations/drafts/{id}/content-blocks", tags: ["Finance", "Quotations"], summary: "Update a quotation draft's content blocks" })
	.input(z.object({ organizationId: idString(), id: idString(), contentBlocks: z.array(contentBlockSchema).max(20) }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		await updateQuotationDraftContentBlocks(input.id, input.organizationId, input.contentBlocks);
		return { success: true };
	});

// ── Start (resume-or-create) an edit-draft from a committed quotation ──
export const editQuotationProcedure = subscriptionProcedure
	.route({ method: "POST", path: "/finance/quotations/{id}/edit-draft", tags: ["Finance", "Quotations"], summary: "Start an edit draft for a committed quotation" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		try {
			const draft = await getOrCreateQuotationEditDraft(input.id, input.organizationId, context.user.id);
			return { id: draft.id };
		} catch (e: any) {
			throw new ORPCError("CONFLICT", { message: e?.message ?? "تعذّر بدء التعديل" });
		}
	});

// ── Commit a draft (Save) ──
export const commitQuotationDraftProcedure = subscriptionProcedure
	.route({ method: "POST", path: "/finance/quotations/drafts/{id}/commit", tags: ["Finance", "Quotations"], summary: "Commit a quotation draft" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		let quotation;
		try {
			quotation = await commitQuotationDraft(input.id, input.organizationId);
		} catch (e: any) {
			throw new ORPCError("BAD_REQUEST", { message: e?.message ?? "تعذّر حفظ المسودة" });
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_DRAFT_COMMITTED",
			entityType: "quotation",
			entityId: quotation!.id,
			metadata: { quotationNo: quotation!.quotationNo },
		});

		return serializeQuotation(quotation);
	});

// ── Discard a draft ──
export const deleteQuotationDraftProcedure = subscriptionProcedure
	.route({ method: "DELETE", path: "/finance/quotations/drafts/{id}", tags: ["Finance", "Quotations"], summary: "Discard a quotation draft" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		await deleteQuotationDraft(input.id, input.organizationId);
		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "QUOTATION_DRAFT_DISCARDED",
			entityType: "quotation",
			entityId: input.id,
		});
		return { success: true };
	});

// ── List drafts ──
export const listQuotationDraftsProcedure = protectedProcedure
	.route({ method: "GET", path: "/finance/quotations/drafts", tags: ["Finance", "Quotations"], summary: "List quotation drafts" })
	.input(z.object({ organizationId: idString(), query: searchQuery(), limit: paginationLimit(), offset: paginationOffset() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		const result = await getOrganizationQuotationDrafts(input.organizationId, {
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
export const getQuotationDraftProcedure = protectedProcedure
	.route({ method: "GET", path: "/finance/quotations/drafts/{id}", tags: ["Finance", "Quotations"], summary: "Get a quotation draft" })
	.input(z.object({ organizationId: idString(), id: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		const quotation = await getQuotationById(input.id, input.organizationId);
		if (!quotation || !quotation.isDraft) {
			throw new ORPCError("NOT_FOUND", { message: "المسودة غير موجودة" });
		}
		return serializeQuotation(quotation);
	});

// ── Count drafts (badge) ──
export const countQuotationDraftsProcedure = protectedProcedure
	.route({ method: "GET", path: "/finance/quotations/drafts/count", tags: ["Finance", "Quotations"], summary: "Count quotation drafts" })
	.input(z.object({ organizationId: idString() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, { section: "pricing", action: "quotations" });
		return { count: await countOrganizationQuotationDrafts(input.organizationId) };
	});
