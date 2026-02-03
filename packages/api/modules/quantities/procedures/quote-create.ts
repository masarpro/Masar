import { ORPCError } from "@orpc/server";
import { createQuote, getCostStudyById, getQuoteById, updateQuote, deleteQuote as deleteQuoteQuery, getQuotesByCostStudyId } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const quoteCreate = protectedProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/quotes",
		tags: ["Quantities"],
		summary: "Create quote",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
			quoteType: z.string(),
			clientName: z.string(),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().optional(),
			clientAddress: z.string().optional(),
			subtotal: z.number(),
			overheadAmount: z.number().default(0),
			profitAmount: z.number().default(0),
			vatAmount: z.number().default(0),
			totalAmount: z.number(),
			validUntil: z.string().transform((str) => new Date(str)),
			paymentTerms: z.string().optional(),
			deliveryTerms: z.string().optional(),
			showUnitPrices: z.boolean().default(true),
			showQuantities: z.boolean().default(true),
			showItemDescriptions: z.boolean().default(true),
			includeTerms: z.boolean().default(true),
			includeCoverPage: z.boolean().default(true),
			selectedCategories: z.any().optional(),
			termsAndConditions: z.string().optional(),
			notes: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "pricing" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const { organizationId, ...data } = input;

		const quote = await createQuote(data);

		return {
			...quote,
			subtotal: Number(quote.subtotal),
			overheadAmount: Number(quote.overheadAmount),
			profitAmount: Number(quote.profitAmount),
			vatAmount: Number(quote.vatAmount),
			totalAmount: Number(quote.totalAmount),
		};
	});

export const quoteGetById = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/quotes/{id}",
		tags: ["Quantities"],
		summary: "Get quote by ID",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		const quote = await getQuoteById(input.id);

		if (!quote || quote.costStudy.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "عرض السعر غير موجود",
			});
		}

		return {
			...quote,
			subtotal: Number(quote.subtotal),
			overheadAmount: Number(quote.overheadAmount),
			profitAmount: Number(quote.profitAmount),
			vatAmount: Number(quote.vatAmount),
			totalAmount: Number(quote.totalAmount),
		};
	});

export const quoteUpdate = protectedProcedure
	.route({
		method: "PUT",
		path: "/quantities/quotes/{id}",
		tags: ["Quantities"],
		summary: "Update quote",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
			quoteType: z.string().optional(),
			clientName: z.string().optional(),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().optional(),
			clientAddress: z.string().optional(),
			subtotal: z.number().optional(),
			overheadAmount: z.number().optional(),
			profitAmount: z.number().optional(),
			vatAmount: z.number().optional(),
			totalAmount: z.number().optional(),
			validUntil: z.string().transform((str) => new Date(str)).optional(),
			paymentTerms: z.string().optional(),
			deliveryTerms: z.string().optional(),
			showUnitPrices: z.boolean().optional(),
			showQuantities: z.boolean().optional(),
			showItemDescriptions: z.boolean().optional(),
			includeTerms: z.boolean().optional(),
			includeCoverPage: z.boolean().optional(),
			selectedCategories: z.any().optional(),
			termsAndConditions: z.string().optional(),
			notes: z.string().optional(),
			pdfUrl: z.string().optional(),
			status: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "pricing" },
		);

		// Verify the quote exists and belongs to the organization
		const existingQuote = await getQuoteById(input.id);
		if (!existingQuote || existingQuote.costStudy.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "عرض السعر غير موجود",
			});
		}

		const { id, organizationId, ...data } = input;

		const quote = await updateQuote(id, data);

		return {
			...quote,
			subtotal: Number(quote.subtotal),
			overheadAmount: Number(quote.overheadAmount),
			profitAmount: Number(quote.profitAmount),
			vatAmount: Number(quote.vatAmount),
			totalAmount: Number(quote.totalAmount),
		};
	});

export const quoteDelete = protectedProcedure
	.route({
		method: "DELETE",
		path: "/quantities/quotes/{id}",
		tags: ["Quantities"],
		summary: "Delete quote",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "pricing" },
		);

		// Verify the quote exists and belongs to the organization
		const existingQuote = await getQuoteById(input.id);
		if (!existingQuote || existingQuote.costStudy.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "عرض السعر غير موجود",
			});
		}

		await deleteQuoteQuery(input.id);

		return { success: true };
	});

export const quoteList = protectedProcedure
	.route({
		method: "GET",
		path: "/quantities/{costStudyId}/quotes",
		tags: ["Quantities"],
		summary: "List quotes for a cost study",
	})
	.input(
		z.object({
			organizationId: z.string(),
			costStudyId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "quantities", action: "view" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: "دراسة التكلفة غير موجودة",
			});
		}

		const quotes = await getQuotesByCostStudyId(input.costStudyId);

		return {
			quotes: quotes.map((quote) => ({
				...quote,
				subtotal: Number(quote.subtotal),
				overheadAmount: Number(quote.overheadAmount),
				profitAmount: Number(quote.profitAmount),
				vatAmount: Number(quote.vatAmount),
				totalAmount: Number(quote.totalAmount),
			})),
		};
	});
