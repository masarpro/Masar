import {
	getOrganizationOpenDocuments,
	getOpenDocumentById,
	createOpenDocument,
	updateOpenDocument,
	deleteOpenDocument,
} from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import {
	MAX_NAME, MAX_LONG_TEXT, MAX_ADDRESS,
	idString, optionalTrimmed, searchQuery,
	paginationLimit, paginationOffset,
} from "../../../lib/validation-constants";

export const listOpenDocuments = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/documents",
		tags: ["Finance", "Documents"],
		summary: "List open documents for an organization",
	})
	.input(
		z.object({
			organizationId: idString(),
			documentType: z
				.enum(["LETTER", "AGREEMENT", "CERTIFICATE", "MEMO", "OTHER"])
				.optional(),
			projectId: z.string().trim().max(100).optional(),
			query: searchQuery(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "view",
		});

		const result = await getOrganizationOpenDocuments(input.organizationId, {
			documentType: input.documentType,
			projectId: input.projectId,
			query: input.query,
			limit: input.limit,
			offset: input.offset,
		});

		return result;
	});

export const getOpenDocument = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/documents/{id}",
		tags: ["Finance", "Documents"],
		summary: "Get an open document by ID",
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

		const document = await getOpenDocumentById(input.id, input.organizationId);

		if (!document) {
			throw new ORPCError("NOT_FOUND", { message: "المستند غير موجود" });
		}

		return document;
	});

export const createOpenDocumentProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/finance/documents",
		tags: ["Finance", "Documents"],
		summary: "Create a new open document",
	})
	.input(
		z.object({
			organizationId: idString(),
			documentType: z.enum(["LETTER", "AGREEMENT", "CERTIFICATE", "MEMO", "OTHER"]),
			title: z.string().trim().min(1, "عنوان المستند مطلوب").max(MAX_NAME),
			content: z.string().trim().min(1, "محتوى المستند مطلوب").max(MAX_LONG_TEXT),
			clientId: z.string().trim().max(100).optional(),
			projectId: z.string().trim().max(100).optional(),
			recipientName: optionalTrimmed(MAX_NAME),
			recipientCompany: optionalTrimmed(MAX_NAME),
			recipientAddress: optionalTrimmed(MAX_ADDRESS),
			templateId: z.string().trim().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const document = await createOpenDocument({
			organizationId: input.organizationId,
			createdById: context.user.id,
			documentType: input.documentType,
			title: input.title,
			content: input.content,
			clientId: input.clientId,
			projectId: input.projectId,
			recipientName: input.recipientName,
			recipientCompany: input.recipientCompany,
			recipientAddress: input.recipientAddress,
			templateId: input.templateId,
		});

		return document;
	});

export const updateOpenDocumentProcedure = subscriptionProcedure
	.route({
		method: "PUT",
		path: "/finance/documents/{id}",
		tags: ["Finance", "Documents"],
		summary: "Update an open document",
	})
	.input(
		z.object({
			organizationId: idString(),
			id: idString(),
			documentType: z.enum(["LETTER", "AGREEMENT", "CERTIFICATE", "MEMO", "OTHER"]).optional(),
			title: z.string().trim().min(1).max(MAX_NAME).optional(),
			content: z.string().trim().min(1).max(MAX_LONG_TEXT).optional(),
			clientId: z.string().trim().max(100).nullish(),
			projectId: z.string().trim().max(100).nullish(),
			recipientName: optionalTrimmed(MAX_NAME),
			recipientCompany: optionalTrimmed(MAX_NAME),
			recipientAddress: optionalTrimmed(MAX_ADDRESS),
			templateId: z.string().trim().max(100).nullish(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "quotations",
		});

		const { organizationId, id, ...data } = input;

		const document = await updateOpenDocument(id, organizationId, {
			...data,
			clientId: data.clientId ?? undefined,
			projectId: data.projectId ?? undefined,
			templateId: data.templateId ?? undefined,
		});

		return document;
	});

export const deleteOpenDocumentProcedure = subscriptionProcedure
	.route({
		method: "DELETE",
		path: "/finance/documents/{id}",
		tags: ["Finance", "Documents"],
		summary: "Delete an open document",
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
			action: "quotations",
		});

		await deleteOpenDocument(input.id, input.organizationId);

		return { success: true };
	});
