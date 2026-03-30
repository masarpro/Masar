import { ORPCError } from "@orpc/server";
import { STUDY_ERRORS } from "../lib/error-messages";
import { createQuote, getCostStudyById, getQuoteById, updateQuote, deleteQuote as deleteQuoteQuery, getQuotesByCostStudyId } from "@repo/database";
import { z } from "zod";
import { convertQuoteDecimals } from "../../../lib/decimal-helpers";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";

export const quoteCreate = subscriptionProcedure
	.route({
		method: "POST",
		path: "/quantities/{costStudyId}/quotes",
		tags: ["Quantities"],
		summary: "Create quote",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
			quoteType: z.string().trim().max(100),
			clientName: z.string().trim().max(200),
			clientCompany: z.string().trim().max(100).optional(),
			clientPhone: z.string().trim().max(100).optional(),
			clientEmail: z.string().trim().max(100).optional(),
			clientAddress: z.string().trim().max(100).optional(),
			subtotal: z.number().nonnegative(),
			overheadAmount: z.number().nonnegative().default(0),
			profitAmount: z.number().nonnegative().default(0),
			vatAmount: z.number().nonnegative().default(0),
			totalAmount: z.number().nonnegative(),
			validUntil: z.string().transform((str) => new Date(str)),
			paymentTerms: z.string().trim().max(100).optional(),
			deliveryTerms: z.string().trim().max(100).optional(),
			showUnitPrices: z.boolean().default(true),
			showQuantities: z.boolean().default(true),
			showItemDescriptions: z.boolean().default(true),
			includeTerms: z.boolean().default(true),
			includeCoverPage: z.boolean().default(true),
			selectedCategories: z.record(z.string(), z.unknown()).optional(),
			termsAndConditions: z.string().trim().max(100).optional(),
			notes: z.string().trim().max(2000).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "pricing" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const { organizationId, ...data } = input;

		const quote = await createQuote(data);

		return convertQuoteDecimals(quote);
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
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		const quote = await getQuoteById(input.id);

		if (!quote || quote.costStudy.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.QUOTE_NOT_FOUND,
			});
		}

		return convertQuoteDecimals(quote);
	});

export const quoteUpdate = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/quantities/quotes/{id}",
		tags: ["Quantities"],
		summary: "Update quote",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
			quoteType: z.string().trim().max(100).optional(),
			clientName: z.string().trim().max(100).optional(),
			clientCompany: z.string().trim().max(100).optional(),
			clientPhone: z.string().trim().max(100).optional(),
			clientEmail: z.string().trim().max(100).optional(),
			clientAddress: z.string().trim().max(100).optional(),
			subtotal: z.number().nonnegative().optional(),
			overheadAmount: z.number().nonnegative().optional(),
			profitAmount: z.number().nonnegative().optional(),
			vatAmount: z.number().nonnegative().optional(),
			totalAmount: z.number().nonnegative().optional(),
			validUntil: z.string().transform((str) => new Date(str)).optional(),
			paymentTerms: z.string().trim().max(100).optional(),
			deliveryTerms: z.string().trim().max(100).optional(),
			showUnitPrices: z.boolean().optional(),
			showQuantities: z.boolean().optional(),
			showItemDescriptions: z.boolean().optional(),
			includeTerms: z.boolean().optional(),
			includeCoverPage: z.boolean().optional(),
			selectedCategories: z.record(z.string(), z.unknown()).optional(),
			termsAndConditions: z.string().trim().max(100).optional(),
			notes: z.string().trim().max(2000).optional(),
			pdfUrl: z.string().trim().max(100).optional(),
			status: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "pricing" },
		);

		// Verify the quote exists and belongs to the organization
		const existingQuote = await getQuoteById(input.id);
		if (!existingQuote || existingQuote.costStudy.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.QUOTE_NOT_FOUND,
			});
		}

		const { id, organizationId, ...data } = input;

		const quote = await updateQuote(id, data);

		return convertQuoteDecimals(quote);
	});

export const quoteDelete = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/quantities/quotes/{id}",
		tags: ["Quantities"],
		summary: "Delete quote",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "pricing" },
		);

		// Verify the quote exists and belongs to the organization
		const existingQuote = await getQuoteById(input.id);
		if (!existingQuote || existingQuote.costStudy.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.QUOTE_NOT_FOUND,
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
			organizationId: z.string().trim().max(100),
			costStudyId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "pricing", action: "view" },
		);

		// Verify the study exists and belongs to the organization
		const study = await getCostStudyById(input.costStudyId, input.organizationId);
		if (!study) {
			throw new ORPCError("NOT_FOUND", {
				message: STUDY_ERRORS.NOT_FOUND,
			});
		}

		const quotes = await getQuotesByCostStudyId(input.costStudyId);

		return {
			quotes: quotes.map((quote) =>
				convertQuoteDecimals(quote),
			),
		};
	});
