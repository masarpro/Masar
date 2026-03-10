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
			organizationId: z.string(),
			costStudyId: z.string(),
			quoteType: z.string(),
			clientName: z.string(),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().optional(),
			clientAddress: z.string().optional(),
			subtotal: z.number().nonnegative(),
			overheadAmount: z.number().nonnegative().default(0),
			profitAmount: z.number().nonnegative().default(0),
			vatAmount: z.number().nonnegative().default(0),
			totalAmount: z.number().nonnegative(),
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
			id: z.string(),
			organizationId: z.string(),
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
			id: z.string(),
			organizationId: z.string(),
			quoteType: z.string().optional(),
			clientName: z.string().optional(),
			clientCompany: z.string().optional(),
			clientPhone: z.string().optional(),
			clientEmail: z.string().optional(),
			clientAddress: z.string().optional(),
			subtotal: z.number().nonnegative().optional(),
			overheadAmount: z.number().nonnegative().optional(),
			profitAmount: z.number().nonnegative().optional(),
			vatAmount: z.number().nonnegative().optional(),
			totalAmount: z.number().nonnegative().optional(),
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
			id: z.string(),
			organizationId: z.string(),
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
			organizationId: z.string(),
			costStudyId: z.string(),
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
